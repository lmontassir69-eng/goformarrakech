/*
# Create users, drivers, partners tables + update bookings with foreign keys

## Purpose
Builds the full relational schema for the VoyageGo Marrakech operations
dashboard — staff credentials, driver fleet, partner agencies, and links
bookings to partners and drivers.

## 1. New Tables
### users (Staff Credentials)
- id (uuid, PK), full_name (text), email (text, unique), role (text: admin/employee), created_at
### drivers (The Fleet)
- id (uuid, PK), name (text), phone_number (text), vehicle_type (text), status (text), created_at
### partners (Agencies & Suppliers)
- id (uuid, PK), business_name (text), category (text), contact_phone (text), status (text), commission_rate (numeric), created_at

## 2. Modified Tables
### bookings — added columns (additive, no data loss)
- partner_id (uuid, nullable, FK to partners)
- driver_id (uuid, nullable, FK to drivers)
- status CHECK expanded to include 'assigned' and 'cancelled'

## 3. Security
- RLS enabled on all new tables with anon+authenticated open policies (shared operations DB)

## 4. Seed Data
- 2 users, 5 drivers, 6 partners
*/

-- ===== USERS TABLE =====
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'employee')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_users" ON users;
CREATE POLICY "anon_select_users" ON users FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_users" ON users;
CREATE POLICY "anon_insert_users" ON users FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_users" ON users;
CREATE POLICY "anon_update_users" ON users FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_users" ON users;
CREATE POLICY "anon_delete_users" ON users FOR DELETE TO anon, authenticated USING (true);

-- ===== DRIVERS TABLE =====
CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone_number text NOT NULL,
  vehicle_type text NOT NULL CHECK (vehicle_type IN ('Mercedes Van', '4x4 Prado', 'Minibus')),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'on_trip', 'off_duty')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_drivers" ON drivers;
CREATE POLICY "anon_select_drivers" ON drivers FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_drivers" ON drivers;
CREATE POLICY "anon_insert_drivers" ON drivers FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_drivers" ON drivers;
CREATE POLICY "anon_update_drivers" ON drivers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_drivers" ON drivers;
CREATE POLICY "anon_delete_drivers" ON drivers FOR DELETE TO anon, authenticated USING (true);

-- ===== PARTNERS TABLE =====
CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('Flight', 'Hotel', 'Restaurant', 'Excursion', 'Activity')),
  contact_phone text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  commission_rate numeric DEFAULT 10,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_partners" ON partners;
CREATE POLICY "anon_select_partners" ON partners FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_partners" ON partners;
CREATE POLICY "anon_insert_partners" ON partners FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_partners" ON partners;
CREATE POLICY "anon_update_partners" ON partners FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_partners" ON partners;
CREATE POLICY "anon_delete_partners" ON partners FOR DELETE TO anon, authenticated USING (true);

-- ===== BOOKINGS: ADD FK COLUMNS =====
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'partner_id') THEN
    ALTER TABLE bookings ADD COLUMN partner_id uuid REFERENCES partners(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'driver_id') THEN
    ALTER TABLE bookings ADD COLUMN driver_id uuid REFERENCES drivers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Expand status CHECK to include 'assigned' and 'cancelled'
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'bookings_status_check' AND table_name = 'bookings') THEN
    ALTER TABLE bookings DROP CONSTRAINT bookings_status_check;
  END IF;
END $$;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending', 'confirmed', 'declined', 'assigned', 'cancelled'));

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_partners_category ON partners(category);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_bookings_partner_id ON bookings(partner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_driver_id ON bookings(driver_id);

-- ===== SEED DATA =====
INSERT INTO users (full_name, email, role) VALUES
  ('Amira Benali', 'admin@voyagego.com', 'admin'),
  ('Youssef Tahiri', 'staff@voyagego.com', 'employee')
ON CONFLICT (email) DO NOTHING;

INSERT INTO drivers (name, phone_number, vehicle_type, status) VALUES
  ('Hassan Alami', '+212 661 234 567', 'Mercedes Van', 'available'),
  ('Mohamed Rachidi', '+212 662 345 678', '4x4 Prado', 'available'),
  ('Said Bouzidi', '+212 663 456 789', 'Minibus', 'on_trip'),
  ('Youssef El Amrani', '+212 664 567 890', 'Mercedes Van', 'available'),
  ('Karim Benjelloun', '+212 665 678 901', '4x4 Prado', 'on_trip')
ON CONFLICT DO NOTHING;

INSERT INTO partners (business_name, category, contact_phone, status, commission_rate) VALUES
  ('Riad Dar Anika', 'Hotel', '+212 524 123 456', 'active', 15),
  ('La Mamounia Resort', 'Hotel', '+212 524 388 600', 'active', 12),
  ('Rooftop Nomad Diner', 'Restaurant', '+212 524 456 789', 'active', 10),
  ('Agafay Desert Tours', 'Excursion', '+212 524 789 012', 'active', 20),
  ('British Airways', 'Flight', '+212 524 567 890', 'active', 8),
  ('Hot Air Balloon Marrakech', 'Activity', '+212 524 890 123', 'active', 15)
ON CONFLICT DO NOTHING;

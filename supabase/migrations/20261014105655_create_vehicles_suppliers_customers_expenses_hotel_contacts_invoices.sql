/*
# Add vehicles, suppliers, customers, expenses, hotel_contacts tables + invoice fields on bookings

## Purpose
Extends the admin dashboard with dedicated tables for fleet vehicles, transport suppliers,
customer directory, expense logging, hotel contact contracts, and invoice status tracking on bookings.

## New Tables

1. vehicles
   - id (uuid PK)
   - model_name (text, not null) — e.g. "Mercedes V-Class"
   - license_plate (text, not null) — e.g. "12345-A-1"
   - status (text: active | maintenance | retired, default 'active')
   - driver_id (uuid, nullable, FK to drivers.id ON DELETE SET NULL)
   - created_at (timestamptz)

2. suppliers
   - id (uuid PK)
   - company_name (text, not null)
   - contact_name (text, nullable) — main contact person
   - whatsapp_number (text, nullable)
   - fleet_size (integer, default 0)
   - created_at (timestamptz)

3. customers
   - id (uuid PK)
   - full_name (text, not null)
   - email (text, nullable)
   - country_code (text, nullable) — e.g. "+44"
   - whatsapp_number (text, nullable)
   - created_at (timestamptz)

4. expenses
   - id (uuid PK)
   - expense_name (text, not null)
   - category (text: Fuel | Commission | Maintenance | Marketing | Other, default 'Other')
   - amount_mad (numeric, default 0)
   - expense_date (text, nullable) — stored as text to match booking_date pattern
   - created_at (timestamptz)

5. hotel_contacts
   - id (uuid PK)
   - hotel_name (text, not null)
   - manager_name (text, nullable)
   - direct_phone (text, nullable)
   - contract_expiry (text, nullable) — date string
   - created_at (timestamptz)

## Modified Tables

- bookings: add two nullable columns
  - invoice_issued (boolean, default false) — flags whether an invoice has been generated
  - invoice_number (text, nullable) — mock invoice reference number

## Security
- All new tables have RLS enabled.
- All policies use TO anon, authenticated with USING(true)/WITH CHECK(true) because
  this app uses a custom staff-portal login (queries the users table) — NOT Supabase auth.
  The anon key client must be able to read/write all rows.
- All statements are idempotent (IF NOT EXISTS, DROP POLICY IF EXISTS).
*/

-- ===== vehicles =====
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name text NOT NULL,
  license_plate text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status = ANY (ARRAY['active'::text, 'maintenance'::text, 'retired'::text])),
  driver_id uuid REFERENCES drivers(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_vehicles" ON vehicles;
CREATE POLICY "anon_select_vehicles" ON vehicles FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_vehicles" ON vehicles;
CREATE POLICY "anon_insert_vehicles" ON vehicles FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_vehicles" ON vehicles;
CREATE POLICY "anon_update_vehicles" ON vehicles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_vehicles" ON vehicles;
CREATE POLICY "anon_delete_vehicles" ON vehicles FOR DELETE TO anon, authenticated USING (true);

-- ===== suppliers =====
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_name text,
  whatsapp_number text,
  fleet_size integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_suppliers" ON suppliers;
CREATE POLICY "anon_select_suppliers" ON suppliers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_suppliers" ON suppliers;
CREATE POLICY "anon_insert_suppliers" ON suppliers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_suppliers" ON suppliers;
CREATE POLICY "anon_update_suppliers" ON suppliers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_suppliers" ON suppliers;
CREATE POLICY "anon_delete_suppliers" ON suppliers FOR DELETE TO anon, authenticated USING (true);

-- ===== customers =====
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text,
  country_code text,
  whatsapp_number text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_customers" ON customers;
CREATE POLICY "anon_select_customers" ON customers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_customers" ON customers;
CREATE POLICY "anon_insert_customers" ON customers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_customers" ON customers;
CREATE POLICY "anon_update_customers" ON customers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_customers" ON customers;
CREATE POLICY "anon_delete_customers" ON customers FOR DELETE TO anon, authenticated USING (true);

-- ===== expenses =====
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_name text NOT NULL,
  category text NOT NULL DEFAULT 'Other' CHECK (category = ANY (ARRAY['Fuel'::text, 'Commission'::text, 'Maintenance'::text, 'Marketing'::text, 'Other'::text])),
  amount_mad numeric DEFAULT 0,
  expense_date text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_expenses" ON expenses;
CREATE POLICY "anon_select_expenses" ON expenses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_expenses" ON expenses;
CREATE POLICY "anon_insert_expenses" ON expenses FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_expenses" ON expenses;
CREATE POLICY "anon_update_expenses" ON expenses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_expenses" ON expenses;
CREATE POLICY "anon_delete_expenses" ON expenses FOR DELETE TO anon, authenticated USING (true);

-- ===== hotel_contacts =====
CREATE TABLE IF NOT EXISTS hotel_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_name text NOT NULL,
  manager_name text,
  direct_phone text,
  contract_expiry text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE hotel_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_hotel_contacts" ON hotel_contacts;
CREATE POLICY "anon_select_hotel_contacts" ON hotel_contacts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_hotel_contacts" ON hotel_contacts;
CREATE POLICY "anon_insert_hotel_contacts" ON hotel_contacts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_hotel_contacts" ON hotel_contacts;
CREATE POLICY "anon_update_hotel_contacts" ON hotel_contacts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_hotel_contacts" ON hotel_contacts;
CREATE POLICY "anon_delete_hotel_contacts" ON hotel_contacts FOR DELETE TO anon, authenticated USING (true);

-- ===== bookings: add invoice columns =====
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'invoice_issued') THEN
    ALTER TABLE bookings ADD COLUMN invoice_issued boolean DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'invoice_number') THEN
    ALTER TABLE bookings ADD COLUMN invoice_number text;
  END IF;
END $$;

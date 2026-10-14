/*
# Create bookings table for VoyageGo reservation verification workflow

1. New Tables
- `bookings`
  - `id` (uuid, primary key)
  - `ref_code` (text, unique, human-readable booking reference like VG-4821)
  - `lead_name` (text, customer lead name e.g. "Sarah Jenkins")
  - `group_size` (int, number of people in the group)
  - `whatsapp_number` (text, contact phone number e.g. "+44 7123 456789")
  - `item_title` (text, name of the booked item e.g. "Riad Dar Anika")
  - `item_subtitle` (text, short description e.g. "Luxury Riad in the Medina")
  - `item_category` (text, category: hotels, flights, restaurants, excursions, activities)
  - `partner_name` (text, vendor/partner name)
  - `partner_details` (text, booking specifics e.g. "2x Superior Rooms")
  - `booking_date` (text, date of the booking)
  - `booking_time` (text, time of the booking)
  - `price_mad` (numeric, price in Moroccan Dirham)
  - `status` (text, one of: 'pending', 'confirmed', 'declined' — defaults to 'pending')
  - `decline_reason` (text, nullable, reason if declined)
  - `voucher_code` (text, nullable, generated voucher code on confirmation)
  - `confirmed_at` (timestamptz, nullable, when confirmed)
  - `declined_at` (timestamptz, nullable, when declined)
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `bookings`.
- This app has a staff portal with sign-in, but the public storefront submits
  bookings WITHOUT authentication (customers don't sign in to book). So we use
  `TO anon, authenticated` for INSERT so the anon-key client can create bookings.
- SELECT/UPDATE are also `TO anon, authenticated` since the staff portal uses the
  anon key as well (staff auth is mock/local). This is intentionally a shared table.

3. Indexes
- Index on `status` for fast queue filtering (pending vs confirmed vs declined).
- Index on `created_at` for chronological ordering.
*/

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code text UNIQUE NOT NULL DEFAULT ('VG-' || lpad((extract(epoch from now())::bigint % 100000)::text, 5, '0')),
  lead_name text NOT NULL,
  group_size int NOT NULL DEFAULT 1,
  whatsapp_number text NOT NULL,
  item_title text NOT NULL,
  item_subtitle text NOT NULL DEFAULT '',
  item_category text NOT NULL,
  partner_name text NOT NULL DEFAULT '',
  partner_details text NOT NULL DEFAULT '',
  booking_date text NOT NULL DEFAULT '',
  booking_time text NOT NULL DEFAULT '',
  price_mad numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined')),
  decline_reason text,
  voucher_code text,
  confirmed_at timestamptz,
  declined_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_bookings" ON bookings;
CREATE POLICY "anon_select_bookings" ON bookings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;
CREATE POLICY "anon_insert_bookings" ON bookings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_bookings" ON bookings;
CREATE POLICY "anon_update_bookings" ON bookings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_bookings" ON bookings;
CREATE POLICY "anon_delete_bookings" ON bookings FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

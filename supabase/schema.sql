-- ====================================================================
-- KisanSetu — Complete Supabase PostgreSQL Schema & Realtime Setup
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role VARCHAR(20) NOT NULL CHECK (role IN ('farmer', 'staff', 'admin')),
  full_name TEXT NOT NULL,
  phone TEXT,
  village TEXT,
  district TEXT,
  state TEXT DEFAULT 'Assam',
  aadhaar TEXT,
  land_area TEXT,
  bank_name TEXT,
  bank_account TEXT,
  ifsc_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CROPS TABLE
CREATE TABLE IF NOT EXISTS public.crops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  msp_per_quintal NUMERIC NOT NULL,
  unit TEXT DEFAULT 'Quintal',
  icon TEXT DEFAULT '🌾',
  category TEXT DEFAULT 'Kharif'
);

-- 3. PROCUREMENT CENTRES TABLE
CREATE TABLE IF NOT EXISTS public.procurement_centres (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  address TEXT NOT NULL,
  distance_km NUMERIC DEFAULT 5.0,
  lat NUMERIC,
  lng NUMERIC,
  active_counters INT DEFAULT 3,
  avg_processing_min NUMERIC DEFAULT 7.4,
  queue_count INT DEFAULT 0,
  estimated_wait_min INT DEFAULT 20,
  capacity_percent INT DEFAULT 50,
  today_bookings INT DEFAULT 0,
  status TEXT DEFAULT 'Available',
  status_badge TEXT DEFAULT 'Normal',
  recommended BOOLEAN DEFAULT FALSE,
  officer_name TEXT
);

-- 4. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_code TEXT UNIQUE NOT NULL,
  token_number TEXT NOT NULL,
  farmer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  farmer_name TEXT NOT NULL,
  centre_id TEXT REFERENCES public.procurement_centres(id),
  centre_name TEXT NOT NULL,
  crop_id TEXT REFERENCES public.crops(id),
  crop_name TEXT NOT NULL,
  declared_qty NUMERIC NOT NULL,
  booking_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  arrival_window TEXT,
  status TEXT NOT NULL DEFAULT 'Confirmed' CHECK (status IN ('Confirmed', 'Serving', 'Completed', 'Cancelled')),
  queue_position INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PROCUREMENT RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.procurement_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  token_number TEXT NOT NULL,
  procurement_code TEXT UNIQUE NOT NULL,
  declared_qty NUMERIC NOT NULL,
  actual_qty NUMERIC DEFAULT 0,
  moisture_content TEXT,
  quality_grade TEXT,
  msp_rate NUMERIC NOT NULL,
  net_amount NUMERIC NOT NULL,
  current_step INT DEFAULT 0, -- 0: Booked, 1: CheckIn, 2: Verification, 3: Weighing, 4: Quality, 5: Procured, 6: PayProcessing, 7: PayCompleted
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  procurement_id UUID REFERENCES public.procurement_records(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES public.profiles(id),
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'Processing' CHECK (status IN ('Pending', 'Processing', 'Completed', 'Failed')),
  txn_id TEXT UNIQUE NOT NULL,
  bank_name TEXT,
  account_no TEXT,
  ifsc_code TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- REALTIME SUBSCRIPTIONS REPLICATION SETUP
-- ====================================================================
-- Enable realtime publication for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.procurement_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;

-- ====================================================================
-- SEED INITIAL MOCK DATA
-- ====================================================================
INSERT INTO public.crops (id, name, msp_per_quintal, unit, icon, category) VALUES
  ('paddy', 'Paddy (Dhan - Grade A)', 2300, 'Quintal', '🌾', 'Kharif'),
  ('wheat', 'Wheat (Gehu)', 2275, 'Quintal', '🌾', 'Rabi'),
  ('maize', 'Maize (Makka)', 2090, 'Quintal', '🌽', 'Kharif'),
  ('mustard', 'Mustard (Sarson)', 5650, 'Quintal', '🌱', 'Rabi'),
  ('pulses', 'Gram / Pulses (Chana)', 5440, 'Quintal', '🫘', 'Rabi')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.procurement_centres (id, name, code, address, distance_km, active_counters, avg_processing_min, queue_count, estimated_wait_min, capacity_percent, today_bookings, status, status_badge, recommended, officer_name) VALUES
  ('C01', 'XYZ Procurement Centre (Kamrup Central Hub)', 'KMR-PPC-01', 'NH-37, Near APMC Market, Sonapur, Kamrup', 4.2, 3, 7.4, 18, 28, 62, 120, 'Available', 'Normal', TRUE, 'Biraj Kalita'),
  ('C02', 'ABC Procurement Mandi (Guwahati East)', 'GHY-PPC-02', 'State Warehousing Complex, Dispur, Guwahati', 7.1, 4, 8.5, 43, 85, 87, 210, 'High demand', 'High', FALSE, 'Sunil Sharma'),
  ('C03', 'Green Valley Agri Co-op Mandi', 'GV-PPC-03', 'Khetri Main Road, Kamrup East', 11.5, 2, 6.0, 12, 18, 45, 65, 'Available', 'Low', FALSE, 'Pankaj Gogoi'),
  ('C04', 'Nagaon Highway Procurement Hub', 'NGN-PPC-04', 'Jaha Road, Raha, Nagaon', 24.0, 5, 7.0, 31, 52, 79, 185, 'Moderate', 'Moderate', FALSE, 'Animesh Das')
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Allow public read access to crops and centres
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_centres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public crops read" ON public.crops FOR SELECT USING (true);
CREATE POLICY "Public centres read" ON public.procurement_centres FOR SELECT USING (true);
CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public bookings read write" ON public.bookings FOR ALL USING (true);
CREATE POLICY "Public records read write" ON public.procurement_records FOR ALL USING (true);
CREATE POLICY "Public payments read write" ON public.payments FOR ALL USING (true);

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ===== Database Types =====

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: "admin" | "employee";
  created_at: string;
}

export interface Driver {
  id: string;
  name: string;
  phone_number: string;
  vehicle_type: "Mercedes Van" | "4x4 Prado" | "Minibus";
  status: "available" | "on_trip" | "off_duty";
  created_at: string;
}

export interface Partner {
  id: string;
  business_name: string;
  category: "Flight" | "Hotel" | "Restaurant" | "Excursion" | "Activity";
  contact_phone: string;
  status: "active" | "suspended";
  commission_rate: number;
  created_at: string;
}

export interface Booking {
  id: string;
  ref_code: string;
  lead_name: string;
  group_size: number;
  whatsapp_number: string;
  item_title: string;
  item_subtitle: string;
  item_category: string;
  partner_name: string;
  partner_details: string;
  booking_date: string;
  booking_time: string;
  price_mad: number;
  status: "pending" | "confirmed" | "declined" | "assigned" | "cancelled";
  decline_reason: string | null;
  voucher_code: string | null;
  confirmed_at: string | null;
  declined_at: string | null;
  created_at: string;
  partner_id: string | null;
  driver_id: string | null;
  invoice_issued: boolean;
  invoice_number: string | null;
}

export interface Vehicle {
  id: string;
  model_name: string;
  license_plate: string;
  status: "active" | "maintenance" | "retired";
  driver_id: string | null;
  created_at: string;
}

export interface Supplier {
  id: string;
  company_name: string;
  contact_name: string | null;
  whatsapp_number: string | null;
  fleet_size: number;
  created_at: string;
}

export interface Customer {
  id: string;
  full_name: string;
  email: string | null;
  country_code: string | null;
  whatsapp_number: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  expense_name: string;
  category: "Fuel" | "Commission" | "Maintenance" | "Marketing" | "Other";
  amount_mad: number;
  expense_date: string | null;
  created_at: string;
}

export interface HotelContact {
  id: string;
  hotel_name: string;
  manager_name: string | null;
  direct_phone: string | null;
  contract_expiry: string | null;
  created_at: string;
}

// ===== Constants =====

export const CATEGORY_EMOJI: Record<string, string> = {
  hotels: "🏨",
  flights: "✈️",
  restaurants: "🍽️",
  excursions: "🧭",
  activities: "🎯",
  Hotel: "🏨",
  Flight: "✈️",
  Restaurant: "🍽️",
  Excursion: "🧭",
  Activity: "🎯",
};

export const CATEGORY_LABEL: Record<string, string> = {
  hotels: "Hotel",
  flights: "Flight",
  restaurants: "Restaurant",
  excursions: "Excursion",
  activities: "Activity",
  Hotel: "Hotel",
  Flight: "Flight",
  Restaurant: "Restaurant",
  Excursion: "Excursion",
  Activity: "Activity",
};

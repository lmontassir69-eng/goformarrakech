import { supabase } from "./lib/supabase";
import type { Booking, Driver, Partner, User, Vehicle, Supplier, Customer, Expense, HotelContact } from "./lib/supabase";

const DECLINE_REASONS = [
  "Vendor Fully Booked",
  "Flight Schedule Conflict",
  "Group Size Exceeds Capacity",
  "Date Not Available",
  "Customer Requested Cancellation",
];

function generateVoucherCode(refCode: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${refCode}-${code}`;
}

// ===== AUTH =====

export async function authenticateStaff(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();
  if (error || !data) return null;
  return data as User;
}

export async function createStaffUser(fullName: string, email: string, role: "admin" | "employee"): Promise<User> {
  const { data, error } = await supabase
    .from("users")
    .insert({ full_name: fullName, email: email.toLowerCase().trim(), role })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as User;
}

export async function fetchUsers(): Promise<User[]> {
  const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data as User[];
}

export async function deleteUser(id: string): Promise<void> {
  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) throw error;
}

// ===== DRIVERS =====

export async function fetchDrivers(): Promise<Driver[]> {
  const { data, error } = await supabase.from("drivers").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data as Driver[];
}

export async function addDriver(name: string, phoneNumber: string, vehicleType: Driver["vehicle_type"]): Promise<Driver> {
  const { data, error } = await supabase
    .from("drivers")
    .insert({ name, phone_number: phoneNumber, vehicle_type: vehicleType, status: "available" })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as Driver;
}

export async function deleteDriver(id: string): Promise<void> {
  const { error } = await supabase.from("drivers").delete().eq("id", id);
  if (error) throw error;
}

export async function updateDriverStatus(id: string, status: Driver["status"]): Promise<void> {
  const { error } = await supabase.from("drivers").update({ status }).eq("id", id);
  if (error) throw error;
}

// ===== PARTNERS =====

export async function fetchPartners(): Promise<Partner[]> {
  const { data, error } = await supabase.from("partners").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data as Partner[];
}

export async function fetchPartnersByCategory(category: Partner["category"]): Promise<Partner[]> {
  const { data, error } = await supabase.from("partners").select("*").eq("category", category).order("created_at", { ascending: false });
  if (error) throw error;
  return data as Partner[];
}

export async function addPartner(businessName: string, category: Partner["category"], contactPhone: string, commissionRate: number): Promise<Partner> {
  const { data, error } = await supabase
    .from("partners")
    .insert({ business_name: businessName, category, contact_phone: contactPhone, commission_rate: commissionRate, status: "active" })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as Partner;
}

export async function deletePartner(id: string): Promise<void> {
  const { error } = await supabase.from("partners").delete().eq("id", id);
  if (error) throw error;
}

export async function updatePartnerStatus(id: string, status: Partner["status"]): Promise<void> {
  const { error } = await supabase.from("partners").update({ status }).eq("id", id);
  if (error) throw error;
}

// ===== BOOKINGS =====

export interface NewBookingData {
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
}

export async function insertBooking(booking: NewBookingData): Promise<Booking> {
  const { data, error } = await supabase.from("bookings").insert(booking).select().maybeSingle();
  if (error) throw error;
  return data as Booking;
}

export async function insertBookings(
  cart: { item_title: string; item_subtitle: string; item_category: string; partner_name: string; partner_details: string; booking_date: string; booking_time: string; price_mad: number }[],
  customer: { leadName: string; groupSize: number; whatsapp: string }
): Promise<Booking[]> {
  const rows = cart.map((entry) => ({
    lead_name: customer.leadName,
    group_size: customer.groupSize,
    whatsapp_number: customer.whatsapp,
    item_title: entry.item_title,
    item_subtitle: entry.item_subtitle,
    item_category: entry.item_category,
    partner_name: entry.partner_name,
    partner_details: entry.partner_details,
    booking_date: entry.booking_date,
    booking_time: entry.booking_time,
    price_mad: entry.price_mad,
  }));
  const { data, error } = await supabase.from("bookings").insert(rows).select();
  if (error) throw error;
  return data as Booking[];
}

export async function fetchPendingBookings(): Promise<Booking[]> {
  const { data, error } = await supabase.from("bookings").select("*").eq("status", "pending").order("created_at", { ascending: false });
  if (error) throw error;
  return data as Booking[];
}

export async function fetchAllBookings(): Promise<Booking[]> {
  const { data, error } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data as Booking[];
}

export async function confirmBooking(bookingId: string): Promise<Booking> {
  const { data: booking } = await supabase.from("bookings").select("ref_code").eq("id", bookingId).maybeSingle();
  const voucher = generateVoucherCode(booking?.ref_code ?? "VG");
  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "confirmed", voucher_code: voucher, confirmed_at: new Date().toISOString() })
    .eq("id", bookingId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as Booking;
}

export async function assignDriver(bookingId: string, driverId: string): Promise<Booking> {
  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "assigned", driver_id: driverId })
    .eq("id", bookingId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as Booking;
}

export async function declineBooking(bookingId: string, reason: string): Promise<Booking> {
  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "declined", decline_reason: reason, declined_at: new Date().toISOString() })
    .eq("id", bookingId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as Booking;
}

export async function fetchBookingCounts(): Promise<{ pending: number; confirmedToday: number; declinedToday: number; totalRevenue: number }> {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

  const [pendingRes, confirmedRes, declinedRes, revenueRes] = await Promise.all([
    supabase.from("bookings").select("price_mad", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "confirmed").gte("confirmed_at", startOfDay).lt("confirmed_at", endOfDay),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "declined").gte("declined_at", startOfDay).lt("declined_at", endOfDay),
    supabase.from("bookings").select("price_mad").in("status", ["confirmed", "assigned"]),
  ]);

  const revenue = revenueRes.data?.reduce((sum, b) => sum + Number(b.price_mad), 0) ?? 0;
  return { pending: pendingRes.count ?? 0, confirmedToday: confirmedRes.count ?? 0, declinedToday: declinedRes.count ?? 0, totalRevenue: revenue };
}

export async function fetchDistinctCustomers(): Promise<{ name: string; whatsapp: string; bookings: number; lastVisit: string; groupSize: number }[]> {
  const { data, error } = await supabase.from("bookings").select("lead_name, whatsapp_number, group_size, created_at").order("created_at", { ascending: false });
  if (error) throw error;
  const map = new Map<string, { name: string; whatsapp: string; bookings: number; lastVisit: string; groupSize: number }>();
  for (const row of data) {
    const key = row.lead_name;
    const existing = map.get(key);
    if (existing) {
      existing.bookings += 1;
    } else {
      map.set(key, {
        name: row.lead_name,
        whatsapp: row.whatsapp_number,
        bookings: 1,
        lastVisit: new Date(row.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
        groupSize: row.group_size,
      });
    }
  }
  return Array.from(map.values());
}

export { DECLINE_REASONS };

// ===== DRIVER UPDATE =====

export async function updateDriver(id: string, updates: { name?: string; phone_number?: string; vehicle_type?: Driver["vehicle_type"]; status?: Driver["status"] }): Promise<void> {
  const { error } = await supabase.from("drivers").update(updates).eq("id", id);
  if (error) throw error;
}

// ===== PARTNER UPDATE =====

export async function updatePartner(id: string, updates: { business_name?: string; category?: Partner["category"]; contact_phone?: string; commission_rate?: number; status?: Partner["status"] }): Promise<void> {
  const { error } = await supabase.from("partners").update(updates).eq("id", id);
  if (error) throw error;
}

// ===== BOOKING: CANCEL + DELETE + INVOICE =====

export async function cancelBooking(bookingId: string): Promise<Booking> {
  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as Booking;
}

export async function deleteBooking(bookingId: string): Promise<void> {
  const { error } = await supabase.from("bookings").delete().eq("id", bookingId);
  if (error) throw error;
}

export async function issueInvoice(bookingId: string): Promise<Booking> {
  const { data: booking } = await supabase.from("bookings").select("ref_code").eq("id", bookingId).maybeSingle();
  const invoiceNumber = `INV-${booking?.ref_code ?? "VG"}-${Math.floor(Math.random() * 9000) + 1000}`;
  const { data, error } = await supabase
    .from("bookings")
    .update({ invoice_issued: true, invoice_number: invoiceNumber })
    .eq("id", bookingId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as Booking;
}

// ===== VEHICLES =====

export async function fetchVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase.from("vehicles").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data as Vehicle[];
}

export async function addVehicle(modelName: string, licensePlate: string, status: Vehicle["status"], driverId: string | null): Promise<Vehicle> {
  const { data, error } = await supabase
    .from("vehicles")
    .insert({ model_name: modelName, license_plate: licensePlate, status, driver_id: driverId })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as Vehicle;
}

export async function updateVehicle(id: string, updates: { model_name?: string; license_plate?: string; status?: Vehicle["status"]; driver_id?: string | null }): Promise<void> {
  const { error } = await supabase.from("vehicles").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteVehicle(id: string): Promise<void> {
  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) throw error;
}

// ===== SUPPLIERS =====

export async function fetchSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase.from("suppliers").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data as Supplier[];
}

export async function addSupplier(companyName: string, contactName: string, whatsappNumber: string, fleetSize: number): Promise<Supplier> {
  const { data, error } = await supabase
    .from("suppliers")
    .insert({ company_name: companyName, contact_name: contactName, whatsapp_number: whatsappNumber, fleet_size: fleetSize })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as Supplier;
}

export async function updateSupplier(id: string, updates: { company_name?: string; contact_name?: string; whatsapp_number?: string; fleet_size?: number }): Promise<void> {
  const { error } = await supabase.from("suppliers").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteSupplier(id: string): Promise<void> {
  const { error } = await supabase.from("suppliers").delete().eq("id", id);
  if (error) throw error;
}

// ===== CUSTOMERS =====

export async function fetchCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data as Customer[];
}

export async function addCustomer(fullName: string, email: string, countryCode: string, whatsappNumber: string): Promise<Customer> {
  const { data, error } = await supabase
    .from("customers")
    .insert({ full_name: fullName, email, country_code: countryCode, whatsapp_number: whatsappNumber })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as Customer;
}

export async function updateCustomer(id: string, updates: { full_name?: string; email?: string; country_code?: string; whatsapp_number?: string }): Promise<void> {
  const { error } = await supabase.from("customers").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw error;
}

// ===== EXPENSES =====

export async function fetchExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase.from("expenses").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data as Expense[];
}

export async function addExpense(expenseName: string, category: Expense["category"], amountMad: number, expenseDate: string): Promise<Expense> {
  const { data, error } = await supabase
    .from("expenses")
    .insert({ expense_name: expenseName, category, amount_mad: amountMad, expense_date: expenseDate })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as Expense;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
}

// ===== HOTEL CONTACTS =====

export async function fetchHotelContacts(): Promise<HotelContact[]> {
  const { data, error } = await supabase.from("hotel_contacts").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data as HotelContact[];
}

export async function addHotelContact(hotelName: string, managerName: string, directPhone: string, contractExpiry: string): Promise<HotelContact> {
  const { data, error } = await supabase
    .from("hotel_contacts")
    .insert({ hotel_name: hotelName, manager_name: managerName, direct_phone: directPhone, contract_expiry: contractExpiry })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as HotelContact;
}

export async function updateHotelContact(id: string, updates: { hotel_name?: string; manager_name?: string; direct_phone?: string; contract_expiry?: string }): Promise<void> {
  const { error } = await supabase.from("hotel_contacts").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteHotelContact(id: string): Promise<void> {
  const { error } = await supabase.from("hotel_contacts").delete().eq("id", id);
  if (error) throw error;
}

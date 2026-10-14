export type StaffRole = "admin" | "employee";

export interface StaffAccount {
  id: string;
  fullName: string;
  email: string;
  password: string;
  role: StaffRole;
}

export type NavSection = "operations" | "resources" | "communication" | "finance";

export type StaffNavId =
  | "overview"
  | "reservations"
  | "dispatch"
  | "calendar"
  | "trips"
  | "drivers"
  | "vehicles"
  | "suppliers"
  | "agencies"
  | "customers"
  | "hotels"
  | "whatsapp"
  | "automations"
  | "payments"
  | "invoices";

export interface NavItem {
  id: StaffNavId;
  label: string;
  icon: string;
  section: NavSection;
}

export interface NavGroup {
  section: NavSection;
  label: string;
  items: NavItem[];
}

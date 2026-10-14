import type { StaffAccount, NavGroup } from "./staffTypes";

export const STAFF_ACCESS_KEY = "VG-STAFF-2026";

export const SEED_ACCOUNTS: StaffAccount[] = [
  {
    id: "seed-admin",
    fullName: "Amira Benali",
    email: "admin@voyagego.com",
    password: "admin123",
    role: "admin",
  },
  {
    id: "seed-employee",
    fullName: "Youssef Tahiri",
    email: "staff@voyagego.com",
    password: "staff123",
    role: "employee",
  },
];

export const NAV_GROUPS: NavGroup[] = [
  {
    section: "operations",
    label: "Operations",
    items: [
      { id: "overview", label: "Overview", icon: "LayoutDashboard", section: "operations" },
      { id: "reservations", label: "Reservations", icon: "ClipboardCheck", section: "operations" },
      { id: "dispatch", label: "Dispatch Board", icon: "Radio", section: "operations" },
      { id: "calendar", label: "Calendar", icon: "CalendarDays", section: "operations" },
      { id: "trips", label: "Trips", icon: "Map", section: "operations" },
    ],
  },
  {
    section: "resources",
    label: "Resources",
    items: [
      { id: "drivers", label: "Drivers", icon: "Users", section: "resources" },
      { id: "vehicles", label: "Vehicles", icon: "Car", section: "resources" },
      { id: "suppliers", label: "Transport Suppliers", icon: "Truck", section: "resources" },
      { id: "agencies", label: "Agencies & Partners", icon: "Building2", section: "resources" },
      { id: "customers", label: "Customers", icon: "UserCircle", section: "resources" },
      { id: "hotels", label: "Hotels & Contacts", icon: "Hotel", section: "resources" },
    ],
  },
  {
    section: "communication",
    label: "Communication",
    items: [
      { id: "whatsapp", label: "WhatsApp Inbox", icon: "MessageCircle", section: "communication" },
      { id: "automations", label: "Automations", icon: "Zap", section: "communication" },
    ],
  },
  {
    section: "finance",
    label: "Finance",
    items: [
      { id: "payments", label: "Payments & Expenses", icon: "CreditCard", section: "finance" },
      { id: "invoices", label: "Invoices & Commissions", icon: "FileText", section: "finance" },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

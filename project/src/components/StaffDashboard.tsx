import { useState } from "react";
import {
  LayoutDashboard, ClipboardCheck, Radio, CalendarDays, Map,
  Users, Car, Truck, Building2, UserCircle, Hotel,
  MessageCircle, Zap, CreditCard, FileText,
  Plane, LogOut, Menu, X, Shield,
} from "lucide-react";
import type { StaffAccount, StaffNavId, NavGroup } from "../staffTypes";
import { NAV_GROUPS, ALL_NAV_ITEMS } from "../staffData";
import { ReservationVerificationDesk } from "./ReservationVerificationDesk";
import {
  OverviewContent, DispatchBoardContent, CalendarContent, TripsContent,
  DriversContent, VehiclesContent, SuppliersContent, AgenciesContent,
  CustomersContent, HotelsContent, WhatsAppInboxContent, AutomationsContent,
  PaymentsContent, InvoicesContent,
} from "./StaffContent";

interface StaffDashboardProps {
  account: StaffAccount;
  onLogout: () => void;
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, ClipboardCheck, Radio, CalendarDays, Map,
  Users, Car, Truck, Building2, UserCircle, Hotel,
  MessageCircle, Zap, CreditCard, FileText,
};

export function StaffDashboard({ account, onLogout }: StaffDashboardProps) {
  const [activeNav, setActiveNav] = useState<StaffNavId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleNavClick(id: StaffNavId) {
    setActiveNav(id);
    setSidebarOpen(false);
  }

  const activeLabel = ALL_NAV_ITEMS.find((n) => n.id === activeNav)?.label ?? "Dashboard";

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F1F5F9" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar — deep navy */}
      <aside
        className={`fixed md:sticky top-0 z-50 md:z-auto h-screen w-64 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{ backgroundColor: "#0F172A" }}
      >
        {/* Brand header */}
        <div className="px-4 py-4 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-teal-500 shadow-lg shadow-teal-500/20">
              <Plane className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-white">VoyageGo</p>
              <p className="text-[10px] text-slate-400">Marrakech Ops</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-3 pt-3 pb-1">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Shield className="w-3.5 h-3.5" />
            Operations Dashboard
          </div>
        </div>

        {/* Grouped nav */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          {NAV_GROUPS.map((group: NavGroup) => (
            <div key={group.section} className="mb-3">
              <p className="px-3 py-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = ICONS[item.icon];
                  const isActive = activeNav === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? "bg-teal-500 text-white shadow-md shadow-teal-500/25"
                          : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                      }`}
                    >
                      {Icon && <Icon className="w-4 h-4 shrink-0" />}
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User + logout */}
        <div className="px-3 py-3 border-t border-slate-700/50">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 text-white text-xs font-bold">
              {account.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="leading-tight min-w-0">
              <p className="text-xs font-semibold text-white truncate">{account.fullName}</p>
              <p className="text-[10px] text-slate-500 truncate">{account.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-600">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-gray-900">{activeLabel}</h1>
              <p className="text-[10px] text-gray-400">VoyageGo Operations · {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 text-green-600 text-[10px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              System Online
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="animate-[fadeInUp_0.3s_ease-out]">
            {renderContent(activeNav)}
          </div>
        </main>
      </div>
    </div>
  );
}

function renderContent(navId: StaffNavId) {
  switch (navId) {
    case "overview":
      return <OverviewContent />;
    case "reservations":
      return <ReservationVerificationDesk />;
    case "dispatch":
      return <DispatchBoardContent />;
    case "calendar":
      return <CalendarContent />;
    case "trips":
      return <TripsContent />;
    case "drivers":
      return <DriversContent />;
    case "vehicles":
      return <VehiclesContent />;
    case "suppliers":
      return <SuppliersContent />;
    case "agencies":
      return <AgenciesContent />;
    case "customers":
      return <CustomersContent />;
    case "hotels":
      return <HotelsContent />;
    case "whatsapp":
      return <WhatsAppInboxContent />;
    case "automations":
      return <AutomationsContent />;
    case "payments":
      return <PaymentsContent />;
    case "invoices":
      return <InvoicesContent />;
    default:
      return <OverviewContent />;
  }
}

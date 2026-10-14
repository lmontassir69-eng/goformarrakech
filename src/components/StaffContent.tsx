import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ArrowUpRight, ArrowDownRight, TrendingUp, CheckCircle2, AlertTriangle, Clock,
  Calendar, Map, Users, Car, Truck, Building2, Hotel,
  MessageCircle, Zap, CreditCard, FileText, Radio, Loader2, Plus, Trash2, X, UserCircle,
  Pencil, Download, ChevronLeft, ChevronRight,
} from "lucide-react";
import type { Driver, Partner, Booking, Vehicle, Supplier, Customer, Expense, HotelContact } from "../lib/supabase";
import {
  fetchDrivers, addDriver, deleteDriver, updateDriver,
  fetchPartners, fetchPartnersByCategory, addPartner, deletePartner, updatePartner,
  fetchAllBookings, fetchBookingCounts, fetchDistinctCustomers,
  cancelBooking, deleteBooking, issueInvoice,
  fetchVehicles, addVehicle, deleteVehicle, updateVehicle,
  fetchSuppliers, addSupplier, deleteSupplier, updateSupplier,
  fetchCustomers, addCustomer, deleteCustomer, updateCustomer,
  fetchExpenses, addExpense, deleteExpense,
  fetchHotelContacts, addHotelContact, deleteHotelContact, updateHotelContact,
} from "../bookingApi";
import { DriverDispatchModal } from "./DriverDispatchModal";

// ===== Shared UI =====

function LoadSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-600">{message}</div>;
}

function StatCard({ label, value, change, trend, color }: { label: string; value: string; change: string; trend: "up" | "down"; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <p className="text-[11px] text-gray-400 font-medium">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
      <div className={`flex items-center gap-1 mt-1.5 text-[11px] font-semibold ${trend === "up" ? "text-green-600" : "text-red-500"}`}>
        {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {change}
      </div>
      <div className={`mt-2 h-1 rounded-full ${color}`} />
    </div>
  );
}

// ===== Generic Modal =====

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ title, onClose, children }: ModalProps) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-[fadeInUp_0.2s_ease-out]">
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-medium text-gray-500 mb-1 block">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-teal-400 transition-all";

// ===== Confirm dialog hook =====

function useConfirm() {
  const [confirmState, setConfirmState] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const confirm = (message: string, onConfirm: () => void) => setConfirmState({ message, onConfirm });
  const ConfirmDialog = confirmState ? (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setConfirmState(null)} />
      <div className="relative w-full max-w-xs bg-white rounded-2xl shadow-xl p-5 text-center animate-[fadeInUp_0.2s_ease-out]">
        <div className="w-12 h-12 rounded-full bg-rose-50 mx-auto flex items-center justify-center mb-3">
          <Trash2 className="w-6 h-6 text-rose-500" />
        </div>
        <p className="text-sm font-semibold text-gray-900 mb-1">Confirm Deletion</p>
        <p className="text-xs text-gray-500 mb-4">{confirmState.message}</p>
        <div className="flex gap-2">
          <button onClick={() => setConfirmState(null)} className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
          <button
            onClick={() => { confirmState.onConfirm(); setConfirmState(null); }}
            className="flex-1 py-2 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 transition-colors"
          >Delete</button>
        </div>
      </div>
    </div>
  ) : null;
  return { confirm, ConfirmDialog };
}

// Row action buttons

function EditBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-gray-400 hover:text-teal-600 transition-colors" title="Edit">
      <Pencil className="w-3.5 h-3.5" />
    </button>
  );
}

function DeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-gray-400 hover:text-rose-500 transition-colors" title="Delete">
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}

// ===== Revenue Chart (interactive) =====

interface WeekData {
  weekLabel: string;
  weekStart: Date;
  weekEnd: Date;
  revenue: number;
  bookingCount: number;
  categoryBreakdown: { category: string; revenue: number; count: number }[];
}

const CAT_COLORS: Record<string, string> = {
  hotels: "bg-teal-500", Hotel: "bg-teal-500",
  flights: "bg-blue-500", Flight: "bg-blue-500",
  restaurants: "bg-orange-500", Restaurant: "bg-orange-500",
  excursions: "bg-emerald-500", Excursion: "bg-emerald-500",
  activities: "bg-rose-500", Activity: "bg-rose-500",
  Other: "bg-gray-400",
};

function RevenueChart({ bookings }: { bookings: Booking[] }) {
  const [offset, setOffset] = useState(0);
  const [selectedWeekIdx, setSelectedWeekIdx] = useState<number | null>(null);

  const allWeeks: WeekData[] = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const weeks: WeekData[] = [];
    for (let w = 0; w < 52; w++) {
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - w * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      const weekBookings = bookings.filter((b) => {
        const created = new Date(b.created_at);
        return created >= weekStart && created <= weekEnd;
      });
      const confirmed = weekBookings.filter((b) => b.status === "confirmed" || b.status === "assigned");
      const revenue = confirmed.reduce((s, b) => s + Number(b.price_mad), 0);

      const catMap = new Map<string, { revenue: number; count: number }>();
      for (const b of confirmed) {
        const cat = b.item_category || "Other";
        const ex = catMap.get(cat) || { revenue: 0, count: 0 };
        ex.revenue += Number(b.price_mad);
        ex.count += 1;
        catMap.set(cat, ex);
      }

      weeks.push({
        weekLabel: `W${w + 1}`,
        weekStart, weekEnd,
        revenue,
        bookingCount: weekBookings.length,
        categoryBreakdown: Array.from(catMap.entries()).map(([category, d]) => ({ category, ...d })),
      });
    }
    return weeks;
  }, [bookings]);

  const windowWeeks = allWeeks.slice(offset * 12, offset * 12 + 12).reverse();
  const maxRevenue = Math.max(...windowWeeks.map((w) => w.revenue), 1);
  const selectedWeek = selectedWeekIdx !== null ? windowWeeks[selectedWeekIdx] : null;
  const periodStart = windowWeeks[0]?.weekStart;
  const periodEnd = windowWeeks[windowWeeks.length - 1]?.weekEnd;
  const periodLabel = periodStart && periodEnd
    ? `${periodStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} — ${periodEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
    : "";
  const totalWindowRevenue = windowWeeks.reduce((s, w) => s + w.revenue, 0);
  const totalWindowBookings = windowWeeks.reduce((s, w) => s + w.bookingCount, 0);
  const avgRevenue = totalWindowRevenue / 12;

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-gray-900">Revenue Trend</h3>
          <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 text-[9px] font-bold uppercase tracking-wide">Interactive</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setOffset((o) => Math.min(o + 1, 3)); setSelectedWeekIdx(null); }}
            disabled={offset >= 3}
            className="flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-teal-300 disabled:opacity-30 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] text-gray-600 font-semibold whitespace-nowrap min-w-[140px] text-center">{periodLabel}</span>
          <button onClick={() => { setOffset((o) => Math.max(o - 1, 0)); setSelectedWeekIdx(null); }}
            disabled={offset <= 0}
            className="flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-teal-300 disabled:opacity-30 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-teal-500" />
          <span className="text-sm font-bold text-gray-900">DH {Math.round(totalWindowRevenue).toLocaleString()}</span>
          <span className="text-[10px] text-gray-400">total · {totalWindowBookings} bookings</span>
        </div>
        <div className="text-[10px] text-gray-400">Avg DH {Math.round(avgRevenue).toLocaleString()}/wk</div>
      </div>

      {/* Chart area with bar + line overlay */}
      <div className="relative">
        {/* Average line */}
        <div className="absolute left-0 right-0 pointer-events-none" style={{ bottom: `${(avgRevenue / maxRevenue) * 100 * 1.0 + 8}%` }}>
          <div className="border-t border-dashed border-teal-300/50" />
          <span className="absolute right-0 -top-3.5 text-[8px] text-teal-500 font-semibold bg-white px-1">avg</span>
        </div>

        {/* SVG trend line over bars */}
        <svg className="absolute inset-0 w-full h-40 pointer-events-none z-10" preserveAspectRatio="none" viewBox={`0 0 ${windowWeeks.length * 100} 160`}>
          <polyline
            points={windowWeeks.map((w, i) => {
              const x = i * 100 + 50;
              const y = 160 - (w.revenue / maxRevenue) * 140 - 4;
              return `${x},${y}`;
            }).join(" ")}
            fill="none"
            stroke="rgb(13, 148, 136)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity="0.35"
          />
          {windowWeeks.map((w, i) => {
            const x = i * 100 + 50;
            const y = 160 - (w.revenue / maxRevenue) * 140 - 4;
            const isSel = selectedWeekIdx === i;
            return <circle key={i} cx={x} cy={y} r={isSel ? 5 : 3} fill={isSel ? "rgb(15, 118, 110)" : "rgb(20, 184, 166)"} opacity={isSel ? 1 : 0.6} />;
          })}
        </svg>

        <div className="flex items-end gap-1.5 h-40">
          {windowWeeks.map((week, i) => {
            const heightPct = (week.revenue / maxRevenue) * 100;
            const isSelected = selectedWeekIdx === i;
            const hasData = week.revenue > 0;
            return (
              <button key={i} onClick={() => setSelectedWeekIdx(isSelected ? null : i)}
                className={`flex-1 flex flex-col items-center gap-1.5 group cursor-pointer transition-transform duration-200 ${isSelected ? "scale-105" : "hover:scale-102"}`}>
                <div className={`text-[8px] font-bold transition-all duration-200 ${isSelected ? "text-teal-700 opacity-100" : "text-gray-500 opacity-0 group-hover:opacity-100"}`}>
                  {hasData ? `DH ${Math.round(week.revenue).toLocaleString()}` : ""}
                </div>
                <div className={`w-full rounded-t-lg transition-all duration-300 ${isSelected
                  ? "bg-gradient-to-t from-teal-700 to-teal-500 shadow-md shadow-teal-500/30"
                  : hasData
                  ? "bg-gradient-to-t from-teal-600 to-teal-400 group-hover:from-teal-700 group-hover:to-teal-500"
                  : "bg-gray-100 group-hover:bg-gray-200"}`}
                  style={{ height: `${Math.max(heightPct, 2)}%` }}
                />
                <span className={`text-[8px] transition-colors ${isSelected ? "text-teal-700 font-bold" : "text-gray-400 group-hover:text-teal-600"}`}>
                  {week.weekLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Week detail panel */}
      {selectedWeek && (
        <div className="mt-4 pt-4 border-t border-gray-100 animate-[fadeInUp_0.3s_ease-out]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-xs font-bold text-gray-900">
                {selectedWeek.weekLabel} — {selectedWeek.weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} to {selectedWeek.weekEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5">{selectedWeek.bookingCount} total bookings · DH {Math.round(selectedWeek.revenue).toLocaleString()} confirmed revenue</p>
            </div>
            <button onClick={() => setSelectedWeekIdx(null)} className="text-gray-300 hover:text-gray-500 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {selectedWeek.categoryBreakdown.length > 0 ? (
            <div className="space-y-2">
              {selectedWeek.categoryBreakdown.sort((a, b) => b.revenue - a.revenue).map((cat) => {
                const pct = (cat.revenue / selectedWeek.revenue) * 100;
                const colorCls = CAT_COLORS[cat.category] ?? "bg-gray-400";
                return (
                  <div key={cat.category} className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-gray-600 w-20 shrink-0 capitalize">{cat.category}</span>
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${colorCls} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 w-16 text-right shrink-0">DH {Math.round(cat.revenue).toLocaleString()}</span>
                    <span className="text-[9px] text-gray-400 w-10 text-right shrink-0">{cat.count} bk</span>
                  </div>
                );
              })}
              {/* Category share donut summary */}
              <div className="flex items-center gap-1.5 pt-2 mt-2 border-t border-gray-50">
                {selectedWeek.categoryBreakdown.sort((a, b) => b.revenue - a.revenue).map((cat) => {
                  const pct = (cat.revenue / selectedWeek.revenue) * 100;
                  const colorCls = CAT_COLORS[cat.category] ?? "bg-gray-400";
                  return (
                    <div key={cat.category} className="flex items-center gap-1">
                      <div className={`w-2.5 h-2.5 rounded-full ${colorCls}`} />
                      <span className="text-[9px] text-gray-500">{cat.category} {Math.round(pct)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 mx-auto flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-gray-300" />
              </div>
              <p className="text-xs text-gray-400">No confirmed revenue in this week</p>
              <p className="text-[10px] text-gray-300 mt-0.5">{selectedWeek.bookingCount} bookings were created but none confirmed yet</p>
            </div>
          )}
        </div>
      )}

      {/* Hint */}
      {selectedWeekIdx === null && (
        <p className="text-center text-[10px] text-gray-300 mt-3">Click a bar to see the weekly breakdown · Use arrows to navigate periods</p>
      )}
    </div>
  );
}

// ===== Overview =====

export function OverviewContent() {
  const [counts, setCounts] = useState<{ pending: number; confirmedToday: number; declinedToday: number; totalRevenue: number } | null>(null);
  const [driverCount, setDriverCount] = useState(0);
  const [partnerCount, setPartnerCount] = useState(0);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [c, drivers, partners, allBookings] = await Promise.all([fetchBookingCounts(), fetchDrivers(), fetchPartners(), fetchAllBookings()]);
        setCounts(c);
        setDriverCount(drivers.filter((d) => d.status === "available").length);
        setPartnerCount(partners.length);
        setBookings(allBookings);
      } catch { /* ignore */ } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <LoadSpinner />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Revenue" value={`DH ${(counts?.totalRevenue ?? 0).toLocaleString()}`} change="+12.4%" trend="up" color="bg-teal-500" />
        <StatCard label="Pending Bookings" value={String(counts?.pending ?? 0)} change="Live" trend="up" color="bg-orange-500" />
        <StatCard label="Available Drivers" value={String(driverCount)} change="Ready" trend="up" color="bg-blue-500" />
        <StatCard label="Active Partners" value={String(partnerCount)} change="Connected" trend="up" color="bg-rose-500" />
      </div>
      <RevenueChart bookings={bookings} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Today's Activity</h3>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs"><Clock className="w-4 h-4 text-amber-500" /><span className="text-gray-700">{counts?.pending ?? 0} bookings awaiting partner verification</span></div>
            <div className="flex items-center gap-2.5 text-xs"><CheckCircle2 className="w-4 h-4 text-green-500" /><span className="text-gray-700">{counts?.confirmedToday ?? 0} bookings confirmed today</span></div>
            <div className="flex items-center gap-2.5 text-xs"><AlertTriangle className="w-4 h-4 text-rose-500" /><span className="text-gray-700">{counts?.declinedToday ?? 0} bookings declined today</span></div>
            <div className="flex items-center gap-2.5 text-xs"><Users className="w-4 h-4 text-blue-500" /><span className="text-gray-700">{driverCount} drivers available for dispatch</span></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-teal-50 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-teal-700">{counts?.pending ?? 0}</p><p className="text-[10px] text-teal-600 font-medium">Pending Queue</p></div>
            <div className="bg-blue-50 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-blue-700">{driverCount}</p><p className="text-[10px] text-blue-600 font-medium">Drivers Ready</p></div>
            <div className="bg-amber-50 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-amber-700">{partnerCount}</p><p className="text-[10px] text-amber-600 font-medium">Partners</p></div>
            <div className="bg-rose-50 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-rose-700">{counts?.confirmedToday ?? 0}</p><p className="text-[10px] text-rose-600 font-medium">Confirmed Today</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Dispatch Board =====

export function DispatchBoardContent() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispatchBooking, setDispatchBooking] = useState<Booking | null>(null);

  const load = useCallback(async () => {
    try {
      const all = await fetchAllBookings();
      setBookings(all.filter((b) => b.status === "confirmed" || b.status === "assigned"));
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadSpinner />;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Live Dispatch
        </span>
        <p className="text-xs text-gray-400">Confirmed trips awaiting driver assignment</p>
      </div>
      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <Radio className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-700">No active dispatches</p>
          <p className="text-xs text-gray-400 mt-1">Confirm reservations to populate the dispatch board.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-50 shrink-0"><Radio className="w-5 h-5 text-orange-600" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-gray-400">{b.ref_code}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${b.status === "assigned" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{b.status === "assigned" ? "Assigned" : "Needs Driver"}</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 truncate mt-0.5">{b.item_title}</p>
                <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-0.5"><span>{b.lead_name}</span><span className="flex items-center gap-1"><Clock className="w-3 h-3" />{b.booking_date}</span><span>{b.group_size} pax</span></div>
              </div>
              {b.status === "confirmed" && (
                <button onClick={() => setDispatchBooking(b)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] text-white text-[11px] font-bold hover:bg-[#20BE57] active:scale-95 transition-all shrink-0">
                  <Radio className="w-3.5 h-3.5" /> Assign &amp; Dispatch
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <DriverDispatchModal booking={dispatchBooking} onClose={() => { setDispatchBooking(null); load(); }} onDispatched={() => {}} />
    </div>
  );
}

// ===== Calendar =====

export function CalendarContent() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setBookings(await fetchAllBookings()); } catch { /* ignore */ } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <LoadSpinner />;

  const dayMap = new globalThis.Map<number, Booking[]>();
  for (const b of bookings) {
    const day = parseInt(b.booking_date?.match(/\d+/)?.[0] ?? "0");
    if (day >= 1 && day <= 31) {
      const arr = dayMap.get(day) ?? [];
      arr.push(b);
      dayMap.set(day, arr);
    }
  }

  const days = Array.from({ length: 35 }, (_, i) => i - 2);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1"><h3 className="text-sm font-bold text-gray-900">October 2026</h3></div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const valid = day >= 1 && day <= 31;
            const bk = dayMap.get(day);
            return (
              <div key={day} className={`aspect-square rounded-xl p-1.5 flex flex-col text-xs ${!valid ? "bg-gray-50/50 text-gray-300" : bk?.length ? "bg-teal-50 border border-teal-200" : "bg-gray-50 hover:bg-gray-100 transition-colors"}`}>
                {valid && <span className={`font-bold ${bk?.length ? "text-teal-700" : "text-gray-600"}`}>{day}</span>}
                {bk?.length && (
                  <div className="mt-auto w-full">
                    <div className="flex items-center gap-1 text-[9px] text-teal-600 font-semibold"><Calendar className="w-2.5 h-2.5" />{bk.length}</div>
                    <p className="text-[8px] text-teal-400 truncate">{bk[0].item_title.slice(0, 10)}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ===== Trips =====

export function TripsContent() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { confirm, ConfirmDialog } = useConfirm();

  const load = useCallback(async () => {
    try {
      const all = await fetchAllBookings();
      setBookings(all.filter((b) => b.status === "assigned" || b.status === "declined" || b.status === "cancelled"));
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadSpinner />;

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400 px-1">Completed and historical travel routes</p>
      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-12 text-center"><Map className="w-10 h-10 text-gray-300 mx-auto mb-2" /><p className="text-sm font-semibold text-gray-700">No trips yet</p></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-left">
                <th className="px-4 py-2.5 font-semibold">Ref</th><th className="px-4 py-2.5 font-semibold">Item</th><th className="px-4 py-2.5 font-semibold">Guest</th><th className="px-4 py-2.5 font-semibold">Date</th><th className="px-4 py-2.5 font-semibold">Status</th><th className="px-4 py-2.5 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-gray-700">{b.ref_code}</td>
                  <td className="px-4 py-3 font-semibold text-gray-700">{b.item_title}</td>
                  <td className="px-4 py-3 text-gray-600">{b.lead_name}</td>
                  <td className="px-4 py-3 text-gray-500">{b.booking_date}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${b.status === "assigned" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{b.status}</span></td>
                  <td className="px-4 py-3"><DeleteBtn onClick={() => confirm(`Delete booking ${b.ref_code}?`, async () => { await deleteBooking(b.id); load(); })} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {ConfirmDialog}
    </div>
  );
}

// ===== Drivers =====

export function DriversContent() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", vehicle: "Mercedes Van" as Driver["vehicle_type"], status: "available" as Driver["status"] });
  const { confirm, ConfirmDialog } = useConfirm();

  const load = useCallback(async () => {
    try { setDrivers(await fetchDrivers()); setError(""); } catch (err) { setError(err instanceof Error ? err.message : "Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setForm({ name: "", phone: "", vehicle: "Mercedes Van", status: "available" }); setShowAdd(true); setEditDriver(null); }
  function openEdit(d: Driver) { setForm({ name: d.name, phone: d.phone_number, vehicle: d.vehicle_type, status: d.status }); setEditDriver(d); setShowAdd(true); }

  async function handleSubmit() {
    if (!form.name.trim() || !form.phone.trim()) return;
    try {
      if (editDriver) { await updateDriver(editDriver.id, { name: form.name.trim(), phone_number: form.phone.trim(), vehicle_type: form.vehicle, status: form.status }); }
      else { await addDriver(form.name.trim(), form.phone.trim(), form.vehicle); }
      setShowAdd(false); setEditDriver(null); load();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save"); }
  }

  if (loading) return <LoadSpinner />;

  return (
    <div className="space-y-4">
      {error && <ErrorBox message={error} />}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">Roster of available drivers in Marrakech</p>
        <button onClick={openAdd} className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-[11px] font-semibold hover:bg-teal-700 transition-colors flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add Driver</button>
      </div>
      {showAdd && (
        <Modal title={editDriver ? "Edit Driver" : "Add Driver"} onClose={() => { setShowAdd(false); setEditDriver(null); }}>
          <div className="space-y-3">
            <Field label="Driver Name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Hassan Alami" /></Field>
            <Field label="Phone Number"><input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+212 6XX XXX XXX" /></Field>
            <Field label="Vehicle Type"><select className={inputCls} value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value as Driver["vehicle_type"] })}><option>Mercedes Van</option><option>4x4 Prado</option><option>Minibus</option></select></Field>
            {editDriver && <Field label="Status"><select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Driver["status"] })}><option value="available">Available</option><option value="on_trip">On Trip</option><option value="off_duty">Off Duty</option></select></Field>}
            <div className="flex gap-2 pt-1">
              <button onClick={handleSubmit} className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-700">{editDriver ? "Save Changes" : "Add Driver"}</button>
              <button onClick={() => { setShowAdd(false); setEditDriver(null); }} className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {drivers.map((d) => (
          <div key={d.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-100 text-teal-700 text-sm font-bold">{d.name.charAt(0)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{d.name}</p>
              <p className="text-[11px] text-gray-400 truncate flex items-center gap-1"><Car className="w-3 h-3" />{d.vehicle_type} · {d.phone_number}</p>
              <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${d.status === "available" ? "bg-green-100 text-green-700" : d.status === "on_trip" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500"}`}>{d.status.replace("_", " ")}</span>
            </div>
            <a href={`https://wa.me/${d.phone_number.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1.5 rounded-lg bg-green-50 text-green-600 text-[10px] font-semibold hover:bg-green-100 transition-colors shrink-0 flex items-center gap-1"><MessageCircle className="w-3 h-3" /> Chat</a>
            <EditBtn onClick={() => openEdit(d)} />
            <DeleteBtn onClick={() => confirm(`Delete driver ${d.name}?`, async () => { await deleteDriver(d.id); load(); })} />
          </div>
        ))}
      </div>
      {ConfirmDialog}
    </div>
  );
}

// ===== Vehicles =====

export function VehiclesContent() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [form, setForm] = useState({ model: "", plate: "", status: "active" as Vehicle["status"], driverId: "" });
  const { confirm, ConfirmDialog } = useConfirm();

  const load = useCallback(async () => {
    try {
      const [v, d] = await Promise.all([fetchVehicles(), fetchDrivers()]);
      setVehicles(v); setDrivers(d); setError("");
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setForm({ model: "", plate: "", status: "active", driverId: "" }); setEditVehicle(null); setShowAdd(true); }
  function openEdit(v: Vehicle) { setForm({ model: v.model_name, plate: v.license_plate, status: v.status, driverId: v.driver_id ?? "" }); setEditVehicle(v); setShowAdd(true); }

  async function handleSubmit() {
    if (!form.model.trim() || !form.plate.trim()) return;
    try {
      const driverId = form.driverId || null;
      if (editVehicle) { await updateVehicle(editVehicle.id, { model_name: form.model.trim(), license_plate: form.plate.trim(), status: form.status, driver_id: driverId }); }
      else { await addVehicle(form.model.trim(), form.plate.trim(), form.status, driverId); }
      setShowAdd(false); setEditVehicle(null); load();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save"); }
  }

  if (loading) return <LoadSpinner />;

  const driverName = (id: string | null) => drivers.find((d) => d.id === id)?.name ?? "Unassigned";

  return (
    <div className="space-y-4">
      {error && <ErrorBox message={error} />}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">Fleet vehicles in service</p>
        <button onClick={openAdd} className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-[11px] font-semibold hover:bg-teal-700 transition-colors flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add Vehicle</button>
      </div>
      {showAdd && (
        <Modal title={editVehicle ? "Edit Vehicle" : "Add Vehicle"} onClose={() => { setShowAdd(false); setEditVehicle(null); }}>
          <div className="space-y-3">
            <Field label="Model Name"><input className={inputCls} value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Mercedes V-Class" /></Field>
            <Field label="License Plate"><input className={inputCls} value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} placeholder="12345-A-1" /></Field>
            <Field label="Status"><select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Vehicle["status"] })}><option value="active">Active</option><option value="maintenance">Maintenance</option><option value="retired">Retired</option></select></Field>
            <Field label="Driver Assignment"><select className={inputCls} value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })}><option value="">Unassigned</option>{drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
            <div className="flex gap-2 pt-1">
              <button onClick={handleSubmit} className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-700">{editVehicle ? "Save Changes" : "Add Vehicle"}</button>
              <button onClick={() => { setShowAdd(false); setEditVehicle(null); }} className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
      {vehicles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-12 text-center"><Truck className="w-10 h-10 text-gray-300 mx-auto mb-2" /><p className="text-sm font-semibold text-gray-700">No vehicles yet</p></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead><tr className="bg-gray-50 text-gray-500 text-left"><th className="px-4 py-2.5 font-semibold">Model</th><th className="px-4 py-2.5 font-semibold">Plate</th><th className="px-4 py-2.5 font-semibold">Driver</th><th className="px-4 py-2.5 font-semibold">Status</th><th className="px-4 py-2.5 font-semibold">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-50">
              {vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-700">{v.model_name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono">{v.license_plate}</td>
                  <td className="px-4 py-3 text-gray-600">{driverName(v.driver_id)}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${v.status === "active" ? "bg-green-100 text-green-700" : v.status === "maintenance" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>{v.status}</span></td>
                  <td className="px-4 py-3 flex items-center gap-2"><EditBtn onClick={() => openEdit(v)} /><DeleteBtn onClick={() => confirm(`Delete vehicle ${v.model_name}?`, async () => { await deleteVehicle(v.id); load(); })} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {ConfirmDialog}
    </div>
  );
}

// ===== Suppliers =====

export function SuppliersContent() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ company: "", contact: "", whatsapp: "", fleetSize: 0 });
  const { confirm, ConfirmDialog } = useConfirm();

  const load = useCallback(async () => {
    try { setSuppliers(await fetchSuppliers()); setError(""); } catch (err) { setError(err instanceof Error ? err.message : "Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setForm({ company: "", contact: "", whatsapp: "", fleetSize: 0 }); setEditSupplier(null); setShowAdd(true); }
  function openEdit(s: Supplier) { setForm({ company: s.company_name, contact: s.contact_name ?? "", whatsapp: s.whatsapp_number ?? "", fleetSize: s.fleet_size }); setEditSupplier(s); setShowAdd(true); }

  async function handleSubmit() {
    if (!form.company.trim()) return;
    try {
      if (editSupplier) { await updateSupplier(editSupplier.id, { company_name: form.company.trim(), contact_name: form.contact.trim(), whatsapp_number: form.whatsapp.trim(), fleet_size: form.fleetSize }); }
      else { await addSupplier(form.company.trim(), form.contact.trim(), form.whatsapp.trim(), form.fleetSize); }
      setShowAdd(false); setEditSupplier(null); load();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save"); }
  }

  if (loading) return <LoadSpinner />;

  return (
    <div className="space-y-4">
      {error && <ErrorBox message={error} />}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">External transit and activity contractors</p>
        <button onClick={openAdd} className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-[11px] font-semibold hover:bg-teal-700 transition-colors flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add Supplier</button>
      </div>
      {showAdd && (
        <Modal title={editSupplier ? "Edit Supplier" : "Add Supplier"} onClose={() => { setShowAdd(false); setEditSupplier(null); }}>
          <div className="space-y-3">
            <Field label="Company Name"><input className={inputCls} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Atlas Transport Co." /></Field>
            <Field label="Main Contact Name"><input className={inputCls} value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="Hassan Alami" /></Field>
            <Field label="WhatsApp Number"><input className={inputCls} value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+212 6XX XXX XXX" /></Field>
            <Field label="Fleet Size"><input type="number" className={inputCls} value={form.fleetSize} onChange={(e) => setForm({ ...form, fleetSize: parseInt(e.target.value) || 0 })} /></Field>
            <div className="flex gap-2 pt-1">
              <button onClick={handleSubmit} className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-700">{editSupplier ? "Save Changes" : "Add Supplier"}</button>
              <button onClick={() => { setShowAdd(false); setEditSupplier(null); }} className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
      {suppliers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-12 text-center"><Building2 className="w-10 h-10 text-gray-300 mx-auto mb-2" /><p className="text-sm font-semibold text-gray-700">No suppliers yet</p></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead><tr className="bg-gray-50 text-gray-500 text-left"><th className="px-4 py-2.5 font-semibold">Company</th><th className="px-4 py-2.5 font-semibold">Contact</th><th className="px-4 py-2.5 font-semibold">WhatsApp</th><th className="px-4 py-2.5 font-semibold">Fleet</th><th className="px-4 py-2.5 font-semibold">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-50">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-700">{s.company_name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.contact_name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{s.whatsapp_number ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{s.fleet_size}</td>
                  <td className="px-4 py-3 flex items-center gap-2"><EditBtn onClick={() => openEdit(s)} /><DeleteBtn onClick={() => confirm(`Delete supplier ${s.company_name}?`, async () => { await deleteSupplier(s.id); load(); })} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {ConfirmDialog}
    </div>
  );
}

// ===== Agencies & Partners =====

export function AgenciesContent() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editPartner, setEditPartner] = useState<Partner | null>(null);
  const [form, setForm] = useState({ name: "", cat: "Hotel" as Partner["category"], phone: "", comm: 10, status: "active" as Partner["status"] });
  const { confirm, ConfirmDialog } = useConfirm();

  const load = useCallback(async () => {
    try { setPartners(await fetchPartners()); setError(""); } catch (err) { setError(err instanceof Error ? err.message : "Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setForm({ name: "", cat: "Hotel", phone: "", comm: 10, status: "active" }); setEditPartner(null); setShowAdd(true); }
  function openEdit(p: Partner) { setForm({ name: p.business_name, cat: p.category, phone: p.contact_phone, comm: p.commission_rate, status: p.status }); setEditPartner(p); setShowAdd(true); }

  async function handleSubmit() {
    if (!form.name.trim() || !form.phone.trim()) return;
    try {
      if (editPartner) { await updatePartner(editPartner.id, { business_name: form.name.trim(), category: form.cat, contact_phone: form.phone.trim(), commission_rate: form.comm, status: form.status }); }
      else { await addPartner(form.name.trim(), form.cat, form.phone.trim(), form.comm); }
      setShowAdd(false); setEditPartner(null); load();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save"); }
  }

  if (loading) return <LoadSpinner />;

  return (
    <div className="space-y-4">
      {error && <ErrorBox message={error} />}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">Local riads, restaurants, and activity vendors</p>
        <button onClick={openAdd} className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-[11px] font-semibold hover:bg-teal-700 transition-colors flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add Partner</button>
      </div>
      {showAdd && (
        <Modal title={editPartner ? "Edit Partner" : "Add Partner"} onClose={() => { setShowAdd(false); setEditPartner(null); }}>
          <div className="space-y-3">
            <Field label="Business Name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Riad Dar Anika" /></Field>
            <Field label="Category"><select className={inputCls} value={form.cat} onChange={(e) => setForm({ ...form, cat: e.target.value as Partner["category"] })}><option>Hotel</option><option>Restaurant</option><option>Flight</option><option>Excursion</option><option>Activity</option></select></Field>
            <Field label="Contact Phone"><input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+212 5XX XXX XXX" /></Field>
            <Field label="Commission Rate (%)"><input type="number" className={inputCls} value={form.comm} onChange={(e) => setForm({ ...form, comm: Number(e.target.value) })} /></Field>
            {editPartner && <Field label="Status"><select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Partner["status"] })}><option value="active">Active</option><option value="suspended">Suspended</option></select></Field>}
            <div className="flex gap-2 pt-1">
              <button onClick={handleSubmit} className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-700">{editPartner ? "Save Changes" : "Add Partner"}</button>
              <button onClick={() => { setShowAdd(false); setEditPartner(null); }} className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead><tr className="bg-gray-50 text-gray-500 text-left"><th className="px-4 py-2.5 font-semibold">Partner Name</th><th className="px-4 py-2.5 font-semibold">Category</th><th className="px-4 py-2.5 font-semibold">Commission</th><th className="px-4 py-2.5 font-semibold">Phone</th><th className="px-4 py-2.5 font-semibold">Status</th><th className="px-4 py-2.5 font-semibold">Actions</th></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {partners.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-semibold text-gray-700">{p.business_name}</td>
                <td className="px-4 py-3 text-gray-500">{p.category}</td>
                <td className="px-4 py-3 text-gray-600">{p.commission_rate}%</td>
                <td className="px-4 py-3 text-gray-500">{p.contact_phone}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{p.status}</span></td>
                <td className="px-4 py-3 flex items-center gap-2"><EditBtn onClick={() => openEdit(p)} /><DeleteBtn onClick={() => confirm(`Delete partner ${p.business_name}?`, async () => { await deletePartner(p.id); load(); })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {ConfirmDialog}
    </div>
  );
}

// ===== Customers =====

export function CustomersContent() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookingCustomers, setBookingCustomers] = useState<{ name: string; whatsapp: string; bookings: number; lastVisit: string; groupSize: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: "", email: "", countryCode: "", whatsapp: "" });
  const { confirm, ConfirmDialog } = useConfirm();

  const load = useCallback(async () => {
    try {
      const [c, bc] = await Promise.all([fetchCustomers(), fetchDistinctCustomers()]);
      setCustomers(c); setBookingCustomers(bc); setError("");
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setForm({ name: "", email: "", countryCode: "+44", whatsapp: "" }); setEditCustomer(null); setShowAdd(true); }
  function openEdit(c: Customer) { setForm({ name: c.full_name, email: c.email ?? "", countryCode: c.country_code ?? "", whatsapp: c.whatsapp_number ?? "" }); setEditCustomer(c); setShowAdd(true); }

  async function handleSubmit() {
    if (!form.name.trim()) return;
    try {
      if (editCustomer) { await updateCustomer(editCustomer.id, { full_name: form.name.trim(), email: form.email.trim(), country_code: form.countryCode.trim(), whatsapp_number: form.whatsapp.trim() }); }
      else { await addCustomer(form.name.trim(), form.email.trim(), form.countryCode.trim(), form.whatsapp.trim()); }
      setShowAdd(false); setEditCustomer(null); load();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save"); }
  }

  if (loading) return <LoadSpinner />;

  return (
    <div className="space-y-4">
      {error && <ErrorBox message={error} />}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">Customer directory and booking guests</p>
        <button onClick={openAdd} className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-[11px] font-semibold hover:bg-teal-700 transition-colors flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add Customer</button>
      </div>
      {showAdd && (
        <Modal title={editCustomer ? "Edit Customer" : "Add Customer"} onClose={() => { setShowAdd(false); setEditCustomer(null); }}>
          <div className="space-y-3">
            <Field label="Full Name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sarah Jenkins" /></Field>
            <Field label="Email"><input className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="sarah@example.com" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Country Code"><input className={inputCls} value={form.countryCode} onChange={(e) => setForm({ ...form, countryCode: e.target.value })} placeholder="+44" /></Field>
              <Field label="WhatsApp Number"><input className={inputCls} value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="7123 456789" /></Field>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={handleSubmit} className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-700">{editCustomer ? "Save Changes" : "Add Customer"}</button>
              <button onClick={() => { setShowAdd(false); setEditCustomer(null); }} className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {customers.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Directory</p>
          {customers.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-100 text-teal-700 text-sm font-bold shrink-0">{c.full_name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{c.full_name}</p>
                <p className="text-[11px] text-gray-400 truncate">{c.email ?? "No email"} · {c.country_code} {c.whatsapp_number}</p>
              </div>
              <EditBtn onClick={() => openEdit(c)} />
              <DeleteBtn onClick={() => confirm(`Delete customer ${c.full_name}?`, async () => { await deleteCustomer(c.id); load(); })} />
            </div>
          ))}
        </div>
      )}

      {bookingCustomers.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">From Bookings</p>
          {bookingCustomers.map((c) => (
            <div key={c.name} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 text-sm font-bold shrink-0">{c.name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                <p className="text-[11px] text-gray-400 truncate">{c.groupSize} persons · {c.bookings} booking(s) · Last: {c.lastVisit}</p>
              </div>
              <a href={`https://wa.me/${c.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-600 text-[11px] font-semibold hover:bg-green-100 transition-colors shrink-0"><MessageCircle className="w-3.5 h-3.5" /> {c.whatsapp}</a>
            </div>
          ))}
        </div>
      )}

      {customers.length === 0 && bookingCustomers.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-12 text-center"><UserCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" /><p className="text-sm font-semibold text-gray-700">No customers yet</p></div>
      )}
      {ConfirmDialog}
    </div>
  );
}

// ===== Hotels =====

export function HotelsContent() {
  const [hotels, setHotels] = useState<Partner[]>([]);
  const [contacts, setContacts] = useState<HotelContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editContact, setEditContact] = useState<HotelContact | null>(null);
  const [form, setForm] = useState({ hotel: "", manager: "", phone: "", expiry: "" });
  const { confirm, ConfirmDialog } = useConfirm();

  const load = useCallback(async () => {
    try {
      const [h, c] = await Promise.all([fetchPartnersByCategory("Hotel"), fetchHotelContacts()]);
      setHotels(h); setContacts(c); setError("");
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setForm({ hotel: "", manager: "", phone: "", expiry: "" }); setEditContact(null); setShowAdd(true); }
  function openEdit(c: HotelContact) { setForm({ hotel: c.hotel_name, manager: c.manager_name ?? "", phone: c.direct_phone ?? "", expiry: c.contract_expiry ?? "" }); setEditContact(c); setShowAdd(true); }

  async function handleSubmit() {
    if (!form.hotel.trim()) return;
    try {
      if (editContact) { await updateHotelContact(editContact.id, { hotel_name: form.hotel.trim(), manager_name: form.manager.trim(), direct_phone: form.phone.trim(), contract_expiry: form.expiry.trim() }); }
      else { await addHotelContact(form.hotel.trim(), form.manager.trim(), form.phone.trim(), form.expiry.trim()); }
      setShowAdd(false); setEditContact(null); load();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save"); }
  }

  if (loading) return <LoadSpinner />;

  return (
    <div className="space-y-4">
      {error && <ErrorBox message={error} />}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">Hotel partners and contract contacts</p>
        <button onClick={openAdd} className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-[11px] font-semibold hover:bg-teal-700 transition-colors flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add Hotel Contact</button>
      </div>
      {showAdd && (
        <Modal title={editContact ? "Edit Hotel Contact" : "Add Hotel Contact"} onClose={() => { setShowAdd(false); setEditContact(null); }}>
          <div className="space-y-3">
            <Field label="Hotel Name"><input className={inputCls} value={form.hotel} onChange={(e) => setForm({ ...form, hotel: e.target.value })} placeholder="Riad Dar Anika" /></Field>
            <Field label="Manager Name"><input className={inputCls} value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} placeholder="Youssef El Amrani" /></Field>
            <Field label="Direct Phone"><input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+212 5XX XXX XXX" /></Field>
            <Field label="Contract Expiry Date"><input type="date" className={inputCls} value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} /></Field>
            <div className="flex gap-2 pt-1">
              <button onClick={handleSubmit} className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-700">{editContact ? "Save Changes" : "Add Contact"}</button>
              <button onClick={() => { setShowAdd(false); setEditContact(null); }} className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {contacts.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Contract Contacts</p>
          {contacts.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 shrink-0"><Hotel className="w-5 h-5 text-teal-600" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{c.hotel_name}</p>
                <p className="text-[11px] text-gray-400 truncate">{c.manager_name ?? "No manager"} · {c.direct_phone ?? "No phone"} · Expires: {c.contract_expiry ?? "N/A"}</p>
              </div>
              <EditBtn onClick={() => openEdit(c)} />
              <DeleteBtn onClick={() => confirm(`Delete contact for ${c.hotel_name}?`, async () => { await deleteHotelContact(c.id); load(); })} />
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2.5">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Partner Hotels</p>
        {hotels.map((h) => (
          <div key={h.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 shrink-0"><Hotel className="w-5 h-5 text-teal-600" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{h.business_name}</p>
                <p className="text-[11px] text-gray-400 truncate">{h.contact_phone}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[9px] text-teal-600 font-semibold bg-teal-50 px-1.5 py-0.5 rounded">{h.commission_rate}% commission</span>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${h.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{h.status}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {ConfirmDialog}
    </div>
  );
}

// ===== WhatsApp Inbox (static mock) =====

export function WhatsAppInboxContent() {
  const chats = [
    { name: "Sarah Jenkins", preview: "Hi! Is the riad confirmed for the 16th?", time: "2 min ago", unread: 2, type: "client" },
    { name: "Hassan Alami (Driver)", preview: "On my way to Agafay, ETA 20 min", time: "8 min ago", unread: 1, type: "driver" },
    { name: "James Liu", preview: "Perfect, see you tomorrow!", time: "1 hour ago", unread: 0, type: "client" },
    { name: "Riad Dar Anika", preview: "We have the superior rooms ready", time: "3 hours ago", unread: 0, type: "partner" },
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 text-green-600 text-[10px] font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> WhatsApp Connected</span>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
        {chats.map((c) => (
          <div key={c.name} className="flex items-center gap-3 p-3.5 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 text-sm font-bold ${c.type === "driver" ? "bg-orange-100 text-orange-700" : c.type === "partner" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>{c.name.charAt(0)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between"><p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p><span className="text-[10px] text-gray-400 shrink-0">{c.time}</span></div>
              <p className="text-xs text-gray-500 truncate">{c.preview}</p>
            </div>
            {c.unread > 0 && <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-bold shrink-0">{c.unread}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== Automations (static mock) =====

export function AutomationsContent() {
  const automations = [
    { name: "Booking Confirmation SMS", trigger: "Reservation Confirmed", status: "Active", sent: 1284 },
    { name: "Driver Dispatch WhatsApp", trigger: "Manual / On Confirm", status: "Active", sent: 567 },
    { name: "Vendor Allocation Request", trigger: "New Booking", status: "Active", sent: 1421 },
    { name: "Post-Trip Review Request", trigger: "Trip Completed + 2h", status: "Paused", sent: 89 },
  ];
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 px-1">Webhook statuses and automated message logs</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {automations.map((a) => (
          <div key={a.name} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 shrink-0"><Zap className="w-5 h-5 text-amber-500" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{a.name}</p>
                <p className="text-[11px] text-gray-400 truncate">Trigger: {a.trigger}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${a.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{a.status}</span>
                  <span className="text-[9px] text-gray-400">{a.sent.toLocaleString()} sent</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== Payments =====

export function PaymentsContent() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showExpense, setShowExpense] = useState(false);
  const [expForm, setExpForm] = useState({ name: "", category: "Fuel" as Expense["category"], amount: 0, date: "" });
  const { confirm, ConfirmDialog } = useConfirm();

  const load = useCallback(async () => {
    try {
      const [b, e] = await Promise.all([fetchAllBookings(), fetchExpenses()]);
      setBookings(b); setExpenses(e); setError("");
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAddExpense() {
    if (!expForm.name.trim()) return;
    try { await addExpense(expForm.name.trim(), expForm.category, expForm.amount, expForm.date); setShowExpense(false); setExpForm({ name: "", category: "Fuel", amount: 0, date: "" }); load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to add expense"); }
  }

  if (loading) return <LoadSpinner />;

  const totalCollected = bookings.filter((b) => b.status === "confirmed" || b.status === "assigned").reduce((s, b) => s + Number(b.price_mad), 0);
  const totalPending = bookings.filter((b) => b.status === "pending").reduce((s, b) => s + Number(b.price_mad), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount_mad), 0);

  return (
    <div className="space-y-4">
      {error && <ErrorBox message={error} />}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Collected" value={`DH ${totalCollected.toLocaleString()}`} change="Live" trend="up" color="bg-teal-500" />
        <StatCard label="Pending" value={`DH ${totalPending.toLocaleString()}`} change="Awaiting" trend="down" color="bg-orange-500" />
        <StatCard label="Expenses" value={`DH ${totalExpenses.toLocaleString()}`} change="Logged" trend="down" color="bg-rose-500" />
        <StatCard label="Net" value={`DH ${(totalCollected - totalExpenses).toLocaleString()}`} change="Profit" trend="up" color="bg-blue-500" />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Payment Transactions</h3>
        <button onClick={() => setShowExpense(true)} className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-[11px] font-semibold hover:bg-rose-700 transition-colors flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Log Expense</button>
      </div>

      {showExpense && (
        <Modal title="Log Expense" onClose={() => setShowExpense(false)}>
          <div className="space-y-3">
            <Field label="Expense Name"><input className={inputCls} value={expForm.name} onChange={(e) => setExpForm({ ...expForm, name: e.target.value })} placeholder="Fuel refill" /></Field>
            <Field label="Category"><select className={inputCls} value={expForm.category} onChange={(e) => setExpForm({ ...expForm, category: e.target.value as Expense["category"] })}><option>Fuel</option><option>Commission</option><option>Maintenance</option><option>Marketing</option><option>Other</option></select></Field>
            <Field label="Amount (MAD)"><input type="number" className={inputCls} value={expForm.amount} onChange={(e) => setExpForm({ ...expForm, amount: Number(e.target.value) })} /></Field>
            <Field label="Date"><input type="date" className={inputCls} value={expForm.date} onChange={(e) => setExpForm({ ...expForm, date: e.target.value })} /></Field>
            <div className="flex gap-2 pt-1">
              <button onClick={handleAddExpense} className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700">Log Expense</button>
              <button onClick={() => setShowExpense(false)} className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {expenses.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-sm font-bold text-gray-900">Expenses</h3></div>
          <table className="w-full text-xs">
            <thead><tr className="bg-gray-50 text-gray-500 text-left"><th className="px-4 py-2.5 font-semibold">Name</th><th className="px-4 py-2.5 font-semibold">Category</th><th className="px-4 py-2.5 font-semibold text-right">Amount</th><th className="px-4 py-2.5 font-semibold">Date</th><th className="px-4 py-2.5 font-semibold">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-50">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-700">{e.expense_name}</td>
                  <td className="px-4 py-3 text-gray-500">{e.category}</td>
                  <td className="px-4 py-3 font-semibold text-rose-600 text-right">DH {Math.round(Number(e.amount_mad)).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500">{e.expense_date ?? "—"}</td>
                  <td className="px-4 py-3"><DeleteBtn onClick={() => confirm(`Delete expense ${e.expense_name}?`, async () => { await deleteExpense(e.id); load(); })} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {bookings.length === 0 ? (
          <div className="py-12 text-center"><CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-500">No transactions yet</p></div>
        ) : (
          <table className="w-full text-xs">
            <thead><tr className="bg-gray-50 text-gray-500 text-left"><th className="px-4 py-2.5 font-semibold">Ref</th><th className="px-4 py-2.5 font-semibold">Guest</th><th className="px-4 py-2.5 font-semibold text-right">Amount</th><th className="px-4 py-2.5 font-semibold">Status</th><th className="px-4 py-2.5 font-semibold">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-gray-700">{b.ref_code}</td>
                  <td className="px-4 py-3 text-gray-600">{b.lead_name}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900 text-right">DH {Math.round(Number(b.price_mad)).toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${b.status === "confirmed" || b.status === "assigned" ? "bg-green-100 text-green-700" : b.status === "declined" || b.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>{b.status}</span></td>
                  <td className="px-4 py-3"><DeleteBtn onClick={() => confirm(`Delete booking ${b.ref_code}?`, async () => { await deleteBooking(b.id); load(); })} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {ConfirmDialog}
    </div>
  );
}

// ===== Invoices =====

export function InvoicesContent() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invoiceToast, setInvoiceToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, b] = await Promise.all([fetchPartners(), fetchAllBookings()]);
      setPartners(p); setBookings(b); setError("");
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleGenerateInvoice(bookingId: string) {
    try { const updated = await issueInvoice(bookingId); setInvoiceToast(updated.invoice_number ?? null); setTimeout(() => setInvoiceToast(null), 4000); load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to issue invoice"); }
  }

  function downloadInvoice(b: Booking) {
    const content = [
      "VOYAGEGO — INVOICE",
      "================",
      `Invoice Number: ${b.invoice_number ?? "Not issued"}`,
      `Booking Ref: ${b.ref_code}`,
      `Guest: ${b.lead_name}`,
      `Item: ${b.item_title}`,
      `Date: ${b.booking_date} at ${b.booking_time}`,
      `Group Size: ${b.group_size} pax`,
      `Amount: DH ${Math.round(Number(b.price_mad)).toLocaleString()}`,
      `Status: ${b.status}`,
      `Voucher: ${b.voucher_code ?? "N/A"}`,
      `Issued: ${b.invoice_issued ? "Yes" : "No"}`,
      "",
      "Generated by VoyageGo Operations Dashboard",
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `invoice-${b.ref_code}.txt`; a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <LoadSpinner />;

  const completedBookings = bookings.filter((b) => b.status === "confirmed" || b.status === "assigned");
  const partnerRevenue = partners.map((p) => {
    const partnerBookings = bookings.filter((b) => b.partner_name === p.business_name && (b.status === "confirmed" || b.status === "assigned"));
    const revenue = partnerBookings.reduce((s, b) => s + Number(b.price_mad), 0);
    const commission = (revenue * p.commission_rate) / 100;
    return { partner: p, revenue, commission, bookingCount: partnerBookings.length };
  }).filter((r) => r.bookingCount > 0);
  const totalCommission = partnerRevenue.reduce((s, r) => s + r.commission, 0);

  return (
    <div className="space-y-4">
      {error && <ErrorBox message={error} />}
      {invoiceToast && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center gap-3 animate-[fadeInUp_0.3s_ease-out]">
          <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold text-emerald-800">Invoice issued: <span className="font-mono">{invoiceToast}</span></p>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Total Commission" value={`DH ${Math.round(totalCommission).toLocaleString()}`} change="Due" trend="up" color="bg-teal-500" />
        <StatCard label="Active Partners" value={String(partners.length)} change="All" trend="up" color="bg-blue-500" />
        <StatCard label="With Revenue" value={String(partnerRevenue.length)} change="Earning" trend="up" color="bg-rose-500" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-sm font-bold text-gray-900">Invoice Generation — Completed Bookings</h3></div>
        {completedBookings.length === 0 ? (
          <div className="py-8 text-center"><FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-400">No completed bookings to invoice</p></div>
        ) : (
          <table className="w-full text-xs">
            <thead><tr className="bg-gray-50 text-gray-500 text-left"><th className="px-4 py-2.5 font-semibold">Ref</th><th className="px-4 py-2.5 font-semibold">Guest</th><th className="px-4 py-2.5 font-semibold text-right">Amount</th><th className="px-4 py-2.5 font-semibold">Invoice</th><th className="px-4 py-2.5 font-semibold">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-50">
              {completedBookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-gray-700">{b.ref_code}</td>
                  <td className="px-4 py-3 text-gray-600">{b.lead_name}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900 text-right">DH {Math.round(Number(b.price_mad)).toLocaleString()}</td>
                  <td className="px-4 py-3">{b.invoice_issued ? <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-100 text-teal-700">Issued: {b.invoice_number}</span> : <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500">Not issued</span>}</td>
                  <td className="px-4 py-3 flex items-center gap-2">
                    {!b.invoice_issued && <button onClick={() => handleGenerateInvoice(b.id)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-600 text-white text-[10px] font-bold hover:bg-teal-700 transition-colors"><FileText className="w-3 h-3" /> Generate</button>}
                    {b.invoice_issued && <button onClick={() => downloadInvoice(b)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-bold hover:bg-blue-100 transition-colors"><Download className="w-3 h-3" /> Download</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-sm font-bold text-gray-900">Commission Tracking by Partner</h3></div>
        <table className="w-full text-xs">
          <thead><tr className="bg-gray-50 text-gray-500 text-left"><th className="px-4 py-2.5 font-semibold">Partner</th><th className="px-4 py-2.5 font-semibold">Category</th><th className="px-4 py-2.5 font-semibold text-right">Revenue</th><th className="px-4 py-2.5 font-semibold text-right">Commission</th><th className="px-4 py-2.5 font-semibold">Bookings</th></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {partnerRevenue.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No commission data yet — confirm bookings to generate revenue.</td></tr>
            ) : partnerRevenue.map((r) => (
              <tr key={r.partner.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-semibold text-gray-700">{r.partner.business_name}</td>
                <td className="px-4 py-3 text-gray-500">{r.partner.category}</td>
                <td className="px-4 py-3 font-semibold text-gray-900 text-right">DH {Math.round(r.revenue).toLocaleString()}</td>
                <td className="px-4 py-3 text-teal-600 font-semibold text-right">DH {Math.round(r.commission).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-600">{r.bookingCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

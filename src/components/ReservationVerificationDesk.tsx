import { useState, useEffect, useCallback } from "react";
import {
  Clock, CheckCircle2, XCircle, Users, MessageCircle,
  Check, X, ChevronDown, Loader2, Building2, Calendar, Ticket,
  RefreshCw, Inbox, Radio, Trash2, Ban, Plus,
} from "lucide-react";
import type { Booking } from "../lib/supabase";
import { CATEGORY_EMOJI, CATEGORY_LABEL } from "../lib/supabase";
import {
  fetchPendingBookings, fetchBookingCounts,
  confirmBooking, declineBooking, cancelBooking, deleteBooking,
  insertBooking, DECLINE_REASONS,
} from "../bookingApi";
import { DriverDispatchModal } from "./DriverDispatchModal";

export function ReservationVerificationDesk() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [counts, setCounts] = useState({ pending: 0, confirmedToday: 0, declinedToday: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [declineReasonOpen, setDeclineReasonOpen] = useState<string | null>(null);
  const [recentlyConfirmed, setRecentlyConfirmed] = useState<Booking | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dispatchBooking, setDispatchBooking] = useState<Booking | null>(null);
  const [dispatchedDriver, setDispatchedDriver] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Booking | null>(null);
  const [showNewReservation, setShowNewReservation] = useState(false);
  const [submittingNew, setSubmittingNew] = useState(false);
  const [newForm, setNewForm] = useState({
    leadName: "",
    groupSize: 2,
    whatsapp: "",
    itemTitle: "",
    itemCategory: "Hotel",
    partnerName: "",
    bookingDate: "",
    bookingTime: "10:00",
    priceMad: 0,
  });

  async function handleNewReservation() {
    if (!newForm.leadName.trim() || !newForm.itemTitle.trim()) {
      setError("Guest name and item title are required.");
      return;
    }
    setSubmittingNew(true);
    setError("");
    try {
      await insertBooking({
        lead_name: newForm.leadName.trim(),
        group_size: newForm.groupSize,
        whatsapp_number: newForm.whatsapp.trim(),
        item_title: newForm.itemTitle.trim(),
        item_subtitle: "",
        item_category: newForm.itemCategory,
        partner_name: newForm.partnerName.trim(),
        partner_details: "",
        booking_date: newForm.bookingDate,
        booking_time: newForm.bookingTime,
        price_mad: newForm.priceMad,
      });
      setNewForm({ leadName: "", groupSize: 2, whatsapp: "", itemTitle: "", itemCategory: "Hotel", partnerName: "", bookingDate: "", bookingTime: "10:00", priceMad: 0 });
      setShowNewReservation(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create reservation");
    } finally {
      setSubmittingNew(false);
    }
  }

  const load = useCallback(async () => {
    try {
      const [pending, c] = await Promise.all([fetchPendingBookings(), fetchBookingCounts()]);
      setBookings(pending);
      setCounts(c);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleConfirm(bookingId: string) {
    setConfirmingId(bookingId);
    try {
      const updated = await confirmBooking(bookingId);
      setRecentlyConfirmed(updated);
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      setCounts((prev) => ({
        ...prev,
        pending: prev.pending - 1,
        confirmedToday: prev.confirmedToday + 1,
      }));
      setTimeout(() => setRecentlyConfirmed(null), 4000);
      setDispatchBooking(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm booking");
    } finally {
      setConfirmingId(null);
    }
  }

  async function handleDecline(bookingId: string, reason: string) {
    setDecliningId(bookingId);
    try {
      await declineBooking(bookingId, reason);
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      setCounts((prev) => ({
        ...prev,
        pending: prev.pending - 1,
        declinedToday: prev.declinedToday + 1,
      }));
      setDeclineReasonOpen(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decline booking");
    } finally {
      setDecliningId(null);
    }
  }

  async function handleCancel(bookingId: string) {
    try {
      await cancelBooking(bookingId);
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      setCounts((prev) => ({ ...prev, pending: prev.pending - 1 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel booking");
    }
  }

  async function handleDelete(bookingId: string) {
    try {
      await deleteBooking(bookingId);
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      setCounts((prev) => ({ ...prev, pending: prev.pending - 1 }));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete booking");
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    load();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        <StatChip
          icon={<Clock className="w-4 h-4" />}
          label="Awaiting Partner Check"
          value={counts.pending}
          color="amber"
        />
        <StatChip
          icon={<CheckCircle2 className="w-4 h-4" />}
          label="Confirmed Today"
          value={counts.confirmedToday}
          color="emerald"
        />
        <StatChip
          icon={<XCircle className="w-4 h-4" />}
          label="Allocation Issues"
          value={counts.declinedToday}
          color="rose"
        />
      </div>

      {/* Voucher success toast */}
      {recentlyConfirmed && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 animate-[fadeInUp_0.3s_ease-out]">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 shrink-0">
            <Ticket className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-emerald-800">Voucher Generated Successfully</p>
            <p className="text-xs text-emerald-600">
              {recentlyConfirmed.item_title} — Voucher: <span className="font-mono font-semibold">{recentlyConfirmed.voucher_code}</span>
            </p>
          </div>
          <button
            onClick={() => setDispatchBooking(recentlyConfirmed)}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#25D366] px-3 py-1.5 rounded-lg hover:bg-[#20BE57] active:scale-95 transition-all shrink-0"
          >
            <Radio className="w-3.5 h-3.5" />
            Dispatch Driver
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-600 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Queue header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-gray-900">Pending Partner Verification</h3>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-600 text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            {bookings.length} in queue
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewReservation(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-[11px] font-semibold hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Reservation
          </button>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 hover:text-gray-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Booking queue */}
      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 mx-auto flex items-center justify-center mb-3">
            <Inbox className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-700">Queue is clear</p>
          <p className="text-xs text-gray-400 mt-1">All pending bookings have been processed. New requests will appear here automatically.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <ReservationCard
              key={booking.id}
              booking={booking}
              confirming={confirmingId === booking.id}
              declining={decliningId === booking.id}
              declineOpen={declineReasonOpen === booking.id}
              onToggleDecline={() =>
                setDeclineReasonOpen(declineReasonOpen === booking.id ? null : booking.id)
              }
              onConfirm={() => handleConfirm(booking.id)}
              onDecline={(reason) => handleDecline(booking.id, reason)}
              onCancel={() => handleCancel(booking.id)}
              onDelete={() => setDeleteConfirm(booking)}
            />
          ))}
        </div>
      )}

      {/* New reservation modal */}
      {showNewReservation && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowNewReservation(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-[fadeInUp_0.2s_ease-out] max-h-[92vh] overflow-y-auto">
            <div className="px-5 py-3.5 flex items-center justify-between border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-sm font-bold text-gray-900">New Manual Reservation</h2>
              <button onClick={() => setShowNewReservation(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">Lead Guest Name *</label>
                  <input className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-teal-400 transition-all" value={newForm.leadName} onChange={(e) => setNewForm({ ...newForm, leadName: e.target.value })} placeholder="Sarah Jenkins" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">Group Size</label>
                  <input type="number" min={1} max={50} className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-teal-400 transition-all" value={newForm.groupSize} onChange={(e) => setNewForm({ ...newForm, groupSize: Math.max(1, parseInt(e.target.value) || 1) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">WhatsApp Number</label>
                  <input className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-teal-400 transition-all" value={newForm.whatsapp} onChange={(e) => setNewForm({ ...newForm, whatsapp: e.target.value })} placeholder="+44 7123 456789" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">Category</label>
                  <select className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-teal-400 transition-all" value={newForm.itemCategory} onChange={(e) => setNewForm({ ...newForm, itemCategory: e.target.value })}>
                    <option>Hotel</option><option>Flight</option><option>Restaurant</option><option>Excursion</option><option>Activity</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">Item / Service Title *</label>
                <input className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-teal-400 transition-all" value={newForm.itemTitle} onChange={(e) => setNewForm({ ...newForm, itemTitle: e.target.value })} placeholder="e.g. Riad Dar Anika — 2 nights" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">Partner / Vendor Name</label>
                <input className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-teal-400 transition-all" value={newForm.partnerName} onChange={(e) => setNewForm({ ...newForm, partnerName: e.target.value })} placeholder="e.g. Riad Dar Anika" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">Date</label>
                  <input type="date" className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-teal-400 transition-all" value={newForm.bookingDate} onChange={(e) => setNewForm({ ...newForm, bookingDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">Time</label>
                  <input type="time" className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-teal-400 transition-all" value={newForm.bookingTime} onChange={(e) => setNewForm({ ...newForm, bookingTime: e.target.value })} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">Price (MAD)</label>
                  <input type="number" className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-teal-400 transition-all" value={newForm.priceMad} onChange={(e) => setNewForm({ ...newForm, priceMad: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleNewReservation} disabled={submittingNew} className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {submittingNew ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Plus className="w-4 h-4" /> Create Reservation</>}
                </button>
                <button onClick={() => setShowNewReservation(false)} className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Driver dispatch modal */}
      <DriverDispatchModal
        booking={dispatchBooking}
        onClose={() => {
          setDispatchBooking(null);
          setDispatchedDriver(null);
        }}
        onDispatched={(driverName) => setDispatchedDriver(driverName)}
      />

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative w-full max-w-xs bg-white rounded-2xl shadow-xl p-5 text-center animate-[fadeInUp_0.2s_ease-out]">
            <div className="w-12 h-12 rounded-full bg-rose-50 mx-auto flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6 text-rose-500" />
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Delete Booking?</p>
            <p className="text-xs text-gray-500 mb-4">This will permanently remove booking {deleteConfirm.ref_code} from the database.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="flex-1 py-2 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch confirmation toast */}
      {dispatchedDriver && !dispatchBooking && (
        <div className="fixed bottom-4 right-4 z-[85] bg-white rounded-2xl shadow-xl border border-gray-100 p-4 flex items-center gap-3 max-w-xs animate-[fadeInUp_0.3s_ease-out]">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-100 shrink-0">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Driver Assigned</p>
            <p className="text-xs text-gray-500">WhatsApp dispatch sent to {dispatchedDriver}</p>
          </div>
          <button onClick={() => setDispatchedDriver(null)} className="text-gray-300 hover:text-gray-500 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function StatChip({
  icon, label, value, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "amber" | "emerald" | "rose";
}) {
  const colors = {
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    rose: "bg-rose-50 border-rose-200 text-rose-700",
  };
  return (
    <div className={`rounded-2xl border p-3 ${colors[color]}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <p className="text-[10px] font-medium opacity-80 truncate">{label}</p>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function ReservationCard({
  booking, confirming, declining, declineOpen,
  onToggleDecline, onConfirm, onDecline, onCancel, onDelete,
}: {
  booking: Booking;
  confirming: boolean;
  declining: boolean;
  declineOpen: boolean;
  onToggleDecline: () => void;
  onConfirm: () => void;
  onDecline: (reason: string) => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const emoji = CATEGORY_EMOJI[booking.item_category] ?? "📋";
  const categoryLabel = CATEGORY_LABEL[booking.item_category] ?? booking.item_category;
  const whatsappUrl = `https://wa.me/${booking.whatsapp_number.replace(/[^0-9]/g, "")}`;
  const timeAgo = getTimeAgo(booking.created_at);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
      {/* Top: ref + timestamp */}
      <div className="px-4 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            {booking.ref_code}
          </span>
          <span className="text-[10px] text-gray-400">{timeAgo}</span>
        </div>
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-semibold">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      </div>

      {/* Customer data row */}
      <div className="px-4 py-3 border-b border-gray-50">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Lead name */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-50 shrink-0">
              <Users className="w-4 h-4 text-teal-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] text-gray-400 uppercase tracking-wide font-medium">Lead Guest</p>
              <p className="text-sm font-bold text-gray-900 truncate">{booking.lead_name}</p>
            </div>
          </div>

          {/* Group size */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100">
            <Users className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs font-semibold text-gray-700">{booking.group_size} {booking.group_size === 1 ? "Person" : "Persons"}</span>
          </div>

          {/* WhatsApp button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-bold hover:bg-green-600 active:scale-95 transition-all shadow-sm shadow-green-500/20"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            {booking.whatsapp_number}
          </a>
        </div>
      </div>

      {/* Vendor details */}
      <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-50">
        <div className="flex items-start gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-gray-100 shrink-0 text-lg">
            {emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                {categoryLabel}
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-sm font-bold text-gray-900">{booking.partner_name}</span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500">
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" /> {booking.partner_details}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {booking.booking_date} at {booking.booking_time}
              </span>
            </div>
            <p className="text-sm font-bold text-teal-600 mt-1.5">
              DH {Math.round(booking.price_mad).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 py-3">
        {!declineOpen ? (
          <div className="flex gap-2.5">
            <button
              onClick={onConfirm}
              disabled={confirming || declining}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-sm shadow-emerald-600/20 disabled:opacity-50"
            >
              {confirming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirm Reservation
                </>
              )}
            </button>
            <button
              onClick={onToggleDecline}
              disabled={confirming || declining}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-rose-300 text-rose-600 text-sm font-bold hover:bg-rose-50 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Decline
            </button>
            <button
              onClick={onCancel}
              disabled={confirming || declining}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-50"
              title="Cancel booking"
            >
              <Ban className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              disabled={confirming || declining}
              className="flex items-center justify-center px-3 py-2.5 rounded-xl border border-gray-200 text-gray-400 text-sm font-semibold hover:bg-rose-50 hover:text-rose-500 active:scale-[0.98] transition-all disabled:opacity-50"
              title="Delete booking"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2.5 animate-[fadeInUp_0.2s_ease-out]">
            <p className="text-xs font-semibold text-gray-700">Select a reason for declining:</p>
            <div className="space-y-1.5">
              {DECLINE_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => onDecline(reason)}
                  disabled={declining}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 hover:bg-rose-100 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {reason}
                  {declining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronDown className="w-3.5 h-3.5 -rotate-90" />}
                </button>
              ))}
            </div>
            <button
              onClick={onToggleDecline}
              className="w-full py-2 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function getTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

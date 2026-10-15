import { useState, useEffect, useRef, useCallback } from "react";
import { X, Check, Send, User, Car, Clock, MapPin, Loader2, MessageCircle } from "lucide-react";
import type { Booking, Driver } from "../lib/supabase";
import { fetchDrivers, assignDriver, sendDriverDispatch } from "../bookingApi";

interface DriverDispatchModalProps {
  booking: Booking | null;
  onClose: () => void;
  onDispatched: (driverName: string) => void;
}

export function DriverDispatchModal({ booking, onClose, onDispatched }: DriverDispatchModalProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadDrivers = useCallback(async () => {
    try {
      const all = await fetchDrivers();
      setDrivers(all.filter((d) => d.status === "available"));
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDrivers(); }, [loadDrivers]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    if (booking) {
      setSelectedDriverId(null);
      setSent(false);
      setError("");
      setDropdownOpen(false);
    }
  }, [booking]);

  if (!booking) return null;

  const driver = drivers.find((d) => d.id === selectedDriverId);

  async function handleSend() {
    if (!driver || !booking) return;
    setSending(true);
    setError("");
    try {
      await sendDriverDispatch(booking, driver);
      await assignDriver(booking.id, driver.id);
      setSending(false);
      setSent(true);
      onDispatched(driver.name);
      setTimeout(() => { onClose(); }, 2500);
    } catch (cause) {
      setSending(false);
      setError(cause instanceof Error ? cause.message : "Could not send the dispatch message");
    }
  }

  const whatsappUrl = driver ? `https://wa.me/${driver.phone_number.replace(/[^0-9]/g, "")}` : "#";
  const messagePreview = driver
    ? `Hello ${driver.name}, you have a new dispatch assignment:\n\n` +
      `Booking: ${booking.ref_code}\n` +
      `Guest: ${booking.lead_name} (${booking.group_size} pax)\n` +
      `Pickup: ${booking.item_title}\n` +
      `Date: ${booking.booking_date} at ${booking.booking_time}\n\n` +
      `Vehicle: ${driver.vehicle_type}\n` +
      `Please confirm availability.`
    : "";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-[fadeInUp_0.3s_ease-out]">
        <div className="bg-[#075E54] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/15">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Driver Dispatch</h2>
              <p className="text-[11px] text-green-200">WhatsApp assignment message</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {sent ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 mx-auto flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Dispatch Message Sent</h3>
            <p className="text-xs text-gray-500 mt-1.5">
              WhatsApp dispatch notification sent to <span className="font-semibold text-gray-700">{driver?.name}</span>
            </p>
            <div className="mt-4 bg-gray-50 rounded-2xl p-3 text-left">
              <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-1">
                <MessageCircle className="w-3 h-3 text-green-500" />
                Sent via WhatsApp to {driver?.phone_number}
              </div>
              <p className="text-xs text-gray-600 font-mono whitespace-pre-line">{messagePreview}</p>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="bg-gray-50 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-semibold text-gray-600 bg-white px-2 py-0.5 rounded">{booking.ref_code}</span>
                <span className="text-[10px] text-gray-400">{booking.lead_name} · {booking.group_size} pax</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                {booking.item_title}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                {booking.booking_date} at {booking.booking_time}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Assign Driver</label>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-teal-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"
                >
                  {driver ? (
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4 text-teal-600" />
                      {driver.name}
                      <span className="text-[10px] text-gray-400 font-normal">· {driver.vehicle_type}</span>
                    </span>
                  ) : (
                    <span className="text-gray-400">{loading ? "Loading drivers..." : "Select an available driver..."}</span>
                  )}
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl border border-gray-200 shadow-lg z-10 max-h-56 overflow-y-auto animate-[fadeInUp_0.15s_ease-out]">
                    {drivers.length === 0 ? (
                      <p className="px-3.5 py-3 text-xs text-gray-400 text-center">No available drivers</p>
                    ) : drivers.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => { setSelectedDriverId(d.id); setDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-teal-50 transition-colors text-left border-b border-gray-50 last:border-0"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-700 text-xs font-bold shrink-0">
                          {d.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{d.name}</p>
                          <p className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                            <Car className="w-3 h-3" /> {d.vehicle_type} · {d.phone_number}
                          </p>
                        </div>
                        <span className="text-[9px] text-green-500 font-semibold bg-green-50 px-1.5 py-0.5 rounded shrink-0">Available</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {driver && (
              <div className="animate-[fadeInUp_0.2s_ease-out]">
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Message Preview</label>
                <div className="bg-[#DCF8C6] rounded-2xl rounded-tr-sm p-3.5 border border-green-100">
                  <p className="text-xs text-gray-700 whitespace-pre-line font-mono leading-relaxed">{messagePreview}</p>
                  <p className="text-[9px] text-gray-400 text-right mt-2">Auto-generated · WhatsApp Business</p>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-2.5 pt-1">
              <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={!driver || sending}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#25D366] text-white text-sm font-bold hover:bg-[#20BE57] active:scale-[0.98] transition-all shadow-md shadow-green-500/20 disabled:opacity-40"
              >
                {sending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending via WhatsApp...</>
                ) : (
                  <><Send className="w-4 h-4" /> Send Dispatch</>
                )}
              </button>
            </div>

            {driver && !sending && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-green-600 hover:text-green-700 transition-colors">
                <MessageCircle className="w-3.5 h-3.5" />
                Open chat with {driver.name} directly
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

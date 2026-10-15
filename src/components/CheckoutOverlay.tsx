import { useState, useEffect } from "react";
import { X, Check, Calendar, Clock, User, Users, Phone, Loader2 } from "lucide-react";
import type { MarketplaceItem, Currency } from "../types";
import { formatPrice } from "../utils";
import { insertBookings } from "../bookingApi";

export interface CartItem {
  item: MarketplaceItem;
  date: string;
  time: string;
}

interface CheckoutOverlayProps {
  cart: CartItem[];
  currency: Currency;
  onClose: () => void;
  onRemove: (index: number) => void;
  onSuccess?: (refCodes: string[]) => void;
}

export function CheckoutOverlay({ cart, currency, onClose, onRemove, onSuccess }: CheckoutOverlayProps) {
  const [leadName, setLeadName] = useState("");
  const [groupSize, setGroupSize] = useState(2);
  const [whatsapp, setWhatsapp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successRefs, setSuccessRefs] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const total = cart.reduce((sum, c) => sum + c.item.priceMAD, 0);
  const serviceFee = Math.round(total * 0.05);
  const grandTotal = total + serviceFee;

  async function handleSubmit() {
    if (!leadName.trim() || !whatsapp.trim()) {
      setError("Please enter your name and WhatsApp number.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const rows = cart.map((entry) => ({
        item_title: entry.item.title,
        item_subtitle: entry.item.subtitle,
        item_category: entry.item.category,
        partner_name: entry.item.subtitle,
        partner_details: "",
        booking_date: entry.date,
        booking_time: entry.time,
        price_mad: entry.item.priceMAD,
      }));
      const bookings = await insertBookings(rows, {
        leadName: leadName.trim(),
        groupSize,
        whatsapp: whatsapp.trim(),
      });
      const refs = bookings.map((b) => b.ref_code);
      setSuccessRefs(refs);
      setSuccess(true);
      onSuccess?.(refs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl bg-gray-50 rounded-t-3xl shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-100">
              <svg className="w-3.5 h-3.5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-sm font-bold text-gray-900">Secure Checkout</h2>
          </div>
          <button onClick={onClose} className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {success ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-green-100 mx-auto flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Booking Request Submitted!</h3>
              <p className="text-xs text-gray-500 mt-1.5 max-w-xs mx-auto">
                Our team is now verifying availability with our local partners. You'll receive a confirmation via WhatsApp shortly.
              </p>
              <div className="mt-4 space-y-1">
                {successRefs.map((ref) => (
                  <p key={ref} className="text-[11px] font-mono text-gray-600 bg-gray-100 rounded-lg px-3 py-1.5 inline-block">
                    Ref: {ref}
                  </p>
                ))}
              </div>
              <button
                onClick={onClose}
                className="mt-5 px-6 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-700 transition-colors"
              >
                Done
              </button>
            </div>
          ) : cart.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-700">Your cart is empty</p>
              <p className="text-xs text-gray-400 mt-1">Browse categories and book an experience to get started.</p>
            </div>
          ) : (
            <>
              {cart.map((entry, i) => (
                <div key={i} className="bg-white rounded-2xl p-3 flex gap-3 border border-gray-100 shadow-sm">
                  {entry.item.image ? (
                    <img src={entry.item.image} alt={entry.item.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                      <span className="text-2xl">{entry.item.category === "flights" ? "✈️" : "🏨"}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 truncate">{entry.item.title}</h3>
                        <p className="text-[11px] text-gray-400 truncate">{entry.item.subtitle}</p>
                      </div>
                      <button
                        onClick={() => onRemove(i)}
                        className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-[10px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {entry.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {entry.time}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-teal-600">
                      {formatPrice(entry.item.priceMAD, currency)}
                      <span className="text-[10px] text-gray-400 font-normal ml-1">{entry.item.priceUnit}</span>
                    </p>
                  </div>
                </div>
              ))}

              {/* Customer details form */}
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-gray-900">Your Details</h3>
                <div>
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">Lead Guest Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      placeholder="e.g. John Smith"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-gray-500 mb-1 block">Group Size</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={groupSize}
                        onChange={(e) => setGroupSize(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-gray-500 mb-1 block">WhatsApp Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="+44 7123 456789"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Subtotal</span>
                  <span className="text-xs text-gray-600">{formatPrice(total, currency)}</span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Service fee</span>
                  <span className="text-xs text-gray-600">{formatPrice(serviceFee, currency)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-sm font-bold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-teal-600">{formatPrice(grandTotal, currency)}</span>
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2.5 text-xs text-red-600">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 shadow-lg shadow-orange-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Submit Booking Request
                  </>
                )}
              </button>
              <p className="text-center text-[10px] text-gray-400">
                No payment required now — our team confirms availability first.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

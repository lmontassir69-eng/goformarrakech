import { useState, useEffect } from "react";
import { X, Star, Clock, Users, MapPin, Calendar, Check } from "lucide-react";
import type { MarketplaceItem, Currency } from "../types";
import { formatPrice } from "../utils";

interface DetailModalProps {
  item: MarketplaceItem;
  currency: Currency;
  onClose: () => void;
  onBookNow: (item: MarketplaceItem, date: string, time: string) => void;
}

const TIME_SLOTS_FALLBACK = ["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM", "5:00 PM", "7:00 PM"];

export function DetailModal({ item, currency, onClose, onBookNow }: DetailModalProps) {
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  const timeSlots = item.timeSlots
    ? item.timeSlots
    : item.nextAvailable
    ? item.nextAvailable.map((t) => ({ time: t, available: true }))
    : TIME_SLOTS_FALLBACK.map((t) => ({ time: t, available: true }));

  const dateLabel = selectedDate !== null ? days[selectedDate].toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "";
  const canBook = selectedDate !== null && selectedTime !== null;

  function handleBook() {
    if (!canBook) return;
    onBookNow(item, dateLabel, selectedTime!);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={onClose}>
      <div
        className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
      />
      <div
        className={`relative w-full max-w-2xl bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out max-h-[92vh] overflow-y-auto ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="sticky top-0 z-10 bg-white pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto" />
        </div>

        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-white/90 backdrop-blur shadow-md hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        {item.image && (
          <div className="relative h-52 overflow-hidden">
            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute bottom-3 left-3.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Star className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
                <span className="text-xs font-bold text-white">{item.rating}</span>
                <span className="text-[10px] text-white/80">({item.reviewCount.toLocaleString()} reviews)</span>
              </div>
            </div>
          </div>
        )}

        <div className="p-4">
          <h2 className="text-lg font-bold text-gray-900">{item.title}</h2>
          <p className="text-sm text-gray-500">{item.subtitle}</p>

          {/* Meta info */}
          <div className="mt-3 flex items-center gap-3 flex-wrap text-[11px] text-gray-500">
            {item.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-teal-500" /> {item.location}
              </span>
            )}
            {item.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-teal-500" /> {item.duration}
              </span>
            )}
            {item.groupSize && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-teal-500" /> {item.groupSize}
              </span>
            )}
            {item.flightCode && (
              <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-600 font-semibold text-[10px]">
                {item.flightCode}
              </span>
            )}
            {item.stopover && (
              <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-600 font-semibold text-[10px]">
                {item.stopover}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="mt-3 text-sm text-gray-600 leading-relaxed">{item.description}</p>

          {/* Highlights */}
          <div className="mt-4">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">
              {item.category === "flights" ? "What's Included" : item.category === "hotels" ? "Amenities" : "Itinerary Highlights"}
            </h3>
            <div className="space-y-1.5">
              {item.highlights.map((h) => (
                <div key={h} className="flex items-start gap-2">
                  <div className="flex items-center justify-center w-4 h-4 rounded-full bg-teal-100 shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 text-teal-600" />
                  </div>
                  <span className="text-sm text-gray-600">{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Date picker */}
          <div className="mt-5">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-teal-500" /> Select Date
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
              {days.map((d, i) => {
                const isSel = selectedDate === i;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(i)}
                    className={`flex flex-col items-center justify-center min-w-[52px] py-2 rounded-xl border transition-all ${
                      isSel
                        ? "bg-teal-600 border-teal-600 text-white shadow-md"
                        : "bg-white border-gray-200 text-gray-600 hover:border-teal-300"
                    }`}
                  >
                    <span className="text-[9px] uppercase font-medium opacity-70">
                      {d.toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                    <span className="text-base font-bold">{d.getDate()}</span>
                    <span className="text-[9px] opacity-70">
                      {d.toLocaleDateString("en-US", { month: "short" })}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time picker */}
          <div className="mt-4">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-500" /> Select Time
            </h3>
            <div className="flex flex-wrap gap-2">
              {timeSlots.map((slot) => {
                const isSel = selectedTime === slot.time;
                return (
                  <button
                    key={slot.time}
                    disabled={!slot.available}
                    onClick={() => setSelectedTime(slot.time)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isSel
                        ? "bg-teal-600 text-white shadow-md"
                        : slot.available
                        ? "bg-gray-100 text-gray-600 hover:bg-teal-50 hover:text-teal-600"
                        : "bg-gray-50 text-gray-300 line-through cursor-not-allowed"
                    }`}
                  >
                    {slot.time}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price + CTA */}
          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-400">Total price</p>
              <p className="text-xl font-bold text-teal-600">{formatPrice(item.priceMAD, currency)}</p>
              <p className="text-[10px] text-gray-400">{item.priceUnit}</p>
            </div>
            <button
              onClick={handleBook}
              disabled={!canBook}
              className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                canBook
                  ? "bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/30 active:scale-95"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

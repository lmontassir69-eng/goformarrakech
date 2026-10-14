import { Star, Clock, Users, MapPin, ArrowRight } from "lucide-react";
import type { MarketplaceItem, Currency } from "../types";
import { formatPrice } from "../utils";

interface ItemCardProps {
  item: MarketplaceItem;
  currency: Currency;
  onClick: () => void;
}

export function ItemCard({ item, currency, onClick }: ItemCardProps) {
  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 active:scale-[0.98]"
    >
      {item.image && (
        <div className="relative h-44 overflow-hidden">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 backdrop-blur-sm">
            <Star className="w-3 h-3 fill-orange-400 text-orange-400" />
            <span className="text-[11px] font-bold text-gray-800">{item.rating}</span>
            <span className="text-[10px] text-gray-400">({item.reviewCount.toLocaleString()})</span>
          </div>
          {item.tags[0] && (
            <div className="absolute top-2.5 right-2.5 px-2 py-1 rounded-lg bg-teal-600/90 backdrop-blur-sm text-white text-[10px] font-semibold">
              {item.tags[0]}
            </div>
          )}
        </div>
      )}

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-gray-900 truncate">{item.title}</h3>
            <p className="text-[11px] text-gray-500 truncate">{item.subtitle}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-base font-bold text-teal-600">{formatPrice(item.priceMAD, currency)}</p>
            <p className="text-[10px] text-gray-400">{item.priceUnit}</p>
          </div>
        </div>

        {/* Category-specific info */}
        {item.category === "flights" && (
          <div className="mt-3 flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
            <div className="text-center">
              <p className="text-sm font-bold text-gray-800">{item.departureCode}</p>
            </div>
            <div className="flex-1 mx-2 flex flex-col items-center">
              <p className="text-[9px] text-gray-400">{item.duration}</p>
              <div className="w-full flex items-center">
                <div className="h-px flex-1 bg-gray-300" />
                <ArrowRight className="w-3 h-3 text-gray-400" />
              </div>
              <p className="text-[9px] text-teal-600 font-medium">{item.stopover}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-800">{item.arrivalCode}</p>
            </div>
          </div>
        )}

        {item.category === "hotels" && (
          <div className="mt-2.5 flex items-center gap-2 text-[11px] text-gray-500">
            <MapPin className="w-3 h-3 text-teal-500" />
            <span>{item.location}</span>
            {item.hasPool && <span className="text-teal-600 font-medium">· Pool</span>}
          </div>
        )}

        {item.category === "restaurants" && (
          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
            {item.cuisineTags?.map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-600 text-[10px] font-medium">
                {tag}
              </span>
            ))}
            <span className="text-[10px] text-gray-400 font-semibold ml-auto">{item.priceTier}</span>
          </div>
        )}

        {(item.category === "excursions" || item.category === "activities") && (
          <div className="mt-2.5 flex items-center gap-3 text-[11px] text-gray-500">
            {item.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-teal-500" />
                {item.duration}
              </span>
            )}
            {item.groupSize && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-teal-500" />
                {item.groupSize}
              </span>
            )}
            {item.nextAvailable && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-teal-500" />
                Next: {item.nextAvailable[0]}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

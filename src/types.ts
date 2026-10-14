export type CurrencyCode = "MAD" | "USD" | "EUR";

export type CategoryId = "flights" | "hotels" | "restaurants" | "excursions" | "activities";

export interface Currency {
  code: CurrencyCode;
  symbol: string;
  label: string;
  rate: number; // multiplier from base MAD price
}

export interface QuickFilter {
  id: string;
  label: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface MarketplaceItem {
  id: string;
  category: CategoryId;
  title: string;
  subtitle: string;
  image?: string;
  priceMAD: number;
  priceUnit: string;
  rating: number;
  reviewCount: number;
  tags: string[];
  // Flights
  airline?: string;
  flightCode?: string;
  departureCode?: string;
  arrivalCode?: string;
  duration?: string;
  stopover?: string;
  // Hotels
  starRating?: number;
  location?: string;
  hasPool?: boolean;
  isRiad?: boolean;
  // Restaurants
  cuisineTags?: string[];
  priceTier?: string;
  timeSlots?: TimeSlot[];
  // Excursions / Activities
  groupSize?: string;
  nextAvailable?: string[];
  description: string;
  highlights: string[];
}

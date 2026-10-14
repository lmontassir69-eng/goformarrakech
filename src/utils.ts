import type { Currency } from "./types";

export function formatPrice(priceMAD: number, currency: Currency): string {
  const converted = priceMAD * currency.rate;
  if (currency.code === "MAD") {
    return `${currency.symbol} ${Math.round(converted).toLocaleString("en-US")}`;
  }
  return `${currency.symbol}${converted.toFixed(2)}`;
}

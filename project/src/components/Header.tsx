import { useState, useRef, useEffect } from "react";
import { ChevronDown, Plane } from "lucide-react";
import { CURRENCIES } from "../data";
import type { Currency, CurrencyCode } from "../types";

interface HeaderProps {
  currency: Currency;
  onCurrencyChange: (code: CurrencyCode) => void;
  cartCount: number;
  onCartClick: () => void;
}

export function Header({ currency, onCurrencyChange, cartCount, onCartClick }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="mx-auto max-w-2xl px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-600 text-white">
            <Plane className="w-4 h-4" />
          </div>
          <div className="leading-tight">
            <h1 className="text-base font-bold text-gray-900 tracking-tight">VoyageGo</h1>
            <p className="text-[10px] text-gray-500 -mt-0.5 hidden sm:block">Exploring: Marrakech, Morocco</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-[10px] text-gray-500 sm:hidden">Marrakech, MA</p>

          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-xs font-semibold text-gray-700"
            >
              <span>{currency.code}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1">
                {CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      onCurrencyChange(c.code);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors flex items-center justify-between ${
                      currency.code === c.code ? "text-teal-600 font-bold" : "text-gray-700"
                    }`}
                  >
                    <span>{c.label}</span>
                    <span className="font-mono text-gray-400">{c.code} {c.symbol}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onCartClick}
            className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-orange-500 text-white text-[9px] font-bold animate-[pop_0.3s_ease-out]">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

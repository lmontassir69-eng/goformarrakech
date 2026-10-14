import { useState, useMemo, useCallback } from "react";
import { Search } from "lucide-react";
import { Header } from "@/components/Header";
import { CategoryTabs } from "@/components/CategoryTabs";
import { QuickFilterChips } from "@/components/QuickFilterChips";
import { ItemCard } from "@/components/ItemCard";
import { DetailModal } from "@/components/DetailModal";
import { CheckoutOverlay, type CartItem } from "@/components/CheckoutOverlay";
import { CATEGORIES, QUICK_FILTERS, ITEMS, CURRENCIES } from "@/data";
import type { CategoryId, CurrencyCode, MarketplaceItem } from "@/types";

export function Storefront() {
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>("MAD");
  const [activeCategory, setActiveCategory] = useState<CategoryId>("hotels");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const currency = useMemo(
    () => CURRENCIES.find((c) => c.code === currencyCode) ?? CURRENCIES[0],
    [currencyCode]
  );

  const filteredItems = useMemo(() => {
    let items = ITEMS.filter((i) => i.category === activeCategory);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.subtitle.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (activeFilter) {
      items = items.filter((i) => {
        switch (activeFilter) {
          case "nonstop":
            return i.stopover === "Nonstop";
          case "under1500":
            return i.priceMAD < 1500;
          case "morning":
            return i.tags.includes("Morning") || i.nextAvailable?.some((t) => t.includes("AM")) || false;
          case "riad":
            return i.isRiad === true;
          case "toprated":
            return i.rating >= 4.7;
          case "pool":
            return i.hasPool === true;
          case "moroccan":
            return i.cuisineTags?.some((c) => c.toLowerCase().includes("moroccan")) || i.tags.includes("Moroccan");
          case "fusion":
            return i.cuisineTags?.some((c) => c.toLowerCase().includes("fusion")) || i.tags.includes("Fusion");
          case "halfday":
            return i.duration?.includes("hours") && !i.duration?.startsWith("8") && !i.duration?.startsWith("9") && !i.duration?.startsWith("10");
          case "fullday":
            return i.duration?.startsWith("8") || i.duration?.startsWith("9") || i.duration?.startsWith("10");
          case "smallgroup":
            return i.groupSize?.includes("12") || i.groupSize?.includes("15");
          case "adventure":
            return i.tags.includes("Adventure") || i.tags.includes("Adrenaline");
          case "wellness":
            return i.tags.includes("Wellness") || i.tags.includes("Relaxation");
          default:
            return true;
        }
      });
    }

    return items;
  }, [activeCategory, activeFilter, searchQuery]);

  const handleCategoryChange = useCallback((id: CategoryId) => {
    setActiveCategory(id);
    setActiveFilter(null);
    setSearchQuery("");
  }, []);

  const handleBookNow = useCallback((item: MarketplaceItem, date: string, time: string) => {
    setCart((prev) => [...prev, { item, date, time }]);
    setCheckoutOpen(true);
  }, []);

  const handleRemoveFromCart = useCallback((index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100" style={{ backgroundColor: "#F3F4F6" }}>
      <Header
        currency={currency}
        onCurrencyChange={setCurrencyCode}
        cartCount={cart.length}
        onCartClick={() => setCheckoutOpen(true)}
      />
      <CategoryTabs categories={CATEGORIES} active={activeCategory} onChange={handleCategoryChange} />

      <div className="mx-auto max-w-2xl px-4 pt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${CATEGORIES.find((c) => c.id === activeCategory)?.label.toLowerCase()} in Marrakech...`}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"
          />
        </div>
      </div>

      <QuickFilterChips
        filters={QUICK_FILTERS[activeCategory]}
        active={activeFilter}
        onChange={setActiveFilter}
      />

      <main className="mx-auto max-w-2xl px-4 pb-24 pt-1">
        <p className="text-[11px] text-gray-400 mb-2.5 px-1">
          {filteredItems.length} {filteredItems.length === 1 ? "result" : "results"} in Marrakech
        </p>

        {filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-gray-200 mx-auto flex items-center justify-center mb-3">
              <Search className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700">No results found</p>
            <p className="text-xs text-gray-400 mt-1">Try clearing filters or switching categories.</p>
            <button
              onClick={() => {
                setActiveFilter(null);
                setSearchQuery("");
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                currency={currency}
                onClick={() => setSelectedItem(item)}
              />
            ))}
          </div>
        )}
      </main>

      {cart.length > 0 && !checkoutOpen && !selectedItem && (
        <div className="fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-2xl px-4 pb-4">
          <button
            onClick={() => setCheckoutOpen(true)}
            className="w-full bg-teal-600 text-white rounded-2xl py-3.5 shadow-xl shadow-teal-600/20 flex items-center justify-between px-4 active:scale-[0.98] transition-transform"
          >
            <span className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-xs font-bold">
                {cart.length}
              </span>
              <span className="text-sm font-semibold">View Cart</span>
            </span>
            <span className="text-sm font-bold">
              {(() => {
                const c = currency;
                const total = cart.reduce((s, e) => s + e.item.priceMAD, 0);
                const formatted = c.code === "MAD" ? `${c.symbol} ${Math.round(total * c.rate).toLocaleString()}` : `${c.symbol}${(total * c.rate).toFixed(2)}`;
                return formatted;
              })()}
            </span>
          </button>
        </div>
      )}

      {selectedItem && (
        <DetailModal
          item={selectedItem}
          currency={currency}
          onClose={() => setSelectedItem(null)}
          onBookNow={handleBookNow}
        />
      )}
      {checkoutOpen && (
        <CheckoutOverlay
          cart={cart}
          currency={currency}
          onClose={() => setCheckoutOpen(false)}
          onRemove={handleRemoveFromCart}
          onSuccess={() => setCart([])}
        />
      )}
    </div>
  );
}

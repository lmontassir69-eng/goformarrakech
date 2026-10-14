import { useRef } from "react";
import { Plane, Hotel, UtensilsCrossed, Map, Waves } from "lucide-react";
import type { CategoryId } from "../types";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Plane,
  Hotel,
  UtensilsCrossed,
  Map,
  Waves,
};

interface CategoryTabsProps {
  categories: { id: CategoryId; label: string; icon: string }[];
  active: CategoryId;
  onChange: (id: CategoryId) => void;
}

export function CategoryTabs({ categories, active, onChange }: CategoryTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <nav className="sticky top-14 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto px-4 py-2.5 mx-auto max-w-2xl scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {categories.map((cat) => {
          const Icon = ICONS[cat.icon];
          const isActive = active === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onChange(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
                isActive
                  ? "bg-teal-600 text-white shadow-md shadow-teal-600/20 scale-105"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {cat.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

import { Check } from "lucide-react";
import type { QuickFilter } from "../types";

interface QuickFilterChipsProps {
  filters: QuickFilter[];
  active: string | null;
  onChange: (id: string | null) => void;
}

export function QuickFilterChips({ filters, active, onChange }: QuickFilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 mx-auto max-w-2xl scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
      {filters.map((f) => {
        const isActive = active === f.id;
        return (
          <button
            key={f.id}
            onClick={() => onChange(isActive ? null : f.id)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all duration-200 ${
              isActive
                ? "bg-orange-50 text-orange-600 border border-orange-300"
                : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"
            }`}
          >
            {isActive && <Check className="w-3 h-3" />}
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

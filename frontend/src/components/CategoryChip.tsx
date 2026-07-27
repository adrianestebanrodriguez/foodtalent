"use client";

interface CategoryChipProps {
  category: { id: string; label: string; icon: string };
  selected: boolean;
  onClick: () => void;
}

export function CategoryChip({ category, selected, onClick }: CategoryChipProps) {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium
        transition-all duration-200 min-h-[44px]
        ${
          selected
            ? "bg-brand-500 text-white shadow-md"
            : "bg-white text-gray-700 border border-gray-200 hover:border-brand-300 hover:bg-brand-50"
        }
      `}
      role="checkbox"
      aria-checked={selected}
      aria-label={`Filtrar por ${category.label}`}
    >
      <span aria-hidden="true">{category.icon}</span>
      {category.label}
    </button>
  );
}

"use client";

import { Search, Loader2 } from "lucide-react";

interface SearchBarProps {
  query: string;
  setQuery: (value: string) => void;
  placeholder: string;
  onSearch: () => void;
  isSearching: boolean;
}

export function SearchBar({
  query,
  setQuery,
  placeholder,
  onSearch,
  isSearching,
}: SearchBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSearching && query.length >= 10) {
      onSearch();
    }
  };

  return (
    <div className="relative max-w-2xl mx-auto">
      <label htmlFor="search-input" className="sr-only">
        Describe tu necesidad
      </label>
      <input
        id="search-input"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-5 py-4 pr-36 text-base sm:text-lg rounded-xl border-2 border-gray-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-all duration-200 bg-white shadow-sm"
        aria-describedby="search-hint"
        aria-invalid={query.length > 0 && query.length < 10}
        disabled={isSearching}
      />
      <p id="search-hint" className="sr-only">
        Escribe al menos 10 caracteres para obtener mejores resultados
      </p>
      <button
        onClick={onSearch}
        disabled={isSearching || query.length < 10}
        className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm bg-brand-500 text-white hover:bg-brand-600 focus:ring-4 focus:ring-brand-200 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        aria-busy={isSearching}
      >
        {isSearching ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Buscando...
          </>
        ) : (
          <>
            <Search className="w-4 h-4" />
            Buscar experto
          </>
        )}
      </button>
    </div>
  );
}

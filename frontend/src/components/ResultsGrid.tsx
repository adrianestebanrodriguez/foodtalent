"use client";

import { ResultCard } from "./ResultCard";

interface ResultsGridProps {
  results: any[];
}

export function ResultsGrid({ results }: ResultsGridProps) {
  return (
    <section className="max-w-6xl mx-auto px-4 pb-16">
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6 text-center animate-fade-in">
        Estos son los perfiles más idóneos para tu caso
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
        {results.map((result, index) => (
          <div
            key={result.professional_id}
            className="animate-slide-up w-full"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <ResultCard result={result} />
          </div>
        ))}
      </div>
    </section>
  );
}

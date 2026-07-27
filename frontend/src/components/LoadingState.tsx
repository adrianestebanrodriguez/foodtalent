"use client";

import { useState, useEffect } from "react";

const MESSAGES = [
  { threshold: 0, text: "Analizando tu caso..." },
  { threshold: 3000, text: "Comparando tu reto con nuestra red de expertos..." },
  { threshold: 8000, text: "Ya casi — estamos afinando las recomendaciones" },
];

export function LoadingState() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Date.now() - start);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const currentMessage = MESSAGES.reduce((prev, curr) =>
    elapsed >= curr.threshold ? curr : prev
  );

  const progress = Math.min((elapsed / 12000) * 100, 95);

  return (
    <div className="text-center py-12 px-4" role="status" aria-live="polite">
      {/* Bouncing dots */}
      <div className="flex justify-center gap-2 mb-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full bg-brand-500 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
            aria-hidden="true"
          />
        ))}
      </div>

      <p className="text-lg text-gray-700 font-medium animate-fade-in">
        {currentMessage.text}
      </p>

      {/* Progress bar */}
      <div className="mt-4 w-48 mx-auto bg-gray-200 rounded-full h-1 overflow-hidden">
        <div
          className="bg-brand-500 h-1 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

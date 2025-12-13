"use client";

import { useState, useEffect, useMemo } from "react";

// Generate particle positions once on mount
const generateParticles = (count: number) => {
  const seed = 12345; // Fixed seed for consistent random values
  let currentSeed = seed;

  const random = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };

  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${random() * 100}%`,
    top: `${random() * 100}%`,
    animationDelay: `${random() * 5}s`,
    animationDuration: `${3 + random() * 4}s`,
    width: `${2 + random() * 4}px`,
    height: `${2 + random() * 4}px`,
  }));
};

export function Hero() {
  const [currentWord, setCurrentWord] = useState(0);
  const words = ["Innovation", "Technology", "Creativity", "Discovery"];

  // Generate particles once and memoize
  const particles = useMemo(() => generateParticles(20), []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % words.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-slate-900 to-purple-900/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-400/10 via-transparent to-transparent" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute animate-pulse-slow"
            style={{
              left: particle.left,
              top: particle.top,
              animationDelay: particle.animationDelay,
              animationDuration: particle.animationDuration,
            }}
          >
            <div
              className="rounded-full bg-emerald-400/30 blur-sm"
              style={{
                width: particle.width,
                height: particle.height,
              }}
            />
          </div>
        ))}
      </div>

      {/* Hero content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6">
          <span className="bg-gradient-to-r from-emerald-400 via-white to-purple-400 bg-clip-text text-transparent animate-gradient bg-300%">
            Welcome to the Future of
          </span>
          <br />
          <span className="block mt-2 text-5xl sm:text-6xl lg:text-8xl">
            <span className="relative inline-block">
              <span className="absolute inset-0 blur-2xl bg-gradient-to-r from-emerald-400 to-purple-400 opacity-50 animate-pulse-slow" />
              <span className="relative bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
                {words[currentWord]}
              </span>
            </span>
          </span>
        </h1>

        <p className="text-lg sm:text-xl lg:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
          Exploring the intersection of technology and creativity, one post at a time.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="#posts"
            className="group relative px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/25 focus-ring"
          >
            <span className="relative z-10 flex items-center gap-2">
              Start Exploring
              <svg
                className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>

          <a
            href="/about"
            className="px-8 py-4 border border-white/20 rounded-full font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/30 focus-ring"
          >
            Learn More
          </a>
        </div>

        {/* Removed scroll indicator - arrow was removed as requested */}
      </div>
    </section>
  );
}
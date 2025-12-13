"use client";

import Link from "next/link";
import { useState } from "react";

type NavLink = {
  label: string;
  href: string;
  external?: boolean;
};

type Props = {
  links: NavLink[];
  children?: React.ReactNode;
};

export function ResponsiveNav({ links, children }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label="Toggle navigation"
        className="relative flex h-10 w-10 items-center justify-center rounded-xl glass border border-white/10 text-slate-100 transition-all duration-300 hover:border-emerald-400/50 hover:text-emerald-200 hover:bg-white/10 hover:scale-105 focus-ring md:hidden"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`absolute h-0.5 w-5 bg-current transition-all duration-300 ${open ? "translate-y-0 rotate-45" : "-translate-y-1.5"}`}></span>
        <span className={`absolute h-0.5 w-5 bg-current transition-all duration-300 ${open ? "opacity-0" : "opacity-100"}`}></span>
        <span className={`absolute h-0.5 w-5 bg-current transition-all duration-300 ${open ? "translate-y-0 -rotate-45" : "translate-y-1.5"}`}></span>
      </button>

      {/* Mobile menu overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-md md:hidden"
          onClick={() => setOpen(false)}
        >
          <nav
            className="flex flex-col gap-4 p-6 pt-20"
            onClick={(e) => e.stopPropagation()}
          >
            {links.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xl font-semibold text-white transition-all duration-300 hover:text-emerald-300 hover:translate-x-2 focus-ring rounded-lg p-2"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => {
                  setLoading(true);
                  setOpen(false);
                }}
              >
                {link.label}
              </Link>
            ))}
            {children && (
              <div className="mt-4 pt-4 border-t border-white/10">
                {children}
              </div>
            )}
          </nav>
        </div>
      )}

      {loading && (
        <div className="fixed inset-x-0 top-0 z-50 h-1 bg-gradient-to-r from-emerald-400 to-purple-400">
          <div className="h-full w-full animate-pulse bg-gradient-to-r from-emerald-200 to-purple-200" />
        </div>
      )}
    </div>
  );
}

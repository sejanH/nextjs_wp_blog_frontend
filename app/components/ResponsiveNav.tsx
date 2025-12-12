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
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-slate-100 transition-all duration-300 hover:border-emerald-300 hover:text-emerald-200 hover:bg-white/10 focus-ring sm:hidden"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`absolute h-0.5 w-5 bg-current transition-all duration-300 ${open ? "translate-y-0 rotate-45" : "-translate-y-1.5"}`}></span>
        <span className={`absolute h-0.5 w-5 bg-current transition-all duration-300 ${open ? "opacity-0" : "opacity-100"}`}></span>
        <span className={`absolute h-0.5 w-5 bg-current transition-all duration-300 ${open ? "translate-y-0 -rotate-45" : "translate-y-1.5"}`}></span>
      </button>

      <div
        className={`${
          open ? "flex animate-slide-down" : "hidden"
        } absolute left-0 right-0 top-full z-10 flex-col gap-3 border-b border-white/10 bg-slate-900/95 backdrop-blur-md px-6 py-4 sm:static sm:z-auto sm:flex sm:flex-row sm:items-center sm:gap-6 sm:border-none sm:bg-transparent sm:p-0`}
      >
        {links.map((link, index) =>
          link.external ? (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-slate-100 transition-all duration-300 hover:text-emerald-200 hover:-translate-y-0.5 focus-ring"
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ) : (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-slate-100 transition-all duration-300 hover:text-emerald-200 hover:-translate-y-0.5 focus-ring"
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => {
                setLoading(true);
                setOpen(false);
              }}
            >
              {link.label}
            </Link>
          ),
        )}
        {children}
      </div>
      {loading && (
        <div className="fixed inset-x-0 top-0 z-30 h-1 bg-emerald-400">
          <div className="h-full w-full animate-pulse bg-emerald-200" />
        </div>
      )}
    </div>
  );
}

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
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-slate-100 transition hover:border-emerald-300 hover:text-emerald-200 sm:hidden"
        onClick={() => setOpen((v) => !v)}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div
        className={`${
          open ? "flex" : "hidden"
        } absolute left-0 right-0 top-full z-10 flex-col gap-3 border-b border-white/10 ${open ? "bg-slate-900" : "bg-slate-900/95"} px-6 py-4 sm:static sm:z-auto sm:flex sm:flex-row sm:items-center sm:gap-6 sm:border-none sm:bg-transparent sm:p-0`}
      >
        {links.map((link) =>
          link.external ? (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-slate-100 transition hover:text-emerald-200"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ) : (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-slate-100 transition hover:text-emerald-200"
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

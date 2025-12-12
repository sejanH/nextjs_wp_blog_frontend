"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { ResponsiveNav } from "./ResponsiveNav";

type NavLink = {
  label: string;
  href: string;
  external?: boolean;
};

type NavbarProps = {
  links: NavLink[];
  rightSlot?: ReactNode;
};

export function Navbar({ links, rightSlot }: NavbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 backdrop-blur-md animate-slide-down">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-2 sm:px-10">
        <Link
          href="/"
          className="group flex items-center gap-3 rounded-2xl px-2 py-1 transition-all duration-300 hover:text-emerald-200 focus-ring"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-400 to-emerald-600 text-lg font-semibold text-slate-900 shadow-lg shadow-emerald-900/40 transition-all duration-300 group-hover:shadow-emerald-900/60 group-hover:scale-105">
            sz
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200 transition-colors duration-300 group-hover:text-emerald-100">
              Sejan.xyz
            </p>
          </div>
        </Link>
        <ResponsiveNav links={links}>{rightSlot}</ResponsiveNav>
      </div>
    </header>
  );
}

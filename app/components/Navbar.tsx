"use client";

import Link from "next/link";
import { ReactNode, useState, useEffect } from "react";
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-40 transition-all duration-500 ${scrolled ? 'glass border-b border-white/10 shadow-lg' : 'bg-transparent'}`}>
      <div className="container-responsive flex items-center justify-between gap-4 py-2 sm:py-3">
        <Link
          href="/"
          className="group flex items-center gap-3 rounded-2xl px-3 py-2 transition-all duration-300 hover:bg-white/5 focus-ring"
        >
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-bold text-slate-900 shadow-lg shadow-emerald-500/40 transition-all duration-300 group-hover:shadow-emerald-500/60 group-hover:scale-105 group-hover:rotate-3">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-300 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative">sz</span>
          </div>
          <div>
            <p className="text-base font-bold bg-gradient-to-r from-emerald-200 to-white bg-clip-text text-transparent transition-all duration-300 group-hover:from-emerald-100 group-hover:to-white">
              Sejan
            </p>
            <p className="text-xs text-slate-400">Blog</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative text-sm font-medium text-slate-300 transition-all duration-300 hover:text-white hover:scale-105 focus-ring rounded-lg px-3 py-2"
            >
              {link.label}
              <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-emerald-400 to-purple-400 transition-all duration-300 group-hover:w-full group-hover:left-0" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {rightSlot}
          <ResponsiveNav links={links} />
        </div>
      </div>
    </header>
  );
}

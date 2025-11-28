"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_WORDPRESS_API_URL?.replace(/\/$/, "") || "";
  
const FORM_ID = process.env.NEXT_PUBLIC_WPFORM_ID || "";
const AUTH_USER = process.env.WORDPRESS_BASIC_AUTH_USER || "";
const AUTH_PASS = process.env.WORDPRESS_BASIC_AUTH_PASSWORD || "";

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const initialState: FormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export default function ContactPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    ok: boolean;
    message: string | null;
  }>({ ok: true, message: null });

  const canSubmit = useMemo(
    () => form.name && form.email && form.message && !submitting,
    [form, submitting],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!API_BASE || !FORM_ID) {
      setStatus({
        ok: false,
        message:
          "Contact API is not configured. Add NEXT_PUBLIC_WORDPRESS_API_URL and NEXT_PUBLIC_WPFORM_ID in .env.",
      });
      return;
    }

    setSubmitting(true);
    setStatus({ ok: true, message: null });
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (AUTH_USER && AUTH_PASS) {
        headers.Authorization = `Basic ${btoa(`${AUTH_USER}:${AUTH_PASS}`)}`;
      }

      const res = await fetch(
        `${API_BASE}/wpforms/v1/forms/${FORM_ID}/entries`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            // WPForms expects numeric field IDs; adjust to your form mapping.
            fields: {
              1: form.name,
              2: form.email,
              3: form.subject,
              4: form.message,
            },
          }),
        },
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to submit form");
      }

      setStatus({ ok: true, message: "Thank you! Your message was sent." });
      setForm(initialState);
    } catch (err) {
      setStatus({
        ok: false,
        message:
          err instanceof Error
            ? err.message
            : "Something went wrong sending your message.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-950 to-slate-950 text-slate-50">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 sm:px-10">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-2xl px-2 py-1 transition hover:text-emerald-200"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-lg font-semibold text-slate-900 shadow-lg shadow-emerald-900/40">
                sz
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
                  Sejan.xyz
                </p>
              </div>
            </Link>
          </div>
          <nav className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-100 sm:gap-6">
            <Link className="transition hover:text-emerald-200" href="/">
              Home
            </Link>
            <Link className="transition hover:text-emerald-200" href="/contact">
              Contact
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 pb-16 pt-10 sm:px-10">
       
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-emerald-900/30 backdrop-blur sm:p-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold text-emerald-100">
                Name
                <input
                  required
                  type="text"
                  className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-slate-50 outline-none transition focus:border-emerald-300"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-emerald-100">
                Email
                <input
                  required
                  type="email"
                  className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-slate-50 outline-none transition focus:border-emerald-300"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm font-semibold text-emerald-100">
              Subject
              <input
                type="text"
                className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-slate-50 outline-none transition focus:border-emerald-300"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-emerald-100">
              Message
              <textarea
                required
                rows={6}
                className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-slate-50 outline-none transition focus:border-emerald-300"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </label>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex items-center justify-center rounded-full bg-emerald-300 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Sending..." : "Send Message"}
              </button>
              {status.message && (
                <span
                  className={`text-sm ${
                    status.ok ? "text-emerald-200" : "text-red-200"
                  }`}
                >
                  {status.message}
                </span>
              )}
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

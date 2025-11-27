"use client";

import { useMemo, useState } from "react";

type Props = {
  postId: number;
  apiBase: string | undefined;
};

const AUTH_USER = process.env.NEXT_PUBLIC_WP_AUTH_USER || "";
const AUTH_PASS = process.env.NEXT_PUBLIC_WP_AUTH_PASS || "";

const spamPatterns = [
  /<script/i,
  /<\/?iframe/i,
  /\bunion\b/i,
  /\bselect\b/i,
  /\bdrop table\b/i,
  /\binsert\b/i,
  /\bupdate\b/i,
  /\bdelete\b/i,
];

export function CommentForm({ postId, apiBase }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string | null }>(
    { ok: true, message: null },
  );

  const canSubmit = useMemo(
    () => name.trim() && email.trim() && message.trim() && !submitting,
    [name, email, message, submitting],
  );

  const sanitize = (text: string) => text.replace(/<[^>]+>/g, "").trim();

  const isSpammy = (text: string) => spamPatterns.some((p) => p.test(text));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const safeName = sanitize(name);
    const safeMessage = sanitize(message);

    if (isSpammy(safeMessage)) {
      setStatus({ ok: false, message: "Content rejected: looks like spam." });
      return;
    }

    setSubmitting(true);
    setStatus({ ok: true, message: null });

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          name: safeName,
          email: email.trim(),
          message: safeMessage,
          apiBase,
          authUser: AUTH_USER,
          authPass: AUTH_PASS,
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to submit comment");
      }

      setStatus({ ok: true, message: "Comment submitted for review." });
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setStatus({
        ok: false,
        message:
          err instanceof Error
            ? err.message
            : "Something went wrong submitting your comment.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-semibold text-emerald-100">
          Name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-slate-50 outline-none transition focus:border-emerald-300"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold text-emerald-100">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-slate-50 outline-none transition focus:border-emerald-300"
          />
        </label>
      </div>
      <label className="flex flex-col gap-2 text-sm font-semibold text-emerald-100">
        Comment
        <textarea
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-slate-50 outline-none transition focus:border-emerald-300"
        />
      </label>
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center justify-center rounded-full bg-emerald-300 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Posting..." : "Post Comment"}
        </button>
        {status.message && (
          <span className={`text-sm ${status.ok ? "text-emerald-200" : "text-red-200"}`}>
            {status.message}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-300/70">Comments may be held for moderation.</p>
    </form>
  );
}

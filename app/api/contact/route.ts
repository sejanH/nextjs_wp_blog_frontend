import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_WORDPRESS_API_URL?.replace(/\/$/, "");
const FORM_ID = process.env.NEXT_PUBLIC_WPFORM_ID;
const AUTH_USER = process.env.WORDPRESS_BASIC_AUTH_USER || process.env.NEXT_PUBLIC_WP_AUTH_USER || "";
const AUTH_PASS = process.env.WORDPRESS_BASIC_AUTH_PASSWORD || process.env.NEXT_PUBLIC_WP_AUTH_PASS || "";

export async function POST(req: NextRequest) {
  if (!API_BASE || !FORM_ID) {
    return NextResponse.json(
      { error: "Contact API not configured. Set NEXT_PUBLIC_WORDPRESS_API_URL and NEXT_PUBLIC_WPFORM_ID." },
      { status: 400 },
    );
  }

  if (!AUTH_USER || !AUTH_PASS) {
    return NextResponse.json(
      { error: "Authentication missing. Set WORDPRESS_BASIC_AUTH_USER/PASSWORD (or NEXT_PUBLIC_WP_AUTH_*)." },
      { status: 400 },
    );
  }

  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
    }

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

    const sanitize = (text: string) => String(text).replace(/<[^>]+>/g, "").trim();
    const cleanMessage = sanitize(message);
    const cleanName = sanitize(name);
    const cleanSubject = sanitize(subject || "");
    const cleanEmail = String(email).trim();

    if (spamPatterns.some((p) => p.test(cleanMessage))) {
      return NextResponse.json({ error: "Content rejected: looks like spam." }, { status: 400 });
    }

    const res = await fetch(`${API_BASE}/wpforms/v1/forms/${FORM_ID}/entries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${AUTH_USER}:${AUTH_PASS}`).toString("base64")}`,
      },
      body: JSON.stringify({
        fields: {
          1: cleanName,
          2: cleanEmail,
          3: cleanSubject,
          4: cleanMessage,
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text || "Failed to submit form" }, { status: res.status });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected error submitting contact form" },
      { status: 500 },
    );
  }
}

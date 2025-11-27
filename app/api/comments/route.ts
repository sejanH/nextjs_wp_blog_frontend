import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_WORDPRESS_API_URL?.replace(/\/$/, "");

function getSiteBase() {
  if (API_BASE && API_BASE.includes("/wp-json")) {
    return API_BASE.split("/wp-json")[0];
  }
  return API_BASE;
}

export async function POST(req: NextRequest) {
  try {
    const { postId, name, email, message, apiBase, authUser, authPass } =
      await req.json();

    if (!postId || !name || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const cleanMessage = String(message).replace(/<[^>]+>/g, "").trim();
    const cleanName = String(name).replace(/<[^>]+>/g, "").trim();
    const cleanEmail = String(email).trim();

    // Basic spam guard
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
    if (spamPatterns.some((p) => p.test(cleanMessage))) {
      return NextResponse.json(
        { error: "Content rejected: looks like spam." },
        { status: 400 },
      );
    }

    const base = apiBase || API_BASE;
    if (!base) {
      return NextResponse.json(
        { error: "API base not configured" },
        { status: 400 },
      );
    }

    const useAuth = Boolean(authUser && authPass);
    let res: Response;

    if (useAuth) {
      res = await fetch(`${base}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(`${authUser}:${authPass}`).toString("base64")}`,
        },
        body: JSON.stringify({
          post: postId,
          author_name: cleanName,
          author_email: cleanEmail,
          content: cleanMessage,
        }),
      });
    } else {
      const siteBase = getSiteBase();
      if (!siteBase) {
        return NextResponse.json(
          { error: "Site base not configured for comment proxy" },
          { status: 400 },
        );
      }
      const formData = new URLSearchParams();
      formData.set("comment", cleanMessage);
      formData.set("author", cleanName);
      formData.set("email", cleanEmail);
      formData.set("comment_post_ID", String(postId));
      formData.set("comment_parent", "0");

      res = await fetch(`${siteBase}/wp-comments-post.php`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });
    }

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: text || "Failed to submit comment" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Unexpected error submitting comment",
      },
      { status: 500 },
    );
  }
}

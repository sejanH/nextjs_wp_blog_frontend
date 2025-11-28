import type { Metadata } from "next";
import { buildMetadataFromYoast } from "./lib/seo";
import { BlogClient } from "./components/BlogClient";
import { WPPost } from "./types/wp";

export const revalidate = 300;

const API_BASE = process.env.NEXT_PUBLIC_WORDPRESS_API_URL?.replace(/\/$/, "");
const SITE_BASE =
  API_BASE && API_BASE.includes("/wp-json")
    ? API_BASE.split("/wp-json")[0]
    : API_BASE;

export async function generateMetadata(): Promise<Metadata> {
  const fallback = {
    title: "Sejan · Blog",
    description: "WordPress-powered blog",
    url: SITE_BASE || undefined,
  };

  if (!API_BASE) {
    return fallback;
  }

  try {
    const res = await fetch(`${API_BASE}/pages?slug=home&_fields=yoast_head_json`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      const yoast = data?.[0]?.yoast_head_json;
      if (yoast) {
        return buildMetadataFromYoast(yoast, {
          ...fallback,
          siteName: fallback.title,
        });
      }
    }
  } catch {
    return fallback;
  }

  return fallback;
}

export default async function Home() {
  if (!API_BASE) {
    throw new Error("Set NEXT_PUBLIC_WORDPRESS_API_URL in .env");
  }

  const response = await fetch(`${API_BASE}/posts?_embed&per_page=6`, {
    next: { revalidate },
  });

  if (!response.ok) {
    throw new Error("Unable to reach WordPress. Check the API URL.");
  }

  const posts: WPPost[] = await response.json();
  const totalPages = Number(response.headers.get("X-WP-TotalPages") ?? "1");

  return (
    <BlogClient
      initialPosts={posts}
      initialTotalPages={totalPages}
      apiBase={API_BASE}
      siteBase={SITE_BASE}
    />
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogClient } from "@/app/components/BlogClient";
import { buildMetadataFromYoast } from "@/app/lib/seo";
import { WPPost, WPCategory } from "@/app/types/wp";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const API_BASE = process.env.NEXT_PUBLIC_WORDPRESS_API_URL?.replace(/\/$/, "");
const SITE_BASE =
  API_BASE && API_BASE.includes("/wp-json")
    ? API_BASE.split("/wp-json")[0]
    : API_BASE;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const fallback = {
    title: `Category: ${slug}`,
    url: SITE_BASE ? `${SITE_BASE}/category/${slug}` : undefined,
    siteName: "Sejan · Blog",
  };

  if (!API_BASE) return fallback;

  try {
    const res = await fetch(
      `${API_BASE}/categories?slug=${slug}&_fields=yoast_head_json,name,slug`,
      { cache: "no-store" },
    );
    if (res.ok) {
      const data = await res.json();
      const cat = data?.[0];
      if (cat) {
        return buildMetadataFromYoast(cat.yoast_head_json, {
          ...fallback,
          title: cat.yoast_head_json?.title || `Category: ${cat.name}`,
          description: cat.yoast_head_json?.description,
          url: cat.yoast_head_json?.canonical || fallback.url,
        });
      }
    }
  } catch {
    return fallback;
  }

  return fallback;
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!API_BASE) {
    throw new Error("Set NEXT_PUBLIC_WORDPRESS_API_URL in .env");
  }

  const categoryRes = await fetch(
    `${API_BASE}/categories?slug=${slug}&_embed`,
    {
      cache: "no-store",
    },
  );

  if (!categoryRes.ok) {
    throw new Error("Unable to reach WordPress. Check the API URL.");
  }

  const categories: WPCategory[] = await categoryRes.json();
  const category = categories[0];

  if (!category) {
    notFound();
  }

  const postsRes = await fetch(
    `${API_BASE}/posts?_embed&per_page=6&categories=${category.id}`,
    {
      cache: "no-store",
    },
  );

  if (!postsRes.ok) {
    throw new Error("Unable to reach WordPress. Check the API URL.");
  }

  const posts: WPPost[] = await postsRes.json();
  const totalPages = Number(postsRes.headers.get("X-WP-TotalPages") ?? "1");

  return (
    <BlogClient
      initialPosts={posts}
      initialTotalPages={totalPages}
      apiBase={API_BASE}
      siteBase={SITE_BASE}
      categoryId={category.id}
      categoryName={category.name}
    />
  );
}

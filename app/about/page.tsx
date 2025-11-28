import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildMetadataFromYoast } from "@/app/lib/seo";
import { WPPost } from "@/app/types/wp";
import { ResponsiveNav } from "@/app/components/ResponsiveNav";
import { Navbar } from "@/app/components/Navbar";

export const revalidate = 300;

const API_BASE = process.env.NEXT_PUBLIC_WORDPRESS_API_URL?.replace(/\/$/, "");
const SITE_BASE =
  API_BASE && API_BASE.includes("/wp-json")
    ? API_BASE.split("/wp-json")[0]
    : API_BASE;

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function decodeEntities(text: string) {
  const map: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };

  return text.replace(/&(#\d+|#x[0-9a-fA-F]+|\w+);/g, (_, entity) => {
    if (entity[0] === "#") {
      const codePoint =
        entity[1].toLowerCase() === "x"
          ? parseInt(entity.slice(2), 16)
          : parseInt(entity.slice(1), 10);
      return String.fromCodePoint(codePoint);
    }
    return map[entity] ?? `&${entity};`;
  });
}

function normalizeContent(html: string) {
  let clean = html;
  clean = clean.replace(/<section\b[^>]*>/gi, "<div>");
  clean = clean.replace(/<\/section>/gi, "</div>");
  clean = clean.replace(/<div\b[^>]*class="[^"]*elementor-widget-container[^"]*"[^>]*>/gi, "<div>");
  clean = clean.replace(/<div\b[^>]*class="[^"]*elementor-widget-wrap[^"]*"[^>]*>/gi, "<div>");
  clean = clean.replace(/<div\b[^>]*class="[^"]*elementor-container[^"]*"[^>]*>/gi, "<div>");
  clean = clean.replace(/<div\b[^>]*class="[^"]*elementor-column[^"]*"[^>]*>/gi, "<div>");
  clean = clean.replace(/<div\b[^>]*class="[^"]*elementor-element[^"]*"[^>]*>/gi, "<div>");
  clean = clean.replace(/<div\b[^>]*class="[^"]*elementor-widget[^"]*"[^>]*>/gi, "<div>");
  clean = clean.replace(/\sstyle="[^"]*"/gi, "");
  clean = clean.replace(/<p>\s*<\/p>/gi, "");
  return clean;
}

async function getAboutPage(): Promise<WPPost> {
  if (!API_BASE) {
    throw new Error("Set NEXT_PUBLIC_WORDPRESS_API_URL in .env");
  }

  const res = await fetch(`${API_BASE}/pages?slug=about&_embed`, {
    next: { revalidate },
  });

  if (!res.ok) {
    throw new Error("Unable to reach WordPress. Check the API URL.");
  }

  const data: WPPost[] = await res.json();
  if (!data || data.length === 0) {
    notFound();
  }

  return data[0];
}

export async function generateMetadata(): Promise<Metadata> {
  const fallback = {
    title: "About · Sejan",
    description: "About this site",
    url: SITE_BASE ? `${SITE_BASE}/about` : undefined,
    siteName: "Sejan · Blog",
  };

  if (!API_BASE) return fallback;

  try {
    const res = await fetch(
      `${API_BASE}/pages?slug=about&_fields=yoast_head_json,title,excerpt`,
      { cache: "no-store" },
    );
    if (res.ok) {
      const data = await res.json();
      const page = data?.[0];
      if (page) {
        return buildMetadataFromYoast(page.yoast_head_json, {
          ...fallback,
          title: page.yoast_head_json?.title || stripHtml(page.title.rendered),
          description:
            page.yoast_head_json?.description || stripHtml(page.excerpt?.rendered || ""),
          url: page.yoast_head_json?.canonical || fallback.url,
        });
      }
    }
  } catch {
    return fallback;
  }

  return fallback;
}

export default async function AboutPage() {
  const page = await getAboutPage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-950 to-slate-950 text-slate-50">
      <Navbar
        links={[
          { label: "Home", href: "/" },
          { label: "Contact", href: "/contact" },
        ]}
      />

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 pb-20 pt-8 sm:px-10">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 text-slate-50 shadow-2xl shadow-emerald-900/40">
          <div className="flex flex-col gap-3 px-6 py-8 text-center sm:px-10">
            <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
              {decodeEntities(stripHtml(page.title.rendered))}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-emerald-200">
              <Link
                href="/"
                className="inline-flex items-center gap-1 font-semibold transition hover:text-emerald-100"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="m3 12 9-9 9 9" />
                  <path d="M9 21V9h6v12" />
                </svg>
                Home
              </Link>
              <span className="text-emerald-300/80">›</span>
              <span className="text-emerald-100">
                {decodeEntities(stripHtml(page.title.rendered))}
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-emerald-900/30 backdrop-blur sm:p-10">
          <article className="post-content space-y-6 text-slate-200 leading-relaxed">
            <div
              dangerouslySetInnerHTML={{
                __html: normalizeContent(page.content?.rendered ?? ""),
              }}
            />
          </article>
        </section>
      </main>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { WPComment, WPPost } from "@/app/types/wp";
import { CommentForm } from "@/app/components/CommentForm";
import type { Metadata } from "next";
import { buildMetadataFromYoast } from "@/app/lib/seo";
import { JSX } from "react/jsx-runtime";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const API_BASE = process.env.NEXT_PUBLIC_WORDPRESS_API_URL?.replace(/\/$/, "");
const SITE_BASE =
  API_BASE && API_BASE.includes("/wp-json")
    ? API_BASE.split("/wp-json")[0]
    : API_BASE;

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function decodeEntities(text: string | undefined) {
  const map: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };
  if(!text){
    return '';
  }
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

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function slugifyCategory(category?: { slug?: string; name?: string }) {
  if (!category) return "";
  if (category.slug) return category.slug;
  if (!category.name) return "";
  return category.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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
  // Drop social sharing widgets that are only present on some posts.
  clean = clean.replace(
    /<div[^>]*class="[^"]*(oss-social-share|ocean-social|social-share)[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
    "",
  );
  // Remove inline styles to keep typography consistent.
  clean = clean.replace(/\sstyle="[^"]*"/gi, "");
  // Drop empty paragraphs.
  clean = clean.replace(/<p>\s*<\/p>/gi, "");
  return clean;
}

function buildShareLinks(url: string, title: string) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };
}

async function getPostBySlug(slug: string): Promise<WPPost> {
  if (!API_BASE) {
    throw new Error("Set NEXT_PUBLIC_WORDPRESS_API_URL in .env");
  }

  const res = await fetch(`${API_BASE}/posts?slug=${slug}&_embed`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Unable to reach Post. Check the API URL.");
  }

  const data: WPPost[] = await res.json();
  if (!data || data.length === 0) {
    notFound();
  }

  return data[0];
}

async function fetchFullContent(link: string): Promise<string | null> {
  try {
    const res = await fetch(link, { cache: "no-store" });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(
      /<div class="entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/article>/i,
    );
    if (match?.[1]) {
      return match[1];
    }
  } catch {
    return null;
  }
  return null;
}

async function getComments(postId: number): Promise<WPComment[]> {
  if (!API_BASE) return [];
  try {
    const res = await fetch(
      `${API_BASE}/comments?post=${postId}&per_page=100&_embed`,
      { cache: "no-store" },
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const fallback = {
    title: "Post",
    url: SITE_BASE ? `${SITE_BASE}/posts/${slug}` : undefined,
    siteName: "Sejan · Blog",
  };

  if (!API_BASE) return fallback;

  try {
    const res = await fetch(
      `${API_BASE}/posts?slug=${slug}&_fields=yoast_head_json,title,excerpt`,
      { cache: "no-store" },
    );
    if (res.ok) {
      const data = await res.json();
      const post = data?.[0];
      if (post) {
        return buildMetadataFromYoast(post.yoast_head_json, {
          ...fallback,
          title: post.yoast_head_json?.title || stripHtml(post.title.rendered),
          description: post.yoast_head_json?.description || stripHtml(post.excerpt?.rendered || ""),
          url: post.yoast_head_json?.canonical || fallback.url,
        });
      }
    }
  } catch {
    return fallback;
  }

  return fallback;
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (
    post.link &&
    post.content?.rendered &&
    /more-link|elementor-widget-read-more/i.test(post.content.rendered)
  ) {
    const fullHtml = await fetchFullContent(post.link);
    if (fullHtml) {
      post.content = { rendered: fullHtml };
    }
  }

  const categories = post._embedded?.["wp:term"]?.[0] || [];
  const primaryCategory = categories[0];
  const primaryCategorySlug = slugifyCategory(primaryCategory);
  const share = buildShareLinks(
    post.link || `${SITE_BASE || ""}/posts/${slug}`,
    decodeEntities(stripHtml(post.title.rendered)),
  );
  const comments = await getComments(post.id);

  const commentTree = comments.reduce<Record<number, WPComment[]>>(
    (tree, comment) => {
      const parentId = comment.parent || 0;
      if (!tree[parentId]) tree[parentId] = [];
      tree[parentId].push(comment);
      return tree;
    },
    {},
  );

  const renderComments = (parentId = 0, depth = 0): JSX.Element[] => {
    const siblings = commentTree[parentId] || [];
    return siblings.map((comment) => (
      <div
        key={comment.id}
        className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-100"
        style={{ marginLeft: depth * 16 }}
      >
        <div className="flex items-center justify-between text-xs text-emerald-100/80">
          <span className="font-semibold">{decodeEntities(comment.author_name)}</span>
          <span>{formatDate(comment.date)}</span>
        </div>
        <div
          className="prose prose-invert prose-sm mt-2 max-w-none text-slate-100 prose-a:text-emerald-200"
          dangerouslySetInnerHTML={{
            __html: normalizeContent(comment.content.rendered),
          }}
        />
        {renderComments(comment.id, depth + 1)}
      </div>
    ));
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
          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-100 sm:flex">
            <Link className="transition hover:text-emerald-200" href="/">
              Home
            </Link>
            <Link className="transition hover:text-emerald-200" href="/about">
              About
            </Link>
            <Link className="transition hover:text-emerald-200" href="/contact">
              Contact
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 pb-20 pt-8 sm:px-10">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 text-slate-50 shadow-2xl shadow-emerald-900/40">
          <div className="flex flex-col gap-3 px-6 py-8 text-center sm:px-10">
            <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
              {decodeEntities(stripHtml(post.title.rendered))}
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
              {primaryCategory && (
                <>
                  <Link
                    href={`/category/${primaryCategorySlug}`}
                    className="font-semibold transition hover:text-emerald-100"
                  >
                    {decodeEntities(primaryCategory.name)}
                  </Link>
                  <span className="text-emerald-300/80">›</span>
                </>
              )}
              <span className="text-emerald-100">
                {decodeEntities(stripHtml(post.title.rendered))}
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-emerald-900/30 backdrop-blur sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-emerald-200/80">
              <span>{formatDate(post.date)}</span>
              {categories.slice(0, 3).map(
                (category, index) =>
                  category?.name && (
                    <span
                      key={`${post.id}-${index}-${category.name}`}
                      className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-100"
                    >
                      {decodeEntities(category.name)}
                    </span>
                  ),
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-emerald-200">
              <span className="text-xs uppercase tracking-[0.16em] text-emerald-200/80">
                Share
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={share.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-emerald-200 transition hover:bg-emerald-300 hover:text-emerald-900"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                    <path d="M22 5.8c-.7.3-1.4.5-2.1.6a3.5 3.5 0 0 0-6.1 2.4c0 .3 0 .6.1.8-3-.1-5.7-1.6-7.5-3.9a3.5 3.5 0 0 0 .5 4.6c-.6 0-1.1-.2-1.6-.4v.1c0 1.7 1.2 3.1 2.8 3.4-.3.1-.6.1-.9.1-.2 0-.4 0-.6-.1.4 1.3 1.7 2.3 3.2 2.3A7 7 0 0 1 2 18.1a9.8 9.8 0 0 0 5.3 1.5c6.3 0 9.8-5.2 9.8-9.8v-.4c.7-.5 1.3-1.1 1.8-1.8Z" />
                  </svg>
                </a>
                <a
                  href={share.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-emerald-200 transition hover:bg-emerald-300 hover:text-emerald-900"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                    <path d="M13.5 9H15V7h-1.5C11.6 7 11 8.1 11 9.7V11H9v2h2v6h2v-6h1.7l.3-2H13v-1c0-.6.2-1 .5-1Z" />
                  </svg>
                </a>
                <a
                  href={share.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-emerald-200 transition hover:bg-emerald-300 hover:text-emerald-900"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                    <path d="M6.94 6.5a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0ZM4 8.75h3.06V20H4V8.75Zm6.05 0H13v1.61h.05c.41-.77 1.41-1.58 2.9-1.58 3.1 0 3.68 2.02 3.68 4.64V20h-3.06v-5.62c0-1.34-.03-3.07-1.87-3.07-1.87 0-2.16 1.46-2.16 2.97V20H10V8.75Z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <h2 className="mt-4 text-2xl font-semibold leading-tight text-white sm:text-3xl">
            {decodeEntities(stripHtml(post.title.rendered))}
          </h2>
          <article className="post-content mt-10 space-y-6 text-slate-200 leading-relaxed">
            <div
              dangerouslySetInnerHTML={{
                __html: normalizeContent(post.content?.rendered ?? ""),
              }}
            />
          </article>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-emerald-900/30 backdrop-blur sm:p-10">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold uppercase tracking-[0.18em] text-emerald-200">
              Comments ({comments.length})
            </h3>
            {comments.length === 0 ? (
              <p className="text-sm text-slate-300/80">No comments yet.</p>
            ) : (
              <div className="space-y-3">{renderComments()}</div>
            )}
            {
              API_BASE && (
                <div className="mt-6 border-t border-white/10 pt-6">
                  <CommentForm postId={post.id} apiBase={API_BASE} />
                </div>
              )
            }
          </div>
        </section>
      </main>
    </div>
  );
}

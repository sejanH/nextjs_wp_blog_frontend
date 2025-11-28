"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navbar } from "./Navbar";
import { WPPost } from "../types/wp";

type Props = {
  initialPosts: WPPost[];
  initialTotalPages: number;
  apiBase: string;
  siteBase?: string | null;
  categoryId?: number;
  categoryName?: string;
};

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function getImage(post: WPPost) {
  const image = post._embedded?.["wp:featuredmedia"]?.[0];
  return image?.source_url
    ? { src: image.source_url, alt: image.alt_text || post.title.rendered }
    : null;
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

function plainText(html: string) {
  return decodeEntities(stripHtml(html));
}

function getCommentCount(post: WPPost) {
  const replies = post._embedded?.replies?.[0];
  return Array.isArray(replies) ? replies.length : undefined;
}

function getCategoryHref(category: { slug?: string; name?: string }) {
  const slug =
    category.slug ||
    (category.name
      ? category.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      : "");
  return `/category/${slug}`;
}

export function BlogClient({
  initialPosts,
  initialTotalPages,
  apiBase,
  categoryId
}: Props) {
  const [posts, setPosts] = useState<WPPost[]>(initialPosts);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const hasMore = useMemo(() => page < totalPages, [page, totalPages]);

  const fetchPage = useCallback(
    async (pageToFetch: number, searchTerm: string, replace = false) => {
      setLoading(true);
      setError(null);
      try {
        const url = new URL(`${apiBase}/posts`);
        url.searchParams.set("_embed", "");
        url.searchParams.set("per_page", "6");
        url.searchParams.set("page", String(pageToFetch));
        if (categoryId) {
          url.searchParams.set("categories", String(categoryId));
        }
        if (searchTerm) {
          url.searchParams.set("search", searchTerm);
        }

        const res = await fetch(url.toString());
        if (!res.ok) {
          throw new Error("Unable to reach WordPress. Check the API URL.");
        }

        const nextPosts: WPPost[] = await res.json();
        const nextTotal = Number(res.headers.get("X-WP-TotalPages") ?? "1");

        setTotalPages(nextTotal);
        setPage(pageToFetch);
        setPosts((prev) => (replace ? nextPosts : [...prev, ...nextPosts]));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading posts.",
        );
      } finally {
        setLoading(false);
      }
    },
    [apiBase, categoryId],
  );

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await fetchPage(1, query, true);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !loading) {
          fetchPage(page + 1, query);
        }
      },
      { rootMargin: "300px 0px 300px 0px" },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [fetchPage, hasMore, loading, page, query]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-950 to-slate-950 text-slate-50">
      {loading && (
        <div className="fixed inset-x-0 top-0 z-30 h-1 bg-emerald-400">
          <div className="h-full w-full animate-pulse bg-emerald-200" />
        </div>
      )}
      <Navbar
        links={[
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
          { label: "Contact", href: "/contact" },
        ]}
        rightSlot={
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5"
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search posts"
              className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-emerald-300 px-3 py-1 text-xs font-semibold text-slate-900 transition hover:bg-emerald-200"
            >
              Go
            </button>
          </form>
        }
      />

      <main className="mx-auto flex max-w-6xl flex-col gap-12 px-6 pb-8 pt-6 sm:px-10">
        <section className="columns-1 gap-6 sm:columns-2 xl:columns-3">
          {error && (
            <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-6 text-red-50">
              <p className="text-base font-semibold">Connection issue</p>
              <p className="mt-2 text-sm opacity-90">{error}</p>
              <p className="mt-3 text-xs opacity-70">
                Confirm your API URL and that your WordPress instance allows
                REST access.
              </p>
            </div>
          )}

          {!error && posts.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-100">
              <p className="text-base font-semibold">No posts yet</p>
              <p className="mt-2 text-sm opacity-80">
                Publish your first article in WordPress — it will appear here as
                soon as it is live.
              </p>
            </div>
          )}

          {!error &&
            posts.map((post) => {
              const image = getImage(post);
              const categories = post._embedded?.["wp:term"]?.[0] || [];
              const comments = getCommentCount(post);

              return (
                <article
                  key={post.id}
                  className="group mb-6 break-inside-avoid overflow-hidden rounded-2xl border border-emerald-200/50 bg-white text-slate-900 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image.src}
                        alt={stripHtml(image.alt)}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm uppercase tracking-[0.2em] text-emerald-600">
                        WordPress Post
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <Link href={`/posts/${post.slug}`}>
                      <h2 className="text-xl font-semibold leading-snug text-emerald-700 transition group-hover:text-emerald-600">
                        {plainText(post.title.rendered)}
                      </h2>
                    </Link>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-emerald-700">
                      {categories[0]?.name && (
                        <Link
                          className="inline-flex items-center gap-2 hover:text-emerald-800"
                          href={getCategoryHref(categories[0])}
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                          strokeWidth={2}
                          >
                            <path d="M6 4h9l3 3v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
                            <path d="M14 2v4" />
                            <path d="M9 2v4" />
                          </svg>
                          <span className="font-medium underline underline-offset-4">
                            {decodeEntities(categories[0].name)}
                          </span>
                        </Link>
                      )}
                      <span className="hidden text-emerald-600 sm:inline">•</span>
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
                        </svg>
                        {comments !== undefined ? `${comments} Comments` : "Comments"}
                      </span>
                    </div>
                    <p className="line-clamp-3 text-sm leading-relaxed text-slate-700">
                      {plainText(post.excerpt.rendered)}
                    </p>
                    <div className="mt-auto pt-2">
                      <Link
                        href={`/posts/${post.slug}`}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 underline underline-offset-4 transition hover:text-emerald-800"
                      >
                        Continue Reading
                        <span aria-hidden>→</span>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
        </section>

        <div ref={loadMoreRef} className="h-10" aria-hidden />
        {loading && (
          <p className="text-center text-sm text-slate-200/80">Loading…</p>
        )}
      </main>
    </div>
  );
}

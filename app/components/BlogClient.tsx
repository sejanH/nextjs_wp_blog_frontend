"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navbar } from "./Navbar";
import { Hero } from "./Hero";
import { Footer } from "./Footer";
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
    return map[entity] ?? "&" + entity + ";";
  });
}

function getImage(post: WPPost) {
  const image = post._embedded?.["wp:featuredmedia"]?.[0];
  return image
    ? { src: image.source_url || "", alt: image.alt_text || post.title.rendered }
    : null;
}

function getCommentCount(post: WPPost) {
  const replies = post._embedded?.replies?.[0];
  return Array.isArray(replies) ? replies.length : undefined;
}

// getCategoryHref function removed as it's unused

// Loading skeleton component
function PostSkeleton() {
  return (
    <div className="glass-card overflow-hidden rounded-3xl text-white animate-fade-in">
      <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/50 skeleton" />
      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="h-6 skeleton rounded w-3/4" />
        <div className="flex items-center gap-4">
          <div className="h-4 skeleton rounded w-20" />
          <div className="h-4 skeleton rounded w-16" />
        </div>
        <div className="space-y-2">
          <div className="h-3 skeleton rounded" />
          <div className="h-3 skeleton rounded" />
          <div className="h-3 skeleton rounded w-4/5" />
        </div>
        <div className="h-8 skeleton rounded-full w-24 mt-2" />
      </div>
    </div>
  );
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
      { rootMargin: "300px 0px" },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [fetchPage, hasMore, loading, page, query]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950/50 to-slate-950 text-slate-50">
      {/* Background animated gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl animate-pulse-slow" />
      </div>

      {loading && (
        <div className="fixed inset-x-0 top-0 z-50 h-1 bg-gradient-to-r from-emerald-400 to-purple-400" role="progressbar" aria-label="Loading">
          <div className="h-full w-full animate-pulse bg-gradient-to-r from-emerald-200 to-purple-200" />
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
            className="flex items-center gap-2 rounded-full glass px-4 py-2 transition-all duration-300 focus-within:border-emerald-400/50 focus-within:bg-white/10"
            role="search"
          >
            <label htmlFor="search-input" className="sr-only">Search posts</label>
            <svg
              className="h-4 w-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search posts..."
              className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none transition-all duration-300"
              autoComplete="off"
              spellCheck="false"
            />
            <button
              type="submit"
              className="rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 px-3 py-1 text-xs font-semibold text-slate-900 transition-all duration-300 hover:from-emerald-300 hover:to-emerald-400 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25 focus-ring"
              aria-label="Search"
            >
              Search
            </button>
          </form>
        }
      />

      <main id="main-content" className="relative z-10">
        {/* Show hero section only on homepage without category filter */}
        {!categoryId && posts.length > 0 && <Hero />}

        <div className={`container-responsive ${!categoryId ? 'animate-fade-in' : 'pb-8 pt-6'}`}>
          <section id="posts" className={`masonry-grid ${!categoryId ? 'mt-12' : ''}`} aria-label="Blog posts">
            {error && (
              <div className="glass-card rounded-3xl p-8 text-red-300 animate-slide-up" role="alert">
                <div className="flex items-start gap-4">
                  <svg
                    className="h-6 w-6 text-red-400 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-lg font-semibold text-red-200">Connection issue</p>
                    <p className="mt-2 text-sm opacity-90">{error}</p>
                    <p className="mt-3 text-xs opacity-70">
                      Confirm your API URL and that your WordPress instance allows REST access.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!error && posts.length === 0 && (
              <div className="glass-card rounded-3xl p-8 text-slate-300 animate-slide-up text-center">
                <svg
                  className="h-16 w-16 text-slate-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-xl font-semibold mb-2">No posts yet</p>
                <p className="text-sm opacity-80">
                  Publish your first article in WordPress — it will appear here as soon as it is live.
                </p>
              </div>
            )}

            {!error &&
              posts.map((post, index) => {
                const image = getImage(post);
                const categories = post._embedded?.["wp:term"]?.[0] || [];
                const comments = getCommentCount(post);

                return (
                  <article
                    key={post.id}
                    className="group glass-card overflow-hidden rounded-3xl text-white hover-lift-enhanced stagger-item transition-all duration-500"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Image with overlay gradient */}
                    <div className="relative h-48 w-full overflow-hidden">
                      {image ? (
                        <>
                          <Image
                            src={image.src}
                            alt={stripHtml(image.alt)}
                            width={400}
                            height={192}
                            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                            priority={index < 6}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-500/20 to-purple-500/20 text-sm uppercase tracking-[0.2em] text-emerald-300" aria-hidden="true">
                          WordPress Post
                        </div>
                      )}
                      {/* Category badge overlay */}
                      {categories[0]?.name && (
                        <div className="absolute top-4 left-4">
                          <span className="rounded-full glass px-3 py-1 text-xs font-medium text-emerald-300 backdrop-blur-sm">
                            {decodeEntities(categories[0].name)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col gap-4 p-6">
                      <Link href={`/posts/${post.slug}`} className="focus-ring rounded">
                        <h2 className="text-xl font-bold leading-tight text-white transition-all duration-300 group-hover:text-gradient md:text-2xl">
                          {stripHtml(post.title.rendered)}
                        </h2>
                      </Link>

                      {/* Meta information */}
                      <div className="flex items-center gap-4 text-sm text-slate-300">
                        <span className="inline-flex items-center gap-1.5">
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            className="h-4 w-4 text-emerald-400"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(post.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        {comments !== undefined && (
                          <span className="inline-flex items-center gap-1.5">
                            <svg
                              aria-hidden="true"
                              viewBox="0 0 24 24"
                              className="h-4 w-4 text-emerald-400"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
                            </svg>
                            {comments}
                          </span>
                        )}
                      </div>

                      <p className="line-clamp-3 text-sm leading-relaxed text-slate-300">
                        {stripHtml(post.excerpt.rendered)}
                      </p>

                      <div className="mt-auto pt-2">
                        <Link
                          href={`/posts/${post.slug}`}
                          className="group/btn inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 px-4 py-2 text-sm font-semibold text-emerald-300 backdrop-blur-sm transition-all duration-300 hover:from-emerald-500/30 hover:to-emerald-600/30 hover:scale-105 focus-ring"
                          aria-label={`Read more about ${stripHtml(post.title.rendered)}`}
                        >
                          Read More
                          <svg
                            className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })
            }
          </section>
          <div ref={loadMoreRef} className="h-10" aria-hidden />
          {loading && posts.length > 0 && (
            <div className="grid-responsive">
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </div>
          )}
          {loading && posts.length === 0 && (
            <div className="flex justify-center py-12" aria-live="polite">
              <div className="glass rounded-full px-6 py-3 flex items-center gap-3 text-sm text-slate-200">
                <div className="h-5 w-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
                <span>Loading posts…</span>
              </div>
            </div>
          )}
        </div>

        <Footer />
      </main>
    </div>
  );
}

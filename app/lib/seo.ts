import type { Metadata } from "next";

type YoastImage = {
  url?: string;
  width?: number;
  height?: number;
  type?: string;
  alt?: string;
};

type YoastHeadJSON = {
  title?: string;
  description?: string;
  canonical?: string;
  og_title?: string;
  og_description?: string;
  og_url?: string;
  og_site_name?: string;
  og_image?: YoastImage[];
  twitter_card?: "summary" | "summary_large_image" | "player" | "app" | string;
  author?: string;
  published_time?: string;
  modified_time?: string;
};

type FallbackMeta = {
  title: string;
  description?: string;
  url?: string;
  image?: string;
  siteName?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  type?: "website" | "article";
};

// Structured data for SEO
export function generateJsonLd(data: Record<string, unknown>) {
  return {
    __html: JSON.stringify({
      "@context": "https://schema.org",
      ...data,
    }),
  };
}

// Generate article structured data
export function generateArticleJsonLd({
  title,
  description,
  url,
  imageUrl,
  author,
  publishedTime,
  modifiedTime,
}: {
  title: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}) {
  return generateJsonLd({
    "@type": "Article",
    headline: title,
    description,
    url,
    image: imageUrl ? [imageUrl] : undefined,
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    author: author ? { "@type": "Person", name: author } : undefined,
    publisher: {
      "@type": "Organization",
      name: "Sejan.xyz",
      logo: {
        "@type": "ImageObject",
        url: "/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  });
}

// Generate blog structured data
export function generateBlogJsonLd(url?: string) {
  return generateJsonLd({
    "@type": "Blog",
    url,
    name: "Sejan.xyz Blog",
    description: "WordPress-powered blog",
    publisher: {
      "@type": "Organization",
      name: "Sejan.xyz",
      logo: {
        "@type": "ImageObject",
        url: "/logo.png",
      },
    },
  });
}

// Generate breadcrumb structured data
export function generateBreadcrumbJsonLd(breadcrumbs: Array<{ name: string; url: string }>) {
  return generateJsonLd({
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  });
}

export function buildMetadataFromYoast(
  yoast: YoastHeadJSON | undefined,
  fallback: FallbackMeta,
): Metadata {
  const title = yoast?.title || fallback.title;
  const description = yoast?.description || fallback.description;
  const canonical = yoast?.canonical || fallback.url;
  const ogImage =
    yoast?.og_image?.map((img) => ({
      url: img.url || "",
      width: img.width,
      height: img.height,
      type: img.type,
      alt: img.alt,
    })) || (fallback.image ? [{ url: fallback.image }] : undefined);

  const type = fallback.type || "website";
  const isArticle = type === "article";

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      type,
      title: yoast?.og_title || title,
      description: yoast?.og_description || description,
      url: yoast?.og_url || canonical,
      siteName: yoast?.og_site_name || fallback.siteName || fallback.title,
      images: ogImage,
      ...(isArticle && {
        publishedTime: yoast?.published_time || fallback.publishedTime,
        modifiedTime: yoast?.modified_time || fallback.modifiedTime,
        authors: yoast?.author || fallback.author ? [yoast?.author || fallback.author!] : undefined,
      }),
    },
    twitter: (() => {
      const allowed: Array<"summary" | "summary_large_image" | "player" | "app"> = [
        "summary",
        "summary_large_image",
        "player",
        "app",
      ];
      const cardRaw = yoast?.twitter_card;
      const card = allowed.includes(cardRaw as (typeof allowed)[number])
        ? (cardRaw as (typeof allowed)[number])
        : ogImage
          ? "summary_large_image"
          : "summary";

      return {
        card,
        title,
        description,
        images: ogImage?.map((img) => img.url),
        ...(isArticle && {
          creator: yoast?.author || fallback.author,
        }),
      };
    })(),
    ...(isArticle && {
      authors: [{ name: yoast?.author || fallback.author || "Sejan" }],
      publishedTime: yoast?.published_time || fallback.publishedTime,
      modifiedTime: yoast?.modified_time || fallback.modifiedTime,
    }),
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
  };
}

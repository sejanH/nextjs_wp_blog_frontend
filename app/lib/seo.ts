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
  twitter_card?: string;
};

type FallbackMeta = {
  title: string;
  description?: string;
  url?: string;
  image?: string;
  siteName?: string;
};

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

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title: yoast?.og_title || title,
      description: yoast?.og_description || description,
      url: yoast?.og_url || canonical,
      siteName: yoast?.og_site_name || fallback.siteName || fallback.title,
      images: ogImage,
    },
    twitter: {
      card: yoast?.twitter_card || (ogImage ? "summary_large_image" : "summary"),
      title,
      description,
      images: ogImage?.map((img) => img.url),
    },
  };
}

export type WPPost = {
  id: number;
  slug: string;
  date: string;
  link?: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content?: { rendered: string };
  yoast_head?: string;
  yoast_head_json?: any;
  _embedded?: {
    "wp:featuredmedia"?: Array<{ source_url?: string; alt_text?: string }>;
    "wp:term"?: Array<Array<{ name?: string; slug?: string }>>;
    replies?: Array<unknown>;
  };
};

export type WPCategory = {
  id: number;
  name?: string | undefined;
  slug: string;
  description?: string;
};

export type WPComment = {
  id: number;
  parent: number;
  post: number;
  date: string;
  author_name: string;
  author_email?: string;
  content: { rendered: string };
};

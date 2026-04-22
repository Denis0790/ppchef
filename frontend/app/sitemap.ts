import { MetadataRoute } from "next";

const API_URL = process.env.INTERNAL_API_URL || "http://backend:8000/api/v1";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://ppchef.ru";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/subscription`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  const categoryPages: MetadataRoute.Sitemap = [
    "breakfast", "lunch", "dinner", "snack", "dessert", "soup", "salad", "smoothie"
  ].map(cat => ({
    url: `${baseUrl}/search?category=${cat}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  try {
    const allItems: { id: string; created_at: string }[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const res = await fetch(`${API_URL}/recipes?page=${page}&page_size=100`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      allItems.push(...data.items);
      hasMore = page < data.pages;
      page++;
    }

    const recipePages: MetadataRoute.Sitemap = allItems.map(r => ({
      url: `${baseUrl}/recipes/${r.id}`,
      lastModified: new Date(r.created_at),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    }));

    return [...staticPages, ...categoryPages, ...recipePages];
  } catch (e) {
    console.error("sitemap error:", e);
    return [...staticPages, ...categoryPages];
  }
}
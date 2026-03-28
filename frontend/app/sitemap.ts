import { MetadataRoute } from "next";

const API_URL = process.env.INTERNAL_API_URL || "http://backend:8000/api/v1";

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
    const res = await fetch(`${API_URL}/recipes?page_size=1000`);
    const data = await res.json();
    const recipePages: MetadataRoute.Sitemap = data.items.map((r: { id: string; created_at: string }) => ({
      url: `${baseUrl}/recipes/${r.id}`,
      lastModified: new Date(r.created_at),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    }));
    return [...staticPages, ...categoryPages, ...recipePages];
  } catch {
    return [...staticPages, ...categoryPages];
  }
}
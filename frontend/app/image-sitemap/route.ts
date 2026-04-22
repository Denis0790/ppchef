import { NextResponse } from "next/server";

const API_URL = process.env.INTERNAL_API_URL || "http://backend:8000/api/v1";

export async function GET() {
  const baseUrl = "https://ppchef.ru";

  console.log("image-sitemap: API_URL =", API_URL);

  try {
    const res = await fetch(`${API_URL}/recipes?page_size=1000`, {
      cache: "no-store",
    });
    console.log("image-sitemap: response status =", res.status);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log("image-sitemap: recipes count =", data.items?.length);

    const urls = data.items
      .filter((r: { id: string; image_url?: string; title: string }) => r.image_url)
      .map((r: { id: string; image_url: string; title: string }) => `
  <url>
    <loc>${baseUrl}/recipes/${r.id}</loc>
    <image:image>
      <image:loc>${r.image_url}</image:loc>
      <image:title>${r.title.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</image:title>
    </image:image>
  </url>`).join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`;

    return new NextResponse(xml, {
      headers: { "Content-Type": "application/xml" },
    });
  } catch (e) {
    console.error("image-sitemap error:", e);
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
</urlset>`, {
      headers: { "Content-Type": "application/xml" },
    });
  }
}
import { NextResponse } from "next/server";

const API_URL = process.env.INTERNAL_API_URL || "http://backend:8000/api/v1";

export async function GET() {
  const baseUrl = "https://ppchef.ru";

  try {
    const res = await fetch(`${API_URL}/recipes?page_size=1000`, {
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();

    const items = data.items.map((r: {
      id: string; title: string; image_url?: string;
      description?: string; created_at: string;
    }) => `
      <item turbo="true">
        <link>${baseUrl}/recipes/${r.id}</link>
        <turbo:content>
          <![CDATA[
            <h1>${r.title}</h1>
            ${r.image_url ? `<img src="${r.image_url}" />` : ""}
            <p>${r.description || ""}</p>
          ]]>
        </turbo:content>
        <pubDate>${new Date(r.created_at).toUTCString()}</pubDate>
        <title>${r.title.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</title>
      </item>`).join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:turbo="http://turbo.yandex.ru" version="2.0">
  <channel>
    <title>ПП Шеф — рецепты правильного питания</title>
    <link>${baseUrl}</link>
    <description>Полезные рецепты с расчётом КБЖУ</description>
    <language>ru</language>
    ${items}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: { "Content-Type": "application/xml" },
    });
  } catch {
    return new NextResponse("Error", { status: 500 });
  }
}
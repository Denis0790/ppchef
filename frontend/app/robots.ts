import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/kitchen-secret/", "/profile/", "/favorites/", "/auth/"],
    },
    sitemap: "https://ppchef.ru/sitemap.xml",
  };
}
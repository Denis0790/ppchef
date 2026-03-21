import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: {
    default: "ПП Шеф — рецепты правильного питания",
    template: "%s | ПП Шеф",
  },
  description: "Вкусные и полезные рецепты правильного питания. Считаем КБЖУ, подбираем рецепты по ингредиентам, помогаем питаться правильно.",
  keywords: ["правильное питание", "пп рецепты", "здоровое питание", "КБЖУ", "диетические рецепты", "пп шеф"],
  authors: [{ name: "ПП Шеф" }],
  creator: "ПП Шеф",
  metadataBase: new URL("https://ppchef.ru"),
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://ppchef.ru",
    siteName: "ПП Шеф",
    title: "ПП Шеф — рецепты правильного питания",
    description: "Вкусные и полезные рецепты для здорового образа жизни. КБЖУ, поиск по ингредиентам, стоп-слова.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "ПП Шеф" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ПП Шеф — рецепты правильного питания",
    description: "Вкусные и полезные рецепты для здорового образа жизни",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
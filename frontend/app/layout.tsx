import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import BottomNavWrapper from "@/components/BottomNavWrapper";
import CookieBanner from "@/components/CookieBanner";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import IOSInstallBanner from "@/components/IOSInstallBanner";

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
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-180.png", sizes: "180x180", type: "image/png" },
    ],
  },
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
      <head>
        <link rel="apple-touch-icon" href="/icon-180.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ПП Шеф" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="google-site-verification" content="A5zI8khOj5S8wpVDHRu2gPfBZ4dxQKedQoKbUBV-g3o" />
        <meta name="verify-admitad" content="8d9cecedfc" />
      </head>
      <body>
        <AuthProvider>
          <ServiceWorkerRegister />
          <IOSInstallBanner />
          {children}
          <BottomNavWrapper />
          <CookieBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
import type { Metadata } from "next";
import "./globals.css";
import { Cormorant_Garamond, DM_Sans, Unbounded } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import BottomNavWrapper from "@/components/BottomNavWrapper";
import CookieBanner from "@/components/CookieBanner";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import IOSInstallBanner from "@/components/IOSInstallBanner";
import OfflineBanner from "@/components/OfflineBanner";
import RefCodeSaver from "@/components/RefCodeSaver";
import { Suspense } from "react";
import Script from "next/script";

const cormorant = Cormorant_Garamond({
  subsets: ["cyrillic"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const unbounded = Unbounded({
  subsets: ["cyrillic"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ПП Шеф — рецепты правильного питания",
    template: "%s | ПП Шеф",
  },
  description: "Вкусные и полезные рецепты правильного питания. Считаем КБЖУ, подбираем рецепты по ингредиентам, помогаем питаться правильно.",
  keywords: [
    "правильное питание", "пп рецепты", "здоровое питание", "КБЖУ",
    "диетические рецепты", "пп шеф", "рецепты с калориями",
    "рецепты для похудения", "низкокалорийные блюда", "белковые блюда",
    "пп завтрак", "пп обед", "пп ужин",
    "правильное питание меню на неделю", "рецепты без сахара", "диетические блюда",
  ],
  authors: [{ name: "ПП Шеф" }],
  creator: "ПП Шеф",
  metadataBase: new URL("https://ppchef.ru"),
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-180.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website", locale: "ru_RU",
    url: "https://ppchef.ru", siteName: "ПП Шеф",
    title: "ПП Шеф — рецепты правильного питания",
    description: "Вкусные и полезные рецепты для здорового образа жизни. КБЖУ, поиск по ингредиентам, стоп-слова.",
    images: [{ url: "/icon-512.png", width: 1200, height: 630, alt: "ПП Шеф" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ПП Шеф — рецепты правильного питания",
    description: "Вкусные и полезные рецепты для здорового образа жизни",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true },
  },
  verification: {
    google: "A5zI8khOj5S8wpVDHRu2gPfBZ4dxQKedQoKbUBV-g3o",
    yandex: "8e476522b94846ba",
    other: { "verify-admitad": "8d9cecedfc" },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${cormorant.className} ${dmSans.className} ${unbounded.className}`}>
      <head>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="apple-touch-icon" href="/icon-180.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ПП Шеф" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <AuthProvider>
          <Suspense fallback={null}>
            <RefCodeSaver />
          </Suspense>
          <OfflineBanner />
          <IOSInstallBanner />
          {children}
          <BottomNavWrapper />
          <CookieBanner />
        </AuthProvider>

        {/* ── ЯНДЕКС МЕТРИКА ── */}
        <Script id="yandex-metrika" strategy="afterInteractive">
          {`
            (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for (var j = 0; j < document.scripts.length; j++) {
              if (document.scripts[j].src === r) { k=document.scripts[j]; break; }
            }
            k=k||e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
            (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
            ym(108497387, "init", {
              clickmap: true,
              trackLinks: true,
              accurateTrackBounce: true,
              webvisor: true
            });
          `}
        </Script>
        <noscript>
          <div>
            <img
              src="https://mc.yandex.ru/watch/108497387"
              style={{ position: "absolute", left: "-9999px" }}
              alt=""
            />
          </div>
        </noscript>

      </body>
    </html>
  );
}
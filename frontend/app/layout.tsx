import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import BottomNavWrapper from "@/components/BottomNavWrapper";
import CookieBanner from "@/components/CookieBanner";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import IOSInstallBanner from "@/components/IOSInstallBanner";
import OfflineBanner from "@/components/OfflineBanner";
import SplashHider from "@/components/SplashHider";

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
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "ПП Шеф" }],
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
    <html lang="ru">
      <head>
        <link rel="apple-touch-icon" href="/icon-180.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ПП Шеф" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        {/* ── Сплэш — показывается ДО загрузки React ── */}
        <div id="splash-screen" style={{
          position: "fixed", inset: 0, zIndex: 99999,
          background: "#013125",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 32,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="ПП Шеф" style={{ width: 200, height: "auto" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <span id="d1" style={{ width: 8, height: 8, borderRadius: "50%", background: "#A6ED49", display: "block" }} />
            <span id="d2" style={{ width: 8, height: 8, borderRadius: "50%", background: "#A6ED49", display: "block" }} />
            <span id="d3" style={{ width: 8, height: 8, borderRadius: "50%", background: "#A6ED49", display: "block" }} />
          </div>
        </div>

        <style>{`
          @keyframes splashBlink {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 1; }
          }
          @keyframes splashPop {
            from { opacity: 0; transform: scale(0.8); }
            to { opacity: 1; transform: scale(1); }
          }
          #splash-screen img {
            animation: splashPop 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards;
          }
          #d1 { animation: splashBlink 1s ease 0s infinite; opacity: 0.2; }
          #d2 { animation: splashBlink 1s ease 0.2s infinite; opacity: 0.2; }
          #d3 { animation: splashBlink 1s ease 0.4s infinite; opacity: 0.2; }
          #splash-screen.hidden {
            opacity: 0;
            transition: opacity 0.4s ease;
            pointer-events: none;
          }
        `}</style>

        <AuthProvider>
          <SplashHider />
          <OfflineBanner />
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
"use client";

import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

const NAV_ITEMS = [
  {
    icon: "🏠",
    svg: "/icons/house_white.svg",
    svgActive: "/icons/house_green.svg",
    label: "Главная",
    href: "/",
  },
  {
    icon: "🔍",
    svg: "/icons/search_white.svg",
    svgActive: "/icons/search_green.svg",
    label: "Поиск",
    href: "/search",
  },
  {
    icon: "❤️",
    svg: "/icons/heart_white.svg",
    svgActive: "/icons/heart_green.svg",
    label: "Избранное",
    href: "/favorites",
  },
  {
    icon: "📊",
    svg: "/icons/kbju_white.svg",
    svgActive: "/icons/kbju_green.svg",
    label: "КБЖУ",
    href: "/kbju",
  },
];

// Переключи на true когда придёт нужный шрифт от дизайнера
const CUSTOM_FONT_READY = false;

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 480,
        background: "#01311C",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        height: 80,
        paddingBottom: "env(safe-area-inset-bottom)",
        zIndex: 20,
      }}
    >
      {NAV_ITEMS.map(({ icon, svg, svgActive, label, href }) => {
        const active = isActive(href);

        return (
          <div
            key={label}
            onClick={() => router.push(href)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              cursor: "pointer",
              position: "relative",
              minWidth: 56,
              height: "100%",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {/* Индикатор сверху */}
            <div
              style={{
                position: "absolute",
                top: 0,
                width: active ? 62 : 0,
                height: 2,
                borderRadius: "0 0 2px 2px",
                background: "#A6ED49",
                transition: "width 0.25s ease",
              }}
            />

            {/* Иконка */}
            <Image
              src={active ? svgActive : svg}
              alt={label}
              width={28}
              height={28}
              style={{
                transition: "transform 0.2s ease",
                transform: active ? "scale(1.05)" : "scale(1)",
              }}
            />

            {/* Подпись */}
            <div
              style={{
                fontSize: 10,
                lineHeight: 1.4,
                color: active ? "#A6ED49" : "#666",
                fontWeight: 400,
                letterSpacing: "0.3px",
                transition: "color 0.2s ease",
                whiteSpace: "nowrap",
                fontFamily: CUSTOM_FONT_READY
                  ? "'Satoshi', 'DM Sans', sans-serif"
                  : "'DM Sans', sans-serif",
                fontStyle: "italic",
              }}
            >
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
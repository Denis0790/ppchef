"use client";
import { useState, useEffect } from "react";
import { matchPartnerProducts, getKitchenProducts, PartnerMatch } from "@/lib/api";

// Статичные партнёры доставки продуктов — заменишь на реальные Адмитад ссылки после деплоя
const DELIVERY_PARTNERS = [
  {
    name: "Самокат",
    tagline: "Доставка за 15 минут",
    emoji: "🛵",
    color: "#FF6B35",
    url: "https://samokat.ru",
  },
  {
    name: "Пятёрочка",
    tagline: "Доставка от 39 ₽",
    emoji: "🛒",
    color: "#e41e25",
    url: "https://5ka.ru",
  },
  {
    name: "Яндекс.Маркет",
    tagline: "Продукты с доставкой",
    emoji: "🟡",
    color: "#FFCC00",
    url: "https://market.yandex.ru",
  },
  {
    name: "Магнит",
    tagline: "Свежие продукты домой",
    emoji: "🧲",
    color: "#d4002a",
    url: "https://magnit.ru",
  },
  {
    name: "ВкусВилл",
    tagline: "Здоровые продукты",
    emoji: "🌿",
    color: "#4F7453",
    url: "https://vkusvill.ru",
  },
];

// Статичные партнёры кухонных товаров
const KITCHEN_PARTNERS = [
  {
    name: "Wildberries",
    tagline: "Посуда и техника",
    emoji: "🍳",
    color: "#a63297",
    url: "https://wildberries.ru",
  },
  {
    name: "Ozon",
    tagline: "Кухонные товары",
    emoji: "🔵",
    color: "#005bff",
    url: "https://ozon.ru",
  },
  {
    name: "Яндекс.Маркет",
    tagline: "Техника для кухни",
    emoji: "🟡",
    color: "#FFCC00",
    url: "https://market.yandex.ru",
  },
];

interface Props {
  ingredients: { name: string }[];
  variant: "delivery" | "kitchen";
  recipeId: string;
}

export default function PartnerBlock({ ingredients, variant, recipeId }: Props) {
  const idx = recipeId.charCodeAt(0) + recipeId.charCodeAt(1);
  const [matches, setMatches] = useState<PartnerMatch[]>([]);
  const [kitchenProducts, setKitchenProducts] = useState<PartnerMatch["product"][]>([]);
  const [deliveryPartner] = useState(DELIVERY_PARTNERS[idx % DELIVERY_PARTNERS.length]);
  const [kitchenPartner] = useState(KITCHEN_PARTNERS[idx % KITCHEN_PARTNERS.length]);

  useEffect(() => {
    if (variant === "delivery" && ingredients.length) {
      const step = Math.floor(Math.random() * 3) + 3;
      const filtered = ingredients.filter((_, i) => i % step === 0);
      if (filtered.length) {
        const query = filtered.map(i => i.name).join(",");
        matchPartnerProducts(query).then(setMatches).catch(() => {});
      }
    }

    if (variant === "kitchen") {
      getKitchenProducts().then(setKitchenProducts).catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Блок доставки продуктов
  if (variant === "delivery") {
    return (
      <div style={{ marginBottom: 16 }}>
        {/* Если есть матчи по ингредиентам — показываем их */}
        {matches.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 10, textTransform: "uppercase" as const, letterSpacing: 0.5 }}>
              🛒 Заказать продукты
            </div>
            {matches.map((m, i) => (
              <a key={i} href={m.product.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block", marginBottom: i < matches.length - 1 ? 8 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#F5F0E8", borderRadius: 12, padding: "10px 14px" }}>
                  {m.product.store_logo_url
                    ? <img src={m.product.store_logo_url} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain" }} />
                    : <div style={{ width: 32, height: 32, borderRadius: 8, background: "#4F7453", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🛍</div>
                  }
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{m.product.title}</div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{m.ingredient} · {m.product.store_name}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#4F7453", fontWeight: 600 }}>→</div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Баннер доставки */}
        {deliveryPartner && (
          <a href={deliveryPartner.url} target="_blank" rel="noopener noreferrer sponsored" style={{ textDecoration: "none", display: "block" }}>
            <div style={{
              background: "#fff", borderRadius: 16, padding: "14px 16px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              display: "flex", alignItems: "center", gap: 14,
              border: `1.5px solid ${deliveryPartner.color}20`,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: `${deliveryPartner.color}15`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22,
              }}>
                {deliveryPartner.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>
                  {deliveryPartner.name}
                </div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                  {deliveryPartner.tagline}
                </div>
              </div>
              <div style={{
                background: deliveryPartner.color, color: "#fff",
                borderRadius: 10, padding: "6px 12px",
                fontSize: 12, fontWeight: 600, flexShrink: 0,
              }}>
                Заказать
              </div>
            </div>
          </a>
        )}
      </div>
    );
  }

  // Блок кухонных товаров
  if (variant === "kitchen") {
    return (
      <div style={{ marginBottom: 16 }}>
        {/* Если есть товары из БД — показываем */}
        {kitchenProducts.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 10, textTransform: "uppercase" as const, letterSpacing: 0.5 }}>
              🍳 Для приготовления
            </div>
            {kitchenProducts.map((p, i) => (
              <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block", marginBottom: i < kitchenProducts.length - 1 ? 8 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#F5F0E8", borderRadius: 12, padding: "10px 14px" }}>
                  {p.store_logo_url
                    ? <img src={p.store_logo_url} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain" }} />
                    : <div style={{ width: 32, height: 32, borderRadius: 8, background: "#C4975A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🍳</div>
                  }
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{p.store_name}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#C4975A", fontWeight: 600 }}>→</div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Баннер маркетплейса */}
        {kitchenPartner && (
          <a href={kitchenPartner.url} target="_blank" rel="noopener noreferrer sponsored" style={{ textDecoration: "none", display: "block" }}>
            <div style={{
              background: "#fff", borderRadius: 16, padding: "14px 16px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              display: "flex", alignItems: "center", gap: 14,
              border: `1.5px solid ${kitchenPartner.color}20`,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: `${kitchenPartner.color}15`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22,
              }}>
                {kitchenPartner.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>
                  {kitchenPartner.name}
                </div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                  {kitchenPartner.tagline}
                </div>
              </div>
              <div style={{
                background: kitchenPartner.color, color: kitchenPartner.color === "#FFCC00" ? "#333" : "#fff",
                borderRadius: 10, padding: "6px 12px",
                fontSize: 12, fontWeight: 600, flexShrink: 0,
              }}>
                Смотреть
              </div>
            </div>
          </a>
        )}
      </div>
    );
  }

  return null;
}
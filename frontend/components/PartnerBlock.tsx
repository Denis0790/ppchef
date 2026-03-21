"use client";
import { useState, useEffect } from "react";
import { matchPartnerProducts, getKitchenProducts, PartnerMatch } from "@/lib/api";

interface Props {
  ingredients: { name: string }[];
}

export default function PartnerBlock({ ingredients }: Props) {
  const [matches, setMatches] = useState<PartnerMatch[]>([]);
  const [kitchen, setKitchen] = useState<PartnerMatch["product"][]>([]);

  useEffect(() => {
    if (!ingredients.length) return;

    // Показываем каждый 3-5й ингредиент
    const step = Math.floor(Math.random() * 3) + 3;
    const filtered = ingredients.filter((_, i) => i % step === 0);
    if (!filtered.length) return;

    const query = filtered.map(i => i.name).join(",");
    matchPartnerProducts(query).then(setMatches).catch(() => {});
    getKitchenProducts().then(setKitchen).catch(() => {});
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  if (!matches.length && !kitchen.length) return null;

  return (
    <div style={{
      background: "#fff", borderRadius: 16,
      padding: 16, marginBottom: 16,
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    }}>
      {matches.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#888", marginBottom: 12 }}>
            🛒 Купить ингредиенты
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {matches.map((m, i) => (
              <a key={i} href={m.product.url} target="_blank" rel="noopener noreferrer"
                style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: "#F5F0E8", borderRadius: 12, padding: "10px 14px",
                  transition: "opacity 0.2s",
                }}>
                  {m.product.store_logo_url
                    ? <img src={m.product.store_logo_url} alt={m.product.store_name || ""}
                        style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain" }} />
                    : <div style={{ width: 32, height: 32, borderRadius: 8, background: "#4F7453", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🛍</div>
                  }
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{m.product.title}</div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                      {m.ingredient} · {m.product.store_name || "Партнёр"}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#4F7453", fontWeight: 600 }}>Купить →</div>
                </div>
              </a>
            ))}
          </div>
        </>
      )}

      {kitchen.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#888", marginBottom: 12, marginTop: matches.length ? 16 : 0 }}>
            🍳 Для приготовления
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {kitchen.map((p, i) => (
              <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
                style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: "#F5F0E8", borderRadius: 12, padding: "10px 14px",
                }}>
                  {p.store_logo_url
                    ? <img src={p.store_logo_url} alt={p.store_name || ""}
                        style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain" }} />
                    : <div style={{ width: 32, height: 32, borderRadius: 8, background: "#C4975A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🍳</div>
                  }
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{p.store_name || "Партнёр"}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#C4975A", fontWeight: 600 }}>Смотреть →</div>
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
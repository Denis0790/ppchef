"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { addFavorite, removeFavorite, getFavorites } from "@/lib/api";
import { useAuthPrompt } from "@/hooks/useAuthPrompt";

interface Props {
  recipeId: string;
  variant?: "card" | "inline" | "recipe";
}

export default function FavoriteButton({ recipeId, variant = "card" }: Props) {
  const { token, isLoggedIn } = useAuth();
  const { requireAuth, requirePremium, PromptComponent } = useAuthPrompt();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"normal" | "warning">("normal");

  useEffect(() => {
    if (!isLoggedIn || !token) return;
    getFavorites(token).then(favorites => {
      setIsFavorite(favorites.some(r => r.id === recipeId));
    }).catch(() => {});
  }, [isLoggedIn, token, recipeId]);

  function showToast(msg: string, type: "normal" | "warning" = "normal") {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(null), 3000);
  }

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn || !token) {
      requireAuth();
      return;
    }
    setLoading(true);
    try {
      if (isFavorite) {
        await removeFavorite(token, recipeId);
        setIsFavorite(false);
        showToast("Удалено из избранного");
      } else {
        await addFavorite(token, recipeId);
        setIsFavorite(true);
        showToast("Добавлено в избранное");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("Premium") || msg.includes("Лимит") || msg.includes("10")) {
        requirePremium();
      } else if (!isFavorite) {
        setIsFavorite(true);
        showToast("Добавлено в избранное");
      }
    } finally {
      setLoading(false);
    }
  }

  const Toast = toast ? (
    <div style={{
      position: "fixed", bottom: 100,
      left: "50%", transform: "translateX(-50%)",
      background: toastType === "warning" ? "#4F7453" : "rgba(0,0,0,0.75)",
      color: "#F8FFEE", padding: "10px 20px", borderRadius: 20,
      fontSize: 14, fontWeight: 500, zIndex: 100, whiteSpace: "nowrap",
      boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
      fontFamily: "'Montserrat', sans-serif",
    }}>
      {toast}
    </div>
  ) : null;

  if (variant === "recipe") {
    return (
      <>
        {PromptComponent}
        <button
          onClick={toggle}
          disabled={loading}
          style={{
            width: 115, height: 32,
            borderRadius: 100,
            background: isFavorite ? "#01311C" : "#F8FFEE",
            border: "1.1px solid #01311C",
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 6,
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.6 : 1,
            transition: "all 0.2s",
            padding: 0,
            flexShrink: 0,
          }}
        >
          <svg
            width="19" height="19" viewBox="0 0 24 24"
            fill="none"
            stroke={isFavorite ? "#A6ED49" : "#01311C"}
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span style={{
            fontSize: 10, lineHeight: 1,
            color: isFavorite ? "#A6ED49" : "#01311C",
            whiteSpace: "nowrap",
            fontFamily: "'Montserrat', sans-serif",
            fontStyle: "italic",
          }}>
            {isFavorite ? "в избранном" : "в избранное"}
          </span>
        </button>
        {Toast}
      </>
    );
  }

  if (variant === "card") {
    return (
      <>
        {PromptComponent}
        <button
          onClick={toggle}
          disabled={loading}
          style={{
            width: 98, height: 25,
            borderRadius: 100,
            background: isFavorite ? "#01311C" : "#F8FFEE",
            border: "1.1px solid #01311C",
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 4,
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.6 : 1,
            transition: "all 0.2s",
            padding: 0,
            flexShrink: 0,
          }}
        >
          <svg
            width="15" height="15" viewBox="0 0 24 24"
            fill="none"
            stroke={isFavorite ? "#A6ED49" : "#01311C"}
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span style={{
            fontSize: 9, lineHeight: 1,
            color: isFavorite ? "#A6ED49" : "#01311C",
            whiteSpace: "nowrap",
            fontFamily: "'Montserrat', sans-serif",
            fontStyle: "italic",
          }}>
            {isFavorite ? "в избранном" : "в избранное"}
          </span>
        </button>
        {Toast}
      </>
    );
  }

  return (
    <>
      {PromptComponent}
      <button onClick={toggle} disabled={loading} style={{
        background: isFavorite ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.92)",
        border: isFavorite ? "1.5px solid rgba(224,85,85,0.3)" : "1.5px solid rgba(0,0,0,0.08)",
        borderRadius: 12, padding: "7px 11px", fontSize: 18,
        cursor: loading ? "default" : "pointer",
        opacity: loading ? 0.6 : 1,
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        transition: "all 0.2s",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {isFavorite ? "❤️" : "🤍"}
      </button>
      {Toast}
    </>
  );
}
"use client";
import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => {
        const backTo = sessionStorage.getItem("backTo") || "/";
        sessionStorage.removeItem("backTo");
        if (backTo === "/search") {
          sessionStorage.removeItem("isBack");
        } else {
          sessionStorage.setItem("isBack", "1");
        }
        router.push(backTo);
      }}
      style={{
        width: 175, height: 32,
        background: "#013125",
        border: "none",
        borderRadius: 100,
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 8,
        fontSize: 12, fontWeight: 400,
        fontFamily: "'Montserrat', sans-serif",
        fontStyle: "italic",
        color: "#F8FFEE",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      <img src="/icon_auth/back.svg" alt="back" style={{ width: 6, height: 10, objectFit: "contain"}} />
      {/* 🔧 замени /YOUR_BACK_ARROW.svg на свой путь */}
      вернуться к рецептам
    </button>
  );
}
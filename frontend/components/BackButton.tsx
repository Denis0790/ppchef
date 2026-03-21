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
        position: "absolute", top: 16, left: 16,
        background: "rgba(255,255,255,0.9)",
        border: "none",
        borderRadius: 12, padding: "8px 14px",
        fontSize: 13, fontWeight: 600,
        color: "#333", cursor: "pointer",
      }}
    >
      ← Назад
    </button>
  );
}
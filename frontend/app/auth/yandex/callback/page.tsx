"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Suspense } from "react";

function YandexCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("auth_error");

    if (token) {
      setToken(token);
      router.replace("/");
    } else if (error) {
      router.replace("/auth?error=yandex");
    } else {
      router.replace("/auth");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      minHeight: "100vh",
      background: "#013125",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        border: "3px solid rgba(166,237,73,0.2)",
        borderTop: "3px solid #A6ED49",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function YandexCallbackPage() {
  return (
    <Suspense>
      <YandexCallbackContent />
    </Suspense>
  );
}
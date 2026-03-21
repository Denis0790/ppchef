"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function AdminRedirect() {
  const router = useRouter();
  const { isReady, isLoggedIn } = useAuth();

  useEffect(() => {
    if (!isReady) return;
    if (!isLoggedIn) {
      router.push("/");
      return;
    }
    router.push("/kitchen-secret/dashboard");
  }, [isReady, isLoggedIn, router]);

  return (
    <main style={{
      minHeight: "100vh", background: "#1a1a2e",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontFamily: "'DM Sans', sans-serif",
    }}>
      Загрузка...
    </main>
  );
}
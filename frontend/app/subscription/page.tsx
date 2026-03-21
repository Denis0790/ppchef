"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getMe, createPayment } from "@/lib/api";

export default function SubscriptionPage() {
  const router = useRouter();
  const { token, isLoggedIn } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) { router.push("/auth"); return; }
    getMe(token!).then(u => {
      setIsPremium(u.is_premium);
      setExpiresAt(u.subscription_expires_at || null);
      setPlan(u.subscription_plan || null);
    }).finally(() => setLoading(false));
  }, [isLoggedIn, token, router]);

  async function handlePay(selectedPlan: string) {
    if (!token) return;
    setPaying(selectedPlan);
    try {
      const { confirmation_url } = await createPayment(token, selectedPlan);
      window.location.href = confirmation_url;
    } catch {
      alert("Ошибка при создании платежа");
    } finally {
      setPaying(null);
    }
  }

  if (loading) return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa" }}>
      Загрузка...
    </main>
  );

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#F5F0E8", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Шапка */}
      <div style={{ padding: "16px 20px", background: "#fff", borderBottom: "1px solid #ece7de", display: "flex", alignItems: "center", gap: 12 }}>
        <div onClick={() => router.push("/profile")} style={{ width: 36, height: 36, borderRadius: "50%", background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18 }}>←</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: "#4F7453" }}>Подписка</div>
      </div>

      <div style={{ padding: "24px 20px 80px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Текущий статус */}
        {isPremium && expiresAt && (
          <div style={{ background: "linear-gradient(135deg, #4F7453, #7A9E7E)", borderRadius: 16, padding: 20, color: "#fff" }}>
            <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>Активная подписка</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
              ⭐ ПП Шеф Premium
            </div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>
              {plan === "yearly" ? "Годовая" : "Месячная"} · до {new Date(expiresAt).toLocaleDateString("ru")}
            </div>
          </div>
        )}

        {/* Что даёт подписка */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: "#333", marginBottom: 14 }}>
            Что входит в Premium
          </div>
          {[
            "🚫 Стоп-слова — скрывай нежелательные ингредиенты",
            "📊 Расчёт % от суточной нормы в каждом рецепте",
            "❤️ Неограниченное избранное",
            "🔍 Поиск по холодильнику",
          ].map(item => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, fontSize: 14, color: "#555" }}>
              {item}
            </div>
          ))}
        </div>

        {/* Тарифы */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Месячный */}
          <div style={{
            background: "#fff", borderRadius: 16, padding: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            border: "2px solid transparent",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#333" }}>1 месяц</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#4F7453" }}>90 ₽</div>
            </div>
            <div style={{ fontSize: 13, color: "#aaa", marginBottom: 14 }}>3 рубля в день</div>
            <button onClick={() => handlePay("monthly")} disabled={paying !== null} style={{
              width: "100%", height: 46, background: "#4F7453",
              color: "#fff", border: "none", borderRadius: 12,
              fontSize: 15, fontWeight: 600, cursor: "pointer",
            }}>
              {paying === "monthly" ? "Переход к оплате..." : "Оформить"}
            </button>
          </div>

          {/* Годовой */}
          <div style={{
            background: "#fff", borderRadius: 16, padding: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            border: "2px solid #4F7453",
            position: "relative",
          }}>
            <div style={{
              position: "absolute", top: -12, left: 20,
              background: "#4F7453", color: "#fff",
              fontSize: 11, fontWeight: 600,
              padding: "3px 12px", borderRadius: 20,
            }}>
              Выгоднее на 27%
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#333" }}>1 год</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#4F7453" }}>790 ₽</div>
                <div style={{ fontSize: 11, color: "#aaa", textAlign: "right" }}>вместо 1080 ₽</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "#aaa", marginBottom: 14 }}>66 рублей в месяц</div>
            <button onClick={() => handlePay("yearly")} disabled={paying !== null} style={{
              width: "100%", height: 46, background: "#4F7453",
              color: "#fff", border: "none", borderRadius: 12,
              fontSize: 15, fontWeight: 600, cursor: "pointer",
            }}>
              {paying === "yearly" ? "Переход к оплате..." : "Оформить"}
            </button>
          </div>
        </div>

        <div style={{ fontSize: 12, color: "#aaa", textAlign: "center", lineHeight: 1.6 }}>
          Оплата через ЮКассу. Автопродление не подключается. Возврат в течение 24 часов если не понравилось.
        </div>
      </div>
    </main>
  );
}
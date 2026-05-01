"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getMe, createPayment } from "@/lib/api";
import Image from "next/image";
import Header from "@/components/Header";

export default function SubscriptionPage() {
  const router = useRouter();
  const { token, isLoggedIn, isReady } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) return;
    if (!isLoggedIn) { router.push("/auth"); return; }
    getMe(token!).then(u => {
      setIsPremium(u.is_premium);
      setExpiresAt(u.subscription_expires_at || null);
      setPlan(u.subscription_plan || null);
    }).finally(() => setLoading(false));
  }, [isLoggedIn, token, router, isReady]);

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
    <main className="subscription-main" style={{
      maxWidth: 480, margin: "0 auto", minHeight: "100vh",
      background: "#F8FFEE", display: "flex",
      alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        border: "3px solid #A6ED49", borderTop: "3px solid #01311C",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );

  return (
    <main className="subscription-main" style={{
      maxWidth: 480, margin: "0 auto", minHeight: "100vh",
      background: "#F8FFEE", fontFamily: "'Montserrat', sans-serif",
    }}>

      {/* Десктоп хедер */}
      <div className="subscription-desktop-header" style={{ display: "none" }}>
        <Header />
      </div>

      {/* Мобильная шапка */}
      <div className="subscription-mobile-header" style={{
        height: 70, background: "#01311C",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        paddingLeft: 18, paddingRight: 18,
      }}>
        <div
          onClick={() => router.push("/profile")}
          style={{
            width: 172, height: 32, border: "1px solid #A6ED49",
            borderRadius: 20, display: "flex", alignItems: "center",
            justifyContent: "center", gap: 8, cursor: "pointer",
          }}
        >
          <Image src="/icon_profile/left1.svg" alt="" width={8} height={8} style={{ objectFit: "contain", flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontStyle: "italic", fontWeight: 400, fontFamily: "'Montserrat', sans-serif", color: "#F8FFEE" }}>
            вернуться в профиль
          </span>
        </div>

        {isPremium && (
          <div style={{
            height: 32, paddingLeft: 16, paddingRight: 16,
            border: "1px solid #A6ED49", borderRadius: 20,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Image src="/icon_profile/diamond.svg" alt="" width={19} height={19} style={{ objectFit: "contain" }} />
            <span style={{ fontSize: 12, fontStyle: "italic", fontWeight: 400, fontFamily: "'Montserrat', sans-serif", color: "#F8FFEE" }}>
              premium
            </span>
          </div>
        )}
      </div>

      <div className="subscription-content" style={{ padding: "24px 18px 100px", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* ── PREMIUM АКТИВЕН ── */}
        {isPremium && expiresAt && (
          <div style={{ background: "#01311C", border: "1px solid #A6ED49", borderRadius: 16, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Image src="/icon_profile/diamond.svg" alt="" width={19} height={19} style={{ objectFit: "contain" }} />
              <span style={{ fontSize: 16, fontWeight: 500, fontStyle: "italic", fontFamily: "'Montserrat', sans-serif", color: "#A6ED49" }}>
                premium активен
              </span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 400, fontStyle: "normal", fontFamily: "'Montserrat', sans-serif", color: "#F8FFEE", opacity: 0.7 }}>
              {plan === "yearly" ? "годовая" : "месячная"} (до {new Date(expiresAt).toLocaleDateString("ru")})
            </div>
          </div>
        )}

        {/* ── ЧТО ВХОДИТ В PREMIUM ── */}
        <div style={{ border: "1px solid #A6ED49", borderRadius: 16, padding: 16, background: "#F8FFEE", marginTop: 18 }}>
          <div style={{ fontSize: 16, fontWeight: 500, fontStyle: "italic", fontFamily: "'Montserrat', sans-serif", color: "#013125", marginBottom: 16 }}>
            что входит в premium
          </div>
          {[
            { icon: "/icon_profile/stop2.svg", title: "стоп-слова", desc: "скрывай нежелательные ингредиенты" },
            { icon: "/icon_profile/kbju2.svg", title: "расчет нормы в %", desc: "суточная норма блюда в каждом рецепте" },
            { icon: "/icon_profile/like2.svg", title: "неограниченное избранное", desc: "добавляй в избранное без ограничений" },
            { icon: "/icon_profile/search2.svg", title: "холодильник", desc: "поиск по имеющимся продуктам" },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
              <div style={{ flexShrink: 0, marginTop: 2 }}>
                <Image src={icon} alt="" width={20} height={20} style={{ objectFit: "contain" }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 400, fontStyle: "italic", fontFamily: "'Montserrat', sans-serif", color: "#013125", marginBottom: 2 }}>
                  {title}
                </div>
                <div style={{ fontSize: 12, fontWeight: 400, fontStyle: "normal", fontFamily: "'Montserrat', sans-serif", color: "#013125", opacity: 0.7 }}>
                  {desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── ТАРИФ: МЕСЯЦ ── */}
        <div style={{ background: "#01311C", border: "1px solid #A6ED49", borderRadius: 16, padding: 16, marginTop: 18, height: 125 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Image src="/icon_profile/diamond.svg" alt="" width={19} height={19} style={{ objectFit: "contain" }} />
            <span style={{ fontSize: 16, fontWeight: 500, fontStyle: "italic", fontFamily: "'Montserrat', sans-serif", color: "#A6ED49", flex: 1 }}>
              premium 1 месяц
            </span>
            <span style={{ fontSize: 18, fontWeight: 500, fontStyle: "italic", fontFamily: "'Montserrat', sans-serif", color: "#A6ED49" }}>
              90 ₽
            </span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 400, fontStyle: "normal", fontFamily: "'Montserrat', sans-serif", color: "#F8FFEE", opacity: 0.5, marginBottom: 14 }}>
            3 рубля в день
          </div>
          <button
            onClick={() => handlePay("monthly")}
            disabled={paying !== null}
            style={{ width: "100%", height: 40, background: "#A6ED49", color: "#01311C", border: "none", borderRadius: 20, fontSize: 12, fontStyle: "italic", fontFamily: "'Montserrat', sans-serif", cursor: "pointer" }}
          >
            {paying === "monthly" ? "переход к оплате..." : "оформить →"}
          </button>
        </div>

        {/* ── ТАРИФ: ГОД ── */}
        <div style={{ background: "#01311C", border: "1px solid #A6ED49", borderRadius: 16, padding: 16, marginTop: 18, height: 125 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Image src="/icon_profile/diamond.svg" alt="" width={19} height={19} style={{ objectFit: "contain" }} />
            <span style={{ fontSize: 16, fontWeight: 500, fontStyle: "italic", fontFamily: "'Montserrat', sans-serif", color: "#A6ED49", flex: 1 }}>
              premium 1 год
            </span>
            <span style={{ fontSize: 18, fontWeight: 500, fontStyle: "italic", fontFamily: "'Montserrat', sans-serif", color: "#A6ED49" }}>
              790 ₽
            </span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 400, fontStyle: "normal", fontFamily: "'Montserrat', sans-serif", color: "#F8FFEE", opacity: 0.7, marginBottom: 14 }}>
            66 рублей в месяц
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ height: 40, paddingLeft: 16, paddingRight: 16, border: "1px solid #A6ED49", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontStyle: "italic", fontFamily: "'Montserrat', sans-serif", color: "#F8FFEE" }}>
                выгоднее на 27%
              </span>
            </div>
            <button
              onClick={() => handlePay("yearly")}
              disabled={paying !== null}
              style={{ flex: 1, height: 40, background: "#A6ED49", color: "#01311C", border: "none", borderRadius: 20, fontSize: 12, fontStyle: "italic", fontFamily: "'Montserrat', sans-serif", cursor: "pointer" }}
            >
              {paying === "yearly" ? "переход к оплате..." : "оформить →"}
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getMe, User } from "@/lib/api";
// import BottomNav from "@/components/BottomNav"; // раскомментируйте, если нужен

function getErrorStatus(err: unknown): number | undefined {
  if (typeof err === "object" && err !== null) {
    const e = err as { status?: number; response?: { status?: number } };
    return e.status ?? e.response?.status;
  }
  return undefined;
}

function hasShareApi(): boolean {
  return typeof navigator !== "undefined" && "share" in navigator && typeof (navigator as Navigator & { share?: (data: ShareData) => Promise<void> }).share === "function";
}

async function tryShare(link: string): Promise<boolean> {
  const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
  const shareFn = nav.share;
  if (!shareFn) return false;
  try {
    await shareFn({
      title: "ПП Шеф — рецепты правильного питания",
      text: "Готовлю по ПП рецептам — попробуй и ты! За регистрацию по моей ссылке получишь скидку 🌿",
      url: link,
    });
    return true;
  } catch (err) {
    console.warn("[Profile] navigator.share failed", err);
    return false;
  }
}

export default function ProfilePage() {
  const router = useRouter();
  const { token, logout, isLoggedIn, isPremium, isReady } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Если есть флаг готовности auth — ждём, пока он станет true
    if (typeof isReady !== "undefined" && !isReady) {
      console.debug("[Profile] auth not ready, waiting");
      return;
    }

    let mounted = true;

    // Если пользователь не залогинен — редиректим и завершаем
    if (!isLoggedIn) {
      console.debug("[Profile] not logged in — redirect to /auth");
      router.replace("/auth");
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    // Защита: token должен быть определён
    if (!token) {
      console.warn("[Profile] token missing while isLoggedIn=true — redirect to /auth");
      router.replace("/auth");
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    (async () => {
      try {
        const u = await getMe(token);

        if (!mounted) return;

        // Валидация ответа (на случай, если SW/nginx вернул HTML)
        if (!u || typeof u !== "object" || !("id" in u)) {
          console.warn("[Profile] unexpected getMe response", u);
          router.replace("/auth");
          return;
        }

        setUser(u);
      } catch (err: unknown) {
        console.error("[Profile] getMe failed", err);
        const status = getErrorStatus(err);
        if (status === 401 || status === 403) {
          try { logout?.(); } catch (e) { /* ignore */ }
          router.replace("/auth");
        } else {
          // Для остальных ошибок — не редиректим сразу, можно показать сообщение в UI
          // Например: setFetchError(true);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isReady, isLoggedIn, token, router, logout]);

  function handleLogout() {
    try { logout?.(); } catch (e) { /* ignore */ }
    router.push("/");
  }

  function getRefLink(): string {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/?ref=${user?.ref_code ?? ""}`;
  }

  function copyRefLink() {
    try {
      const link = getRefLink();
      if (!link) return;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn("[Profile] copyRefLink failed", e);
    }
  }

  async function shareRefLink() {
    const link = getRefLink();
    if (!link) return;
    if (hasShareApi()) {
      const ok = await tryShare(link);
      if (!ok) copyRefLink();
    } else {
      copyRefLink();
    }
  }

  if (loading) return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa" }}>
      Загрузка...
    </main>
  );

  const menuItem = (icon: string, label: string, onClick: () => void, color = "#333") => (
    <div onClick={onClick} style={{
      background: "#fff", borderRadius: 16, padding: "16px 20px", cursor: "pointer",
      display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <div style={{ fontWeight: 500, color }}>{label}</div>
      <div style={{ marginLeft: "auto", color: "#ccc", fontSize: 18 }}>›</div>
    </div>
  );

  const refCount = user?.referral_count || 0;
  const progress = refCount % 3;
  const nextReward = progress === 0 ? 3 : 3 - progress;
  const totalMonths = Math.floor(refCount / 3);

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#F5F0E8", fontFamily: "'DM Sans', sans-serif" }}>

      <div style={{ padding: "16px 20px", background: "#fff", borderBottom: "1px solid #ece7de", display: "flex", alignItems: "center", gap: 12 }}>
        <div onClick={() => router.push("/")} style={{ width: 36, height: 36, borderRadius: "50%", background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18 }}>←</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: "#4F7453" }}>Профиль</div>
      </div>

      <div style={{ padding: "24px 20px 100px" }}>

        {/* Аватар */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#4F7453", color: "#fff", fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            {user?.email ? user.email[0].toUpperCase() : "?"}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#333" }}>{user?.email}</div>
          <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>
            {isPremium ? "⭐ Premium подписка" : "Аккаунт ПП Шеф"}
          </div>
        </div>

        {/* Реферальный блок */}
        <div style={{ background: "linear-gradient(135deg, #4F7453, #7A9E7E)", borderRadius: 16, padding: 20, marginBottom: 16, color: "#fff" }}>
          <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: 0.5 }}>🎁 Пригласите друзей</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            Получите Premium бесплатно
          </div>
          <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 16, lineHeight: 1.6 }}>
            Приглашайте друзей по своей ссылке — за каждые <b>3 друга</b> получаете <b>1 месяц Premium</b> в подарок 🎁
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.85, marginBottom: 6 }}>
              <span>Приглашено: <b>{refCount}</b></span>
              <span>До награды: <b>{nextReward}</b></span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: 10, height: 8, overflow: "hidden" }}>
              <div style={{ background: "#fff", borderRadius: 10, height: 8, width: `${progress / 3 * 100}%`, transition: "width 0.5s ease" }} />
            </div>
            {totalMonths > 0 && (
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 8, textAlign: "center" }}>
                🎉 Уже получено: {totalMonths} мес. Premium
              </div>
            )}
          </div>

          <div style={{ background: "rgba(0,0,0,0.15)", borderRadius: 10, padding: "8px 12px", marginBottom: 10, fontSize: 12, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: 0.9 }}>
            {user?.ref_code ? `${typeof window !== "undefined" ? window.location.origin : "ppchef.ru"}/?ref=${user.ref_code}` : "—"}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={copyRefLink} style={{ flex: 1, height: 42, background: "rgba(255,255,255,0.2)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {copied ? "✅ Скопировано!" : "📋 Скопировать"}
            </button>
            <button onClick={shareRefLink} style={{ flex: 1, height: 42, background: "#fff", color: "#4F7453", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              📤 Поделиться
            </button>
          </div>
        </div>

        {/* Меню */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 4, paddingLeft: 4 }}>
            Аккаунт
          </div>
          {menuItem("🔑", "Восстановление пароля", () => router.push("/auth/reset"))}
          {menuItem("📝", "Предложить рецепт", () => router.push("/suggest"))}

          <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 0.5, marginTop: 8, marginBottom: 4, paddingLeft: 4 }}>
            Подписка
          </div>
          {menuItem("⭐", "Управление подпиской", () => router.push("/subscription"))}

          {/* Поддержка */}
          <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 0.5, marginTop: 8, marginBottom: 4, paddingLeft: 4 }}>
            Поддержка
          </div>

          <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 13, color: "#555", marginBottom: 12, lineHeight: 1.6 }}>
              Есть вопрос или нашли ошибку? Напишите нам — ответим в течение дня.
            </div>
            <a href="mailto:support@ppchef.ru" style={{ textDecoration: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#F5F0E8", borderRadius: 12, padding: "12px 14px" }}>
                <span style={{ fontSize: 20 }}>📧</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>support@ppchef.ru</div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>Написать в поддержку</div>
                </div>
                <div style={{ marginLeft: "auto", color: "#ccc", fontSize: 16 }}>›</div>
              </div>
            </a>
          </div>

          {/* О приложении */}
          <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 0.5, marginTop: 8, marginBottom: 4, paddingLeft: 4 }}>
            О приложении
          </div>
          <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: "#555" }}>Версия</span>
              <span style={{ fontSize: 13, color: "#aaa" }}>1.0.0</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: "#555" }}>Сайт</span>
              <a href="https://ppchef.ru" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#4F7453", textDecoration: "none" }}>ppchef.ru</a>
            </div>
            <div onClick={() => router.push("/terms")} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, cursor: "pointer" }}>
              <span style={{ fontSize: 13, color: "#555" }}>Пользовательское соглашение</span>
              <span style={{ fontSize: 13, color: "#4F7453" }}>→</span>
            </div>
            <div onClick={() => router.push("/privacy")} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, cursor: "pointer" }}>
              <span style={{ fontSize: 13, color: "#555" }}>Политика конфиденциальности</span>
              <span style={{ fontSize: 13, color: "#4F7453" }}>→</span>
            </div>
            <div onClick={() => router.push("/offer")} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
              <span style={{ fontSize: 13, color: "#555" }}>Публичная оферта</span>
              <span style={{ fontSize: 13, color: "#4F7453" }}>→</span>
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            {menuItem("🚪", "Выйти", handleLogout, "#e05555")}
          </div>
        </div>
      </div>
    </main>
  );
}
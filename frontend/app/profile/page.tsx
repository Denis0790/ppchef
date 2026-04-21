"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getMe, User } from "@/lib/api";
import Image from "next/image";

function hasShareApi(): boolean {
  return typeof navigator !== "undefined" && "share" in navigator &&
    typeof (navigator as Navigator & { share?: (data: ShareData) => Promise<void> }).share === "function";
}

async function tryShare(link: string): Promise<boolean> {
  const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
  if (!nav.share) return false;
  try {
    await nav.share({
      title: "ПП Шеф — рецепты правильного питания",
      text: "Готовлю по ПП рецептам — попробуй и ты! За регистрацию по моей ссылке получишь скидку 🌿",
      url: link,
    });
    return true;
  } catch {
    return false;
  }
}

export default function ProfilePage() {
  const router = useRouter();
  const { token, logout, isLoggedIn, isPremium, isReady } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    const savedName = localStorage.getItem("profileName");
    if (savedName) { setName(savedName); setNameInput(savedName); }
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (!isLoggedIn || !token) {
      router.replace("/auth");
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const u = await getMe(token);
        if (!mounted) return;
        if (!u || typeof u !== "object" || !("id" in u)) {
          router.replace("/auth");
          return;
        }
        setUser(u);
      } catch {
        if (!mounted) return;
        router.replace("/auth");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, isLoggedIn, token]);

  function handleLogout() {
    try { logout?.(); } catch {}
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
    } catch {}
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

  function saveName() {
    const trimmed = nameInput.trim();
    setName(trimmed);
    localStorage.setItem("profileName", trimmed);
    setEditingName(false);
  }

  if (!isReady || loading) return (
    <main style={{
      maxWidth: 480, margin: "0 auto", minHeight: "100vh",
      background: "#F8FFEE", display: "flex",
      alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        border: "3px solid #A6ED49",
        borderTop: "3px solid #01311C",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );

  const refCount = user?.referral_count || 0;
  const progress = refCount % 3;
  const nextReward = progress === 0 ? 3 : 3 - progress;
  const totalMonths = Math.floor(refCount / 3);

  return (
    <main style={{
      maxWidth: 480, margin: "0 auto", minHeight: "100vh",
      background: "#F8FFEE", fontFamily: "'Montserrat', sans-serif",
    }}>

      {/* ── ШАПКА ── */}
      <div style={{
        height: 70, background: "#01311C",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        paddingLeft: 18, paddingRight: 18,
      }}>
        {/* Кнопка назад */}
        <div
          onClick={() => router.push("/")}
          style={{
            width: 175, height: 32,
            border: "1px solid #A6ED49",
            borderRadius: 20,
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 8, cursor: "pointer",
          }}
        >
          <Image src="/icon_profile/left1.svg" alt="" width={8} height={8} style={{ objectFit: "contain", flexShrink: 0 }} />
          <span style={{
            fontSize: 12, fontStyle: "italic", fontWeight: 400,
            fontFamily: "'Montserrat', sans-serif", color: "#F8FFEE",
          }}>
            вернуться к рецептам
          </span>
        </div>

        {/* Кнопка Premium — только если есть */}
        {isPremium && (
          <div style={{
            height: 32, paddingLeft: 16, paddingRight: 16,
            border: "1px solid #A6ED49",
            borderRadius: 20,
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 6,
          }}>
            <Image src="/icon_profile/diamond.svg" alt="" width={19} height={19} style={{ objectFit: "contain" }} />
            <span style={{
              fontSize: 12, fontStyle: "italic", fontWeight: 400,
              fontFamily: "'Montserrat', sans-serif", color: "#F8FFEE",
            }}>
              premium
            </span>
          </div>
        )}
      </div>

      <div style={{ padding: "24px 18px 100px" }}>

        {/* ── АВАТАР + ИМЯ + EMAIL ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          {/* Аватар */}
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "#01311C",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Image src="/icon_profile/avatar.svg" alt="" width={67} height={67} style={{ objectFit: "contain" }} />
          </div>

          {/* Имя + email */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Поле имени */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <input
                value={nameInput}
                onChange={e => { setNameInput(e.target.value); setEditingName(true); }}
                onFocus={() => setEditingName(true)}
                placeholder="Напишите своё имя"
                style={{
                  border: "none",
                  borderBottom: "1px solid #A6ED49",
                  background: "transparent", outline: "none",
                  fontSize: 14, fontStyle: "italic", fontWeight: 400,
                  fontFamily: "'Montserrat', sans-serif",
                  color: nameInput ? "#013125" : "#013125",
                  opacity: nameInput ? 1 : 0.4,
                  width: "100%",
                  paddingLeft: 12,
                  paddingBottom: 4,
                }}
              />
              {editingName && (
                <div
                  onClick={saveName}
                  style={{
                    width: 24, height: 24, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <Image src="/icon_profile/check.svg" alt="" width={24} height={18} style={{ objectFit: "contain" }} />
                </div>
              )}
            </div>
            {/* Email */}
            <div style={{
              fontSize: 12, fontWeight: 400, fontStyle: "normal",
              fontFamily: "'Montserrat', sans-serif",
              color: "#013125", opacity: 0.5,
            }}>
              {user?.email}
            </div>
          </div>
        </div>

        {/* ── РЕФЕРАЛЬНЫЙ БЛОК ── */}
        <div style={{
          background: "#01311C", borderRadius: 16,
          padding: 16, marginBottom: 16,
        }}>
          {/* Заголовок */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Image src="/icon_profile/diamond.svg" alt="" width={19} height={19} style={{ objectFit: "contain" }} />
            <span style={{
              fontSize: 16, fontWeight: 500, fontStyle: "italic",
              fontFamily: "'Montserrat', sans-serif", color: "#A6ED49",
            }}>
              premium бесплатно
            </span>
          </div>

          {/* Описание */}
          <div style={{
            fontSize: 14, fontWeight: 400, fontStyle: "normal",
            fontFamily: "'Montserrat', sans-serif",
            color: "#F8FFEE", lineHeight: 1.6, marginBottom: 12,
          }}>
            Приглашайте друзей по своей ссылке — за каждые <span style={{ color: "#A6ED49", fontStyle: "italic" }}>3 друга</span> получаете <span style={{ color: "#A6ED49", fontStyle: "italic" }}>1 месяц premium в подарок</span>
          </div>

          {/* Прогресс */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontFamily: "'Montserrat', sans-serif",fontStyle: 'italic', color: "#F8FFEE", opacity: 0.7 }}>
                приглашено {refCount}
              </span>
              <span style={{ fontSize: 12, fontFamily: "'Montserrat', sans-serif", color: "#F8FFEE", opacity: 0.7 }}>
                до награды {nextReward}
              </span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, height: 6, overflow: "hidden" }}>
              <div style={{
                background: "#A6ED49", borderRadius: 10, height: 6,
                width: `${progress / 3 * 100}%`,
                transition: "width 0.5s ease",
              }} />
            </div>
            {totalMonths > 0 && (
              <div style={{
                fontSize: 12, fontFamily: "'Montserrat', sans-serif",
                color: "#A6ED49", marginTop: 6, textAlign: "center",
              }}>
                получено: {totalMonths} мес. premium
              </div>
            )}
          </div>

          {/* Кнопки */}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={copyRefLink} style={{
              flex: 1, height: 36,
              background: "transparent",
              color: "#F8FFEE",
              border: "1px solid #A6ED49",
              borderRadius: 20,
              fontSize: 12, fontStyle: "italic",
              fontFamily: "'Montserrat', sans-serif",
              cursor: "pointer",
            }}>
              {copied ? "скопировано!" : "скопировать"}
            </button>
            <button onClick={shareRefLink} style={{
              flex: 1, height: 36,
              background: "#A6ED49",
              color: "#01311C",
              border: "none",
              borderRadius: 20,
              fontSize: 12, fontStyle: "italic",
              fontFamily: "'Montserrat', sans-serif",
              cursor: "pointer",
            }}>
              поделиться
            </button>
          </div>
        </div>

        {/* ── МЕНЮ ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Предложить рецепт */}
          <div
            onClick={() => router.push("/suggest")}
            style={{
              height: 48, border: "1px solid #01311C", borderRadius: 40,
              display: "flex", alignItems: "center",
              paddingLeft: 18, paddingRight: 18, gap: 12, cursor: "pointer",
            }}
          >
            <Image src="/icon_profile/suggest.svg" alt="" width={24} height={18} style={{ objectFit: "contain" }} />
            <span style={{
              fontSize: 14, fontWeight: 400, fontStyle: "italic",
              fontFamily: "'Montserrat', sans-serif", color: "#013125",
            }}>
              предложить рецепт
            </span>
          </div>

          {/* Управление подпиской */}
          <div
            onClick={() => router.push("/subscription")}
            style={{
              height: 48, border: "1px solid #01311C", borderRadius: 40,
              display: "flex", alignItems: "center",
              paddingLeft: 18, paddingRight: 18, gap: 12, cursor: "pointer",
              marginTop: 36,
            }}
          >
            <Image src="/icon_profile/subscription.svg" alt="" width={24} height={18} style={{ objectFit: "contain" }} />
            <span style={{
              fontSize: 14, fontWeight: 400, fontStyle: "italic",
              fontFamily: "'Montserrat', sans-serif", color: "#013125",
            }}>
              управление подпиской
            </span>
          </div>

          {/* Написать в поддержку */}
          <a href="mailto:support@ppchef.ru" style={{ textDecoration: "none" }}>
            <div style={{
              height: 48, border: "1px solid #01311C", borderRadius: 40,
              display: "flex", alignItems: "center",
              paddingLeft: 18, paddingRight: 18, gap: 12, cursor: "pointer",
            }}>
              <Image src="/icon_profile/support.svg" alt="" width={24} height={18} style={{ objectFit: "contain" }} />
              <span style={{
                fontSize: 14, fontWeight: 400, fontStyle: "italic",
                fontFamily: "'Montserrat', sans-serif", color: "#013125",
              }}>
                написать в поддержку
              </span>
            </div>
          </a>

          {/* О приложении */}
          <div style={{

            paddingTop: 16, paddingBottom: 16, paddingLeft: 18, paddingRight: 18,
            marginTop: 4,
          }}>
            <div style={{
              fontSize: 12, fontWeight: 400, fontStyle: "italic",
              fontFamily: "'Montserrat', sans-serif",
              color: "#013125", opacity: 0.7, marginBottom: 12,
            }}>
              о приложении
            </div>
            {[
              { label: "версия", value: "1.0.0", onClick: undefined },
              { label: "сайт", value: "ppchef.ru", onClick: undefined },
              { label: "пользовательское соглашение", value: "→", onClick: () => router.push("/terms") },
              { label: "политика конфиденциальности", value: "→", onClick: () => router.push("/privacy") },
              { label: "публичная оферта", value: "→", onClick: () => router.push("/offer") },
            ].map(({ label, value, onClick }) => (
              <div
                key={label}
                onClick={onClick}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  marginBottom: 10, cursor: onClick ? "pointer" : "default",
                }}
              >
                <span style={{
                  fontSize: 12, fontWeight: 400, fontStyle: "italic",
                  fontFamily: "'Montserrat', sans-serif", color: "#013125", opacity: 0.7,
                }}>
                  {label}
                </span>
                <span style={{
                  fontSize: 12, fontWeight: 400, fontStyle: "italic",
                  fontFamily: "'Montserrat', sans-serif", color: "#013125", opacity: 0.7,
                }}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Выйти */}
          <div
            onClick={handleLogout}
            style={{
              height: 48, border: "1px solid #01311C", borderRadius: 40,
              display: "flex", alignItems: "center",
              paddingLeft: 18, paddingRight: 18, gap: 12, cursor: "pointer",
              marginTop: 4,
            }}
          >
            <Image src="/icon_profile/logout.svg" alt="" width={12} height={12} style={{ objectFit: "contain" }} />
            <span style={{
              fontSize: 14, fontWeight: 400, fontStyle: "italic",
              fontFamily: "'Montserrat', sans-serif", color: "#013125",
            }}>
              выйти
            </span>
          </div>

        </div>
      </div>
    </main>
  );
}
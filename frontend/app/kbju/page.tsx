"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getMe, updateMe, User } from "@/lib/api";
import AuthPrompt from "@/components/AuthPrompt";

type Goal = "loss" | "maintain" | "gain";
type Activity = "low" | "medium" | "high";
type Gender = "male" | "female";

const ACTIVITY_MAP: Record<Activity, number> = {
  low: 1.2, medium: 1.375, high: 1.55,
};

function calcNorm(gender: Gender, age: number, weight: number, height: number, activity: Activity, goal: Goal) {
  const bmr = gender === "male"
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;
  let calories = Math.round(bmr * ACTIVITY_MAP[activity]);
  if (goal === "loss") calories = Math.round(calories * 0.85);
  if (goal === "gain") calories = Math.round(calories * 1.1);
  const protein = Math.round(weight * (goal === "gain" ? 2 : 1.8));
  const fat = Math.round(calories * 0.25 / 9);
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
  return { calories, protein, fat, carbs };
}

const pageStyles = `
  .seg-btn {
    background: transparent;
    border: none;
    border-bottom: 1.4px solid transparent;
    outline: none;
    cursor: pointer;
    font-family: 'Montserrat', sans-serif;
    font-style: italic;
    font-weight: 400;
    font-size: 14px;
    color: #013125;
    padding: 4px 0;
    transition: border-color 0.2s;
    white-space: nowrap;
    line-height: 1;
  }
  .seg-btn.active {
    border-top: 2px solid #A6ED49;
  }

  .kbju-num-input {
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
    color: #013125;
    font-family: 'Montserrat', sans-serif;
    font-style: italic;
    font-weight: 400;
    font-size: 12px;
    padding: 0;
    text-align: center;
  }
  .kbju-num-input::placeholder { color: rgba(1,49,37,0.3); }
  .kbju-num-input::-webkit-outer-spin-button,
  .kbju-num-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  .kbju-num-input[type=number] { -moz-appearance: textfield; }

  .stop-textarea {
    flex: 1;
    background: transparent;
    border: none;
    border-bottom: 1.4px solid #A6ED49;
    outline: none;
    resize: none;
    color: #F8FFEE;
    font-family: 'Montserrat', sans-serif;
    font-style: italic;
    font-weight: 400;
    font-size: 12px;
    line-height: 0.8;
    padding: 0;
    display: block;
    overflow: hidden;
  }
  .stop-textarea::placeholder { color: rgba(248,255,238,0.3); }

  .toggle-track {
    width: 44px; height: 24px;
    border-radius: 12px;
    background: transparent;
    border: 1.4px solid #A6ED49;
    position: relative;
    transition: background 0.2s;
    flex-shrink: 0;
    cursor: pointer;
  }
  .toggle-track.on { background: #A6ED49; }
  .toggle-thumb {
    position: absolute; top: 2px; left: 2px;
    width: 18px; height: 18px;
    border-radius: 50%;
    background: #A6ED49;
    border: 1.4px solid #A6ED49;
    transition: left 0.2s;
  }
  .toggle-track.on .toggle-thumb { left: 21px; background: #013125; }

  .calc-btn {
    width: 100%; height: 36px;
    background: #A6ED49;
    color: #013125;
    border: none;
    border-radius: 100px;
    font-family: 'Montserrat', sans-serif;
    font-style: italic;
    font-weight: 400;
    font-size: 12px;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .calc-btn:hover { opacity: 0.9; }
  .calc-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  @keyframes kbju-spin { to { transform: rotate(360deg); } }
`;

export default function KbjuPage() {
  const router = useRouter();
  const { token, isLoggedIn, isReady, isPremium } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingStop, setSavingStop] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [stopFocused, setStopFocused] = useState(false);

  const [gender, setGender]     = useState<Gender>("female");
  const [age, setAge]           = useState("");
  const [weight, setWeight]     = useState("");
  const [height, setHeight]     = useState("");
  const [activity, setActivity] = useState<Activity>("medium");
  const [goal, setGoal]         = useState<Goal>("maintain");
  const [norm, setNorm]         = useState<{ calories: number; protein: number; fat: number; carbs: number } | null>(null);
  const [stopWords, setStopWords] = useState("");
  const [showPercent, setShowPercent] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    if (!isLoggedIn || !token) { setShowAuthPrompt(true); setLoading(false); return; }
    let mounted = true;
    (async () => {
      try {
        const u = await getMe(token);
        if (!mounted) return;
        setUser(u);
        setStopWords(u.stop_words || "");
        setShowPercent(Boolean(u.show_daily_percent));
        if (u.daily_calories) {
          const n = { calories: u.daily_calories, protein: u.daily_protein || 0, fat: u.daily_fat || 0, carbs: u.daily_carbs || 0 };
          setNorm(n);
          try { localStorage.setItem("userNorm", JSON.stringify({ ...n, show: Boolean(u.show_daily_percent), stop_words: u.stop_words || "" })); } catch {}
        }
      } catch (err) { console.error("[Kbju] getMe failed", err); }
      finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [isReady, isLoggedIn, token, router]);

  async function handleCalcAndSave() {
    const a = parseInt(age), w = parseInt(weight), h = parseInt(height);
    if (!a || !w || !h) return;
    const calculated = calcNorm(gender, a, w, h, activity, goal);
    setNorm(calculated);
    setSaving(true);
    try {
      await updateMe(token!, {
        daily_calories: calculated.calories,
        daily_protein:  calculated.protein,
        daily_fat:      calculated.fat,
        daily_carbs:    calculated.carbs,
        show_daily_percent: showPercent,
        stop_words: stopWords || null,
      });
      localStorage.setItem("userNorm", JSON.stringify({
        calories: calculated.calories, protein: calculated.protein,
        fat: calculated.fat, carbs: calculated.carbs,
        show: showPercent, stop_words: stopWords,
      }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  }

  // Тоггл сохраняет сразу независимо
  async function handleTogglePercent() {
    const newValue = !showPercent;
    setShowPercent(newValue);
    try {
      await updateMe(token!, { show_daily_percent: newValue });
      try {
        const raw = localStorage.getItem("userNorm");
        const existing = raw ? JSON.parse(raw) : {};
        localStorage.setItem("userNorm", JSON.stringify({ ...existing, show: newValue }));
      } catch {}
    } catch (err) {
      console.error("[Kbju] toggle failed", err);
      setShowPercent(!newValue); // откатываем если ошибка
    }
  }

  async function handleSaveStopWords() {
    setSavingStop(true);
    try {
      await updateMe(token!, { stop_words: stopWords || null });
      try {
        const raw = localStorage.getItem("userNorm");
        const existing = raw ? JSON.parse(raw) : {};
        localStorage.setItem("userNorm", JSON.stringify({ ...existing, stop_words: stopWords }));
      } catch {}
      setStopFocused(false);
    } finally { setSavingStop(false); }
  }

  const Header = () => (
    <div style={{
      height: 71, padding: "0 15px", background: "#013125",
      position: "sticky", top: 0, zIndex: 10,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div onClick={() => router.push("/")} style={{ height: 32, border: "1.4px solid #A6ED49", borderRadius: 100, display: "flex", alignItems: "center", gap: 6, padding: "0 14px", cursor: "pointer" }}>
        <img src="/icon_profile/left1.svg" alt="" width={8} height={8} style={{ objectFit: "contain" }} />
        <span style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontWeight: 400, fontSize: 12, color: "#F8FFEE", whiteSpace: "nowrap" }}>
          вернуться к рецептам
        </span>
      </div>
      <div style={{ height: 32, border: "1.4px solid #A6ED49", borderRadius: 100, display: "flex", alignItems: "center", gap: 6, padding: "0 14px" }}>
        <img src="/icon_profile/diamond.svg" alt="" width={19} height={19} style={{ objectFit: "contain" }} />
        <span style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontWeight: 400, fontSize: 12, color: "#F8FFEE" }}>
          premium
        </span>
      </div>
    </div>
  );

  if (!isReady || loading) return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#F8FFEE", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{pageStyles}</style>
      <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid rgba(1,49,37,0.1)", borderTop: "3px solid #013125", animation: "kbju-spin 0.8s linear infinite" }} />
    </main>
  );

  if (showAuthPrompt) return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#F8FFEE" }}>
      <style>{pageStyles}</style>
      <Header />
      <AuthPrompt type="auth" onClose={() => router.push("/")} />
    </main>
  );

  if (!isPremium) return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#F8FFEE" }}>
      <style>{pageStyles}</style>
      <div style={{
        height: 71, padding: "0 15px", background: "#013125",
        position: "sticky", top: 0, zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div onClick={() => router.push("/")} style={{ height: 32, border: "1.4px solid #A6ED49", borderRadius: 100, display: "flex", alignItems: "center", gap: 6, padding: "0 14px", cursor: "pointer" }}>
          <img src="/icon_profile/left1.svg" alt="" width={8} height={8} style={{ objectFit: "contain" }} />
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontWeight: 400, fontSize: 12, color: "#F8FFEE", whiteSpace: "nowrap" }}>
            вернуться к рецептам
          </span>
        </div>
        <div style={{ height: 32, border: "1.4px solid #A6ED49", borderRadius: 100, display: "flex", alignItems: "center", gap: 6, padding: "0 14px" }}>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontWeight: 400, fontSize: 12, color: "#F8FFEE" }}>
            premium
          </span>
        </div>
      </div>
      <AuthPrompt type="premium" onClose={() => router.push("/")} />
    </main>
  );

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#F8FFEE" }}>
      <style>{pageStyles}</style>
      <Header />

      <div style={{ padding: "36px 15px 100px", display: "flex", flexDirection: "column", gap: 36 }}>

        {/* ── БЛОК: МОЯ НОРМА ── */}
        <div style={{ background: "#013125", borderRadius: 20, padding: "20px" }}>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <img src="/icon_kbju/norm.svg" alt="" width={19} height={19} />
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontWeight: 500, fontSize: 16, color: "#A6ED49" }}>
              моя норма кбжу
            </span>
          </div>

          {/* Всегда показываем 4 бейджа — пустые если нормы нет */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
            {[
              { label: "ккал",     value: norm?.calories },
              { label: "белки",    value: norm?.protein  },
              { label: "жиры",     value: norm?.fat      },
              { label: "углеводы", value: norm?.carbs    },
            ].map(({ label, value }) => (
              <div key={label} style={{ border: "1.4px solid #F8FFEE", borderRadius: 100, height: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 12, color: "#F8FFEE" }}>
                  {value ?? "—"}
                </span>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: 12, color: "#F8FFEE", opacity: 0.7 }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Тоггл — сохраняет сразу */}
          <div onClick={handleTogglePercent} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginTop: 16 }}>
            <div className={`toggle-track${showPercent ? " on" : ""}`}>
              <div className="toggle-thumb" />
            </div>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: 12, color: "#F8FFEE", opacity: 0.7 }}>
              показывать % от нормы в рецептах
            </span>
          </div>
        </div>

        {/* ── БЛОК: КАЛЬКУЛЯТОР ── */}
        <div style={{ background: "#F8FFEE", borderRadius: 20, padding: "20px 20px 22px", border: "1.4px solid #A6ED49" }}>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22 }}>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontWeight: 500, fontSize: 16, color: "#013125" }}>
              калькулятор
            </span>
          </div>

          {/* Пол */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", gap: 24 }}>
              {([["female", "женский"], ["male", "мужской"]] as [Gender, string][]).map(([key, label]) => (
                <button key={key} className={`seg-btn${gender === key ? " active" : ""}`} onClick={() => setGender(key)}>{label}</button>
              ))}
            </div>
          </div>

          {/* Возраст / Вес / Рост */}
          <div style={{ display: "flex", gap: 10, marginBottom: 22, alignItems: "flex-end" }}>
            {[
              { value: age,    set: setAge,    width: 72, unit: "лет" },
              { value: weight, set: setWeight, width: 72, unit: "кг"  },
              { value: height, set: setHeight, width: 88, unit: "см"  },
            ].map(({ value, set, width, unit }, i) => (
              <div key={i} style={{
                width, height: 32,
                border: "1.4px solid #A6ED49", borderRadius: 100,
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", paddingRight: 8, gap: 2,
              }}>
                <input
                  type="number" value={value}
                  onChange={e => { if (e.target.value.length <= 3) set(e.target.value); }}
                  className="kbju-num-input" maxLength={3}
                  style={{ width: "100%", textAlign: "center" }}
                />
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: 12, color: "#013125", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {unit}
                </span>
              </div>
            ))}
          </div>

          {/* Активность */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: 12, color: "#013125", opacity: 0.7, marginBottom: 10 }}>активность</div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {([
                ["low",    "минимум"   ],
                ["medium", "умеренная" ],
                ["high",   "высокая"   ],
              ] as [Activity, string][]).map(([key, label]) => (
                <button key={key} className={`seg-btn${activity === key ? " active" : ""}`} onClick={() => setActivity(key)}>{label}</button>
              ))}
            </div>
          </div>

          {/* Цель */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: 12, color: "#013125", opacity: 0.7, marginBottom: 10 }}>цель</div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {([
                ["loss",     "похудение"  ],
                ["maintain", "поддержание"],
                ["gain",     "набор массы"],
              ] as [Goal, string][]).map(([key, label]) => (
                <button key={key} className={`seg-btn${goal === key ? " active" : ""}`} onClick={() => setGoal(key)}>{label}</button>
              ))}
            </div>
          </div>

          <button className="calc-btn" onClick={handleCalcAndSave} disabled={saving || !age || !weight || !height}>
            {saving ? "сохраняем..." : saved ? "✓ сохранено" : "рассчитать →"}
          </button>
        </div>

        {/* ── БЛОК: СТОП-СЛОВА ── */}
        <div style={{ background: "#013125", borderRadius: 20, padding: "20px 20px 22px" }}>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
            <img src="/icon_kbju/not.svg" alt="" width={19} height={19} />
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontWeight: 500, fontSize: 16, color: "#A6ED49" }}>
              стоп-слова
            </span>
          </div>

          <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: 12, color: "#F8FFEE", lineHeight: 1.6, marginBottom: 16 }}>
            укажите продукты, на которые у вас аллергия — на рецептах с ними будет отметка «нежелательные ингредиенты».
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <textarea
              value={stopWords}
              onChange={e => setStopWords(e.target.value)}
              onFocus={() => setStopFocused(true)}
              placeholder="свинина, молоко, орехи, глютен..."
              rows={2}
              className="stop-textarea"
              style={{ marginBottom: -4 }}
            />
            {stopFocused && (
              <div onClick={handleSaveStopWords} style={{ cursor: savingStop ? "default" : "pointer", opacity: savingStop ? 0.4 : 1, flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="#A6ED49" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
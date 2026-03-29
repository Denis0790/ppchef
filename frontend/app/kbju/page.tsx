"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getMe, updateMe, User } from "@/lib/api";
import BottomNav from "@/components/BottomNav";

type Goal = "loss" | "maintain" | "gain";
type Activity = "low" | "medium" | "high" | "very_high";
type Gender = "male" | "female";

const ACTIVITY_MAP: Record<Activity, number> = {
  low: 1.2,
  medium: 1.375,
  high: 1.55,
  very_high: 1.725,
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

export default function KbjuPage() {
  const router = useRouter();
  const { token, isLoggedIn, isReady, isPremium } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [gender, setGender] = useState<Gender>("female");
  const [age, setAge] = useState("28");
  const [weight, setWeight] = useState("60");
  const [height, setHeight] = useState("165");
  const [activity, setActivity] = useState<Activity>("medium");
  const [goal, setGoal] = useState<Goal>("maintain");
  const [norm, setNorm] = useState<{ calories: number; protein: number; fat: number; carbs: number } | null>(null);
  const [stopWords, setStopWords] = useState("");
  const [showPercent, setShowPercent] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    if (!isLoggedIn) { router.push("/auth"); return; }
    getMe(token!).then(u => {
      setUser(u);
      setStopWords(u.stop_words || "");
      setShowPercent(u.show_daily_percent || false);
      if (u.daily_calories) {
        const n = {
          calories: u.daily_calories,
          protein: u.daily_protein || 0,
          fat: u.daily_fat || 0,
          carbs: u.daily_carbs || 0,
        };
        setNorm(n);
        localStorage.setItem("userNorm", JSON.stringify({
          ...n,
          show: u.show_daily_percent || false,
          stop_words: u.stop_words || "",
        }));
      }
    }).finally(() => setLoading(false));
  }, [isReady, isLoggedIn, token, router]);

  function handleCalc() {
    const a = parseInt(age), w = parseInt(weight), h = parseInt(height);
    if (!a || !w || !h) return;
    setNorm(calcNorm(gender, a, w, h, activity, goal));
  }

  async function handleSave() {
    if (!norm) return;
    setSaving(true);
    try {
      await updateMe(token!, {
        daily_calories: norm.calories,
        daily_protein: norm.protein,
        daily_fat: norm.fat,
        daily_carbs: norm.carbs,
        show_daily_percent: showPercent,
        stop_words: stopWords || null,
      });
      localStorage.setItem("userNorm", JSON.stringify({
        calories: norm.calories,
        protein: norm.protein,
        fat: norm.fat,
        carbs: norm.carbs,
        show: showPercent,
        stop_words: stopWords,
      }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (!isReady || loading) return (
  <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #ece7de", borderTop: "3px solid #01311C", animation: "spin 0.8s linear infinite" }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </main>
);

  if (!isPremium) return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#F5F0E8", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ padding: "16px 20px", background: "#fff", borderBottom: "1px solid #ece7de", display: "flex", alignItems: "center", gap: 12 }}>
        <div onClick={() => router.push("/")} style={{ width: 36, height: 36, borderRadius: "50%", background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18 }}>←</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: "#4F7453" }}>📊 Моя норма КБЖУ</div>
      </div>

      <div style={{ padding: "32px 24px 100px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: "100%", filter: "blur(4px)", pointerEvents: "none", marginBottom: -60, opacity: 0.6 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {["2100", "140", "70", "220"].map((v, i) => (
                <div key={i} style={{ background: "#F5F0E8", borderRadius: 12, padding: "10px 6px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#4F7453" }}>{v}</div>
                  <div style={{ fontSize: 10, color: "#888" }}>{["Ккал", "Белки", "Жиры", "Углев"][i]}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ height: 120, background: "#F5F0E8", borderRadius: 10 }} />
          </div>
        </div>

        <div style={{
          width: "100%", background: "linear-gradient(135deg, #4F7453, #7A9E7E)",
          borderRadius: 20, padding: "28px 24px",
          boxShadow: "0 8px 32px rgba(79,116,83,0.3)",
          textAlign: "center", color: "#fff", zIndex: 1,
        }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>⭐</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Premium функция
          </div>
          <div style={{ fontSize: 14, opacity: 0.85, lineHeight: 1.6, marginBottom: 20 }}>
            Расчёт суточной нормы КБЖУ, стоп-слова и процент от нормы в каждом рецепте
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24, textAlign: "left" }}>
            {[
              "📊 Калькулятор суточной нормы КБЖУ",
              "🚫 Стоп-слова для нежелательных продуктов",
              "💯 % от нормы в каждом рецепте",
              "🔍 Поиск рецептов по холодильнику",
            ].map(item => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, opacity: 0.9 }}>
                <span style={{ flexShrink: 0 }}>✓</span> {item}
              </div>
            ))}
          </div>
          <button onClick={() => router.push("/subscription")} style={{
            width: "100%", height: 50, background: "#fff",
            color: "#4F7453", border: "none", borderRadius: 14,
            fontSize: 16, fontWeight: 700, cursor: "pointer",
          }}>
            Попробовать за 90 ₽/мес →
          </button>
          <div style={{ fontSize: 11, opacity: 0.6, marginTop: 10 }}>
            Или 790 ₽ за год — выгоднее на 27%
          </div>
        </div>
      </div>
      <BottomNav />
    </main>
  );

  const s = (active: boolean) => ({
    padding: "8px 16px", borderRadius: 20, border: "none",
    cursor: "pointer", fontSize: 13, fontWeight: 500,
    background: active ? "#4F7453" : "#fff",
    color: active ? "#fff" : "#888",
    boxShadow: active ? "none" : "0 1px 4px rgba(0,0,0,0.08)",
    transition: "all 0.2s",
  } as React.CSSProperties);

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#F5F0E8", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ padding: "20px 20px 16px", background: "#fff", borderBottom: "1px solid #ece7de", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, color: "#4F7453" }}>
          📊 Моя норма КБЖУ
        </div>
        <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Рассчитайте суточную норму</div>
      </div>

      <div style={{ padding: "16px 16px 100px", display: "flex", flexDirection: "column", gap: 14 }}>
        {norm && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#4F7453", marginBottom: 12 }}>
              {user?.daily_calories ? "✅ Ваша норма сохранена" : "📋 Расчётная норма"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {[
                { label: "Ккал", value: norm.calories },
                { label: "Белки", value: norm.protein },
                { label: "Жиры", value: norm.fat },
                { label: "Углев", value: norm.carbs },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: "#F5F0E8", borderRadius: 12, padding: "10px 6px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#4F7453" }}>{value}</div>
                  <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
            <div onClick={() => setShowPercent(p => !p)} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, cursor: "pointer" }}>
              <div style={{ width: 44, height: 24, borderRadius: 12, background: showPercent ? "#4F7453" : "#ddd", position: "relative", transition: "background 0.2s" }}>
                <div style={{ position: "absolute", top: 2, left: showPercent ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
              </div>
              <span style={{ fontSize: 13, color: "#555" }}>Показывать % от нормы в рецептах</span>
            </div>
          </div>
        )}

        <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#333", marginBottom: 14, fontFamily: "'Cormorant Garamond', serif" }}>Калькулятор</div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Пол</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={s(gender === "female")} onClick={() => setGender("female")}>👩 Женский</button>
              <button style={s(gender === "male")} onClick={() => setGender("male")}>👨 Мужской</button>
            </div>
          </div>
          {[
            { label: "Возраст", value: age, set: setAge, unit: "лет", placeholder: "28" },
            { label: "Вес", value: weight, set: setWeight, unit: "кг", placeholder: "60" },
            { label: "Рост", value: height, set: setHeight, unit: "см", placeholder: "165" },
          ].map(({ label, value, set, unit, placeholder }) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>{label}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="number" value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
                  style={{ width: 100, height: 40, border: "1.5px solid #ece7de", borderRadius: 10, padding: "0 12px", fontSize: 15, fontFamily: "inherit", outline: "none", background: "#F5F0E8" }} />
                <span style={{ fontSize: 13, color: "#888" }}>{unit}</span>
              </div>
            </div>
          ))}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Активность</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[{ key: "low", label: "Минимум" }, { key: "medium", label: "Умеренная" }, { key: "high", label: "Высокая" }, { key: "very_high", label: "Очень высокая" }].map(({ key, label }) => (
                <button key={key} style={s(activity === key)} onClick={() => setActivity(key as Activity)}>{label}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Цель</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[{ key: "loss", label: "🔥 Похудение" }, { key: "maintain", label: "⚖️ Поддержание" }, { key: "gain", label: "💪 Набор массы" }].map(({ key, label }) => (
                <button key={key} style={{ ...s(goal === key), fontSize: 12 }} onClick={() => setGoal(key as Goal)}>{label}</button>
              ))}
            </div>
          </div>
          <button onClick={handleCalc} style={{ width: "100%", height: 46, background: "#4F7453", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
            Рассчитать
          </button>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#333", marginBottom: 6, fontFamily: "'Cormorant Garamond', serif" }}>🚫 Стоп-слова</div>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 10, lineHeight: 1.5 }}>
            Укажите продукты которые не едите — рецепты с ними будут помечены. Через запятую: свинина, лактоза, орехи
          </div>
          <textarea value={stopWords} onChange={e => setStopWords(e.target.value)}
            placeholder="свинина, молоко, орехи, глютен..." rows={3}
            style={{ width: "100%", border: "1.5px solid #ece7de", borderRadius: 10, padding: "10px 12px", fontSize: 14, fontFamily: "inherit", background: "#F5F0E8", outline: "none", resize: "none", color: "#333" }} />
        </div>

        {norm && (
          <button onClick={handleSave} disabled={saving} style={{
            width: "100%", height: 50, borderRadius: 14, border: "none",
            background: saved ? "#7A9E7E" : "#4F7453",
            color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer",
          }}>
            {saved ? "✅ Сохранено!" : saving ? "Сохраняем..." : "Сохранить норму"}
          </button>
        )}
      </div>
    </main>
  );
}
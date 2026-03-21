"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { suggestRecipe, getMe } from "@/lib/api";

const CATEGORIES = [
  { key: "breakfast", label: "Завтрак", emoji: "🌅" },
  { key: "lunch", label: "Обед", emoji: "🥗" },
  { key: "dinner", label: "Ужин", emoji: "🍽️" },
  { key: "snack", label: "Перекус", emoji: "🥜" },
  { key: "dessert", label: "Десерт", emoji: "🍓" },
  { key: "soup", label: "Суп", emoji: "🍲" },
  { key: "salad", label: "Салат", emoji: "🥙" },
  { key: "smoothie", label: "Смузи", emoji: "🥤" },
];

const inp = {
  width: "100%", border: "1.5px solid #ece7de", borderRadius: 10,
  padding: "10px 14px", fontSize: 14, fontFamily: "inherit",
  background: "#F5F0E8", outline: "none", color: "#333",
} as React.CSSProperties;

const label12 = { fontSize: 12, color: "#888", marginBottom: 6, display: "block" } as React.CSSProperties;
const hint = { fontSize: 11, color: "#aaa", marginTop: 5, lineHeight: 1.5 } as React.CSSProperties;

export default function SuggestPage() {
  const router = useRouter();
  const { token, isLoggedIn } = useAuth();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("breakfast");
  const [authorName, setAuthorName] = useState("");
  const [showAuthor, setShowAuthor] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [ingredients, setIngredients] = useState([{ name: "", amount: "" }]);
  const [steps, setSteps] = useState([{ text: "" }]);

  // КБЖУ
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [carbs, setCarbs] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");

  // Доп поля
  const [benefit, setBenefit] = useState("");
  const [showExtra, setShowExtra] = useState(false);

  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) router.push("/auth");
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn || !token) return;
    getMe(token).then(u => setAuthorName(u.email));
  }, [isLoggedIn, token]);

  async function handleSubmit() {
    if (!title.trim() || !token) return;
    setSaving(true);
    try {
      await suggestRecipe(token, {
        title,
        category,
        status: "suggested",
        calories: calories ? parseFloat(calories) : null,
        protein: protein ? parseFloat(protein) : null,
        fat: fat ? parseFloat(fat) : null,
        carbs: carbs ? parseFloat(carbs) : null,
        cook_time_minutes: cookTime ? parseInt(cookTime) : null,
        servings: servings ? parseInt(servings) : null,
        benefit: benefit.trim() || null,
        nutritionist_tips: null,
        vitamins: null,
        image_url: imageUrl.trim() || null,
        author_credit: showAuthor ? (authorName.trim() || null) : null,
        tags: [],
        ingredients: ingredients.filter(i => i.name.trim()).map(i => ({ name: i.name, amount: i.amount || null })),
        steps: steps.filter(s => s.text.trim()).map((s, i) => ({ step_number: i + 1, text: s.text, image_url: null })),
      });
      setDone(true);
    } catch {
      alert("Ошибка при отправке");
    } finally {
      setSaving(false);
    }
  }

  if (done) return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ fontSize: 64 }}>🎉</div>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: "#4F7453" }}>Спасибо!</div>
      <div style={{ fontSize: 15, color: "#888", textAlign: "center", padding: "0 32px" }}>Ваш рецепт отправлен на проверку. После одобрения он появится в приложении.</div>
      <button onClick={() => router.push("/")} style={{ marginTop: 8, background: "#4F7453", color: "#fff", border: "none", borderRadius: 14, padding: "14px 32px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
        На главную
      </button>
    </main>
  );

  if (!isLoggedIn) return null;

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#F5F0E8", fontFamily: "'DM Sans', sans-serif" }}>

      <div style={{ padding: "16px 20px", background: "#fff", borderBottom: "1px solid #ece7de", display: "flex", alignItems: "center", gap: 12 }}>
        <div onClick={() => router.push("/profile")} style={{ width: 36, height: 36, borderRadius: "50%", background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18 }}>←</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: "#4F7453" }}>Предложить рецепт</div>
      </div>

      <div style={{ padding: "20px 20px 100px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Название */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ ...label12, textTransform: "uppercase", letterSpacing: 0.5 }}>Название рецепта *</div>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Например: Творожная запеканка с ягодами" style={inp} />
        </div>

        {/* Категория */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ ...label12, textTransform: "uppercase", letterSpacing: 0.5 }}>Категория</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {CATEGORIES.map(c => (
              <div key={c.key} onClick={() => setCategory(c.key)} style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer",
                background: category === c.key ? "#4F7453" : "#F5F0E8",
                color: category === c.key ? "#fff" : "#888",
                fontWeight: category === c.key ? 600 : 400, transition: "all 0.2s",
              }}>
                {c.emoji} {c.label}
              </div>
            ))}
          </div>
        </div>

        {/* Ингредиенты */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ ...label12, textTransform: "uppercase", letterSpacing: 0.5 }}>Ингредиенты</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ingredients.map((ing, i) => (
              <div key={i} style={{ display: "flex", gap: 8 }}>
                <input value={ing.name}
                  onChange={e => setIngredients(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                  placeholder="Ингредиент"
                  style={{ flex: 2, border: "1.5px solid #ece7de", borderRadius: 10, padding: "8px 12px", fontSize: 14, fontFamily: "inherit", background: "#F5F0E8", outline: "none", color: "#333" }} />
                <input value={ing.amount}
                  onChange={e => setIngredients(prev => prev.map((x, j) => j === i ? { ...x, amount: e.target.value } : x))}
                  placeholder="Кол-во"
                  style={{ flex: 1, border: "1.5px solid #ece7de", borderRadius: 10, padding: "8px 12px", fontSize: 14, fontFamily: "inherit", background: "#F5F0E8", outline: "none", color: "#333" }} />
                {ingredients.length > 1 && (
                  <button onClick={() => setIngredients(prev => prev.filter((_, j) => j !== i))}
                    style={{ width: 36, height: 36, background: "#FFF0F0", border: "none", borderRadius: 10, cursor: "pointer", color: "#e05555", fontSize: 16 }}>✕</button>
                )}
              </div>
            ))}
            <button onClick={() => setIngredients(prev => [...prev, { name: "", amount: "" }])}
              style={{ background: "transparent", border: "1.5px dashed #ece7de", borderRadius: 10, padding: 10, fontSize: 13, color: "#4F7453", cursor: "pointer", fontFamily: "inherit" }}>
              + Добавить ингредиент
            </button>
          </div>
        </div>

        {/* Шаги */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ ...label12, textTransform: "uppercase", letterSpacing: 0.5 }}>Приготовление</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {steps.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#4F7453", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 6 }}>{i + 1}</div>
                <textarea value={step.text}
                  onChange={e => setSteps(prev => prev.map((x, j) => j === i ? { text: e.target.value } : x))}
                  placeholder={`Шаг ${i + 1}`} rows={2}
                  style={{ flex: 1, border: "1.5px solid #ece7de", borderRadius: 10, padding: "8px 12px", fontSize: 14, fontFamily: "inherit", background: "#F5F0E8", outline: "none", color: "#333", resize: "none" }} />
                {steps.length > 1 && (
                  <button onClick={() => setSteps(prev => prev.filter((_, j) => j !== i))}
                    style={{ width: 36, height: 36, background: "#FFF0F0", border: "none", borderRadius: 10, cursor: "pointer", color: "#e05555", fontSize: 16, marginTop: 2 }}>✕</button>
                )}
              </div>
            ))}
            <button onClick={() => setSteps(prev => [...prev, { text: "" }])}
              style={{ background: "transparent", border: "1.5px dashed #ece7de", borderRadius: 10, padding: 10, fontSize: 13, color: "#4F7453", cursor: "pointer", fontFamily: "inherit" }}>
              + Добавить шаг
            </button>
          </div>
        </div>

        {/* КБЖУ */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ ...label12, textTransform: "uppercase", letterSpacing: 0.5 }}>КБЖУ (необязательно)</div>
          <div style={{ ...hint, marginBottom: 12 }}>Если знаете — укажите на 100г готового блюда. Если нет — оставьте пустым, мы посчитаем сами.</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Калории (ккал)", value: calories, set: setCalories, placeholder: "например 185" },
              { label: "Белки (г)", value: protein, set: setProtein, placeholder: "например 24" },
              { label: "Жиры (г)", value: fat, set: setFat, placeholder: "например 6" },
              { label: "Углеводы (г)", value: carbs, set: setCarbs, placeholder: "например 12" },
            ].map(({ label, value, set, placeholder }) => (
              <div key={label}>
                <div style={label12}>{label}</div>
                <input type="number" value={value} onChange={e => set(e.target.value)}
                  placeholder={placeholder} style={inp} />
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
            <div>
              <div style={label12}>Время готовки (мин)</div>
              <input type="number" value={cookTime} onChange={e => setCookTime(e.target.value)}
                placeholder="например 30" style={inp} />
            </div>
            <div>
              <div style={label12}>Порций</div>
              <input type="number" value={servings} onChange={e => setServings(e.target.value)}
                placeholder="например 4" style={inp} />
            </div>
          </div>
        </div>

        {/* Дополнительно */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div onClick={() => setShowExtra(p => !p)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>✨ Дополнительно</div>
            <div style={{ fontSize: 18, color: "#aaa", transform: showExtra ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>›</div>
          </div>
          {showExtra && (
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={label12}>🌱 Польза блюда</div>
                <textarea value={benefit} onChange={e => setBenefit(e.target.value)}
                  placeholder="Чем полезно это блюдо? Какие витамины содержит, для кого подходит..."
                  rows={3}
                  style={{ ...inp, resize: "none" } as React.CSSProperties} />
                <div style={hint}>Например: богато белком, подходит для похудения, содержит клетчатку</div>
              </div>
            </div>
          )}
          {!showExtra && (
            <div style={{ fontSize: 12, color: "#aaa", marginTop: 8 }}>
              Польза блюда, советы и другое — нажмите чтобы раскрыть
            </div>
          )}
        </div>

        {/* Фото */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ ...label12, textTransform: "uppercase", letterSpacing: 0.5 }}>Фото (необязательно)</div>
          <div style={{ ...hint, marginBottom: 10 }}>
            Загрузите фото на любой фотохостинг (например imgur.com) и вставьте ссылку. Если не заполните — модератор добавит фото сам.
          </div>
          <input value={imageUrl} onChange={e => setImageUrl(e.target.value)}
            placeholder="https://i.imgur.com/..." style={inp} />
          {imageUrl.trim() && (
            <img src={imageUrl} alt="preview" onError={e => (e.currentTarget.style.display = "none")}
              style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 10, marginTop: 10 }} />
          )}
        </div>

        {/* Автор */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div onClick={() => setShowAuthor(p => !p)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <div style={{
              width: 44, height: 24, borderRadius: 12,
              background: showAuthor ? "#4F7453" : "#ddd",
              position: "relative", transition: "background 0.2s", flexShrink: 0,
            }}>
              <div style={{
                position: "absolute", top: 2, left: showAuthor ? 22 : 2,
                width: 20, height: 20, borderRadius: "50%",
                background: "#fff", transition: "left 0.2s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
              }} />
            </div>
            <span style={{ fontSize: 14, color: "#555" }}>Указать своё имя как автора</span>
          </div>
          {showAuthor && (
            <div style={{ marginTop: 12 }}>
              <div style={label12}>Как вас представить читателям?</div>
              <input value={authorName} onChange={e => setAuthorName(e.target.value)}
                placeholder="Ваше имя или никнейм" style={inp} />
              <div style={hint}>Это имя будет отображаться в карточке рецепта</div>
            </div>
          )}
        </div>

        {/* Кнопка */}
        <button onClick={handleSubmit} disabled={saving || !title.trim()} style={{
          width: "100%", height: 52,
          background: title.trim() ? "#4F7453" : "#ccc",
          color: "#fff", border: "none", borderRadius: 14,
          fontSize: 16, fontWeight: 600,
          cursor: title.trim() ? "pointer" : "default",
        }}>
          {saving ? "Отправляем..." : "Отправить рецепт"}
        </button>

        <div style={{ fontSize: 12, color: "#aaa", textAlign: "center", lineHeight: 1.6 }}>
          После проверки модератором рецепт появится в приложении. Мы можем дополнить его КБЖУ и фотографией.
        </div>
      </div>
    </main>
  );
}
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { suggestRecipe, getMe } from "@/lib/api";
import Header from "@/components/Header";

const CATEGORIES = [
  { key: "breakfast", label: "завтрак" },
  { key: "lunch", label: "обед" },
  { key: "dinner", label: "ужин" },
  { key: "snack", label: "перекус" },
  { key: "dessert", label: "десерт" },
  { key: "soup", label: "суп" },
  { key: "salad", label: "салат" },
  { key: "smoothie", label: "смузи" },
];

const pageStyles = `
  .suggest-main { max-width: 480px; margin: 0 auto; min-height: 100vh; background: #F8FFEE; font-family: 'Montserrat', sans-serif; }
  .suggest-desktop-header { display: none; }
  .suggest-mobile-header { display: flex; }
  .suggest-content { padding: 20px 18px 100px; display: flex; flex-direction: column; gap: 14px; }

  .suggest-block {
    background: #013125;
    border-radius: 16px;
    padding: 16px;
    border: 1px solid rgba(166,237,73,0.2);
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .suggest-label {
    font-size: 11px;
    font-style: italic;
    font-family: 'Montserrat', sans-serif;
    color: #A6ED49;
    opacity: 0.8;
    margin-bottom: 8px;
    display: block;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .suggest-input {
    width: 100%;
    border: 1.5px solid rgba(166,237,73,0.3);
    border-radius: 100px;
    padding: 10px 16px;
    font-size: 13px;
    font-style: italic;
    font-family: 'Montserrat', sans-serif;
    background: rgba(255,255,255,0.06);
    outline: none;
    color: #F8FFEE;
    transition: border-color 0.2s;
  }
  .suggest-input:focus { border-color: #A6ED49; }
  .suggest-input::placeholder { color: rgba(248,255,238,0.25); }

  .suggest-textarea {
    width: 100%;
    border: 1.5px solid rgba(166,237,73,0.3);
    border-radius: 16px;
    padding: 10px 16px;
    font-size: 13px;
    font-style: italic;
    font-family: 'Montserrat', sans-serif;
    background: rgba(255,255,255,0.06);
    outline: none;
    color: #F8FFEE;
    resize: none;
    transition: border-color 0.2s;
  }
  .suggest-textarea:focus { border-color: #A6ED49; }
  .suggest-textarea::placeholder { color: rgba(248,255,238,0.25); }

  @media (min-width: 768px) {
    .suggest-main { max-width: 100% !important; }
    .suggest-desktop-header { display: block !important; }
    .suggest-mobile-header { display: none !important; }
    .suggest-content {
      max-width: 680px;
      margin: 0 auto;
      padding: 24px 20px 100px;
    }
  }
`;

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
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [carbs, setCarbs] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [benefit, setBenefit] = useState("");
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
        title, category, status: "suggested",
        calories: calories ? parseFloat(calories) : null,
        protein: protein ? parseFloat(protein) : null,
        fat: fat ? parseFloat(fat) : null,
        carbs: carbs ? parseFloat(carbs) : null,
        cook_time_minutes: cookTime ? parseInt(cookTime) : null,
        servings: servings ? parseInt(servings) : null,
        benefit: benefit.trim() || null,
        nutritionist_tips: null, vitamins: null,
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
    <main className="suggest-main">
      <style>{pageStyles}</style>
      <div className="suggest-desktop-header"><Header /></div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
        <div style={{ fontSize: 64 }}>🎉</div>
        <div style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: 22, fontWeight: 500, color: "#013125" }}>
          спасибо!
        </div>
        <div style={{ fontSize: 13, fontStyle: "italic", fontFamily: "'Montserrat', sans-serif", color: "#013125", opacity: 0.6, textAlign: "center", padding: "0 32px", lineHeight: 1.6 }}>
          ваш рецепт отправлен на проверку. после одобрения он появится в приложении
        </div>
        <button onClick={() => router.push("/")} style={{
          marginTop: 8, background: "#013125", color: "#A6ED49",
          border: "none", borderRadius: 100, padding: "14px 32px",
          fontSize: 13, fontStyle: "italic", fontFamily: "'Montserrat', sans-serif", cursor: "pointer",
        }}>
          на главную →
        </button>
      </div>
    </main>
  );

  if (!isLoggedIn) return null;

  return (
    <main className="suggest-main">
      <style>{pageStyles}</style>

      <div className="suggest-desktop-header"><Header /></div>

      <div className="suggest-mobile-header" style={{
        height: 70, background: "#01311C", alignItems: "center",
        justifyContent: "space-between", paddingLeft: 18, paddingRight: 18,
      }}>
        <div onClick={() => router.push("/profile")} style={{
          height: 32, border: "1px solid #A6ED49", borderRadius: 20,
          display: "flex", alignItems: "center", gap: 8, padding: "0 14px", cursor: "pointer",
        }}>
          <img src="/icon_profile/left1.svg" alt="" width={8} height={8} />
          <span style={{ fontSize: 12, fontStyle: "italic", fontFamily: "'Montserrat', sans-serif", color: "#F8FFEE" }}>
            вернуться в профиль
          </span>
        </div>
      </div>

      <div className="suggest-content">

        {/* Название */}
        <div className="suggest-block">
          <span className="suggest-label">название рецепта *</span>
          <input
            value={title} onChange={e => setTitle(e.target.value)}
            placeholder="например: творожная запеканка с ягодами"
            className="suggest-input"
          />
        </div>

        {/* Категория */}
        <div className="suggest-block">
          <span className="suggest-label">категория</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {CATEGORIES.map(c => (
              <div key={c.key} onClick={() => setCategory(c.key)} style={{
                padding: "6px 16px", borderRadius: 100, fontSize: 12,
                fontStyle: "italic", fontFamily: "'Montserrat', sans-serif",
                cursor: "pointer",
                background: category === c.key ? "#A6ED49" : "rgba(166,237,73,0.08)",
                color: category === c.key ? "#013125" : "#F8FFEE",
                border: `1.5px solid ${category === c.key ? "#A6ED49" : "rgba(166,237,73,0.2)"}`,
                transition: "all 0.2s",
                fontWeight: category === c.key ? 600 : 400,
              }}>
                {c.label}
              </div>
            ))}
          </div>
        </div>

        {/* Ингредиенты */}
        <div className="suggest-block">
          <span className="suggest-label">ингредиенты</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ingredients.map((ing, i) => (
              <div key={i} style={{ display: "flex", gap: 8 }}>
                <input
                  value={ing.name}
                  onChange={e => setIngredients(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                  placeholder="ингредиент"
                  className="suggest-input"
                  style={{ flex: 2 }}
                />
                <input
                  value={ing.amount}
                  onChange={e => setIngredients(prev => prev.map((x, j) => j === i ? { ...x, amount: e.target.value } : x))}
                  placeholder="кол-во"
                  className="suggest-input"
                  style={{ flex: 1 }}
                />
                {ingredients.length > 1 && (
                  <button onClick={() => setIngredients(prev => prev.filter((_, j) => j !== i))} style={{
                    width: 36, height: 38, background: "transparent",
                    border: "1.5px solid rgba(166,237,73,0.3)", borderRadius: 100,
                    cursor: "pointer", color: "#F87045", fontSize: 16, flexShrink: 0,
                  }}>×</button>
                )}
              </div>
            ))}
            <button onClick={() => setIngredients(prev => [...prev, { name: "", amount: "" }])} style={{
              background: "transparent", border: "1.5px dashed rgba(166,237,73,0.3)",
              borderRadius: 100, padding: "8px 16px", fontSize: 12,
              fontStyle: "italic", fontFamily: "'Montserrat', sans-serif",
              color: "#A6ED49", cursor: "pointer", opacity: 0.7,
            }}>
              + добавить ингредиент
            </button>
          </div>
        </div>

        {/* Шаги */}
        <div className="suggest-block">
          <span className="suggest-label">приготовление</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {steps.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: "#A6ED49", color: "#013125",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 6,
                  fontFamily: "'Montserrat', sans-serif",
                }}>{i + 1}</div>
                <textarea
                  value={step.text}
                  onChange={e => setSteps(prev => prev.map((x, j) => j === i ? { text: e.target.value } : x))}
                  placeholder={`шаг ${i + 1}`} rows={2}
                  className="suggest-textarea"
                  style={{ flex: 1 }}
                />
                {steps.length > 1 && (
                  <button onClick={() => setSteps(prev => prev.filter((_, j) => j !== i))} style={{
                    width: 36, height: 36, background: "transparent",
                    border: "1.5px solid rgba(166,237,73,0.3)", borderRadius: 100,
                    cursor: "pointer", color: "#F87045", fontSize: 16, flexShrink: 0, marginTop: 2,
                  }}>×</button>
                )}
              </div>
            ))}
            <button onClick={() => setSteps(prev => [...prev, { text: "" }])} style={{
              background: "transparent", border: "1.5px dashed rgba(166,237,73,0.3)",
              borderRadius: 100, padding: "8px 16px", fontSize: 12,
              fontStyle: "italic", fontFamily: "'Montserrat', sans-serif",
              color: "#A6ED49", cursor: "pointer", opacity: 0.7,
            }}>
              + добавить шаг
            </button>
          </div>
        </div>

        {/* КБЖУ */}
        <div className="suggest-block">
          <span className="suggest-label">кбжу (необязательно)</span>
          <div style={{ fontSize: 11, fontStyle: "italic", fontFamily: "'Montserrat', sans-serif", color: "#F8FFEE", opacity: 0.4, marginBottom: 12, lineHeight: 1.5 }}>
            если знаете — укажите на 100г готового блюда. если нет — оставьте пустым, мы посчитаем сами
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "калории (ккал)", value: calories, set: setCalories, placeholder: "185" },
              { label: "белки (г)", value: protein, set: setProtein, placeholder: "24" },
              { label: "жиры (г)", value: fat, set: setFat, placeholder: "6" },
              { label: "углеводы (г)", value: carbs, set: setCarbs, placeholder: "12" },
            ].map(({ label, value, set, placeholder }) => (
              <div key={label}>
                <span className="suggest-label">{label}</span>
                <input type="number" value={value} onChange={e => set(e.target.value)}
                  placeholder={placeholder} className="suggest-input" />
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
            <div>
              <span className="suggest-label">время готовки (мин)</span>
              <input type="number" value={cookTime} onChange={e => setCookTime(e.target.value)}
                placeholder="30" className="suggest-input" />
            </div>
            <div>
              <span className="suggest-label">порций</span>
              <input type="number" value={servings} onChange={e => setServings(e.target.value)}
                placeholder="4" className="suggest-input" />
            </div>
          </div>
        </div>

        {/* Польза */}
        <div className="suggest-block">
          <span className="suggest-label">польза блюда (необязательно)</span>
          <textarea
            value={benefit} onChange={e => setBenefit(e.target.value)}
            placeholder="чем полезно это блюдо? какие витамины содержит, для кого подходит..."
            rows={3} className="suggest-textarea"
          />
        </div>

        {/* Фото */}
        <div className="suggest-block">
          <span className="suggest-label">фото (необязательно)</span>
          <div style={{ fontSize: 11, fontStyle: "italic", fontFamily: "'Montserrat', sans-serif", color: "#F8FFEE", opacity: 0.4, marginBottom: 10, lineHeight: 1.5 }}>
            загрузите на imgur.com и вставьте ссылку. если не заполните — модератор добавит сам
          </div>
          <input value={imageUrl} onChange={e => setImageUrl(e.target.value)}
            placeholder="https://i.imgur.com/..." className="suggest-input" />
          {imageUrl.trim() && (
            <img src={imageUrl} alt="preview"
              onError={e => (e.currentTarget.style.display = "none")}
              style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 12, marginTop: 10 }} />
          )}
        </div>

        {/* Автор */}
        <div className="suggest-block">
          <div onClick={() => setShowAuthor(p => !p)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <div style={{
              width: 44, height: 24, borderRadius: 12,
              background: showAuthor ? "#A6ED49" : "rgba(166,237,73,0.15)",
              position: "relative", transition: "background 0.2s", flexShrink: 0,
            }}>
              <div style={{
                position: "absolute", top: 2, left: showAuthor ? 22 : 2,
                width: 20, height: 20, borderRadius: "50%",
                background: showAuthor ? "#013125" : "rgba(255,255,255,0.5)",
                transition: "left 0.2s, background 0.2s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
              }} />
            </div>
            <span style={{ fontSize: 13, fontStyle: "italic", fontFamily: "'Montserrat', sans-serif", color: "#F8FFEE" }}>
              указать своё имя как автора
            </span>
          </div>
          {showAuthor && (
            <div style={{ marginTop: 12 }}>
              <span className="suggest-label">как вас представить читателям?</span>
              <input value={authorName} onChange={e => setAuthorName(e.target.value)}
                placeholder="ваше имя или никнейм" className="suggest-input" />
            </div>
          )}
        </div>

        {/* Кнопка */}
        <button onClick={handleSubmit} disabled={saving || !title.trim()} style={{
          width: "100%", height: 48,
          background: title.trim() ? "#A6ED49" : "rgba(166,237,73,0.2)",
          color: title.trim() ? "#013125" : "rgba(1,49,37,0.3)",
          border: "none", borderRadius: 100,
          fontSize: 14, fontStyle: "italic", fontFamily: "'Montserrat', sans-serif",
          cursor: title.trim() ? "pointer" : "default",
          fontWeight: 600,
          transition: "all 0.2s",
        }}>
          {saving ? "отправляем..." : "отправить рецепт →"}
        </button>

        <div style={{ fontSize: 11, fontStyle: "italic", fontFamily: "'Montserrat', sans-serif", color: "#013125", opacity: 0.4, textAlign: "center", lineHeight: 1.6 }}>
          после проверки модератором рецепт появится в приложении. мы можем дополнить его кбжу и фотографией
        </div>
      </div>
    </main>
  );
}
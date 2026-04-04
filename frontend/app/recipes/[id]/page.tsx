import { getRecipe } from "@/lib/api";
import BackButton from "@/components/BackButton";
import FavoriteButton from "@/components/FavoriteButton";
import KbjuBlock from "@/components/KbjuBlock";
import IngredientsList from "@/components/IngredientsList";
import PartnerBlock from "@/components/PartnerBlock";
import { notFound } from "next/navigation";

const CATEGORY_LABELS: Record<string, string> = {
  breakfast: "Завтрак",
  lunch: "Обед",
  dinner: "Ужин",
  snack: "Перекус",
  dessert: "Десерт",
  soup: "Суп",
  salad: "Салат",
  smoothie: "Смузи",
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const recipe = await getRecipe(id);
    return {
      title: recipe.title,
      description: recipe.benefit || `Рецепт ${recipe.title} — КБЖУ, ингредиенты и пошаговое приготовление`,
      openGraph: {
        title: recipe.title,
        description: recipe.benefit || `Рецепт ${recipe.title}`,
        images: recipe.image_url ? [{ url: recipe.image_url }] : [],
      },
    };
  } catch {
    return { title: "Рецепт" };
  }
}

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let recipe;
  try {
    recipe = await getRecipe(id);
  } catch {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "name": recipe.title,
    "description": recipe.benefit || recipe.title,
    "image": recipe.image_url || "",
    "author": { "@type": "Organization", "name": "ПП Шеф" },
    "datePublished": recipe.created_at,
    "prepTime": recipe.cook_time_minutes ? `PT${recipe.cook_time_minutes}M` : undefined,
    "recipeYield": recipe.servings ? `${recipe.servings} порций` : undefined,
    "nutrition": {
      "@type": "NutritionInformation",
      "calories": recipe.calories ? `${Math.round(recipe.calories)} ккал` : undefined,
      "proteinContent": recipe.protein ? `${Math.round(recipe.protein)} г` : undefined,
      "fatContent": recipe.fat ? `${Math.round(recipe.fat)} г` : undefined,
      "carbohydrateContent": recipe.carbs ? `${Math.round(recipe.carbs)} г` : undefined,
    },
    "recipeIngredient": recipe.ingredients.map(i => `${i.name}${i.amount ? ` — ${i.amount}` : ""}`),
    "recipeInstructions": recipe.steps.map(s => ({
      "@type": "HowToStep",
      "text": s.text,
    })),
    "keywords": "правильное питание, пп рецепт, здоровое питание",
  };

  return (
    <main style={{
      maxWidth: 480, margin: "0 auto",
      minHeight: "100vh", background: "#F8FFEE",
      fontFamily: "'Montserrat', sans-serif",
    }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── ШАПКА: кнопка назад + избранное ── */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        paddingLeft: 18, paddingRight: 18,
        paddingTop: 17,
        marginBottom: 0,
      }}>
        {/* Кнопка назад */}
        <BackButton />

        {/* Кнопка в избранное */}
        <FavoriteButton recipeId={recipe.id} variant="recipe" />
      </div>

      {/* ── КАРТИНКА 429×200, скругление сверху ── */}
      <div style={{
        width: 429, margin: "17px auto 0",
        height: 200,
        borderRadius: "16px 16px 0 0",
        overflow: "hidden",
        background: "#e8e0d0",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 80,
      }}>
        {recipe.image_url
          ? <img src={recipe.image_url} alt={recipe.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : "🥗"}
      </div>

      <div style={{ padding: "0 18px 80px" }}>

        {/* ── МЕТА: время + порции ── */}
        <div style={{
          display: "flex", alignItems: "center",
          flexWrap: "wrap", gap: "2px 12px",
          fontSize: 11, color: "#888",
          fontFamily: "'Montserrat', sans-serif",
          fontStyle: "italic",
          marginTop: 13,
          paddingLeft: 0,
        }}>
          {recipe.cook_time_minutes && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <img src="/icons/chasi.svg" alt="" style={{ width: 13.9, height: 13.9, objectFit: "contain" }} />
              {recipe.cook_time_minutes} мин
            </span>
          )}
          {recipe.servings && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <img src="/icons/vilki.svg" alt="" style={{ width: 13.9, height: 13.9, objectFit: "contain" }} />
              {recipe.servings} порц.
            </span>
          )}
        </div>

        {/* ── НАЗВАНИЕ ── */}
        <div style={{
          width: 350, minHeight: 36,
          marginTop: 12,
          fontSize: 16, fontWeight: 400,
          fontFamily: "'Montserrat', sans-serif",
          color: "#133520", lineHeight: 1.3,
        }}>
          {recipe.title}
        </div>

        {/* ── КБЖУ в строчку 429×24 ── */}
        <div style={{
          display: "flex", alignItems: "center",
          gap: 6,
          marginTop: 12,
          width: 429, height: 24,
        }}>
          {[
            { label: "ккал",     value: recipe.calories },
            { label: "белки",    value: recipe.protein  },
            { label: "жиры",     value: recipe.fat      },
            { label: "углеводы", value: recipe.carbs    },
          ].map(({ label, value }) => (
            <div key={label} style={{
              flex: 1, height: 24,
              border: "1px solid #A6ED49",
              borderRadius: 12,
              background: "#F8FFEE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              overflow: "hidden",
            }}>
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: "#01311C", lineHeight: 1,
                whiteSpace: "nowrap",
                fontFamily: "'Montserrat', sans-serif",
              }}>
                {value ? Math.round(value) : "—"}
              </span>
              <span style={{
                fontSize: 10,
                color: "#01311C", lineHeight: 1,
                whiteSpace: "nowrap",
                opacity: 0.75,
                fontFamily: "'Montserrat', sans-serif",
              }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* ── ПОЛЬЗА ── */}
        {recipe.benefit && (
          <div style={{
            marginTop: 32,
            border: "1px solid #A6ED49",
            borderRadius: 16,
            padding: "14px 16px",
            background: "#F8FFEE",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <img src="/icons/sovet.svg" alt="" style={{ width: 21, height: 16, objectFit: "contain" }} />
              {/* 🔧 замени /YOUR_BENEFIT_ICON.svg на свой путь */}
              <span style={{
                fontSize: 14, fontWeight: 600,
                color: "#133520",
                fontFamily: "'Montserrat', sans-serif",
              }}>
                Польза
              </span>
            </div>
            <div style={{
              fontSize: 14, color: "#133520", lineHeight: 1.6,
              fontFamily: "'Montserrat', sans-serif",
            }}>
              {recipe.benefit}
            </div>
          </div>
        )}

        {/* ── ИНГРЕДИЕНТЫ ── */}
        {recipe.ingredients.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <img src="/icons/ingred.svg" alt="" style={{ width: 21, height: 16, objectFit: "contain" }} />
              {/* 🔧 замени /YOUR_INGREDIENTS_ICON.svg на свой путь */}
              <span style={{
                fontSize: 14, fontWeight: 600,
                color: "#133520",
                fontFamily: "'Montserrat', sans-serif",
              }}>
                Ингредиенты
              </span>
            </div>
            {recipe.ingredients.map((ing, i) => (
              <div key={i}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  fontSize: 14, color: "#133520",
                  fontFamily: "'Montserrat', sans-serif",
                }}>
                  <span>{ing.name}</span>
                  <span style={{ opacity: 0.7 }}>{ing.amount}</span>
                </div>
                {i < recipe.ingredients.length - 1 && (
                  <div style={{ height: 1, background: "#A6ED49" }} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── РЕФЕРАЛКА ── */}
        {recipe.ingredients.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <PartnerBlock />
          </div>
        )}

        {/* ── ПРИГОТОВЛЕНИЕ ── */}
        {recipe.steps.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <img src="/YOUR_STEPS_ICON.svg" alt="" style={{ width: 21, height: 16, objectFit: "contain" }} />
              {/* 🔧 замени /YOUR_STEPS_ICON.svg на свой путь */}
              <span style={{
                fontSize: 14, fontWeight: 600,
                color: "#133520",
                fontFamily: "'Montserrat', sans-serif",
              }}>
                Приготовление
              </span>
            </div>
            {recipe.steps.map((step) => (
              <div key={step.id} style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <div style={{
                  flexShrink: 0, width: 28, height: 28,
                  borderRadius: "50%", background: "#4F7453",
                  color: "#fff", fontSize: 13, fontWeight: 600,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Montserrat', sans-serif",
                }}>
                  {step.step_number}
                </div>
                <div style={{
                  fontSize: 14, color: "#133520", lineHeight: 1.6, paddingTop: 4,
                  fontFamily: "'Montserrat', sans-serif",
                }}>
                  {step.text}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* остальные блоки пока как есть */}
        {recipe.nutritionist_tips && (
          <div style={{
            background: "linear-gradient(135deg, #4F7453, #7A9E7E)",
            borderRadius: 16, padding: 16, marginBottom: 16, color: "#fff",
            marginTop: 32,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              👨‍⚕️ Совет нутрициолога
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.9 }}>
              {recipe.nutritionist_tips}
            </div>
          </div>
        )}

        {recipe.vitamins && (
          <div style={{
            background: "#fff", borderRadius: 16,
            padding: 16, marginBottom: 16,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#C4975A", marginBottom: 6 }}>
              💊 Витамины и минералы
            </div>
            <div style={{ fontSize: 14, color: "#555", lineHeight: 1.6 }}>
              {recipe.vitamins}
            </div>
          </div>
        )}

        {recipe.tags.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
            {recipe.tags.map((tag) => (
              <div key={tag.id} style={{
                background: "#fff", borderRadius: 20,
                padding: "4px 12px", fontSize: 12,
                color: "#4F7453", fontWeight: 500,
              }}>
                #{tag.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
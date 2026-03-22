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
      minHeight: "100vh", background: "#F5F0E8",
      fontFamily: "'DM Sans', sans-serif",
      paddingTop: 16,
    }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div style={{
        height: 280, background: "linear-gradient(135deg, #e8e0d0, #d5cab8)",
        display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 80,
        position: "relative",
      }}>
        {recipe.image_url
          ? <img src={recipe.image_url} alt={recipe.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : "🥗"}
        <BackButton />
        <FavoriteButton recipeId={recipe.id} />
        <div style={{
          position: "absolute", bottom: 16, right: 16,
          background: "#4F7453", color: "#fff",
          fontSize: 11, fontWeight: 600,
          padding: "4px 12px", borderRadius: 20,
        }}>
          {CATEGORY_LABELS[recipe.category] || recipe.category}
        </div>
      </div>

      <div style={{ padding: "20px 20px 80px" }}>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 28, fontWeight: 700,
          color: "#333", marginBottom: 8, lineHeight: 1.2,
        }}>
          {recipe.title}
        </h1>

        <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#888", marginBottom: 20 }}>
          {recipe.cook_time_minutes && <span>⏱ {recipe.cook_time_minutes} мин</span>}
          {recipe.servings && <span>🍽 {recipe.servings} порц.</span>}
          {recipe.author_credit && <span>👤 {recipe.author_credit}</span>}
        </div>

        <KbjuBlock
          calories={recipe.calories}
          protein={recipe.protein}
          fat={recipe.fat}
          carbs={recipe.carbs}
        />

        {recipe.benefit && (
          <div style={{
            background: "#fff", borderRadius: 16,
            padding: 16, marginBottom: 16,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#4F7453", marginBottom: 6 }}>
              🌱 Польза
            </div>
            <div style={{ fontSize: 14, color: "#555", lineHeight: 1.6 }}>
              {recipe.benefit}
            </div>
          </div>
        )}

        {/* Ингредиенты */}
        {recipe.ingredients.length > 0 && (
          <div style={{
            background: "#fff", borderRadius: 16,
            padding: 16, marginBottom: 16,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}>
            <div style={{
              fontSize: 16, fontWeight: 700, color: "#333", marginBottom: 12,
              fontFamily: "'Cormorant Garamond', serif",
            }}>
              Ингредиенты
            </div>
            <IngredientsList ingredients={recipe.ingredients} />
          </div>
        )}

        {/* Партнёр — доставка продуктов (после ингредиентов) */}
        {recipe.ingredients.length > 0 && (
          <PartnerBlock
            ingredients={recipe.ingredients}
            variant="delivery"
            recipeId={recipe.id}
          />
        )}

        {/* Шаги приготовления */}
        {recipe.steps.length > 0 && (
          <div style={{
            background: "#fff", borderRadius: 16,
            padding: 16, marginBottom: 16,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}>
            <div style={{
              fontSize: 16, fontWeight: 700, color: "#333", marginBottom: 12,
              fontFamily: "'Cormorant Garamond', serif",
            }}>
              Приготовление
            </div>
            {recipe.steps.map((step) => (
              <div key={step.id} style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <div style={{
                  flexShrink: 0, width: 28, height: 28,
                  borderRadius: "50%", background: "#4F7453",
                  color: "#fff", fontSize: 13, fontWeight: 600,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {step.step_number}
                </div>
                <div style={{ fontSize: 14, color: "#555", lineHeight: 1.6, paddingTop: 4 }}>
                  {step.text}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Партнёр — кухонные товары (после шагов) */}
        {recipe.steps.length > 0 && (
          <PartnerBlock
            ingredients={recipe.ingredients}
            variant="kitchen"
            recipeId={recipe.id}
          />
        )}

        {recipe.nutritionist_tips && (
          <div style={{
            background: "linear-gradient(135deg, #4F7453, #7A9E7E)",
            borderRadius: 16, padding: 16, marginBottom: 16, color: "#fff",
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
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
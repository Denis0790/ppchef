import { getRecipe } from "@/lib/api";
import BackButton from "@/components/BackButton";
import FavoriteButton from "@/components/FavoriteButton";
import IngredientsList from "@/components/IngredientsList";
import PartnerBlock from "@/components/PartnerBlock";
import { notFound } from "next/navigation";
import Image from "next/image";
import Header from "@/components/Header";

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
        images: recipe.image_url
          ? [{ url: recipe.image_url, width: 1200, height: 630, alt: recipe.title }]
          : [],
      },
      twitter: {
        card: "summary_large_image",
        title: recipe.title,
        description: recipe.benefit || `Рецепт ${recipe.title}`,
        images: recipe.image_url ? [recipe.image_url] : [],
      },
    };
  } catch {
    return { title: "Рецепт" };
  }
}

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
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
    "image": recipe.image_url ? [recipe.image_url] : [],  // массив, не строка
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
    "recipeIngredient": recipe.ingredients.map(
        (i) => `${i.name}${i.amount ? ` — ${i.amount}` : ""}`
      ),
      "recipeInstructions": recipe.steps.map(
        (s) => ({ "@type": "HowToStep", "text": s.text })
      ),
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
      <Header />

      {/* ── КНОПКА НАЗАД + ИЗБРАННОЕ ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        paddingLeft: 18, paddingRight: 18, paddingTop: 17,
      }}>
        <BackButton />
        <FavoriteButton recipeId={recipe.id} variant="recipe" />
      </div>

      {/* ── КАРТИНКА ── */}
      <div style={{
        width: "100%", margin: "17px auto 0",
        height: 260, borderRadius: "16px 16px 0 0",
        overflow: "hidden", background: "#e8e0d0",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 80, position: "relative",
      }}>
        {recipe.image_url
          ? <Image
              src={recipe.image_url}
              alt={recipe.title}
              fill
              sizes="(max-width: 768px) 100vw, 665px"
              quality={70}
              style={{ objectFit: "cover" }}
            />
          : "🥗"}
      </div>

      <div style={{ padding: "0 18px 120px" }}>

        {/* ── МЕТА + КБЖУ + НАЗВАНИЕ ── */}
        <div style={{ display: "flex", alignItems: "flex-start", marginTop: 13, gap: 0 }}>

          {/* ЛЕВАЯ: время + порции + название */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: "flex", alignItems: "center",
              flexWrap: "wrap", gap: "2px 12px",
              fontSize: 12, color: "#888", opacity: 0.7,
              fontFamily: "'Montserrat', sans-serif", fontStyle: "normal",
            }}>
              {recipe.cook_time_minutes && (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Image src="/icons/chasi.svg" alt="" width={14} height={14} style={{ objectFit: "contain" }} />
                  {recipe.cook_time_minutes} мин
                </span>
              )}
              {recipe.servings && (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Image src="/icons/vilki.svg" alt="" width={14} height={14} style={{ objectFit: "contain" }} />
                  {recipe.servings} порц.
                </span>
              )}
            </div>

            <div style={{
              marginTop: 12, fontSize: 16, fontWeight: 400,
              fontFamily: "'Montserrat', sans-serif",
              color: "#133520", lineHeight: 1.3, paddingRight: 8,
            }}>
              {recipe.title}
            </div>
          </div>

          {/* ПРАВАЯ: КБЖУ вертикально */}
          <div style={{
            display: "flex", flexDirection: "column", gap: 4,
            flexShrink: 0, width: 86, marginTop: 9, marginRight: 0,
          }}>
            {[
              { label: "ккал",     value: recipe.calories },
              { label: "белки",    value: recipe.protein  },
              { label: "жиры",     value: recipe.fat      },
              { label: "углеводы", value: recipe.carbs    },
            ].map(({ label, value }) => (
              <div key={label} style={{
                width: 83, height: 19,
                border: "1px solid #A6ED49", borderRadius: 12,
                background: "#F8FFEE",
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 3, overflow: "hidden",
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#01311C", lineHeight: 1, whiteSpace: "nowrap", fontFamily: "'Montserrat', sans-serif" }}>
                  {value ? Math.round(value) : "—"}
                </span>
                <span style={{ fontSize: 10, color: "#01311C", lineHeight: 1, whiteSpace: "nowrap", opacity: 0.75, fontFamily: "'Montserrat', sans-serif" }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── ПОЛЬЗА ── */}
        {recipe.benefit && (
          <div style={{ marginTop: 24, border: "1px solid #A6ED49", borderRadius: 16, padding: "14px 16px", background: "#F8FFEE" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Image src="/icons/sovet1.svg" alt="" width={24} height={18} style={{ objectFit: "contain" }} />
              <span style={{ fontSize: 12, fontWeight: 500, fontStyle: "italic", color: "#133520", fontFamily: "'Montserrat', sans-serif" }}>
                польза
              </span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 400, fontStyle: "normal", color: "#133520", lineHeight: 1.6, fontFamily: "'Montserrat', sans-serif" }}>
              {recipe.benefit}
            </div>
          </div>
        )}

        {/* ── ИНГРЕДИЕНТЫ ── */}
        {recipe.ingredients.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Image src="/icons/ingred1.svg" alt="" width={24} height={18} style={{ objectFit: "contain" }} />
              <span style={{ fontSize: 12, fontWeight: 500, fontStyle: "italic", color: "#133520", fontFamily: "'Montserrat', sans-serif" }}>
                ингредиенты
              </span>
            </div>
            <IngredientsList ingredients={recipe.ingredients} />
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
              <Image src="/icons/prigotovlenie.svg" alt="" width={24} height={18} style={{ objectFit: "contain" }} />
              <span style={{ fontSize: 12, fontWeight: 500, fontStyle: "italic", color: "#133520", fontFamily: "'Montserrat', sans-serif" }}>
                приготовление
              </span>
            </div>
            {recipe.steps.map((step: { id: string; step_number: number; text: string }) => (
              <div key={step.id} style={{ display: "flex", gap: 7, marginBottom: 8, alignItems: "flex-start" }}>
                <div style={{ flexShrink: 0, width: 2, height: 12, background: "#A6ED49", marginTop: 2 }} />
                <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 400, fontStyle: "normal", color: "#013125", fontFamily: "'Montserrat', sans-serif", lineHeight: 1.3 }}>
                  {step.step_number}
                </span>
                <span style={{ fontSize: 11, fontWeight: 400, fontStyle: "normal", color: "#013125", fontFamily: "'Montserrat', sans-serif", lineHeight: 1.3, marginLeft: 7 }}>
                  {step.text}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── СОВЕТ НУТРИЦИОЛОГА ── */}
        {recipe.nutritionist_tips && (
          <div style={{ background: "#013125", borderRadius: 16, padding: 16, marginTop: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Image src="/icons/nutritionist.svg" alt="" width={24} height={18} style={{ objectFit: "contain" }} />
              <span style={{ fontSize: 12, fontWeight: 500, fontStyle: "italic", color: "#A6ED49", fontFamily: "'Montserrat', sans-serif" }}>
                совет нутрициолога
              </span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 400, fontStyle: "normal", color: "#F8FFEE", lineHeight: 1.6, fontFamily: "'Montserrat', sans-serif" }}>
              {recipe.nutritionist_tips}
            </div>
          </div>
        )}

        {/* ── ВИТАМИНЫ И МИНЕРАЛЫ ── */}
        {recipe.vitamins && (
          <div style={{ background: "#F8FFEE", borderRadius: 16, border: "1px solid #A6ED49", padding: 16, marginTop: 24, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Image src="/icons/vitamins.svg" alt="" width={24} height={18} style={{ objectFit: "contain" }} />
              <span style={{ fontSize: 12, fontWeight: 500, fontStyle: "italic", color: "#013125", fontFamily: "'Montserrat', sans-serif" }}>
                витамины и минералы
              </span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 400, fontStyle: "normal", color: "#013125", lineHeight: 1.6, fontFamily: "'Montserrat', sans-serif" }}>
              {recipe.vitamins}
            </div>
          </div>
        )}

        {recipe.tags.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
            {recipe.tags.map((tag: { id: string; name: string }) => (
              <div key={tag.id} style={{ background: "#fff", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#4F7453", fontWeight: 500 }}>
                #{tag.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
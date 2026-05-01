import { getRecipe } from "@/lib/api";
import BackButton from "@/components/BackButton";
import FavoriteButton from "@/components/FavoriteButton";
import IngredientsList from "@/components/IngredientsList";
import PartnerBlock from "@/components/PartnerBlock";
import { notFound } from "next/navigation";
import Image from "next/image";
import Header from "@/components/Header";
import ShareButton from "@/components/ShareButton";

const CATEGORIES = [
  { key: "",          label: "все" },
  { key: "breakfast", label: "завтрак" },
  { key: "lunch",     label: "обед" },
  { key: "dinner",    label: "ужин" },
  { key: "snack",     label: "перекус" },
  { key: "dessert",   label: "десерт" },
  { key: "salad",     label: "салат" },
  { key: "smoothie",  label: "смузи" },
];

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

  const categoryLabel = CATEGORIES.find(c => c.key === recipe.category)?.label || recipe.category;
  const recipeUrl = `https://ppchef.ru/recipes/${recipe.id}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "name": recipe.title,
    "description": recipe.benefit || recipe.title,
    "image": recipe.image_url ? [recipe.image_url] : [],
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
    <>
      <style>{`
        .recipe-page-main {
          max-width: 480px;
          margin: 0 auto;
          min-height: 100vh;
          background: #F8FFEE;
          font-family: 'Montserrat', sans-serif;
        }
        .recipe-page-content {
          padding: 0 18px 40px;
        }
        .recipe-page-image {
          width: 100%;
          height: 260px;
          margin: 17px auto 0;
        }
        @media (min-width: 768px) {
          .recipe-page-main {
            max-width: 100% !important;
          }
          .recipe-page-inner {
            max-width: 700px;
            margin: 0 auto;
          }
          .recipe-page-image {
            height: 420px;
            border-radius: 16px;
            overflow: hidden;
            margin-top: 24px;
          }
          .recipe-page-content {
            padding: 0 0 80px;
          }
        }
      `}</style>

      <main className="recipe-page-main">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <Header />

        <div className="recipe-page-inner">

          {/* ── КНОПКА НАЗАД + ИЗБРАННОЕ ── */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            paddingLeft: 18, paddingRight: 18, paddingTop: 17,
          }}>
            <BackButton />
            <FavoriteButton recipeId={recipe.id} variant="recipe" />
          </div>

          {/* ── КАРТИНКА ── */}
          <div className="recipe-page-image" style={{
            overflow: "hidden", background: "#e8e0d0",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 80, position: "relative",
          }}>
            {recipe.image_url
              ? <Image
                  src={recipe.image_url}
                  alt={recipe.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 700px"
                  quality={80}
                  style={{ objectFit: "cover" }}
                />
              : "🥗"}
          </div>

          <div className="recipe-page-content" style={{ padding: "0 18px 40px" }}>

            {/* ── КАТЕГОРИЯ ── */}
            <div style={{ marginTop: 13, marginBottom: 12 }}>
              <div style={{
                width: 61, height: 30, borderRadius: 100,
                background: "#01311C",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{
                  fontSize: 12, fontWeight: 400, fontStyle: "italic",
                  fontFamily: "'Montserrat', sans-serif",
                  color: "#F8FFEE", lineHeight: 1, whiteSpace: "nowrap",
                }}>
                  {categoryLabel}
                </span>
              </div>
            </div>

            {/* ── НАЗВАНИЕ + КБЖУ ── */}
            <div style={{
              display: "flex", alignItems: "stretch",
              justifyContent: "space-between", marginBottom: 24,
            }}>
              <div style={{ flex: 1, minWidth: 0, paddingRight: 12, display: "flex", flexDirection: "column" }}>
                <div style={{
                  fontSize: 16, fontWeight: 500, fontStyle: "italic",
                  fontFamily: "'Montserrat', sans-serif",
                  color: "#133520", lineHeight: 1.3, marginBottom: 6,
                }}>
                  {recipe.title}
                </div>
                <div style={{
                  display: "flex", alignItems: "center",
                  flexWrap: "wrap", gap: "2px 12px",
                  fontSize: 12, fontWeight: 400, fontStyle: "normal",
                  fontFamily: "'Montserrat', sans-serif",
                  color: "#888", opacity: 0.7,
                }}>
                  {recipe.cook_time_minutes && (
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Image src="/icons/chasi.svg" alt="" width={16} height={16} style={{ objectFit: "contain" }} />
                      {recipe.cook_time_minutes} мин
                    </span>
                  )}
                  {recipe.servings && (
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Image src="/icons/vilki.svg" alt="" width={16} height={16} style={{ objectFit: "contain" }} />
                      {recipe.servings} порц.
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0, alignSelf: "flex-start", marginTop: -34 }}>
                <div style={{
                  fontSize: 9, fontWeight: 400, fontStyle: "italic",
                  fontFamily: "'Montserrat', sans-serif",
                  color: "#013125", opacity: 0.4,
                  textAlign: "center", marginBottom: 2,
                }}>
                  кбжу на 100г
                </div>
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
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, fontStyle: "normal", fontFamily: "'Montserrat', sans-serif", color: "#01311C", lineHeight: 1, whiteSpace: "nowrap" }}>
                      {value ? Math.round(value) : "—"}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 400, fontStyle: "normal", fontFamily: "'Montserrat', sans-serif", color: "#01311C", lineHeight: 1, whiteSpace: "nowrap", opacity: 0.75 }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── ПОЛЬЗА ── */}
            {recipe.benefit && (
              <div style={{ border: "1px solid #A6ED49", borderRadius: 16, padding: "14px 16px", background: "#F8FFEE", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <Image src="/icons/sovet1.svg" alt="" width={24} height={18} style={{ objectFit: "contain" }} />
                  <span style={{ fontSize: 16, fontWeight: 500, fontStyle: "italic", fontFamily: "'Montserrat', sans-serif", color: "#133520" }}>
                    польза
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 400, fontStyle: "normal", fontFamily: "'Montserrat', sans-serif", color: "#133520", lineHeight: "20px" }}>
                  {recipe.benefit.split("\n").map((line: string, i: number) =>
                    line.trim() ? <p key={i} style={{ margin: 0, marginBottom: 2 }}>{line}</p> : <br key={i} />
                  )}
                </div>
              </div>
            )}

            {/* ── ИНГРЕДИЕНТЫ ── */}
            {recipe.ingredients.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <Image src="/icons/ingred1.svg" alt="" width={24} height={18} style={{ objectFit: "contain" }} />
                  <span style={{ fontSize: 16, fontWeight: 500, fontStyle: "italic", fontFamily: "'Montserrat', sans-serif", color: "#133520" }}>
                    ингредиенты
                  </span>
                </div>
                <div style={{ fontSize: 14, lineHeight: "15px" }}>
                  <IngredientsList ingredients={recipe.ingredients} />
                </div>
              </div>
            )}

            {/* ── ПАРТНЁРСКИЙ БЛОК ── */}
            {recipe.ingredients.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <PartnerBlock />
              </div>
            )}

            {/* ── ПРИГОТОВЛЕНИЕ ── */}
            {recipe.steps.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <Image src="/icons/prigotovlenie.svg" alt="" width={24} height={18} style={{ objectFit: "contain" }} />
                  <span style={{ fontSize: 16, fontWeight: 500, fontStyle: "italic", fontFamily: "'Montserrat', sans-serif", color: "#133520" }}>
                    приготовление
                  </span>
                </div>
                {recipe.steps.map((step: { id: string; step_number: number; text: string }) => (
                  <div key={step.id} style={{ display: "flex", gap: 7, marginBottom: 8, alignItems: "flex-start" }}>
                    <div style={{ flexShrink: 0, width: 2, height: 12, background: "#A6ED49", marginTop: 2 }} />
                    <span style={{ flexShrink: 0, fontSize: 14, fontWeight: 400, fontStyle: "normal", fontFamily: "'Montserrat', sans-serif", color: "#013125", lineHeight: 1.3 }}>
                      {step.step_number}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 400, fontStyle: "normal", fontFamily: "'Montserrat', sans-serif", color: "#013125", lineHeight: "16px", marginLeft: 7 }}>
                      {step.text}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* ── СОВЕТ НУТРИЦИОЛОГА ── */}
            {recipe.nutritionist_tips && (
              <div style={{ background: "#013125", borderRadius: 16, padding: 16, marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <Image src="/icons/nutritionist.svg" alt="" width={24} height={18} style={{ objectFit: "contain" }} />
                  <span style={{ fontSize: 16, fontWeight: 500, fontStyle: "italic", fontFamily: "'Montserrat', sans-serif", color: "#A6ED49" }}>
                    совет нутрициолога
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 400, fontStyle: "normal", fontFamily: "'Montserrat', sans-serif", color: "#F8FFEE", lineHeight: "20px" }}>
                  {recipe.nutritionist_tips.split("\n").map((line: string, i: number) =>
                    line.trim() ? <p key={i} style={{ margin: 0, marginBottom: 2 }}>{line}</p> : <br key={i} />
                  )}
                </div>
              </div>
            )}

            {/* ── ВИТАМИНЫ И МИНЕРАЛЫ ── */}
            {recipe.vitamins && (
              <div style={{ background: "#F8FFEE", borderRadius: 16, border: "1px solid #A6ED49", padding: 16, marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <Image src="/icons/vitamins.svg" alt="" width={24} height={18} style={{ objectFit: "contain" }} />
                  <span style={{ fontSize: 16, fontWeight: 500, fontStyle: "italic", fontFamily: "'Montserrat', sans-serif", color: "#013125" }}>
                    витамины и минералы
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 400, fontStyle: "normal", fontFamily: "'Montserrat', sans-serif", color: "#013125", lineHeight: "20px" }}>
                  {recipe.vitamins.split("\n").map((line: string, i: number) =>
                    line.trim() ? <p key={i} style={{ margin: 0, marginBottom: 2 }}>{line}</p> : <br key={i} />
                  )}
                </div>
              </div>
            )}

            {/* ── ТЕГИ ── */}
            {recipe.tags.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
                {recipe.tags.map((tag: { id: string; name: string }) => (
                  <div key={tag.id} style={{
                    background: "#fff", borderRadius: 20, padding: "4px 12px",
                    fontSize: 12, fontWeight: 500, fontStyle: "normal",
                    fontFamily: "'Montserrat', sans-serif", color: "#4F7453",
                  }}>
                    #{tag.name}
                  </div>
                ))}
              </div>
            )}

            {/* ── КНОПКА ПОДЕЛИТЬСЯ ── */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 100 }}>
              <ShareButton title={recipe.title} url={recipeUrl} />
            </div>

          </div>
        </div>
      </main>
    </>
  );
}
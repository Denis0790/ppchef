import { Metadata } from "next";
import { getRecipes, getNewRecipes } from "@/lib/api";
import RecipeList from "@/components/RecipeList";

export const metadata: Metadata = {
  title: "ПП Шеф — рецепты правильного питания с КБЖУ",
  description: "Более 1000 рецептов правильного питания с расчётом калорий, белков, жиров и углеводов. Завтраки, обеды, ужины, перекусы — вкусно и полезно.",
  keywords: [
    "рецепты правильного питания",
    "пп рецепты",
    "рецепты с кбжу",
    "здоровое питание рецепты",
    "диетические рецепты",
    "низкокалорийные рецепты",
    "рецепты для похудения",
    "пп завтраки",
    "пп обеды",
    "пп ужины",
    "правильное питание меню",
    "рецепты без сахара",
    "белковые рецепты",
  ],
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const params = await searchParams;
  const [data, newRecipes] = await Promise.all([
    getRecipes(),
    getNewRecipes(6),
  ]);
  return <RecipeList initialData={data} newRecipes={newRecipes} refCode={params.ref} />;
}
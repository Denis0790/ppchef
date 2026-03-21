import { getRecipes, getPopularRecipes } from "@/lib/api";
import RecipeList from "@/components/RecipeList";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const params = await searchParams;
  const [data, popular] = await Promise.all([
    getRecipes(),
    getPopularRecipes(5),
  ]);
  return <RecipeList initialData={data} popularRecipes={popular} refCode={params.ref} />;
}
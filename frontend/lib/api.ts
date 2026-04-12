const API_URL = typeof window === "undefined"
  ? (process.env.INTERNAL_API_URL || "http://backend:8000/api/v1")
  : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1");

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (res.status === 401 && retry) {
    const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (refreshRes.ok) {
      const data = await refreshRes.json();
      return apiFetch<T>(path, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${data.access_token}`,
        },
      }, false);
    } else {
      throw new Error("Сессия истекла. Войдите снова.");
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Ошибка сервера" }));
    const detail = Array.isArray(error.detail)
      ? error.detail.map((e: { msg: string }) => e.msg.replace(/^Value error,\s*/i, "")).join(", ")
      : error.detail || "Ошибка сервера";
    throw new Error(detail);
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text);
}

// ─── Рецепты ──────────────────────────────────────────────────
export interface Recipe {
  id: string;
  title: string;
  category: string;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  cook_time_minutes: number | null;
  servings: number | null;
  image_url: string | null;
  author_credit: string | null;
  created_at: string;
  ingredient_names: string[];
}
export interface RecipeDetail extends Recipe {
  benefit: string | null;
  nutritionist_tips: string | null;
  vitamins: string | null;
  steps: { id: string; step_number: number; text: string; image_url: string | null }[];
  ingredients: { id: string; name: string; amount: string | null }[];
  tags: { id: string; name: string }[];
}

export interface RecipeAdmin extends RecipeDetail {
  status: string;
  is_published: boolean;
  external_id: string | null;
  updated_at: string | null;
}

export interface RecipesResponse {
  items: Recipe[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface RecipeFilters {
  category?: string;
  calories_min?: number;
  calories_max?: number;
  protein_min?: number;
  cook_time_max?: number;
  search?: string;
  page?: number;
  page_size?: number;
}

export async function getRecipes(filters: RecipeFilters = {}): Promise<RecipesResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<RecipesResponse>(`/recipes${query}`, { cache: "no-store" });
}

export async function getRecipe(id: string): Promise<RecipeDetail> {
  return apiFetch<RecipeDetail>(`/recipes/${id}`, { cache: "no-store" });
}

export async function getPopularRecipes(limit = 5): Promise<Recipe[]> {
  return apiFetch<Recipe[]>(`/recipes/popular?limit=${limit}`, { cache: "no-store" });
}

// ─── Auth ─────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  is_premium: boolean;
  is_superuser: boolean;
  email_verified: boolean;
  daily_calories: number | null;
  daily_protein: number | null;
  daily_fat: number | null;
  daily_carbs: number | null;
  show_daily_percent: boolean;
  stop_words: string | null;
  subscription_plan: string | null;
  subscription_expires_at: string | null;
  ref_code: string | null;
  referral_count: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email: string, password: string, refCode?: string): Promise<User> {
  const url = refCode ? `/auth/register?ref=${refCode}` : "/auth/register";
  return apiFetch<User>(url, {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      agreed_to_terms: true,
      agreed_to_personal_data: true,
    }),
  });
}

export async function getMe(token: string): Promise<User> {
  return apiFetch<User>("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ─── Избранное ────────────────────────────────────────────────
interface FavoriteItem {
  id: string;
  recipe_id: string;
  created_at: string;
  recipe: Recipe;
}

export async function getFavorites(token: string): Promise<Recipe[]> {
  const items = await apiFetch<FavoriteItem[]>("/favorites", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return items.map(item => item.recipe);
}

export async function addFavorite(token: string, recipeId: string): Promise<void> {
  return apiFetch<void>(`/favorites/${recipeId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function removeFavorite(token: string, recipeId: string): Promise<void> {
  return apiFetch<void>(`/favorites/${recipeId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ─── Админ ────────────────────────────────────────────────────
export interface RecipeCreateData {
  title: string;
  category: string;
  calories?: number | null;
  protein?: number | null;
  fat?: number | null;
  carbs?: number | null;
  cook_time_minutes?: number | null;
  servings?: number | null;
  benefit?: string | null;
  nutritionist_tips?: string | null;
  vitamins?: string | null;
  image_url?: string | null;
  author_credit?: string | null;
  status: string;
  tags: string[];
  ingredients: { name: string; amount: string | null }[];
  steps: { step_number: number; text: string; image_url: string | null }[];
}

export async function adminGetRecipes(
  token: string,
  params: { search?: string; category?: string; status?: string; page?: number; page_size?: number } = {}
): Promise<RecipesResponse> {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== "") p.append(k, String(v)); });
  const query = p.toString() ? `?${p.toString()}` : "";
  return apiFetch<RecipesResponse>(`/admin/recipes${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function adminGetRecipe(token: string, id: string): Promise<RecipeAdmin> {
  return apiFetch<RecipeAdmin>(`/admin/recipes/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function adminCreateRecipe(token: string, data: RecipeCreateData): Promise<RecipeAdmin> {
  return apiFetch<RecipeAdmin>("/admin/recipes", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function adminUpdateRecipe(token: string, id: string, data: RecipeCreateData): Promise<RecipeAdmin> {
  return apiFetch<RecipeAdmin>(`/admin/recipes/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function adminDeleteRecipe(token: string, id: string): Promise<void> {
  return apiFetch<void>(`/admin/recipes/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function adminPublishRecipe(token: string, id: string): Promise<RecipeAdmin> {
  return apiFetch<RecipeAdmin>(`/admin/recipes/${id}/publish`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function adminUnpublishRecipe(token: string, id: string): Promise<RecipeAdmin> {
  return apiFetch<RecipeAdmin>(`/admin/recipes/${id}/unpublish`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ─── Поиск ────────────────────────────────────────────────────
export interface SearchRecipe extends Recipe {
  match_count?: number;
  total_ingredients?: number;
  match_percent?: number;
}

export async function searchRecipes(q: string, mode: "title" | "ingredients"): Promise<SearchRecipe[]> {
  const params = new URLSearchParams({ q, mode });
  return apiFetch<SearchRecipe[]>(`/recipes/search?${params.toString()}`, { cache: "no-store" });
}

export interface UpdateProfileData {
  daily_calories?: number | null;
  daily_protein?: number | null;
  daily_fat?: number | null;
  daily_carbs?: number | null;
  show_daily_percent?: boolean;
  stop_words?: string | null;
}

export async function updateMe(token: string, data: {
  daily_calories?: number | null;
  daily_protein?: number | null;
  daily_fat?: number | null;
  daily_carbs?: number | null;
  show_daily_percent?: boolean | null;
  stop_words?: string | null;
}): Promise<User> {
  return apiFetch<User>("/auth/me", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function suggestRecipe(token: string, data: RecipeCreateData): Promise<void> {
  return apiFetch<void>("/recipes/suggest", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function createPayment(token: string, plan: string): Promise<{ payment_id: string; confirmation_url: string }> {
  return apiFetch(`/payments/create`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ plan, return_url: `${window.location.origin}/subscription` }),
  });
}

export interface PartnerMatch {
  ingredient: string;
  ingredient_index: number;
  product: {
    id: string;
    title: string;
    url: string;
    store_name: string | null;
    store_logo_url: string | null;
    product_type: string;
  };
}

export async function matchPartnerProducts(ingredients: string): Promise<PartnerMatch[]> {
  return apiFetch<PartnerMatch[]>(`/partners/match?ingredients=${encodeURIComponent(ingredients)}`);
}

export async function getKitchenProducts(): Promise<PartnerMatch["product"][]> {
  return apiFetch<PartnerMatch["product"][]>(`/partners/kitchen`);
}

export interface AdminStats {
  total_users: number;
  today_users: number;
  premium_users: number;
  published_recipes: number;
  draft_recipes: number;
  suggested_recipes: number;
  rps: number;
}

export async function getAdminStats(token: string): Promise<AdminStats> {
  return apiFetch<AdminStats>("/admin/stats", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function verifyCode(email: string, code: string) {
  return apiFetch("/auth/verify-code", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}
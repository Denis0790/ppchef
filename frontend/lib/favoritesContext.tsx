"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { getFavorites, addFavorite, removeFavorite } from "@/lib/api";

interface FavoritesContextType {
  favoriteIds: Set<string>;
  toggle: (recipeId: string) => Promise<{ success: boolean; isPremium?: boolean }>;
  isReady: boolean;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favoriteIds: new Set(),
  toggle: async () => ({ success: false }),
  isReady: false,
});

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { token, isLoggedIn } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isReady, setIsReady] = useState(false);

    useEffect(() => {
    if (!isLoggedIn || !token) {
        setTimeout(() => {
        setFavoriteIds(new Set());
        setIsReady(true);
        }, 0);
        return;
    }
    let mounted = true;
    getFavorites(token)
        .then(favorites => {
        if (!mounted) return;
        setFavoriteIds(new Set(favorites.map(r => r.id)));
        })
        .catch(() => {})
        .finally(() => {
        if (!mounted) return;
        setIsReady(true);
        });
    return () => { mounted = false; };
    }, [isLoggedIn, token]);

  async function toggle(recipeId: string): Promise<{ success: boolean; isPremium?: boolean }> {
    if (!token) return { success: false };
    const isFav = favoriteIds.has(recipeId);
    try {
      if (isFav) {
        await removeFavorite(token, recipeId);
        setFavoriteIds(prev => { const s = new Set(prev); s.delete(recipeId); return s; });
      } else {
        await addFavorite(token, recipeId);
        setFavoriteIds(prev => new Set(prev).add(recipeId));
      }
      return { success: true };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("Premium") || msg.includes("Лимит") || msg.includes("10")) {
        return { success: false, isPremium: true };
      }
      return { success: false };
    }
  }

  return (
    <FavoritesContext.Provider value={{ favoriteIds, toggle, isReady }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
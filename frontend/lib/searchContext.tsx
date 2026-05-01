"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { SearchRecipe } from "@/lib/api";

type SearchMode = "title" | "ingredients";

interface SearchContextType {
  desktopQuery: string;
  setDesktopQuery: (q: string) => void;
  desktopMode: SearchMode;
  setDesktopMode: (m: SearchMode) => void;
  desktopResults: SearchRecipe[];
  setDesktopResults: (r: SearchRecipe[]) => void;
  desktopSearching: boolean;
  setDesktopSearching: (v: boolean) => void;
  desktopChips: string[];
  setDesktopChips: (c: string[]) => void;
  isDesktopSearchActive: boolean;
}

const SearchContext = createContext<SearchContextType | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [desktopQuery, setDesktopQuery] = useState("");
  const [desktopMode, setDesktopMode] = useState<SearchMode>("title");
  const [desktopResults, setDesktopResults] = useState<SearchRecipe[]>([]);
  const [desktopSearching, setDesktopSearching] = useState(false);
  const [desktopChips, setDesktopChips] = useState<string[]>([]);

  const isDesktopSearchActive = desktopQuery.trim().length > 0 || desktopChips.length > 0;

  return (
    <SearchContext.Provider value={{
      desktopQuery, setDesktopQuery,
      desktopMode, setDesktopMode,
      desktopResults, setDesktopResults,
      desktopSearching, setDesktopSearching,
      desktopChips, setDesktopChips,
      isDesktopSearchActive,
    }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be inside SearchProvider");
  return ctx;
}
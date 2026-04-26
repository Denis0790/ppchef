"use client";
import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  logout: () => Promise<void>;
  isLoggedIn: boolean;
  isReady: boolean;
  isPremium: boolean;
  setIsPremium: (v: boolean) => void;
  subscriptionExpiresAt: string | null;
  subscriptionPlan: string | null;
  trialExpiredModalShown: boolean;
  setTrialExpiredModalShown: (v: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  setToken: () => {},
  logout: async () => {},
  isLoggedIn: false,
  isReady: false,
  isPremium: false,
  setIsPremium: () => {},
  subscriptionExpiresAt: null,
  subscriptionPlan: null,
  trialExpiredModalShown: false,
  setTrialExpiredModalShown: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState<string | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [trialExpiredModalShown, setTrialExpiredModalShown] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleRefresh(t: string) {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    try {
      const payload = JSON.parse(atob(t.split(".")[1]));
      const expiresIn = payload.exp * 1000 - Date.now();
      const refreshIn = Math.max(expiresIn - 60_000, 0);
      refreshTimer.current = setTimeout(doRefresh, refreshIn);
    } catch {}
  }

  async function doRefresh(): Promise<string | null> {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setTokenState(data.access_token);
        scheduleRefresh(data.access_token);
        fetchProfile(data.access_token);
        return data.access_token;
      } else {
        setTokenState(null);
        setIsPremium(false);
        return null;
      }
    } catch {
      setTokenState(null);
      return null;
    }
  }

  async function fetchProfile(t: string) {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${t}` },
        credentials: "include",
      });
      if (res.ok) {
        const user = await res.json();
        setIsPremium(user.is_premium || false);
        setSubscriptionExpiresAt(user.subscription_expires_at || null);
        setSubscriptionPlan(user.subscription_plan || null);

        // Проверяем истёк ли пробный период
        if (
          user.subscription_plan === "trial" &&
          !user.is_premium &&
          user.subscription_expires_at
        ) {
          const expired = new Date(user.subscription_expires_at) < new Date();
          if (expired) {
            const key = `trial_expired_shown_${user.id}`;
            const alreadyShown = localStorage.getItem(key);
            if (!alreadyShown) {
              setTrialExpiredModalShown(true);
            }
          }
        }
      }
    } catch {}
  }

  function setToken(t: string | null) {
    setTokenState(t);
    if (t) {
      scheduleRefresh(t);
      fetchProfile(t);
    } else {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      setIsPremium(false);
      setSubscriptionExpiresAt(null);
      setSubscriptionPlan(null);
    }
  }

  async function logout() {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    setTokenState(null);
    setIsPremium(false);
    setSubscriptionExpiresAt(null);
    setSubscriptionPlan(null);
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {}
  }

  useEffect(() => {
    doRefresh().finally(() => {
      setTimeout(() => setIsReady(true), 100);
    });
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{
      token, setToken, logout,
      isLoggedIn: !!token, isReady,
      isPremium, setIsPremium,
      subscriptionExpiresAt, subscriptionPlan,
      trialExpiredModalShown, setTrialExpiredModalShown,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
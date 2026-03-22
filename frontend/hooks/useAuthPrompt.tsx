"use client";
import { useState } from "react";
import AuthPrompt from "@/components/AuthPrompt";

export function useAuthPrompt() {
  const [prompt, setPrompt] = useState<"auth" | "premium" | null>(null);

  const requireAuth = (callback?: () => void) => {
    setPrompt("auth");
  };

  const requirePremium = (callback?: () => void) => {
    setPrompt("premium");
  };

  const PromptComponent = prompt ? (
    <AuthPrompt type={prompt} onClose={() => setPrompt(null)} />
  ) : null;

  return { requireAuth, requirePremium, PromptComponent };
}
"use client";
import { useEffect } from "react";

export default function SplashHider() {
  useEffect(() => {
    const splash = document.getElementById("splash-screen");
    if (!splash) return;
    splash.classList.add("hidden");
    setTimeout(() => splash.remove(), 400);
  }, []);
  return null;
}
"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function RefCodeSaver() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) localStorage.setItem("ref_code", ref);
  }, [searchParams]);

  return null;
}
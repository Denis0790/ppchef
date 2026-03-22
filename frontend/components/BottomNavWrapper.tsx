"use client";
import { usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";

export default function BottomNavWrapper() {
  const pathname = usePathname();

  const hidden = [
    "/kitchen-secret",
    "/auth",
  ];

  if (hidden.some(p => pathname.startsWith(p))) return null;

  return <BottomNav />;
}
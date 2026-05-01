"use client";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import KbjuModal from "@/components/KbjuModal";
import AuthPrompt from "@/components/AuthPrompt";

const DESIGN = {
  headerBg: "#01311C",
  headerHeight: 70,
  logoHeight: 43,
  profileIconSize: 32,
};

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, isPremium } = useAuth();
  const [showKbju, setShowKbju] = useState(false);
  const [authPrompt, setAuthPrompt] = useState<"auth" | "premium" | null>(null);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  function handleKbjuClick() {
    if (!isLoggedIn) { setAuthPrompt("auth"); return; }
    if (!isPremium) { setAuthPrompt("premium"); return; }
    setShowKbju(true);
  }

  const navItems = [
    { label: "главная", href: "/", onClick: null },
    { label: "избранное", href: "/favorites", onClick: null },
    { label: "кбжу", href: "/kbju", onClick: handleKbjuClick },
  ];

  return (
    <>
      {showKbju && <KbjuModal onClose={() => setShowKbju(false)} />}
      {authPrompt && (
        <AuthPrompt
          type={authPrompt}
          onClose={() => setAuthPrompt(null)}
          desktop
        />
      )}

      <div style={{
        background: DESIGN.headerBg,
        borderBottom: "1px solid rgba(166,237,73,0.15)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ height: DESIGN.headerHeight, display: "flex", alignItems: "center" }}>
          <div style={{
            width: "100%", maxWidth: 1200, margin: "0 auto",
            padding: "0 20px", display: "flex",
            justifyContent: "space-between", alignItems: "center", gap: 24,
          }}>
            <Image
              src="/logo.svg" alt="ПП Шеф"
              height={DESIGN.logoHeight} width={200}
              style={{ width: "auto", cursor: "pointer", flexShrink: 0 }}
              onClick={() => router.push("/")}
            />

            <nav className="desktop-nav" style={{ display: "none", gap: 8, flexShrink: 0 }}>
              {navItems.map(({ label, href, onClick }) => (
                <div
                  key={href}
                  onClick={() => onClick ? onClick() : router.push(href)}
                  style={{
                    height: 36, padding: "0 18px", borderRadius: 100,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                    background: isActive(href) ? "rgba(166,237,73,0.15)" : "transparent",
                    border: isActive(href) ? "1px solid #A6ED49" : "1px solid transparent",
                    fontSize: 13, fontStyle: "italic",
                    fontFamily: "'Montserrat', sans-serif",
                    color: isActive(href) ? "#A6ED49" : "rgba(248,255,238,0.7)",
                    transition: "all 0.2s", whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </div>
              ))}
            </nav>

            <div onClick={() => router.push(isLoggedIn ? "/profile" : "/auth")} style={{ cursor: "pointer", flexShrink: 0 }}>
              <Image src="/profile.svg" alt="Профиль" width={DESIGN.profileIconSize} height={DESIGN.profileIconSize} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
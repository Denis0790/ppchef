"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

const DESIGN = {
  headerBg: "#01311C",
  headerHeight: 70,
  logoHeight: 43,
  profileIconSize: 32,
};

export default function Header() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  return (
    <div style={{
      height: DESIGN.headerHeight,
      padding: "0 20px",
      background: DESIGN.headerBg,
      borderBottom: "1px solid #ece7de",
      position: "sticky", top: 0, zIndex: 10,
      display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <Image src="/logo.svg" alt="ПП Шеф" height={DESIGN.logoHeight} width={200} style={{ width: "auto" }} />
      <div onClick={() => router.push(isLoggedIn ? "/profile" : "/auth")} style={{ cursor: "pointer" }}>
        <Image src="/profile.svg" alt="Профиль" width={DESIGN.profileIconSize} height={DESIGN.profileIconSize} />
      </div>
    </div>
  );
}
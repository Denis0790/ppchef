
"use client";
import Image from "next/image";

interface ShareButtonProps {
  title: string;
  url: string;
}

export default function ShareButton({ title, url }: ShareButtonProps) {
  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `ПП Шеф — ${title}`,
        text: `Смотри какой рецепт нашёл: ${title}`,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      alert("Ссылка скопирована!");
    }
  };

  return (
    <button
      onClick={handleShare}
      style={{
        width: 345, height: 32,
        background: "#013125",
        border: "none",
        borderRadius: 20,
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 8,
        cursor: "pointer",
      }}
    >
      <span style={{
        fontSize: 12,
        fontStyle: "italic",
        fontFamily: "'Montserrat', sans-serif",
        color: "#F8FFEE",
      }}>
        поделиться рецептом
      </span>
      {/* SVG стрелка — замени src на свой путь */}
      <Image src="/icons/strelka.svg" alt="" width={14} height={14} style={{ objectFit: "contain" }} />
    </button>
  );
}
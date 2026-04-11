"use client";

interface ShareButtonProps {
  title: string;
  url: string;
}

export default function ShareButton({ title, url }: ShareButtonProps) {
  const handleShare = async () => {
    if (navigator.share) {
      // нативный шер (мобилки) — откроет стандартное меню "поделиться"
      await navigator.share({
        title: `ПП Шеф — ${title}`,
        text: `Смотри какой рецепт нашёл: ${title}`,
        url,
      });
    } else {
      // десктоп — просто копируем ссылку
      await navigator.clipboard.writeText(url);
      alert("Ссылка скопирована!");
    }
  };

  return (
    <button onClick={handleShare} style={{
      background: "none",
      border: "1px solid #A6ED49",
      borderRadius: 20,
      padding: "6px 16px",
      fontSize: 12,
      color: "#013125",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontFamily: "'Montserrat', sans-serif",
    }}>
      <span>↗</span> поделиться
    </button>
  );
}
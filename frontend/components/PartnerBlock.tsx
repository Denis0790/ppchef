"use client";

const KUPER_URL = "https://trk.ppdu.ru/click?uid=327418&oid=2363&erid=2SDnjd8jdBo";

export default function PartnerBlock() {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        background: "#ffffff",
        borderRadius: 16,
        padding: "14px 16px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        display: "flex",
        alignItems: "center",
        gap: 14,
        border: "1.5px solid rgba(0,160,72,0.13)",
        cursor: "pointer",
      }}
        onClick={() => window.open(KUPER_URL, "_blank")}
      >
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          flexShrink: 0,
          background: "rgba(0,160,72,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
        }}>
          🛒
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#333333" }}>
            Купер
          </div>
          <div style={{ fontSize: 11, color: "#888888", marginTop: 2 }}>
            Доставка продуктов до двери
          </div>
        </div>
        <div style={{
          background: "#00A048",
          color: "#ffffff",
          borderRadius: 10,
          padding: "6px 12px",
          fontSize: 12,
          fontWeight: 600,
          flexShrink: 0,
        }}>
          Заказать
        </div>
      </div>
      <div style={{ fontSize: 9, color: "#bbbbbb", marginTop: 4, textAlign: "right" as const }}>
        Реклама · ООО «Инстамарт Сервис» · erid: 2SDnjd8jdBo
      </div>
    </div>
  );
}
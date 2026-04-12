"use client";
import Image from "next/image";

const KUPER_URL = "https://trk.ppdu.ru/click?uid=327418&oid=2363&erid=2SDnjd8jdBo";

export default function PartnerBlock() {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          width: 345,
          height: 97,
          background: "#01311C",
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 12,
          cursor: "pointer",
        }}
        onClick={() => window.open(KUPER_URL, "_blank")}
      >
        {/* SVG иконка*/}
        <div style={{ width: 37, height: 37, flexShrink: 0 }}>
          <Image src="/kyper/korzina.png" alt="Купер" width={37} height={37} style={{ objectFit: "contain" }} />
        </div>

        {/* Текст */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 16, fontWeight: 500,
            color: "#A6ED49",
            fontFamily: "'Montserrat', sans-serif",
            marginBottom: 4,
          }}>
            купер доставка
          </div>
          <div style={{
            fontSize: 12, fontWeight: 400,
            color: "#F8FFEE",
            fontFamily: "'Montserrat', sans-serif",
            lineHeight: 1.4,
          }}>
            привезем свежие продукты до двери из вашего любимого магазина
          </div>
        </div>

        {/* Кнопка заказать */}
        <div style={{
          width: 111, height: 33,
          flexShrink: 0,
          background: "#A6ED49",
          borderRadius: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <span style={{
            fontSize: 12,
            fontStyle: "italic",
            color: "#01311C",
            fontFamily: "'Montserrat', sans-serif",
          }}>
            заказать
          </span>
        </div>
      </div>

      {/* Маркировка рекламы */}
      <div style={{ fontSize: 9, color: "#bbbbbb", marginTop: 4, textAlign: "right" }}>
        Реклама · ООО «Инстамарт Сервис» · erid: 2SDnjd8jdBo
      </div>
    </div>
  );
}
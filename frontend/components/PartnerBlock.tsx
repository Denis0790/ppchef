"use client";
import Image from "next/image";

const SPORTMASTER_URL = "https://trk.ppdu.ru/click?uid=327418&oid=1240&erid=2SDnjcchrbW";

export default function PartnerBlock() {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          height: 97,
          background: "#01311C",
          borderRadius: 16,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 16px",
          gap: 6,
          cursor: "pointer",
        }}
        onClick={() => window.open(SPORTMASTER_URL, "_blank")}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 37, height: 37, flexShrink: 0 }}>
            <Image src="/sportmaster/sport-logo.jpg" alt="Спортмастер" width={37} height={37} style={{ objectFit: "contain" }} />
          </div>

          <div style={{
            fontSize: 16, fontWeight: 500,
            color: "#A6ED49",
            fontFamily: "'Montserrat', sans-serif",
            flex: 1,
          }}>
            спортмастер
          </div>

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
              перейти →
            </span>
          </div>
        </div>

        <div style={{
          fontSize: 12, fontWeight: 400,
          color: "#F8FFEE",
          fontFamily: "'Montserrat', sans-serif",
          lineHeight: 1.4,
        }}>
          товары для спорта и активного образа жизни
        </div>
      </div>

      <div style={{ fontSize: 9, color: "#bbbbbb", marginTop: 4, textAlign: "right" }}>
        Реклама · ООО «Спортмастер» · erid: 2SDnjcchrbW
      </div>
    </div>
  );
}
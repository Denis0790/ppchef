"use client";

export default function Loading() {
  return (
    <main style={{
      maxWidth: 480, margin: "0 auto",
      minHeight: "100vh", background: "#013125",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 32,
    }}>
      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.6); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.04); }
        }
        @keyframes blink {
          0%, 100% { opacity: 0.2; }
          50%       { opacity: 1; }
        }
        .logo-anim {
          animation: popIn 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards,
                     pulse 2.4s ease 0.8s infinite;
          opacity: 0;
        }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: #A6ED49; }
        .dot1 { animation: blink 1.2s ease 0.9s infinite; opacity: 0.2; }
        .dot2 { animation: blink 1.2s ease 1.1s infinite; opacity: 0.2; }
        .dot3 { animation: blink 1.2s ease 1.3s infinite; opacity: 0.2; }
      `}</style>

      <img
        src="/logo.png"
        alt="ПП Шеф"
        className="logo-anim"
        style={{ width: 220, height: "auto" }}
      />

      <div style={{ display: "flex", gap: 8 }}>
        <div className="dot dot1" />
        <div className="dot dot2" />
        <div className="dot dot3" />
      </div>
    </main>
  );
}
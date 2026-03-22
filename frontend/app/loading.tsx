"use client";

export default function Loading() {
  return (
    <main style={{
      maxWidth: 480, margin: "0 auto",
      minHeight: "100vh", background: "#F5F0E8",
      display: "flex", alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        border: "3px solid #ece7de",
        borderTop: "3px solid #01311C",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
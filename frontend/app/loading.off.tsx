export function InlineSpinner({ size = 24 }: { size?: number }) {
  const border = Math.max(2, Math.round(size / 8));
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `${border}px solid #ece7de`,
        borderTop: `${border}px solid #01311C`,
        animation: "ppchef-spin 0.8s linear infinite",
        display: "inline-block",
      }}
    />
  );
}

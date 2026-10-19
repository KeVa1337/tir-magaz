"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="uk">
      <body style={{ fontFamily: "system-ui", background: "#0a0c0f", color: "#e7ebf0", display: "grid", placeItems: "center", minHeight: "100dvh", margin: 0 }}>
        <div style={{ textAlign: "center" }}>
          <h1>Сервіс тимчасово недоступний</h1>
          <button onClick={reset} style={{ marginTop: 16, padding: "10px 20px", background: "#ffb020", border: 0, borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Оновити</button>
        </div>
      </body>
    </html>
  );
}

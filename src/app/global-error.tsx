"use client";

import { useEffect } from "react";

/**
 * Último recurso: erro no layout raiz. Substitui o documento inteiro e não recebe o globals.css,
 * então o estilo é inline e segue o tema do sistema.
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pt-BR" style={{ colorScheme: "light dark" }}>
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
          textAlign: "center",
        }}
      >
        <title>Algo deu errado · Agendly</title>
        <div style={{ maxWidth: 380 }}>
          <h1 style={{ margin: 0, fontSize: 24, lineHeight: 1.2 }}>Algo deu errado</h1>
          <p style={{ margin: "12px 0 24px", fontSize: 15, lineHeight: 1.55, opacity: 0.75 }}>
            Tivemos um problema inesperado. Tente de novo em instantes.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              height: 48,
              padding: "0 22px",
              border: 0,
              borderRadius: 12,
              background: "CanvasText",
              color: "Canvas",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}

"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { publicUrl } from "@/lib/public-link";

/**
 * QR Code da página pública como data URL (PNG). Gerado no navegador, em alta resolução para
 * impressão; preto sobre branco independe do tema, para qualquer leitor.
 */
export function useQrCode(slug: string, enabled = true) {
  const [result, setResult] = useState<{ slug: string; dataUrl: string } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    QRCode.toDataURL(publicUrl(slug), { width: 1024, margin: 2, errorCorrectionLevel: "M" }).then((dataUrl) => {
      if (!cancelled) setResult({ slug, dataUrl });
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, slug]);

  return result?.slug === slug ? result.dataUrl : null;
}

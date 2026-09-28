"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { publicLinkLabel, publicUrl } from "@/lib/public-link";
import { useCopyPublicLink } from "./use-copy-public-link";

/** QR Code da página pública, para imprimir no balcão ou postar nas redes. */
export function QrCodeDialog({
  slug,
  open,
  onOpenChange,
}: {
  slug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const copyLink = useCopyPublicLink(slug);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    // Alta resolução para impressão; preto sobre branco independe do tema, para qualquer leitor
    QRCode.toDataURL(publicUrl(slug), { width: 1024, margin: 2, errorCorrectionLevel: "M" }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });

    return () => {
      cancelled = true;
    };
  }, [open, slug]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="text-center sm:max-w-[380px]" showCloseButton={false}>
        <div>
          <DialogTitle>QR Code da sua página</DialogTitle>
          <DialogDescription className="mt-1">
            Imprima no balcão ou poste nas redes. Quem escanear cai direto no agendamento.
          </DialogDescription>
        </div>

        <div className="mx-auto grid size-[200px] place-items-center overflow-hidden rounded-lg border bg-white p-2">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URL gerada no navegador
            <img src={dataUrl} alt={`QR Code de ${publicLinkLabel(slug)}`} className="size-full" />
          ) : (
            <div className="skeleton size-full rounded-md" />
          )}
        </div>

        <div className="text-[14px] font-semibold break-all">{publicLinkLabel(slug)}</div>

        <div className="flex gap-2">
          <Button variant="secondary" className="h-[46px] flex-1 rounded-[11px]" onClick={copyLink}>
            Copiar link
          </Button>
          <Button
            className="h-[46px] flex-1 rounded-[11px]"
            nativeButton={false}
            aria-disabled={!dataUrl}
            render={<a href={dataUrl ?? undefined} download={`qrcode-${slug}.png`} />}
          >
            <Icon name="download" size={19} />
            Baixar PNG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

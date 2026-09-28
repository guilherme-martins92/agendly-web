"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { publicUrl } from "@/lib/public-link";

/** Copia o link público do negócio e avisa com um toast. */
export function useCopyPublicLink(slug: string) {
  return useCallback(async () => {
    try {
      await navigator.clipboard.writeText(publicUrl(slug));
      toast.info("Link copiado");
    } catch {
      toast.error("Não foi possível copiar. Selecione o link e copie manualmente.");
    }
  }, [slug]);
}

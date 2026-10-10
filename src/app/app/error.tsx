"use client";

import { useEffect } from "react";
import { LoadError } from "@/components/ui/controls";

/** Erro inesperado ao renderizar uma tela do backoffice. O menu continua no lugar; só o conteúdo é substituído. */
export default function BackofficeError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-[1100px]">
      <LoadError what="esta tela" messages={["Ocorreu um erro inesperado. Tente novamente."]} onRetry={() => retry()} />
    </div>
  );
}

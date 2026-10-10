"use client";

import { useEffect } from "react";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";

/** Falha ao carregar a página pública (API fora do ar, limite de requisições): o negócio existe, só não deu para buscar agora. */
export default function PublicBusinessError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3.5 px-6 py-16 text-center">
      <title>Página indisponível · Agendly</title>
      <div className="grid size-[72px] place-items-center rounded-full border bg-surface text-text-2">
        <Icon name="warning" size={34} />
      </div>
      <h1 className="mt-1.5 text-[26px] leading-tight font-bold tracking-[-0.02em]">Não foi possível abrir a página</h1>
      <p className="max-w-[380px] text-[15px] leading-[1.55] font-medium text-pretty text-text-2">
        Tivemos um problema ao carregar o agendamento. Costuma ser passageiro: tente de novo em instantes.
      </p>
      <Button size="lg" className="mt-3" onClick={() => retry()}>
        Tentar novamente
      </Button>
      <div className="mt-7 text-[12px] font-bold text-text-3">agendly</div>
    </div>
  );
}

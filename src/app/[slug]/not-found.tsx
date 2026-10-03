import type { Metadata } from "next";
import { Icon } from "@/components/icon";

export const metadata: Metadata = { title: "Página não encontrada", robots: { index: false, follow: false } };

/** Slug inexistente ou negócio sem a página pública no ar. */
export default function PublicBusinessNotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3.5 px-6 py-16 text-center">
      <div className="grid size-[72px] place-items-center rounded-full border bg-surface text-text-2">
        <Icon name="storefront" size={34} />
      </div>
      <h1 className="mt-1.5 text-[26px] leading-tight font-bold tracking-[-0.02em]">Página não encontrada</h1>
      <p className="max-w-[380px] text-[15px] leading-[1.55] font-medium text-pretty text-text-2">
        Este endereço não existe ou o negócio não está recebendo agendamentos online no momento.
      </p>
      <p className="mt-1.5 max-w-[360px] text-[14px] leading-normal font-medium text-text-2">
        Confira se o link está correto ou fale com o estabelecimento pelo WhatsApp ou Instagram.
      </p>
      <div className="mt-7 text-[12px] font-bold text-text-3">agendly</div>
    </div>
  );
}

"use client";

import { useQueries } from "@tanstack/react-query";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useSession } from "@/components/backoffice/session-context";
import { useCopyPublicLink } from "@/components/backoffice/use-copy-public-link";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { ListSkeleton, LoadError } from "@/components/ui/controls";
import { getListWorkSchedulesQueryOptions, useListProfessionals } from "@/lib/api/generated/professionals/professionals";
import { useListServices } from "@/lib/api/generated/services/services";
import { cn } from "@/lib/utils";

type StepKey = "svc" | "pro" | "work" | "share";

type Step = {
  key: StepKey;
  title: string;
  text: string;
  done: boolean;
  cta: { label: string; href?: string; onClick?: () => void };
};

const shareStorageKey = (businessId: string) => `agendly-onboarding-shared:${businessId}`;

// "Compartilhou o link" não existe no backend (não é um estado do negócio) — é uma preferência local.
// useSyncExternalStore evita divergir a primeira renderização do cliente da do servidor (sem localStorage).
const sharedListeners = new Set<() => void>();

function readShared(businessId: string) {
  try {
    return localStorage.getItem(shareStorageKey(businessId)) === "1";
  } catch {
    return false;
  }
}

function subscribeShared(callback: () => void) {
  sharedListeners.add(callback);
  return () => sharedListeners.delete(callback);
}

function markShared(businessId: string) {
  try {
    localStorage.setItem(shareStorageKey(businessId), "1");
  } catch {
    // Armazenamento indisponível (ex.: navegação privada): o passo só fica marcado nesta visita
  }
  sharedListeners.forEach((listener) => listener());
}

/** Checklist de 4 passos (em qualquer ordem) para deixar o negócio pronto para receber agendamentos. */
export function OnboardingScreen() {
  const { business } = useSession();
  const copyLink = useCopyPublicLink(business.slug);

  const services = useListServices();
  const professionals = useListProfessionals();
  const scheduleQueries = useQueries({
    queries: (professionals.data ?? []).map((p) => getListWorkSchedulesQueryOptions(p.id)),
  });

  const shared = useSyncExternalStore(
    subscribeShared,
    () => readShared(business.id),
    () => false,
  );

  if (services.isError || professionals.isError) {
    return (
      <div className="mx-auto flex max-w-[720px] flex-col gap-4">
        <LoadError
          what="os dados dos primeiros passos"
          messages={services.error?.errors ?? professionals.error?.errors}
          onRetry={() => {
            services.refetch();
            professionals.refetch();
          }}
        />
      </div>
    );
  }

  if (services.isPending || professionals.isPending) {
    return (
      <div className="mx-auto flex max-w-[720px] flex-col gap-4">
        <div className="skeleton h-8 w-80 rounded-md" />
        <ListSkeleton rows={4} />
      </div>
    );
  }

  const hasService = services.data.length > 0;
  const hasProfessional = professionals.data.length > 0;
  const lastProfessional = professionals.data.at(-1);
  const hasSchedule = scheduleQueries.some((q) => (q.data?.length ?? 0) > 0);

  const steps: Step[] = [
    {
      key: "svc",
      title: "Cadastre um serviço",
      text: "Nome, duração e preço. Por exemplo: Corte masculino, 30 min, R$ 45,00.",
      done: hasService,
      cta: { label: "Cadastrar serviço", href: "/app/servicos" },
    },
    {
      key: "pro",
      title: "Cadastre um profissional",
      text: "Quem atende no seu negócio. Depois, marque os serviços que cada um realiza.",
      done: hasProfessional,
      cta: { label: "Cadastrar profissional", href: "/app/profissionais" },
    },
    {
      key: "work",
      title: "Defina os horários de trabalho",
      text: "Dias e intervalos de cada profissional, como 09:00–12:00 e 13:00–18:00.",
      done: hasSchedule,
      cta: lastProfessional
        ? { label: "Definir horários", href: `/app/profissionais/${lastProfessional.id}?aba=horarios` }
        : { label: "Cadastrar profissional primeiro", href: "/app/profissionais" },
    },
    {
      key: "share",
      title: "Compartilhe seu link",
      text: "Divulgue no Instagram e no WhatsApp, ou imprima o QR Code para o balcão.",
      done: shared,
      cta: {
        label: "Copiar link",
        onClick: () => {
          copyLink();
          markShared(business.id);
        },
      },
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const percent = Math.round((doneCount / steps.length) * 100);
  const allDone = doneCount === steps.length;
  const firstPendingKey = steps.find((s) => !s.done)?.key;

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-5">
      <div>
        <div className="text-[13px] font-bold text-brand-text">Bem-vindo ao Agendly</div>
        <h1 className="mt-1.5 text-[22px] leading-tight font-bold tracking-[-0.02em] text-pretty md:text-[28px]">
          Vamos deixar {business.name} pronta para receber agendamentos
        </h1>
        <div className="mt-1.5 text-[15px] font-medium text-text-2">Quatro passos rápidos, em qualquer ordem.</div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between text-[13px] font-semibold text-text-2">
          <span>
            {doneCount} de {steps.length} passos concluídos
          </span>
          <span>{percent}%</span>
        </div>
        <div className="h-2 rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-surface shadow-sm">
        {steps.map((step, i) => {
          const current = step.key === firstPendingKey;
          return (
            <div key={step.key} className={cn("flex gap-3.5 p-5", i > 0 && "border-t")}>
              <div
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-full text-[15px] font-bold",
                  step.done ? "bg-done-bg text-done-fg" : current ? "bg-brand text-on-brand" : "bg-surface-2 text-text-2",
                )}
              >
                {step.done ? <Icon name="check" size={20} /> : i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className={cn("text-[16px] font-bold", step.done && "text-text-2")}>{step.title}</div>
                <div className="mt-0.5 text-[14px] leading-[1.5] font-medium text-pretty text-text-2">{step.text}</div>
                {step.done ? (
                  <div className="mt-2.5 text-[13px] font-semibold text-done-fg">Concluído</div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant={current ? "primary" : "secondary"}
                      size="sm"
                      className="h-[42px] px-4"
                      nativeButton={!step.cta.href}
                      render={step.cta.href ? <Link href={step.cta.href} /> : undefined}
                      onClick={step.cta.onClick}
                    >
                      {step.cta.label}
                    </Button>
                    {step.key === "share" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-[42px] px-4"
                        nativeButton={false}
                        render={<Link href="/app/configuracoes" />}
                      >
                        <Icon name="qr_code_2" size={19} />
                        QR Code
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {allDone && (
        <div className="flex flex-wrap items-center gap-3.5 rounded-2xl bg-done-bg p-5 text-done-fg">
          <Icon name="celebration" size={28} />
          <div className="flex-1 text-[15px] leading-[1.45] font-semibold">Tudo pronto. Sua página já pode receber agendamentos.</div>
          <Button nativeButton={false} render={<Link href="/app/agenda" />}>
            Ir para a agenda
          </Button>
        </div>
      )}
    </div>
  );
}

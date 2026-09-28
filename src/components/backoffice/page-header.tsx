import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icon";
import { cn } from "@/lib/utils";

/** Título da tela (26px no desktop, 20px no celular) com subtítulo e ação à direita. */
export function PageHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        <h1 className="text-[20px] leading-tight font-bold tracking-[-0.02em] md:text-[26px]">{title}</h1>
        {subtitle && <div className="mt-1 text-[14px] leading-snug font-medium text-text-2">{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

/** Estado vazio no padrão do design (ícone em círculo, título, texto e ação opcional). */
export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: IconName;
  title: string;
  text: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-dashed border-border-strong bg-surface px-6 py-14 text-center">
      <div className="grid size-14 place-items-center rounded-full bg-brand-soft text-brand-text">
        <Icon name={icon} size={28} />
      </div>
      <div className="text-[18px] leading-snug font-bold">{title}</div>
      <div className="max-w-[420px] text-[14px] leading-normal font-medium text-pretty text-text-2">{text}</div>
      {action && <div className="mt-1.5">{action}</div>}
    </div>
  );
}

/** Tela ainda não construída: mantém a navegação completa enquanto as etapas avançam. */
export function ComingSoon({ title, stage }: { title: string; stage: string }) {
  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-4">
      <PageHeader title={title} />
      <EmptyState icon="schedule" title="Em construção" text={`Esta tela chega na etapa de ${stage}.`} />
    </div>
  );
}

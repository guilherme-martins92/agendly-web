"use client";

import { Icon } from "@/components/icon";
import { ApiError } from "@/lib/api/api-error";
import { useGetCurrentUser } from "@/lib/api/generated/users/users";

// Página provisória da etapa 2 (base do projeto): valida BFF, sessão, cliente gerado e tokens visuais.
// Será substituída pelo shell do backoffice na etapa 3.
export default function BackofficeHome() {
  const { data: user, error, isPending } = useGetCurrentUser();

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center gap-2.5">
        <div className="grid size-8 place-items-center rounded-[9px] bg-brand text-[17px] font-bold text-on-brand">a</div>
        <span className="text-xl font-bold tracking-tight">agendly</span>
      </div>

      <section className="rounded-lg border bg-surface p-5 shadow-sm">
        {isPending && <div className="skeleton h-4 w-1/2 rounded-sm" />}
        {error && (
          <p className="text-danger">{error instanceof ApiError ? error.errors.join(" ") : "Erro inesperado."}</p>
        )}
        {user && (
          <div className="flex items-center gap-3">
            <Icon name="check_circle" filled className="text-done-dot" />
            <div>
              <div className="font-semibold">{user.name}</div>
              <div className="text-sm text-text-2">
                {user.email} · {user.role}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="flex flex-wrap gap-2">
        {(["sched", "conf", "done", "canc", "noshow"] as const).map((s) => (
          <span
            key={s}
            className="inline-flex h-[26px] items-center gap-1.5 rounded-full px-2.5 text-[13px] font-semibold"
            style={{ background: `var(--${s}-bg)`, color: `var(--${s}-fg)` }}
          >
            <span className="size-[7px] rounded-full" style={{ background: `var(--${s}-dot)` }} />
            {s}
          </span>
        ))}
      </section>

      <section className="flex gap-3 text-text-2">
        <Icon name="calendar_month" />
        <Icon name="content_cut" />
        <Icon name="space_dashboard" filled />
        <Icon name="qr_code_2" />
      </section>
    </main>
  );
}

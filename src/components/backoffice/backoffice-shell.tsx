"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { AlertBanner } from "@/components/ui/field";
import { useGetMyBusiness } from "@/lib/api/generated/businesses/businesses";
import { useGetCurrentUser } from "@/lib/api/generated/users/users";
import { EMPLOYEE_HOME, isOwnerOnly, type Role } from "@/lib/navigation";
import { publicLinkLabel } from "@/lib/public-link";
import { DesktopHeader, MobileHeader } from "./header";
import { BottomNav, Sidebar } from "./navigation";
import { QrCodeDialog } from "./qr-code-dialog";
import { SessionContext, type BackofficeSession } from "./session-context";

/**
 * Estrutura do backoffice: menu lateral + cabeçalho no desktop; cabeçalho + navegação inferior no
 * celular. Carrega usuário e negócio uma vez e os disponibiliza às telas via useSession().
 */
export function BackofficeShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [qrOpen, setQrOpen] = useState(false);

  const userQuery = useGetCurrentUser();
  const businessQuery = useGetMyBusiness();

  const unauthorized = Boolean(userQuery.error?.isUnauthorized || businessQuery.error?.isUnauthorized);
  const role = userQuery.data?.role as Role | undefined;
  const forbiddenForRole = role === "Employee" && isOwnerOnly(pathname);

  useEffect(() => {
    if (unauthorized) router.replace(`/entrar?next=${encodeURIComponent(pathname)}`);
  }, [unauthorized, pathname, router]);

  // O proxy já barra pelo token; aqui cobre a navegação no cliente e tokens renovados no caminho
  useEffect(() => {
    if (forbiddenForRole) router.replace(EMPLOYEE_HOME);
  }, [forbiddenForRole, router]);

  const session = useMemo<BackofficeSession | null>(() => {
    if (!userQuery.data || !businessQuery.data || !role) return null;
    return { user: userQuery.data, business: businessQuery.data, role, isOwner: role === "Owner" };
  }, [userQuery.data, businessQuery.data, role]);

  const failed = !unauthorized && (userQuery.isError || businessQuery.isError);

  if (failed) {
    const error = userQuery.error ?? businessQuery.error;
    return (
      <div className="grid min-h-dvh place-items-center bg-background p-4">
        <AlertBanner
          className="max-w-md"
          title="Não foi possível carregar o painel"
          messages={error?.errors ?? ["Verifique sua conexão e tente novamente."]}
          action={
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                userQuery.refetch();
                businessQuery.refetch();
              }}
            >
              Tentar novamente
            </Button>
          }
        />
      </div>
    );
  }

  if (!session || unauthorized || forbiddenForRole) {
    return <ShellSkeleton />;
  }

  return (
    <SessionContext.Provider value={session}>
      <div className="flex h-dvh bg-background">
        <Sidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <DesktopHeader onOpenQr={() => setQrOpen(true)} />
          <MobileHeader onOpenQr={() => setQrOpen(true)} />
          <main className="min-h-0 flex-1 overflow-auto px-4 pt-4 pb-6 md:px-8 md:pt-7 md:pb-10">
            {session.isOwner && !session.business.active && <InactiveBusinessBanner slug={session.business.slug} />}
            {children}
          </main>
          <BottomNav />
        </div>
      </div>
      <QrCodeDialog slug={session.business.slug} open={qrOpen} onOpenChange={setQrOpen} />
    </SessionContext.Provider>
  );
}

function InactiveBusinessBanner({ slug }: { slug: string }) {
  return (
    <div
      role="status"
      className="mx-auto mb-4 flex max-w-[1240px] flex-wrap items-center gap-3 rounded-[12px] border border-sched-dot bg-sched-bg px-4 py-3 text-sched-fg"
    >
      <Icon name="visibility_off" size={22} />
      <div className="min-w-[200px] flex-1 text-[14px] leading-[1.45] font-semibold">
        Seu negócio está desativado. A página {publicLinkLabel(slug)} está fora do ar e não recebe agendamentos.
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="border-sched-dot"
        nativeButton={false}
        render={<Link href="/app/configuracoes" />}
      >
        Reativar
      </Button>
    </div>
  );
}

/** Esqueleto no formato do shell, para a tela não "pular" quando os dados chegam. */
function ShellSkeleton() {
  return (
    <div className="flex h-dvh bg-background" aria-busy="true" aria-label="Carregando">
      <div className="hidden w-60 shrink-0 flex-col gap-3 border-r bg-surface px-5 py-6 md:flex">
        <div className="skeleton mb-4 h-7 w-32 rounded-md" />
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton h-5 w-40 rounded-md" />
        ))}
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex h-[60px] items-center gap-3 border-b bg-surface px-4 md:h-16 md:px-6">
          <div className="skeleton h-5 w-44 rounded-md" />
        </div>
        <div className="flex flex-col gap-3 p-4 md:p-8">
          <div className="skeleton h-7 w-56 rounded-md" />
          <div className="skeleton h-4 w-72 rounded-md" />
        </div>
      </div>
    </div>
  );
}

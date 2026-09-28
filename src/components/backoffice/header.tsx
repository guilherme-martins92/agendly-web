"use client";

import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/navigation";
import { publicLinkLabel } from "@/lib/public-link";
import { useSession } from "./session-context";
import { useCopyPublicLink } from "./use-copy-public-link";
import { UserMenu } from "./user-menu";

type HeaderProps = { onOpenQr: () => void };

/** Cabeçalho do desktop: negócio, link público com ações e menu do usuário. */
export function DesktopHeader({ onOpenQr }: HeaderProps) {
  const { user, business, role } = useSession();
  const copyLink = useCopyPublicLink(business.slug);

  return (
    <header className="hidden h-16 shrink-0 items-center gap-3 border-b bg-surface px-6 md:flex">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <div className="text-[16px] font-bold whitespace-nowrap">{business.name}</div>
        <div className="ml-1.5 flex h-8 min-w-0 items-center gap-1.5 rounded-[8px] border bg-surface-2 px-2.5 text-[13px] font-medium text-text-2">
          <Icon name="link" size={16} />
          <span className="truncate">{publicLinkLabel(business.slug)}</span>
        </div>
        <Button variant="secondary" size="xs" onClick={copyLink}>
          <Icon name="content_copy" size={17} />
          Copiar link
        </Button>
        <Button variant="secondary" size="xs" onClick={onOpenQr}>
          <Icon name="qr_code_2" size={17} />
          QR Code
        </Button>
      </div>

      <UserMenu
        trigger={
          <button type="button" className="flex h-11 cursor-pointer items-center gap-2.5 rounded-[12px] pr-2 pl-1 text-left hover:bg-surface-2">
            <Avatar name={user.name} />
            <span>
              <span className="block text-[14px] leading-tight font-semibold">{user.name}</span>
              <span className="block text-[12px] leading-tight font-medium text-text-2">{ROLE_LABEL[role]}</span>
            </span>
            <Icon name="expand_more" className="text-text-2" />
          </button>
        }
      />
    </header>
  );
}

/** Cabeçalho do celular: negócio e link em duas linhas, ações como ícones. */
export function MobileHeader({ onOpenQr }: HeaderProps) {
  const { user, business } = useSession();
  const copyLink = useCopyPublicLink(business.slug);

  return (
    <header className="flex h-[60px] shrink-0 items-center gap-1 border-b bg-surface pt-[env(safe-area-inset-top)] pr-2 pl-4 md:hidden">
      <div className="min-w-0 flex-1">
        <div className="truncate text-[16px] leading-tight font-bold">{business.name}</div>
        <div className="truncate text-[12px] font-medium text-text-2">{publicLinkLabel(business.slug)}</div>
      </div>
      <Button variant="subtle" size="icon" aria-label="Copiar link" onClick={copyLink}>
        <Icon name="content_copy" size={22} />
      </Button>
      <Button variant="subtle" size="icon" aria-label="QR Code" onClick={onOpenQr}>
        <Icon name="qr_code_2" size={22} />
      </Button>
      <UserMenu
        trigger={
          <button type="button" aria-label="Menu do usuário" className="grid size-11 cursor-pointer place-items-center">
            <Avatar name={user.name} small />
          </button>
        }
      />
    </header>
  );
}

function Avatar({ name, small }: { name: string; small?: boolean }) {
  return (
    <span
      className={
        small
          ? "grid size-[34px] place-items-center rounded-full bg-brand-soft text-[12px] font-bold text-brand-text"
          : "grid size-9 place-items-center rounded-full bg-brand-soft text-[13px] font-bold text-brand-text"
      }
    >
      {initials(name)}
    </span>
  );
}

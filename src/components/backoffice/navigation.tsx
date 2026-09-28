"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icon";
import { Logo } from "@/components/logo";
import { bottomNavItems, isActive, sidebarItems, type NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useSession } from "./session-context";
import { UserMenu } from "./user-menu";

/** Menu lateral do desktop (240px). */
export function Sidebar({ extraItems = [] }: { extraItems?: NavItem[] }) {
  const { role } = useSession();
  const pathname = usePathname();
  const items = [...extraItems, ...sidebarItems(role)];

  return (
    <nav aria-label="Principal" className="hidden w-60 shrink-0 flex-col gap-0.5 border-r bg-surface px-3 py-[18px] md:flex">
      <Logo size="sm" className="px-2.5 pt-1 pb-[22px]" />
      {items.map((item) => {
        const active = isActive(item, pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-[42px] items-center gap-3 rounded-[10px] px-3 text-[14px] transition-colors",
              active ? "bg-brand-soft font-bold text-brand-text" : "font-medium text-text-2 hover:bg-surface-2",
            )}
          >
            <Icon name={item.icon} size={21} filled={active} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Navegação inferior do celular; o proprietário tem um item "Mais" com o restante do menu. */
export function BottomNav() {
  const { role } = useSession();
  const pathname = usePathname();
  const { items, overflow } = bottomNavItems(role);

  return (
    <nav aria-label="Principal" className="flex h-[68px] shrink-0 border-t bg-surface px-1 pb-[env(safe-area-inset-bottom)] md:hidden">
      {items.map((item) => {
        const active = isActive(item, pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold",
              active ? "text-brand-text" : "text-text-2",
            )}
          >
            <BottomNavPill icon={item.icon} active={active} />
            {item.label}
          </Link>
        );
      })}

      {overflow.length > 0 && (
        <UserMenu
          side="top"
          extraLinks={overflow}
          trigger={
            <button
              type="button"
              className={cn(
                "flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 text-[11px] font-semibold",
                overflow.some((item) => isActive(item, pathname)) ? "text-brand-text" : "text-text-2",
              )}
            >
              <BottomNavPill icon="menu" active={overflow.some((item) => isActive(item, pathname))} />
              Mais
            </button>
          }
        />
      )}
    </nav>
  );
}

function BottomNavPill({ icon, active }: { icon: NavItem["icon"]; active: boolean }) {
  return (
    <span className={cn("grid h-[30px] w-[52px] place-items-center rounded-full", active && "bg-brand-soft")}>
      <Icon name={icon} size={22} filled={active} />
    </span>
  );
}

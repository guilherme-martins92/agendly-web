"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { toast } from "sonner";
import { Icon } from "@/components/icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/api/session-client";
import { ROLE_LABEL, type NavItem } from "@/lib/navigation";
import { useTheme } from "@/lib/theme";
import { useSession } from "./session-context";

const itemClass = "h-11 gap-2.5 rounded-[9px] px-3 text-[14px] font-medium text-text";

/**
 * Menu do usuário: dados da conta, atalhos extras (no celular), troca de tema e sair.
 * O gatilho é passado por quem usa (avatar no cabeçalho ou "Mais" na navegação inferior).
 */
export function UserMenu({
  trigger,
  extraLinks = [],
  side = "bottom",
}: {
  trigger: ReactElement;
  extraLinks?: NavItem[];
  side?: "top" | "bottom";
}) {
  const { user, role } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useTheme();

  async function handleLogout() {
    try {
      await logout();
    } finally {
      queryClient.clear();
      router.replace("/entrar");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent side={side} align="end" sideOffset={8} className="w-[260px] rounded-lg p-1.5 shadow-lg">
        <div className="mb-1.5 border-b px-3 pt-3 pb-2.5">
          <div className="text-[14px] font-bold">{user.name}</div>
          <div className="truncate text-[13px] font-medium text-text-2">{user.email}</div>
          <span className="mt-2 inline-flex h-[22px] items-center rounded-full bg-brand-soft px-2 text-[11px] font-bold text-brand-text">
            {ROLE_LABEL[role]}
          </span>
        </div>

        {extraLinks.map((link) => (
          <DropdownMenuItem key={link.href} className={itemClass} onClick={() => router.push(link.href)}>
            <Icon name={link.icon} />
            {link.label}
          </DropdownMenuItem>
        ))}

        <DropdownMenuItem className={itemClass} onClick={toggleTheme}>
          <Icon name={theme === "dark" ? "light_mode" : "dark_mode"} />
          {theme === "dark" ? "Tema claro" : "Tema escuro"}
        </DropdownMenuItem>

        <DropdownMenuItem
          className={`${itemClass} text-danger focus:bg-danger-soft focus:text-danger`}
          onClick={() => {
            handleLogout().catch(() => toast.error("Não foi possível sair. Tente novamente."));
          }}
        >
          <Icon name="logout" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

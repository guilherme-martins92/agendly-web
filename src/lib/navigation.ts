import type { IconName } from "@/components/icon";

export type Role = "Owner" | "Employee";

export type NavItem = { href: string; label: string; icon: IconName };

const DASHBOARD: NavItem = { href: "/app", label: "Dashboard", icon: "space_dashboard" };
const AGENDA: NavItem = { href: "/app/agenda", label: "Agenda", icon: "calendar_month" };
const CUSTOMERS: NavItem = { href: "/app/clientes", label: "Clientes", icon: "group" };
const SERVICES: NavItem = { href: "/app/servicos", label: "Serviços", icon: "content_cut" };
const PROFESSIONALS: NavItem = { href: "/app/profissionais", label: "Profissionais", icon: "badge" };
const SETTINGS: NavItem = { href: "/app/configuracoes", label: "Configurações", icon: "settings" };
export const ONBOARDING: NavItem = { href: "/app/primeiros-passos", label: "Primeiros passos", icon: "checklist" };

/** Menu lateral (desktop). */
export function sidebarItems(role: Role): NavItem[] {
  return role === "Owner"
    ? [DASHBOARD, AGENDA, CUSTOMERS, SERVICES, PROFESSIONALS, SETTINGS]
    : [AGENDA, CUSTOMERS, SERVICES, PROFESSIONALS];
}

/** Navegação inferior (celular): até 5 itens; o restante do proprietário vai para o menu "Mais". */
export function bottomNavItems(role: Role): { items: NavItem[]; overflow: NavItem[] } {
  return role === "Owner"
    ? {
        items: [{ ...DASHBOARD, label: "Início", icon: "home" }, AGENDA, CUSTOMERS, SERVICES],
        overflow: [PROFESSIONALS, SETTINGS],
      }
    : { items: [AGENDA, CUSTOMERS, SERVICES, { ...PROFESSIONALS, label: "Equipe" }], overflow: [] };
}

/** Telas exclusivas do proprietário. O funcionário que tentar abrir é levado para a agenda. */
export function isOwnerOnly(pathname: string) {
  return pathname === "/app" || pathname.startsWith(SETTINGS.href) || pathname.startsWith(ONBOARDING.href);
}

export const EMPLOYEE_HOME = AGENDA.href;

export function isActive(item: NavItem, pathname: string) {
  return item.href === "/app" ? pathname === "/app" : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export const ROLE_LABEL: Record<Role, string> = { Owner: "Proprietário", Employee: "Funcionário" };

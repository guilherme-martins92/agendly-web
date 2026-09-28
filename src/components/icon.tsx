import { cn } from "@/lib/utils";

/**
 * Ícones Material Symbols Rounded usados no produto.
 *
 * A fonte é carregada do Google Fonts já recortada para esta lista (parâmetro icon_names),
 * em vez da fonte completa (~5 MB). Para usar um ícone novo, adicione o nome aqui:
 * o tipo IconName impede usar ícones que não estão na fonte recortada.
 */
export const ICON_NAMES = [
  "add",
  "arrow_back",
  "badge",
  "block",
  "calendar_month",
  "calendar_view_week",
  "call",
  "celebration",
  "chat",
  "check",
  "check_circle",
  "checklist",
  "chevron_left",
  "chevron_right",
  "close",
  "content_copy",
  "content_cut",
  "dark_mode",
  "delete",
  "download",
  "edit",
  "edit_calendar",
  "error",
  "event",
  "event_available",
  "event_busy",
  "event_repeat",
  "expand_more",
  "group",
  "home",
  "hourglass_top",
  "info",
  "insights",
  "language",
  "light_mode",
  "link",
  "location_on",
  "lock",
  "logout",
  "menu",
  "open_in_new",
  "payments",
  "person",
  "person_add",
  "person_off",
  "play_circle",
  "power_settings_new",
  "qr_code_2",
  "receipt_long",
  "schedule",
  "search",
  "search_off",
  "settings",
  "space_dashboard",
  "storefront",
  "task_alt",
  "timer",
  "trending_down",
  "trending_flat",
  "trending_up",
  "view_agenda",
  "view_column",
  "visibility",
  "visibility_off",
  "warning",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

// O Google Fonts exige icon_names em ordem alfabética
export const ICON_FONT_URL =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..24,400,0..1,0" +
  `&icon_names=${[...ICON_NAMES].sort().join(",")}&display=block`;

type IconProps = {
  name: IconName;
  size?: number;
  filled?: boolean;
  className?: string;
  /** Rótulo acessível; sem ele o ícone é decorativo (aria-hidden). */
  label?: string;
};

export function Icon({ name, size = 20, filled = false, className, label }: IconProps) {
  return (
    <span
      className={cn("material-symbols-rounded inline-block shrink-0 select-none leading-none", className)}
      style={{
        fontFamily: "'Material Symbols Rounded'",
        fontSize: size,
        width: size,
        height: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}`,
      }}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
    >
      {name}
    </span>
  );
}

import { Icon } from "@/components/icon";
import type { BusinessDto } from "@/lib/api/generated/model";
import { initials, maskPhone } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Cartão com a identidade do negócio: capa, avatar (logo ou iniciais) e contato.
 * "hero" é o topo da home (mobile e desktop); "card" é o cartão fixo da barra lateral (desktop).
 */
export function BusinessIdentity({
  business,
  variant,
  className,
}: {
  business: BusinessDto;
  variant: "hero" | "card";
  className?: string;
}) {
  const hero = variant === "hero";
  const digits = business.phone?.replace(/\D/g, "") ?? "";

  return (
    <div className={cn(!hero && "overflow-hidden rounded-2xl border bg-surface shadow-sm", className)}>
      <div className={cn("bg-brand-soft", hero ? "h-[110px]" : "h-[84px]")} />
      <div className={cn("flex flex-col gap-3.5", hero ? "-mt-11 px-1" : "-mt-9 px-6 pb-6")}>
        <Avatar business={business} size={hero ? 88 : 76} onSurface={!hero} />
        <div>
          <h1 className={cn("font-bold tracking-[-0.02em]", hero ? "text-[26px]" : "text-[21px]")}>{business.name}</h1>
          {business.description && (
            <p className="mt-1.5 text-[14px] leading-[1.55] font-medium text-pretty text-text-2">{business.description}</p>
          )}
        </div>
        {(business.phone || business.address) && (
          <div className="flex flex-col divide-y divide-border rounded-[14px] border bg-surface">
            {business.phone && (
              <a href={`tel:+55${digits}`} className="flex min-h-12 items-center gap-3 px-3.5 text-[14px] font-semibold text-text">
                <Icon name="call" size={20} className="shrink-0 text-brand-text" />
                {maskPhone(business.phone)}
              </a>
            )}
            {business.address && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(business.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-12 items-center gap-3 px-3.5 text-[14px] font-semibold text-text"
              >
                <Icon name="location_on" size={20} className="shrink-0 text-brand-text" />
                <span className="text-pretty">{business.address}</span>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Avatar({ business, size, onSurface }: { business: BusinessDto; size: number; onSurface: boolean }) {
  const style = { width: size, height: size, borderRadius: size * 0.27, fontSize: size * 0.34 };
  const border = cn("border-4", onSurface ? "border-surface" : "border-background");

  if (business.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- logo vem de uma URL externa definida pelo negócio
      <img src={business.logoUrl} alt="" style={style} className={cn(border, "object-cover")} />
    );
  }

  return (
    <div style={style} className={cn(border, "grid place-items-center bg-brand font-bold text-on-brand")}>
      {initials(business.name)}
    </div>
  );
}

import { cn } from "@/lib/utils";

export function Logo({ size = "md", className }: { size?: "sm" | "md"; className?: string }) {
  const small = size === "sm";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "grid place-items-center bg-brand font-bold text-on-brand",
          small ? "size-7 rounded-[8px] text-[15px]" : "size-8 rounded-[9px] text-[17px]",
        )}
      >
        a
      </div>
      <span className={cn("font-bold tracking-[-0.02em]", small ? "text-[18px]" : "text-[20px]")}>agendly</span>
    </div>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
  wide,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  wide?: boolean;
}) {
  return (
    <>
      <div
        className={cn(
          "mt-7 flex w-full flex-col gap-4 rounded-xl border bg-surface p-7 shadow-md",
          wide ? "max-w-[480px]" : "max-w-[420px]",
        )}
      >
        <div>
          <h1 className="text-[24px] leading-tight font-bold tracking-[-0.02em]">{title}</h1>
          <p className="mt-1 text-[14px] leading-normal font-medium text-text-2">{subtitle}</p>
        </div>
        {children}
      </div>
      <div className="mt-5 flex items-center gap-1.5 text-[14px] font-medium text-text-2">{footer}</div>
    </>
  );
}

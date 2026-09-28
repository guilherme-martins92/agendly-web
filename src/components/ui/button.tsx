import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Botões do design system. Alturas: 48 (CTA), 44 (padrão, alvo de toque mínimo),
 * 36 (controles compactos) e 32 (ações compactas no cabeçalho desktop).
 */
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 font-semibold whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-4 focus-visible:ring-brand-soft disabled:cursor-not-allowed disabled:opacity-45 aria-disabled:cursor-not-allowed aria-disabled:opacity-45",
  {
    variants: {
      variant: {
        primary: "bg-brand text-on-brand hover:bg-brand-hover",
        secondary: "border border-border-strong bg-surface text-text hover:bg-surface-2",
        ghost: "bg-transparent text-brand-text hover:bg-brand-soft",
        subtle: "bg-transparent text-text hover:bg-surface-2",
        danger: "border border-danger-border bg-surface text-danger hover:bg-danger-soft",
        "danger-solid": "bg-danger text-surface hover:opacity-90",
      },
      size: {
        lg: "h-12 rounded-[12px] px-5 text-[15px]",
        md: "h-11 rounded-[10px] px-4 text-[14px]",
        sm: "h-9 rounded-[9px] px-3.5 text-[13px]",
        xs: "h-8 rounded-[8px] px-2.5 text-[13px]",
        icon: "size-11 rounded-[12px]",
        "icon-sm": "size-10 rounded-[10px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

function Button({
  className,
  variant,
  size,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return <ButtonPrimitive data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };

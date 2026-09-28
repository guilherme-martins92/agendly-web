import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { ICON_FONT_URL } from "@/components/icon";
import { ThemeScript } from "@/components/theme-script";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: {
    default: "Agendly",
    template: "%s · Agendly",
  },
  description: "Agendamento online para negócios com hora marcada.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" data-theme="light" className={figtree.variable} suppressHydrationWarning>
      <head>
        <ThemeScript />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Fonte de ícones recortada (ver components/icon.tsx) */}
        <link rel="stylesheet" href={ICON_FONT_URL} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}

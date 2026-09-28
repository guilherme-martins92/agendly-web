import { Logo } from "@/components/logo";
import { QueryProvider } from "@/components/query-provider";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <QueryProvider>
      <main className="flex min-h-dvh flex-col items-center bg-background px-4 py-8 md:px-6 md:py-14">
        <Logo />
        {children}
      </main>
    </QueryProvider>
  );
}

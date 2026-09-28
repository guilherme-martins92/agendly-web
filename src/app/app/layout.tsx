import { QueryProvider } from "@/components/query-provider";

export default function BackofficeLayout({ children }: LayoutProps<"/app">) {
  return <QueryProvider>{children}</QueryProvider>;
}

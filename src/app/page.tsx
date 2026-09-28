import { redirect } from "next/navigation";

// Sem landing page por enquanto: o proxy leva ao backoffice ou ao login, conforme a sessão
export default function Home() {
  redirect("/app");
}

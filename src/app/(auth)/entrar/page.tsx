import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  // useSearchParams (parâmetro ?next=) exige um limite de Suspense
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

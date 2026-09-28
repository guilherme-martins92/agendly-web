"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { AlertBanner, Field, TextInput } from "@/components/ui/field";
import { ApiError } from "@/lib/api/api-error";
import { login } from "@/lib/api/session-client";

/** Só aceita voltar para dentro do backoffice (evita redirecionamento aberto para outro site). */
function safeNext(next: string | null) {
  return next && next.startsWith("/app") ? next : "/app";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      await login(email.trim(), password);
      router.replace(safeNext(searchParams.get("next")));
    } catch (err) {
      // A API responde a mesma mensagem genérica para e-mail inexistente ou senha errada
      setError(err instanceof ApiError ? err.errors : ["Não foi possível entrar. Tente novamente."]);
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Entrar"
      subtitle="Acesse a agenda do seu negócio."
      footer={
        <>
          Ainda não tem conta?
          <Link href="/cadastro" className="px-0.5 py-1.5 font-semibold text-brand-text hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {error && <AlertBanner messages={error} />}

        <Field label="E-mail" htmlFor="email">
          <TextInput
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            required
          />
        </Field>

        <Field label="Senha" htmlFor="password">
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            required
          />
        </Field>

        <Button type="submit" size="lg" disabled={loading || !email || !password} className="mt-1">
          {loading ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </AuthCard>
  );
}

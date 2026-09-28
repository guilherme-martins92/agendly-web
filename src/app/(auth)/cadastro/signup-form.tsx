"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { PasswordInput } from "@/components/auth/password-input";
import { Icon, type IconName } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { AlertBanner, Field, TextInput } from "@/components/ui/field";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ApiError } from "@/lib/api/api-error";
import { useCheckSlugAvailability } from "@/lib/api/generated/businesses/businesses";
import { register } from "@/lib/api/session-client";
import { EMAIL_PATTERN, slugify } from "@/lib/format";
import { APP_URL } from "@/lib/public-link";
import { cn } from "@/lib/utils";

// Mesmas regras do RegisterUserCommandValidator da API
const PASSWORD_RULES: { test: (pw: string) => boolean; label: string }[] = [
  { test: (pw) => pw.length >= 8, label: "8 caracteres" },
  { test: (pw) => /[A-Z]/.test(pw), label: "letra maiúscula" },
  { test: (pw) => /[a-z]/.test(pw), label: "letra minúscula" },
  { test: (pw) => /[0-9]/.test(pw), label: "número" },
];

const APP_HOST = APP_URL.replace(/^https?:\/\//, "");

export function SignupForm() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tried, setTried] = useState(false);
  const [apiError, setApiError] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

  const finalSlug = slug.replace(/-$/, "");
  const debouncedSlug = useDebouncedValue(finalSlug, 400);
  const slugCheck = useCheckSlugAvailability(
    { slug: debouncedSlug },
    { query: { enabled: debouncedSlug.length >= 3, staleTime: 10_000, retry: false } },
  );

  const errors = {
    businessName: !businessName.trim() ? "Informe o nome do negócio." : null,
    userName: userName.trim().length < 2 ? "Informe seu nome." : null,
    email: !EMAIL_PATTERN.test(email.trim()) ? "Informe um e-mail válido." : null,
    password: PASSWORD_RULES.every((rule) => rule.test(password)) ? null : "A senha não atende aos requisitos.",
  };

  const slug$ = slugStatus({
    slug: finalSlug,
    checking: finalSlug !== debouncedSlug || slugCheck.isFetching,
    available: slugCheck.data?.available,
    reason: slugCheck.data?.reason ?? null,
    checkFailed: slugCheck.isError,
    tried,
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;

    setTried(true);
    setApiError(null);
    if (Object.values(errors).some(Boolean) || !slug$.ok) return;

    setLoading(true);
    try {
      await register({
        businessName: businessName.trim(),
        businessSlug: finalSlug,
        userName: userName.trim(),
        email: email.trim(),
        password,
      });
      router.replace("/app/primeiros-passos");
    } catch (err) {
      setApiError(err instanceof ApiError ? err.errors : ["Não foi possível criar a conta. Tente novamente."]);
      setLoading(false);
    }
  }

  const show = (key: keyof typeof errors) => (tried ? errors[key] : null);

  return (
    <AuthCard
      wide
      title="Criar conta"
      subtitle="Em poucos minutos sua página de agendamento fica no ar."
      footer={
        <>
          Já tem conta?
          <Link href="/entrar" className="px-0.5 py-1.5 font-semibold text-brand-text hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {apiError && <AlertBanner title="Não foi possível criar a conta" messages={apiError} />}

        <Field label="Nome do negócio" htmlFor="businessName" error={show("businessName")}>
          <TextInput
            id="businessName"
            placeholder="Ex.: Barbearia do Zé"
            maxLength={100}
            value={businessName}
            hasError={Boolean(show("businessName"))}
            onChange={(e) => {
              setBusinessName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
          />
        </Field>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="slug" className="text-[14px] leading-tight font-semibold">
            Endereço da página
          </label>
          <div
            className={cn(
              "flex h-12 items-center overflow-hidden rounded-[11px] border bg-surface transition-shadow focus-within:ring-4 focus-within:ring-brand-soft",
              slug$.border,
            )}
          >
            <span className="flex h-full items-center border-r bg-surface-2 pr-2.5 pl-3.5 text-[15px] font-medium whitespace-nowrap text-text-2">
              {APP_HOST}/
            </span>
            <input
              id="slug"
              value={slug}
              placeholder="meu-negocio"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-describedby="slug-status"
              onChange={(e) => {
                setSlug(slugify(e.target.value, true));
                setSlugTouched(true);
              }}
              onBlur={() => setSlug((s) => s.replace(/-$/, ""))}
              className="h-full min-w-0 flex-1 bg-transparent px-3 text-[16px] font-medium text-text outline-none"
            />
          </div>
          <span id="slug-status" aria-live="polite" className={cn("flex items-center gap-1.5 text-[13px] leading-snug font-medium", slug$.color)}>
            <Icon name={slug$.icon} size={16} />
            <span className="font-bold">
              {APP_HOST}/{finalSlug || "meu-negocio"}
            </span>
            · {slug$.message}
          </span>
        </div>

        <Field label="Seu nome" htmlFor="userName" error={show("userName")}>
          <TextInput
            id="userName"
            autoComplete="name"
            maxLength={100}
            value={userName}
            hasError={Boolean(show("userName"))}
            onChange={(e) => setUserName(e.target.value)}
          />
        </Field>

        <Field label="E-mail" htmlFor="email" error={show("email")}>
          <TextInput
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            hasError={Boolean(show("email"))}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-[14px] leading-tight font-semibold">
            Senha
          </label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="Mínimo de 8 caracteres"
            value={password}
            hasError={Boolean(show("password"))}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby="password-rules"
          />
          <ul id="password-rules" className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] font-semibold">
            {PASSWORD_RULES.map((rule) => {
              const ok = rule.test(password);
              return (
                <li key={rule.label} className={cn("flex items-center gap-1", ok ? "text-done-fg" : tried ? "text-danger" : "text-text-3")}>
                  <Icon name={ok ? "check_circle" : "error"} size={14} filled={ok} />
                  {rule.label}
                </li>
              );
            })}
          </ul>
        </div>

        <Button type="submit" size="lg" disabled={loading} className="mt-1">
          {loading ? "Criando conta…" : "Criar conta"}
        </Button>
      </form>
    </AuthCard>
  );
}

function slugStatus({
  slug,
  checking,
  available,
  reason,
  checkFailed,
  tried,
}: {
  slug: string;
  checking: boolean;
  available: boolean | undefined;
  reason: string | null;
  checkFailed: boolean;
  tried: boolean;
}): { ok: boolean; message: string; icon: IconName; color: string; border: string } {
  const neutral = { color: "text-text-2", border: "border-border-strong focus-within:border-brand" };
  const bad = { ok: false, icon: "error" as const, color: "text-danger", border: "border-danger" };

  if (!slug) {
    return tried
      ? { ...bad, message: "Escolha o endereço da sua página." }
      : { ok: false, icon: "link", message: "Este será o endereço da sua página de agendamento.", ...neutral };
  }
  if (slug.length < 3) return { ...bad, message: "Use pelo menos 3 caracteres." };
  // Sem conseguir verificar (ex.: excesso de tentativas), não trava o cadastro: a API valida o slug ao criar a conta
  if (checkFailed && !checking) return { ok: true, icon: "info", message: "Não foi possível verificar agora.", ...neutral };
  if (checking || available === undefined) return { ok: false, icon: "schedule", message: "Verificando…", ...neutral };
  if (!available) return { ...bad, message: reason ?? "Este endereço não está disponível." };
  return { ok: true, icon: "check_circle", message: "Disponível", color: "text-done-fg", border: "border-done-dot focus-within:border-done-dot" };
}

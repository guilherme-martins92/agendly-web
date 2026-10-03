"use client";

import { Field, TextInput } from "@/components/ui/field";
import { EMAIL_PATTERN, maskPhone } from "@/lib/format";

export type CustomerFormValues = { name: string; phone: string; email: string };

/** Validação compartilhada com o orquestrador, que decide se o botão "Continuar" pode avançar. */
export function validateCustomer({ name, phone, email }: CustomerFormValues) {
  const phoneDigits = phone.replace(/\D/g, "");
  const trimmedEmail = email.trim();
  return {
    name: name.trim().length < 2 ? "Informe seu nome." : null,
    phone: phoneDigits.length < 10 ? "Informe um WhatsApp válido com DDD." : null,
    email: trimmedEmail && !EMAIL_PATTERN.test(trimmedEmail) ? "Informe um e-mail válido." : null,
  };
}

/** Passo 4: dados de contato. Sem conta nem senha — só o necessário para o negócio confirmar o horário. */
export function CustomerStep({
  values,
  tried,
  onChange,
}: {
  values: CustomerFormValues;
  tried: boolean;
  onChange: (patch: Partial<CustomerFormValues>) => void;
}) {
  const errors = validateCustomer(values);

  return (
    <div className="flex max-w-[420px] flex-col gap-[18px]">
      <p className="-mt-2 text-[14px] font-medium text-text-2">
        Não precisa criar conta nem senha. Usamos seu WhatsApp só para falar sobre este horário.
      </p>

      <Field label="Nome" htmlFor="customer-name" error={tried ? errors.name : null}>
        <TextInput
          id="customer-name"
          autoComplete="name"
          placeholder="Seu nome"
          value={values.name}
          hasError={Boolean(tried && errors.name)}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </Field>

      <Field label="WhatsApp" htmlFor="customer-phone" error={tried ? errors.phone : null}>
        <TextInput
          id="customer-phone"
          inputMode="tel"
          autoComplete="tel"
          className="tabular"
          placeholder="(11) 91234-5678"
          value={values.phone}
          hasError={Boolean(tried && errors.phone)}
          onChange={(e) => onChange({ phone: maskPhone(e.target.value) })}
        />
      </Field>

      <Field label="E-mail" aside="Opcional" htmlFor="customer-email" error={tried ? errors.email : null}>
        <TextInput
          id="customer-email"
          type="email"
          autoComplete="email"
          placeholder="voce@email.com"
          value={values.email}
          hasError={Boolean(tried && errors.email)}
          onChange={(e) => onChange({ email: e.target.value })}
        />
      </Field>
    </div>
  );
}

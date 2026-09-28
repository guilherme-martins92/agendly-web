"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/components/backoffice/session-context";
import { PageHeader } from "@/components/backoffice/page-header";
import { useCopyPublicLink } from "@/components/backoffice/use-copy-public-link";
import { useQrCode } from "@/components/backoffice/use-qr-code";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/controls";
import { AlertBanner, Field, TextInput } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/form-dialog";
import { errorMessages } from "@/lib/api/errors";
import {
  getGetMyBusinessQueryKey,
  useActivateMyBusiness,
  useDeactivateMyBusiness,
  useUpdateMyBusiness,
} from "@/lib/api/generated/businesses/businesses";
import type { BusinessDto } from "@/lib/api/generated/model";
import { maskPhone } from "@/lib/format";
import { publicLinkLabel, publicUrl } from "@/lib/public-link";
import { cn } from "@/lib/utils";

const DESCRIPTION_MAX = 280;

export function SettingsScreen() {
  const { business } = useSession();

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-4">
      <div className="flex max-w-[760px] flex-col gap-4">
        <PageHeader title="Configurações do negócio" subtitle="Dados exibidos na sua página pública de agendamento." />
        {/* Recria o formulário quando os dados salvos mudam, para "Descartar" voltar ao estado gravado */}
        <BusinessForm
          key={JSON.stringify([business.name, business.description, business.phone, business.address])}
          business={business}
        />
        <PublicPageCard business={business} />
        <DangerZone business={business} />
      </div>
    </div>
  );
}

type FormValues = {
  name: string;
  description: string;
  phone: string;
  address: string;
};

function valuesOf(business: BusinessDto): FormValues {
  return {
    name: business.name,
    description: business.description ?? "",
    phone: maskPhone(business.phone ?? ""),
    address: business.address ?? "",
  };
}

function BusinessForm({ business }: { business: BusinessDto }) {
  const queryClient = useQueryClient();
  const [initial] = useState(() => valuesOf(business));
  const [values, setValues] = useState(initial);
  const [tried, setTried] = useState(false);
  const [apiError, setApiError] = useState<string[] | null>(null);

  const phoneDigits = values.phone.replace(/\D/g, "");
  const errors = {
    name: values.name.trim().length < 2 ? "Informe o nome do negócio." : null,
    phone: phoneDigits && phoneDigits.length < 10 ? "Informe um telefone válido com DDD." : null,
  };
  const dirty = (Object.keys(values) as (keyof FormValues)[]).some((k) => values[k].trim() !== initial[k].trim());

  const update = useUpdateMyBusiness({
    mutation: {
      onSuccess: () => {
        toast.success("Dados do negócio salvos");
        queryClient.invalidateQueries({ queryKey: getGetMyBusinessQueryKey() });
      },
      onError: (error) => setApiError(errorMessages(error)),
    },
  });

  const set = (key: keyof FormValues) => (value: string) => setValues((v) => ({ ...v, [key]: value }));

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setTried(true);
        setApiError(null);
        if (errors.name || errors.phone || !dirty) return;
        update.mutate({
          data: {
            name: values.name.trim(),
            description: values.description.trim() || null,
            phone: phoneDigits || null,
            address: values.address.trim() || null,
          },
        });
      }}
      className="flex flex-col gap-[18px] rounded-2xl border bg-surface p-[22px] shadow-sm"
    >
      <div>
        <h2 className="text-[17px] leading-snug font-bold">Dados do negócio</h2>
        <div className="text-[13px] font-medium text-text-2">Aparecem em destaque na sua página pública.</div>
      </div>

      {apiError && <AlertBanner title="Não foi possível salvar" messages={apiError} />}

      <Field label="Nome do negócio" htmlFor="business-name" error={tried ? errors.name : null}>
        <TextInput
          id="business-name"
          maxLength={100}
          value={values.name}
          hasError={Boolean(tried && errors.name)}
          onChange={(e) => set("name")(e.target.value)}
        />
      </Field>

      <Field label="Descrição" htmlFor="business-description" aside={`${values.description.length}/${DESCRIPTION_MAX}`}>
        <Textarea
          id="business-description"
          rows={3}
          maxLength={DESCRIPTION_MAX}
          placeholder="Conte em poucas palavras o que o cliente encontra no seu negócio."
          value={values.description}
          onChange={(e) => set("description")(e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-4">
        <Field label="Telefone" aside="Opcional" htmlFor="business-phone" error={tried ? errors.phone : null}>
          <TextInput
            id="business-phone"
            inputMode="tel"
            placeholder="(11) 91234-5678"
            className="tabular"
            value={values.phone}
            hasError={Boolean(tried && errors.phone)}
            onChange={(e) => set("phone")(maskPhone(e.target.value))}
          />
        </Field>
        <Field label="Endereço" aside="Opcional" htmlFor="business-address">
          <TextInput
            id="business-address"
            maxLength={200}
            placeholder="Rua, número, bairro, cidade"
            value={values.address}
            onChange={(e) => set("address")(e.target.value)}
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={!dirty || update.isPending} className="px-[18px]">
          {update.isPending ? "Salvando…" : "Salvar alterações"}
        </Button>
        {dirty && (
          <Button
            type="button"
            variant="secondary"
            disabled={update.isPending}
            onClick={() => {
              setValues(initial);
              setTried(false);
              setApiError(null);
            }}
          >
            Descartar
          </Button>
        )}
      </div>
    </form>
  );
}

function PublicPageCard({ business }: { business: BusinessDto }) {
  const qr = useQrCode(business.slug);
  const copyLink = useCopyPublicLink(business.slug);
  const on = business.active;

  return (
    <section className="flex flex-wrap items-center gap-5 rounded-2xl border bg-surface p-[22px] shadow-sm">
      <div className="grid size-[132px] shrink-0 place-items-center overflow-hidden rounded-[12px] border bg-white p-1.5">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URL gerada no navegador
          <img src={qr} alt={`QR Code de ${publicLinkLabel(business.slug)}`} className="size-full" />
        ) : (
          <div className="skeleton size-full rounded-md" />
        )}
      </div>

      <div className="flex min-w-[220px] flex-1 flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-[17px] leading-snug font-bold">Página pública</h2>
          <span
            className={cn(
              "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold",
              on ? "bg-done-bg text-done-fg" : "bg-noshow-bg text-noshow-fg",
            )}
          >
            <span className={cn("size-1.5 rounded-full", on ? "bg-done-dot" : "bg-noshow-dot")} />
            {on ? "No ar" : "Fora do ar"}
          </span>
        </div>

        <div className="flex h-11 min-w-0 items-center gap-2 rounded-md border bg-surface-2 px-3 text-[14px] font-semibold">
          <Icon name="link" size={18} className="text-text-2" />
          <span className="truncate">{publicLinkLabel(business.slug)}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" className="h-10" onClick={copyLink}>
            <Icon name="content_copy" size={18} />
            Copiar link
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="h-10"
            nativeButton={false}
            render={<a href={publicUrl(business.slug)} target="_blank" rel="noopener noreferrer" />}
          >
            <Icon name="open_in_new" size={18} />
            Abrir página
          </Button>
          <Button
            size="sm"
            className="h-10"
            nativeButton={false}
            aria-disabled={!qr}
            render={<a href={qr ?? undefined} download={`qrcode-${business.slug}.png`} />}
          >
            <Icon name="download" size={18} />
            Baixar QR Code
          </Button>
        </div>
      </div>
    </section>
  );
}

function DangerZone({ business }: { business: BusinessDto }) {
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const on = business.active;
  const link = publicLinkLabel(business.slug);

  const options = {
    mutation: {
      onSuccess: () => {
        setConfirmOpen(false);
        toast.success(
          on ? "Negócio desativado. A página pública saiu do ar." : "Negócio reativado. A página pública voltou ao ar.",
        );
        queryClient.invalidateQueries({ queryKey: getGetMyBusinessQueryKey() });
      },
      onError: (error: unknown) => toast.error(errorMessages(error)[0]),
    },
  };
  const deactivate = useDeactivateMyBusiness(options);
  const activate = useActivateMyBusiness(options);

  return (
    <section className={cn("flex flex-col gap-3 rounded-2xl border bg-surface p-[22px]", on && "border-danger-border")}>
      <div className="text-[12px] font-bold tracking-[0.06em] text-danger uppercase">Zona de perigo</div>
      <h2 className="text-[17px] leading-snug font-bold">{on ? "Desativar negócio" : "Reativar negócio"}</h2>
      <p className="max-w-[560px] text-[14px] leading-normal font-medium text-pretty text-text-2">
        {on
          ? "Tira a página pública do ar. Os clientes não conseguem agendar online, mas a agenda e os dados continuam disponíveis aqui."
          : "Sua página pública está fora do ar. Reative para voltar a receber agendamentos online."}
      </p>
      <div>
        <Button variant={on ? "danger-solid" : "primary"} className="px-[18px]" onClick={() => setConfirmOpen(true)}>
          {on ? "Desativar negócio" : "Reativar negócio"}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        icon={on ? "power_settings_new" : "play_circle"}
        tone={on ? "danger" : "primary"}
        title={`${on ? "Desativar" : "Reativar"} ${business.name}?`}
        description={
          on
            ? `A página ${link} sai do ar imediatamente. Agendamentos já marcados continuam na agenda. Você pode reativar quando quiser.`
            : `A página ${link} volta ao ar e os clientes podem agendar novamente.`
        }
        confirmLabel={on ? "Desativar" : "Reativar"}
        pending={deactivate.isPending || activate.isPending}
        onConfirm={() => (on ? deactivate : activate).mutate()}
      />
    </section>
  );
}

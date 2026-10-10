"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { AlertBanner } from "@/components/ui/field";
import { ApiError } from "@/lib/api/api-error";
import { errorMessages } from "@/lib/api/errors";
import { invalidatePublicAvailability } from "@/lib/api/invalidation";
import type { AppointmentDetailsDto, AvailableSlotDto, BusinessDto, ServiceDto } from "@/lib/api/generated/model";
import {
  getGetPublicAvailabilitySummaryQueryOptions,
  useCreatePublicAppointment,
  useGetPublicAvailabilitySummary,
  useListPublicServices,
} from "@/lib/api/generated/public/public";
import { formatDuration } from "@/lib/money";
import { todayIn, toLocalTime } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import { BusinessIdentity } from "./business-identity";
import { CustomerStep, validateCustomer, type CustomerFormValues } from "./steps/customer-step";
import { DateTimeStep } from "./steps/datetime-step";
import { ProfessionalStep } from "./steps/professional-step";
import { ReviewStep } from "./steps/review-step";
import { ServiceStep } from "./steps/service-step";
import { SuccessStep } from "./steps/success-step";

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type FlowStep = 1 | 2 | 3 | 4 | 5;

const FULL_FLOW: FlowStep[] = [1, 2, 3, 4, 5];
const SKIP_PROFESSIONAL_FLOW: FlowStep[] = [1, 3, 4, 5];

const TITLES: Record<FlowStep, string> = {
  1: "Escolha o serviço",
  2: "Escolha o profissional",
  3: "Escolha data e horário",
  4: "Seus dados",
  5: "Revise e confirme",
};

const STEP_SHORT_LABEL: Record<FlowStep, string> = {
  1: "Serviço",
  2: "Profissional",
  3: "Data e horário",
  4: "Seus dados",
  5: "Revisão",
};

type FormError = { tone: "danger" | "warning"; title?: string; messages: string[] };

/**
 * Fluxo público de agendamento (`/{slug}`): serviço → profissional (pulado se só há um) →
 * data/horário → dados do cliente → revisão → confirmação. Sem login — qualquer pessoa agenda.
 */
export function PublicBookingScreen({ slug, business }: { slug: string; business: BusinessDto }) {
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>(0);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [pendingServiceId, setPendingServiceId] = useState<string | null>(null);
  const [noProfessionalsFor, setNoProfessionalsFor] = useState<string | null>(null);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [professionalName, setProfessionalName] = useState<string | null>(null);
  const [date, setDate] = useState(() => todayIn(business.timeZoneId));
  const [slot, setSlot] = useState<AvailableSlotDto | null>(null);
  const [form, setForm] = useState<CustomerFormValues>({ name: "", phone: "", email: "" });
  const [tried, setTried] = useState(false);
  const [formError, setFormError] = useState<FormError | null>(null);
  const [booked, setBooked] = useState<AppointmentDetailsDto | null>(null);

  const servicesQuery = useListPublicServices(slug);
  // Leitura reativa para renderizar (passo 2, resumo, progresso); a navegação em si roda em pickService.
  const summaryQuery = useGetPublicAvailabilitySummary(
    slug,
    { serviceId: serviceId ?? "" },
    { query: { enabled: Boolean(serviceId) } },
  );

  const onlyOneProfessional = (summaryQuery.data?.length ?? 0) === 1;
  const flow = onlyOneProfessional ? SKIP_PROFESSIONAL_FLOW : FULL_FLOW;
  const flowIndex = flow.indexOf(step as FlowStep);
  const inFlow = step >= 1 && step <= 5;
  const selectedService = servicesQuery.data?.find((s) => s.id === serviceId) ?? null;

  function goStep(next: Step) {
    setFormError(null);
    setStep(next);
  }

  function goBack() {
    setFormError(null);
    setStep(flowIndex <= 0 ? 0 : flow[flowIndex - 1]);
  }

  async function pickService(service: ServiceDto) {
    setFormError(null);
    setNoProfessionalsFor(null);
    setServiceId(service.id);
    setProfessionalId(null);
    setProfessionalName(null);
    setSlot(null);
    setPendingServiceId(service.id);

    try {
      // Escreve no mesmo cache que useGetPublicAvailabilitySummary lê: sem busca duplicada.
      const professionals = await queryClient.fetchQuery(
        getGetPublicAvailabilitySummaryQueryOptions(slug, { serviceId: service.id }),
      );
      setPendingServiceId(null);

      if (professionals.length === 0) {
        setNoProfessionalsFor(service.id);
        return;
      }
      if (professionals.length === 1) {
        setProfessionalId(professionals[0].professionalId);
        setProfessionalName(professionals[0].professionalName);
        setDate(todayIn(business.timeZoneId));
        setSlot(null);
        setStep(3);
        return;
      }
      setStep(2);
    } catch (error) {
      setPendingServiceId(null);
      setFormError({ tone: "danger", messages: errorMessages(error) });
    }
  }

  function pickProfessional(id: string, name: string) {
    setFormError(null);
    setProfessionalId(id);
    setProfessionalName(name);
    setDate(todayIn(business.timeZoneId));
    setSlot(null);
    setStep(3);
  }

  function restart() {
    setStep(0);
    setServiceId(null);
    setPendingServiceId(null);
    setNoProfessionalsFor(null);
    setProfessionalId(null);
    setProfessionalName(null);
    setDate(todayIn(business.timeZoneId));
    setSlot(null);
    setTried(false);
    setFormError(null);
    setBooked(null);
  }

  const createAppointment = useCreatePublicAppointment({
    mutation: {
      onSuccess: (result) => {
        // O horário recém-ocupado não pode reaparecer em "Fazer outro agendamento"
        invalidatePublicAvailability(queryClient, slug);
        setBooked(result);
        setFormError(null);
        setStep(6);
      },
      onError: (error) => {
        if (error instanceof ApiError && error.isConflict) {
          invalidatePublicAvailability(queryClient, slug);
          setSlot(null);
          setStep(3);
          setFormError({
            tone: "danger",
            title: "Esse horário acabou de ser ocupado",
            messages: ["Outra pessoa confirmou este horário antes de você. Escolha um novo horário."],
          });
          return;
        }
        if (error instanceof ApiError && error.isRateLimited) {
          setFormError({ tone: "warning", title: "Muitas tentativas", messages: errorMessages(error) });
          return;
        }
        setFormError({ tone: "danger", messages: errorMessages(error) });
      },
    },
  });

  const customerErrors = validateCustomer(form);

  let cta: { label: string; onClick: () => void; disabled?: boolean } | null = null;
  if (step === 3) {
    cta = {
      label: slot ? `Continuar · ${toLocalTime(slot.startAt, business.timeZoneId)}` : "Escolha um horário",
      disabled: !slot,
      onClick: () => slot && goStep(4),
    };
  }
  if (step === 4) {
    cta = {
      label: "Continuar",
      onClick: () => {
        if (customerErrors.name || customerErrors.phone || customerErrors.email) {
          setTried(true);
          return;
        }
        goStep(5);
      },
    };
  }
  if (step === 5) {
    cta = {
      label: createAppointment.isPending ? "Confirmando…" : "Confirmar agendamento",
      disabled: createAppointment.isPending,
      onClick: () => {
        if (!serviceId || !professionalId || !slot) return;
        createAppointment.mutate({
          slug,
          data: {
            customerName: form.name.trim(),
            customerPhone: form.phone.replace(/\D/g, ""),
            customerEmail: form.email.trim() || null,
            professionalId,
            serviceId,
            startAt: slot.startAt,
          },
        });
      },
    };
  }

  return (
    <div className="min-h-dvh">
      <div className="mx-auto grid max-w-[1100px] gap-7 px-4 py-6 sm:px-6 sm:py-10 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start lg:gap-8">
        <aside className="hidden lg:sticky lg:top-10 lg:flex lg:flex-col lg:gap-3.5">
          <BusinessIdentity business={business} variant="card" />
          {step > 0 && (
            <SummaryCard
              service={selectedService}
              professionalName={professionalName}
              date={date}
              slot={slot}
              timeZoneId={business.timeZoneId}
              showDate={step >= 3}
            />
          )}
          <p className="text-center text-[12px] font-medium text-text-3">
            Agendamento online por <span className="font-bold">agendly</span>
          </p>
        </aside>

        <div className="flex min-w-0 flex-col gap-5">
          {step === 0 && (
            <>
              <BusinessIdentity business={business} variant="hero" className="lg:hidden" />
              <div className="lg:hidden">
                <Button size="lg" className="h-14 w-full" onClick={() => goStep(1)}>
                  Agendar horário
                </Button>
              </div>
              <div className="hidden flex-col items-center gap-3.5 rounded-2xl border border-dashed border-border-strong bg-surface px-8 py-16 text-center lg:flex">
                <Icon name="calendar_month" size={32} className="text-text-2" />
                <div className="text-[18px] font-bold">Pronto para agendar?</div>
                <div className="max-w-[360px] text-[14px] font-medium text-text-2">
                  Escolha o serviço, o profissional e o melhor horário em poucos passos.
                </div>
                <Button size="lg" onClick={() => goStep(1)}>
                  Agendar horário
                </Button>
              </div>
            </>
          )}

          {inFlow && (
            <div className="flex flex-col gap-[18px] lg:rounded-2xl lg:border lg:bg-surface lg:p-7 lg:shadow-sm">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Voltar"
                    onClick={goBack}
                    className="-ml-2 grid size-10 shrink-0 place-items-center rounded-[10px] text-text hover:bg-surface-2"
                  >
                    <Icon name="arrow_back" size={22} />
                  </button>
                  <span className="text-[13px] font-semibold text-text-2">
                    Etapa {flowIndex + 1} de {flow.length} · {STEP_SHORT_LABEL[step as FlowStep]}
                  </span>
                </div>
                <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${flow.length}, 1fr)` }}>
                  {flow.map((s) => (
                    <div key={s} className={cn("h-1 rounded-full", s <= step ? "bg-brand" : "bg-border")} />
                  ))}
                </div>
              </div>

              <h2 className="text-[24px] font-bold tracking-[-0.02em] lg:text-[26px]">{TITLES[step as FlowStep]}</h2>

              {formError && (
                <AlertBanner
                  tone={formError.tone}
                  title={formError.title}
                  messages={formError.messages}
                  icon={formError.tone === "warning" ? "hourglass_top" : "event_busy"}
                />
              )}

              {step === 1 && (
                <ServiceStep slug={slug} selectedServiceId={serviceId} pendingServiceId={pendingServiceId} onPick={pickService} />
              )}
              {step === 1 && noProfessionalsFor && (
                <AlertBanner
                  tone="warning"
                  icon="info"
                  messages={["Nenhum profissional disponível para este serviço no momento. Escolha outro serviço."]}
                />
              )}

              {step === 2 && serviceId && (
                <ProfessionalStep
                  slug={slug}
                  serviceId={serviceId}
                  timeZoneId={business.timeZoneId}
                  selectedProfessionalId={professionalId}
                  onPick={pickProfessional}
                />
              )}

              {step === 3 && serviceId && professionalId && professionalName && (
                <DateTimeStep
                  key={professionalId}
                  slug={slug}
                  serviceId={serviceId}
                  professionalId={professionalId}
                  professionalName={professionalName}
                  timeZoneId={business.timeZoneId}
                  date={date}
                  onPickDate={setDate}
                  slot={slot}
                  onPickSlot={setSlot}
                />
              )}

              {step === 4 && <CustomerStep values={form} tried={tried} onChange={(patch) => setForm((f) => ({ ...f, ...patch }))} />}

              {step === 5 && selectedService && professionalName && slot && (
                <ReviewStep
                  service={selectedService}
                  professionalName={professionalName}
                  canEditProfessional={!onlyOneProfessional}
                  date={date}
                  slot={slot}
                  timeZoneId={business.timeZoneId}
                  customerName={form.name}
                  customerPhone={form.phone}
                  onEditService={() => goStep(1)}
                  onEditProfessional={() => goStep(2)}
                  onEditDate={() => goStep(3)}
                  onEditCustomer={() => goStep(4)}
                />
              )}

              {cta && (
                <div className="flex justify-end border-t pt-4">
                  <Button size="lg" className="w-full sm:w-auto sm:min-w-[240px]" disabled={cta.disabled} onClick={cta.onClick}>
                    {cta.label}
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === 6 && booked && <SuccessStep booked={booked} business={business} onRestart={restart} />}

          <p className="text-center text-[12px] font-medium text-text-3 lg:hidden">
            Agendamento online por <span className="font-bold">agendly</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  service,
  professionalName,
  date,
  slot,
  timeZoneId,
  showDate,
}: {
  service: ServiceDto | null;
  professionalName: string | null;
  date: string;
  slot: AvailableSlotDto | null;
  timeZoneId: string;
  showDate: boolean;
}) {
  const rows = [
    {
      icon: "content_cut" as const,
      value: service ? `${service.name} · ${formatDuration(service.durationMinutes)}` : "Serviço",
      has: Boolean(service),
    },
    { icon: "badge" as const, value: professionalName ?? "Profissional", has: Boolean(professionalName) },
    { icon: "event" as const, value: showDate ? date.split("-").reverse().join("/") : "Data", has: showDate },
    {
      icon: "schedule" as const,
      value: slot ? `${toLocalTime(slot.startAt, timeZoneId)} – ${toLocalTime(slot.endAt, timeZoneId)}` : "Horário",
      has: Boolean(slot),
    },
  ];

  return (
    <div className="rounded-2xl border bg-surface p-5 shadow-sm">
      <div className="mb-1.5 text-[12px] font-bold tracking-[0.06em] text-text-3 uppercase">Seu agendamento</div>
      {rows.map((row) => (
        <div key={row.icon} className="flex items-center gap-2.5 py-2">
          <Icon name={row.icon} size={19} className={row.has ? "text-brand-text" : "text-text-3"} />
          <span className={cn("min-w-0 flex-1 text-[14px]", row.has ? "font-semibold text-text" : "font-medium text-text-3")}>
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

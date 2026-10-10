"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { AlertBanner } from "@/components/ui/field";
import { ApiError } from "@/lib/api/api-error";
import { errorMessages } from "@/lib/api/errors";
import { createAppointment } from "@/lib/api/generated/appointments/appointments";
import { invalidateAppointmentData } from "@/lib/api/invalidation";
import { createCustomer, getListCustomersQueryKey } from "@/lib/api/generated/customers/customers";
import type { AppointmentDetailsDto, AvailableSlotDto, CustomerListItemDto, ServiceDto } from "@/lib/api/generated/model";
import { displayPhone } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DateTimePicker } from "../date-time-picker";
import { CustomerStep, type NewCustomerValues } from "./customer-step";
import { validateCustomer } from "@/features/public-booking/steps/customer-step";
import { ProfessionalStep } from "./professional-step";
import { ReviewStep } from "./review-step";
import { ServiceStep } from "./service-step";

type Step = 0 | 1 | 2 | 3 | 4;

const TITLES: Record<Step, string> = {
  0: "Quem é o cliente?",
  1: "Qual serviço?",
  2: "Com qual profissional?",
  3: "Escolha data e horário",
  4: "Revise e confirme",
};

/** Modal de 5 passos para criar um agendamento manual: cliente → serviço → profissional → data/horário → revisão. */
export function NewAppointmentDialog({
  timeZoneId,
  initialDate,
  onClose,
  onCreated,
}: {
  timeZoneId: string;
  initialDate: string;
  onClose: () => void;
  onCreated: (appointment: AppointmentDetailsDto) => void;
}) {
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>(0);

  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerFormMode, setCustomerFormMode] = useState(false);
  const [customerForm, setCustomerForm] = useState<NewCustomerValues>({ name: "", phone: "", email: "" });
  const [customerTried, setCustomerTried] = useState(false);
  // Cliente cadastrado por este modal e os dados usados, para não cadastrar de novo ao repetir o envio
  const [createdCustomer, setCreatedCustomer] = useState<{ id: string; key: string } | null>(null);

  const [service, setService] = useState<ServiceDto | null>(null);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [professionalName, setProfessionalName] = useState<string | null>(null);
  const [date, setDate] = useState(initialDate);
  const [slot, setSlot] = useState<AvailableSlotDto | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string[] | null>(null);

  function pickExistingCustomer(customer: CustomerListItemDto) {
    setCustomerId(customer.id);
    setCustomerName(customer.name);
    setCustomerPhone(displayPhone(customer.phone));
    setStep(1);
  }

  function continueFromCustomerForm() {
    const errors = validateCustomer(customerForm);
    if (errors.name || errors.phone || errors.email) {
      setCustomerTried(true);
      return;
    }
    setCustomerId(null);
    setCustomerName(customerForm.name.trim());
    setCustomerPhone(customerForm.phone);
    setStep(1);
  }

  async function handleSubmit() {
    if (!service || !professionalId || !professionalName || !slot) return;
    setSubmitting(true);
    setError(null);
    try {
      let finalCustomerId = customerId;
      if (!finalCustomerId) {
        const newCustomer = {
          name: customerForm.name.trim(),
          phone: customerForm.phone.replace(/\D/g, ""),
          email: customerForm.email.trim() || null,
        };
        const key = JSON.stringify(newCustomer);

        // Nova tentativa depois de uma falha no agendamento: o cliente já foi cadastrado na anterior
        if (createdCustomer?.key === key) {
          finalCustomerId = createdCustomer.id;
        } else {
          const created = await createCustomer(newCustomer);
          finalCustomerId = created.id;
          setCreatedCustomer({ id: created.id, key });
          queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
        }
      }

      let appointment: AppointmentDetailsDto;
      try {
        appointment = await createAppointment({
          customerId: finalCustomerId,
          professionalId,
          serviceId: service.id,
          startAt: slot.startAt,
          origin: "Manual",
        });
      } catch (appointmentError) {
        if (appointmentError instanceof ApiError && appointmentError.isConflict) {
          invalidateAppointmentData(queryClient);
          setSlot(null);
          setStep(3);
          setError(["Esse horário acabou de ser ocupado. Escolha outro horário."]);
          return;
        }
        throw appointmentError;
      }

      invalidateAppointmentData(queryClient);
      onCreated(appointment);
      onClose();
    } catch (submitError) {
      setError(errorMessages(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  const context = [customerName, service?.name, professionalName].filter(Boolean).join(" · ");

  let primary: { label: string; onClick: () => void; disabled?: boolean } | null = null;
  if (step === 0) {
    primary = customerFormMode
      ? { label: "Continuar", onClick: continueFromCustomerForm }
      : { label: "Continuar", onClick: () => customerId && setStep(1), disabled: !customerId };
  }
  if (step === 3) {
    primary = { label: slot ? "Continuar" : "Escolha um horário", onClick: () => slot && setStep(4), disabled: !slot };
  }
  if (step === 4) {
    primary = { label: submitting ? "Criando…" : "Criar agendamento", onClick: handleSubmit, disabled: submitting };
  }

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-overlay duration-100 data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl bg-surface text-text shadow-lg outline-none duration-100 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 sm:max-w-[520px]">
          <div className="shrink-0 border-b px-4 py-3.5">
            <div className="flex items-center gap-1">
              {step > 0 && (
                <Button
                  variant="subtle"
                  size="icon-sm"
                  aria-label="Voltar"
                  className="-ml-1.5"
                  onClick={() => setStep((s) => (s - 1) as Step)}
                >
                  <Icon name="arrow_back" size={22} />
                </Button>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold text-text-2">Novo agendamento · Etapa {step + 1} de 5</div>
                <DialogPrimitive.Title className="text-[18px] leading-snug font-bold">{TITLES[step]}</DialogPrimitive.Title>
              </div>
              <DialogPrimitive.Close render={<Button type="button" variant="subtle" size="icon-sm" />}>
                <Icon name="close" size={22} />
                <span className="sr-only">Fechar</span>
              </DialogPrimitive.Close>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-1">
              {[0, 1, 2, 3, 4].map((s) => (
                <div key={s} className={cn("h-1 rounded-full", s <= step ? "bg-brand" : "bg-border")} />
              ))}
            </div>
            {context && <div className="mt-2.5 truncate text-[13px] font-medium text-text-2">{context}</div>}
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-4">
            {error && <AlertBanner messages={error} className="mb-4" />}

            {step === 0 && (
              <CustomerStep
                selectedCustomerId={customerId}
                formMode={customerFormMode}
                formValues={customerForm}
                tried={customerTried}
                onPickExisting={pickExistingCustomer}
                onToggleForm={() => setCustomerFormMode((v) => !v)}
                onFormChange={(patch) => setCustomerForm((f) => ({ ...f, ...patch }))}
              />
            )}
            {step === 1 && (
              <ServiceStep
                selectedServiceId={service?.id ?? null}
                onPick={(s) => {
                  setService(s);
                  setProfessionalId(null);
                  setProfessionalName(null);
                  setSlot(null);
                  setStep(2);
                }}
              />
            )}
            {step === 2 && service && (
              <ProfessionalStep
                serviceId={service.id}
                timeZoneId={timeZoneId}
                selectedProfessionalId={professionalId}
                onPick={(id, name) => {
                  setProfessionalId(id);
                  setProfessionalName(name);
                  setSlot(null);
                  setStep(3);
                }}
              />
            )}
            {step === 3 && service && professionalId && (
              <DateTimePicker
                serviceId={service.id}
                professionalId={professionalId}
                timeZoneId={timeZoneId}
                date={date}
                slot={slot}
                onPick={(d, s) => {
                  setDate(d);
                  setSlot(s);
                  setError(null);
                }}
              />
            )}
            {step === 4 && service && professionalName && slot && (
              <ReviewStep
                customerName={customerName}
                customerPhone={customerPhone}
                service={service}
                professionalName={professionalName}
                date={date}
                slot={slot}
                timeZoneId={timeZoneId}
              />
            )}
          </div>

          {primary && (
            <div className="shrink-0 border-t px-4 py-3.5">
              <Button className="h-12 w-full" disabled={primary.disabled} onClick={primary.onClick}>
                {primary.label}
              </Button>
            </div>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

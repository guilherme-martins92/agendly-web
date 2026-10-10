"use client";

import { useQueries } from "@tanstack/react-query";
import { useEffect, useSyncExternalStore } from "react";
import { useSession } from "@/components/backoffice/session-context";
import { getListWorkSchedulesQueryOptions, useListProfessionals } from "@/lib/api/generated/professionals/professionals";
import { useListServices } from "@/lib/api/generated/services/services";

// "Compartilhou o link" e "terminou o checklist" não existem no backend: são preferências locais.
// useSyncExternalStore evita divergir a primeira renderização do cliente da do servidor (sem localStorage).
const sharedKey = (businessId: string) => `agendly-onboarding-shared:${businessId}`;
const doneKey = (businessId: string) => `agendly-onboarding-done:${businessId}`;

const listeners = new Set<() => void>();

function readFlag(key: string) {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function setFlag(key: string) {
  try {
    localStorage.setItem(key, "1");
  } catch {
    // Armazenamento indisponível (ex.: navegação privada): a marcação só vale nesta visita
  }
  listeners.forEach((listener) => listener());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function useFlag(key: string) {
  return useSyncExternalStore(
    subscribe,
    () => readFlag(key),
    () => false,
  );
}

export function markLinkShared(businessId: string) {
  setFlag(sharedKey(businessId));
}

/**
 * Andamento do checklist de primeiros passos. Com `enabled: false` não consulta a API
 * (ex.: funcionário, ou checklist já concluído neste navegador).
 */
export function useOnboardingProgress({ enabled = true }: { enabled?: boolean } = {}) {
  const { business } = useSession();

  const services = useListServices({ query: { enabled } });
  const professionals = useListProfessionals({ query: { enabled } });
  const scheduleQueries = useQueries({
    queries: enabled ? (professionals.data ?? []).map((p) => getListWorkSchedulesQueryOptions(p.id)) : [],
  });
  const shared = useFlag(sharedKey(business.id));

  const isError = services.isError || professionals.isError;
  const isPending = services.isPending || professionals.isPending;
  const schedulesPending = scheduleQueries.some((q) => q.isPending);

  const list = professionals.data ?? [];
  const withService = list.find((p) => p.serviceIds.length > 0);
  const hasService = (services.data?.length ?? 0) > 0;
  const hasProfessional = list.length > 0;
  // Sem serviço vinculado o profissional não aparece na página pública
  const hasLinkedProfessional = Boolean(withService);
  const hasSchedule = scheduleQueries.some((q) => (q.data?.length ?? 0) > 0);

  const ready = enabled && !isPending && !isError && !schedulesPending;
  // O que a página pública precisa para funcionar. "Compartilhou o link" fica de fora: é marcado por
  // navegador, e não deve fazer o checklist reaparecer no menu em cada aparelho novo.
  const setupDone = ready && hasService && hasLinkedProfessional && hasSchedule;

  useEffect(() => {
    if (setupDone) setFlag(doneKey(business.id));
  }, [setupDone, business.id]);

  return {
    isError,
    isPending,
    error: services.error ?? professionals.error,
    refetch: () => {
      services.refetch();
      professionals.refetch();
    },
    /** Todas as consultas terminaram: os passos abaixo são definitivos, não um estado de carregamento. */
    ready,
    hasService,
    hasProfessional,
    hasLinkedProfessional,
    hasSchedule,
    shared,
    setupDone,
    /** Profissional para onde os atalhos do checklist levam: o que já tem serviço, ou o cadastrado por último. */
    targetProfessional: withService ?? list.at(-1),
  };
}

/** O item "Primeiros passos" aparece no menu do proprietário enquanto faltar algo para a página pública funcionar. */
export function useShowOnboardingLink() {
  const { business, isOwner } = useSession();
  const done = useFlag(doneKey(business.id));
  const progress = useOnboardingProgress({ enabled: isOwner && !done });

  return isOwner && !done && progress.ready && !progress.setupDone;
}

import type { QueryClient } from "@tanstack/react-query";

const startsWith = (prefixes: string[]) => (query: { queryKey: readonly unknown[] }) => {
  const [path] = query.queryKey;
  return typeof path === "string" && prefixes.some((prefix) => path.startsWith(prefix));
};

/**
 * Depois de criar, reagendar ou mudar o status de um agendamento no backoffice: além da lista,
 * mudam os horários livres e os números derivados (histórico do cliente, dashboard).
 */
export function invalidateAppointmentData(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ predicate: startsWith(["/appointments", "/customers", "/dashboard"]) });
}

/** Horários livres da página pública de um negócio (grade de horários e resumo por dia). */
export function invalidatePublicAvailability(queryClient: QueryClient, slug: string) {
  return queryClient.invalidateQueries({
    predicate: startsWith([`/public/${slug}/available-slots`, `/public/${slug}/availability-summary`]),
  });
}

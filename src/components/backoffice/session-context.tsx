"use client";

import { createContext, useContext } from "react";
import type { BusinessDto, UserProfileDto } from "@/lib/api/generated/model";
import type { Role } from "@/lib/navigation";

export type BackofficeSession = {
  user: UserProfileDto;
  business: BusinessDto;
  role: Role;
  isOwner: boolean;
  /**
   * Pode criar/editar serviços, profissionais e clientes. Espelha a política ManageCatalog da API
   * (hoje só o proprietário); para o funcionário as telas ficam em modo leitura.
   */
  canManageCatalog: boolean;
  /** Pode confirmar, concluir e cancelar agendamentos: proprietário e funcionário. */
  canChangeAppointmentStatus: boolean;
};

export const SessionContext = createContext<BackofficeSession | null>(null);

/** Usuário, negócio e papel da sessão atual. Disponível dentro do backoffice (/app). */
export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession deve ser usado dentro do BackofficeShell.");
  return session;
}

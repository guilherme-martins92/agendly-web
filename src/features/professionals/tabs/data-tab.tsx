"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/components/backoffice/session-context";
import { Button } from "@/components/ui/button";
import { AlertBanner, Field, TextInput } from "@/components/ui/field";
import { errorMessages } from "@/lib/api/errors";
import type { ProfessionalDto } from "@/lib/api/generated/model";
import { getListProfessionalsQueryKey, useUpdateProfessional } from "@/lib/api/generated/professionals/professionals";
import { Avatar } from "../professionals-screen";

/** Aba "Dados": nome do profissional (foto fica para uma próxima etapa; aparecem as iniciais). */
export function DataTab({ professional }: { professional: ProfessionalDto }) {
  const { canManageCatalog } = useSession();
  const queryClient = useQueryClient();
  const [name, setName] = useState(professional.name);
  const [tried, setTried] = useState(false);
  const [apiError, setApiError] = useState<string[] | null>(null);

  const error = name.trim().length < 2 ? "Informe o nome do profissional." : null;
  const dirty = name.trim() !== professional.name;

  const update = useUpdateProfessional({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProfessionalsQueryKey() });
        toast.success("Dados salvos");
      },
      onError: (err) => setApiError(errorMessages(err)),
    },
  });

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setTried(true);
        setApiError(null);
        if (!error && dirty) update.mutate({ id: professional.id, data: { name: name.trim() } });
      }}
      className="flex max-w-[560px] flex-col gap-5 rounded-lg border bg-surface p-[22px]"
    >
      <div className="flex items-center gap-4">
        <Avatar name={professional.name} className="size-[72px] text-[24px]" />
        <div className="text-[13px] leading-normal font-medium text-text-2">
          As iniciais aparecem para os clientes na página de agendamento.
        </div>
      </div>

      {apiError && <AlertBanner title="Não foi possível salvar" messages={apiError} />}

      <Field label="Nome" htmlFor="professional-name" error={tried ? error : null}>
        <TextInput
          id="professional-name"
          maxLength={100}
          value={name}
          disabled={!canManageCatalog}
          hasError={Boolean(tried && error)}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>

      {canManageCatalog && (
        <div>
          <Button type="submit" disabled={!dirty || update.isPending}>
            {update.isPending ? "Salvando…" : "Salvar alterações"}
          </Button>
        </div>
      )}
    </form>
  );
}

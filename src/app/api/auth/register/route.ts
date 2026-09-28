import { forwardError, loginAndCreateSession, postToApi } from "@/lib/server/auth";
import { withApiErrors } from "@/lib/server/session";

type RegisterBody = {
  businessName: string;
  businessSlug: string;
  userName: string;
  email: string;
  password: string;
};

/** Cria negócio + usuário na API e já entra, para o dono cair direto no onboarding. */
export const POST = withApiErrors(async (request: Request) => {
  const body = (await request.json()) as RegisterBody;

  const upstream = await postToApi("/auth/register", body, request);
  if (!upstream.ok) return forwardError(upstream);

  return loginAndCreateSession(body.email, body.password, request);
});

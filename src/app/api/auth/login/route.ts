import { loginAndCreateSession } from "@/lib/server/auth";
import { withApiErrors } from "@/lib/server/session";

export const POST = withApiErrors(async (request: Request) => {
  const { email, password } = (await request.json()) as { email?: string; password?: string };
  return loginAndCreateSession(email ?? "", password ?? "", request);
});

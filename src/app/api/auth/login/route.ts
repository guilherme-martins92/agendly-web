import { loginAndCreateSession } from "@/lib/server/auth";

export async function POST(request: Request) {
  const { email, password } = (await request.json()) as { email?: string; password?: string };
  return loginAndCreateSession(email ?? "", password ?? "", request);
}

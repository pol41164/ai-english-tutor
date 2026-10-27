import { requireUser } from "@/lib/auth";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  return Response.json({ user: { email: user.email, name: user.name } });
}

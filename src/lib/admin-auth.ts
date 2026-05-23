import { auth } from "@/auth";

/** Renvoie la session si l'utilisateur est admin, sinon null. */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.isAdmin) return null;
  return session;
}

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ClientsAdmin } from "./ClientsAdmin";
import styles from "../page.module.css";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/admin/clients");

  if (!session.user?.isAdmin) {
    return (
      <main className={styles.page}>
        <div className={styles.accessDenied}>
          <h1>Accès refusé</h1>
          <p>Votre compte n&apos;a pas les droits administrateur.</p>
          <a href="/" className={styles.backLink}>← Retour au site</a>
        </div>
      </main>
    );
  }

  const clients = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, groupe: true },
  });

  return (
    <main className={styles.page}>
      <ClientsAdmin initial={clients} adminEmail={session.user.email ?? ""} />
    </main>
  );
}

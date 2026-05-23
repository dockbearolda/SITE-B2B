import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { siteContentDefaults } from "@/lib/site-content";
import { ContenuAdmin } from "./ContenuAdmin";
import styles from "../page.module.css";

export const dynamic = "force-dynamic";

export default async function ContenuPage() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/admin/contenu");

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

  const row = await prisma.siteContent.findUnique({ where: { id: 1 } });
  const d = siteContentDefaults();
  const initial = {
    brandName: row?.brandName ?? d.brandName,
    contactEmail: row?.contactEmail ?? d.contactEmail,
    footerAddress: row?.footerAddress ?? d.footerAddress,
    iban: row?.iban ?? "",
    bic: row?.bic ?? "",
    siret: row?.siret ?? "",
    metaTitle: row?.metaTitle ?? d.metaTitle,
    metaDescription: row?.metaDescription ?? d.metaDescription,
    heroTagline: row?.heroTagline ?? "",
    ctaLabel: row?.ctaLabel ?? d.ctaLabel,
    ctaHref: row?.ctaHref ?? d.ctaHref,
  };

  return (
    <main className={styles.page}>
      <ContenuAdmin initial={initial} adminEmail={session.user.email ?? ""} />
    </main>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const ZONES = [
  {
    href: "/admin/catalogue",
    title: "Catalogue",
    desc: "Familles, catégories, produits, prix, images et mise en ligne.",
  },
  {
    href: "/admin/contenu",
    title: "Contenu du site",
    desc: "Marque, coordonnées, mentions légales, SEO et page d'accueil.",
  },
  {
    href: "/admin/clients",
    title: "Clients",
    desc: "Comptes clients : création, accès et mots de passe.",
  },
];

export default async function AdminPage() {
  const session = await auth();

  if (!session) {
    redirect("/login?callbackUrl=/admin");
  }

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

  return (
    <main className={styles.page}>
      <div className={styles.admin}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Administration OLDA</h1>
            <p className={styles.subtitle}>Connecté : {session.user.email}</p>
          </div>
          <a href="/" className={styles.backLink}>← Site</a>
        </div>

        <div className={styles.dashGrid}>
          {ZONES.map((z) => (
            <Link key={z.href} href={z.href} className={styles.dashCard}>
              <span className={styles.dashCardTitle}>{z.title}</span>
              <span className={styles.dashCardDesc}>{z.desc}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

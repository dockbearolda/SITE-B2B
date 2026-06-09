"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./admin-bubble.module.css";

/** Bulle flottante ultra simple (bas-gauche) — accès rapide à l'administration. */
export function AdminBubble() {
  const pathname = usePathname();

  // Inutile dans l'admin et sur la page de connexion.
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/login")) return null;

  return (
    <Link href="/admin" className={styles.bubble} aria-label="Accès administration">
      Admin
    </Link>
  );
}

"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { RollingNumber } from "@/components/ui/rolling-number";
import styles from "./margin-dashboard.module.css";

function fmt(n: number): string {
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " €";
}

export function MarginDashboard({ vertical = false }: { vertical?: boolean }) {
  const { hasPrices, totalB2B, totalRevente, margeNette, coeffMarge } = useCart();
  const [isOpen, setIsOpen] = useState(true);

  if (!hasPrices) return null;

  const isPositive = margeNette >= 0;
  const heroSign = isPositive ? "+" : "";
  const coeffSign = coeffMarge >= 0 ? "+" : "";

  return (
    <div className={styles.dashboard}>
      {/* ── En-tête cliquable ── */}
      <button
        className={styles.toggle}
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Masquer le tableau de rentabilité" : "Afficher le tableau de rentabilité"}
      >
        <span className={styles.label}>Tableau de rentabilité</span>

        {/* Résumé compact visible quand replié */}
        {!isOpen && (
          <span className={styles.summary}>
            <span className={styles.summaryValue}>
              <RollingNumber
                value={margeNette}
                format={(n) => (n >= 0 ? "+" : "") + fmt(n)}
              />
            </span>
            <span className={styles.summaryBadge}>
              coeff{" "}
              <RollingNumber
                value={coeffMarge}
                format={(n) => (n >= 0 ? "+" : "") + n.toFixed(3)}
              />
            </span>
          </span>
        )}

        {/* Chevron */}
        <svg
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* ── Détail dépliable ── */}
      {isOpen && (
        <div className={`${styles.metrics} ${vertical ? styles.metricsVertical : ""}`}>
          {/* Investissement B2B */}
          <div className={styles.metric}>
            <span className={styles.metricValue}>
              <RollingNumber value={totalB2B} format={fmt} />
            </span>
            <span className={styles.metricName}>Investissement B2B</span>
            <span className={styles.metricSub}>coût total de votre commande</span>
          </div>

          {/* Séparateur flèche */}
          <div className={styles.arrow} aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>

          {/* CA Potentiel */}
          <div className={styles.metric}>
            <span className={styles.metricValue}>
              <RollingNumber value={totalRevente} format={fmt} />
            </span>
            <span className={styles.metricName}>CA Potentiel</span>
            <span className={styles.metricSub}>chiffre d&apos;affaires à la revente</span>
          </div>

          {/* Séparateur flèche */}
          <div className={styles.arrow} aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>

          {/* Marge Nette — carte héro */}
          <div className={`${styles.metric} ${styles.metricHero}`}>
            <span className={styles.heroValue}>
              <RollingNumber
                value={margeNette}
                format={(n) => (n >= 0 ? "+" : "") + fmt(n)}
              />
            </span>
            <span className={styles.heroName}>Bénéfice net projeté</span>
            <span className={styles.heroBadge}>
              coeff{" "}
              <RollingNumber
                value={coeffMarge}
                format={(n) => (n >= 0 ? "+" : "") + n.toFixed(3)}
              />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

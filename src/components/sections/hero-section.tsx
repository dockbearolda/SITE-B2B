import Link from "next/link";

import { catalogFamilies, catalogSummary } from "@/data/catalog";
import { Container } from "@/components/ui/container";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { AnimatedNumber } from "@/components/ui/animated-number";

import styles from "./hero-section.module.css";

function AtelierBadge() {
  return (
    <div className={styles.atelierBadge}>
      <svg
        className={styles.atelierIcon}
        width="13"
        height="13"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M8 1L9.8 5.8L15 6.3L11.2 9.6L12.4 14.7L8 12L3.6 14.7L4.8 9.6L1 6.3L6.2 5.8L8 1Z"
          fill="currentColor"
          fillOpacity="0.85"
        />
      </svg>
      <span className={styles.atelierText}>
        Gravure sur-mesure réalisée dans nos ateliers
      </span>
      <span className={styles.atelierSep} aria-hidden="true" />
      <span className={styles.atelierSub}>Depuis 2011</span>
    </div>
  );
}

const heroMetrics = [
  {
    target: catalogSummary.totalReferences,
    suffix: "+",
    label: "Références",
  },
  {
    target: catalogSummary.totalFamilies,
    suffix: "",
    label: "Familles",
  },
];

export function HeroSection() {
  const previewFamilies = catalogFamilies.slice(0, 3);

  return (
    <section className={styles.section} id="top">
      <Container>
        <div className={styles.shell}>
          <div className={styles.copy}>
            <AtelierBadge />
            <span className={styles.eyebrow}>Catalogue B2B</span>

            <h1 className={styles.title}>
              Une vitrine premium, simple et nette.
            </h1>

            <p className={styles.description}>
              Goodies, tasses, accessoires et textiles. Lecture rapide,
              structure propre, base légère.
            </p>

            <div className={styles.actions}>
              <Link className={styles.primaryAction} href="/#contact">
                Recevoir le catalogue pro
              </Link>
              <Link className={styles.secondaryAction} href="/catalogue">
                Explorer les familles
              </Link>
            </div>

            <div className={styles.metrics}>
              {heroMetrics.map((metric) => (
                <div key={metric.label} className={styles.metricCard}>
                  <span className={styles.metricValue}>
                    <AnimatedNumber
                      target={metric.target}
                      format={(n) => String(n) + metric.suffix}
                    />
                  </span>
                  <span className={styles.metricLabel}>{metric.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.preview}>
            <div className={styles.previewHeader}>
              <span className={styles.previewLabel}>Visuels</span>
              <h2 className={styles.previewTitle}>Emplacements photo</h2>
            </div>

            <div className={styles.mediaGrid}>
              <MediaPlaceholder
                className={styles.primaryMedia}
                ratio="landscape"
                label="Photo principale"
              />
              <div className={styles.secondaryMediaGrid}>
                <MediaPlaceholder ratio="square" label="Photo produit" />
                <MediaPlaceholder ratio="square" label="Photo détail" />
              </div>
            </div>

            <div className={styles.familyStack}>
              {previewFamilies.map((family) => (
                <article key={family.id} className={styles.familyCard}>
                  <div className={styles.familyTop}>
                    <h3 className={styles.familyName}>{family.name}</h3>
                    <span className={styles.familyCount}>
                      <AnimatedNumber
                        target={family.referenceCount}
                        format={(n) => String(n)}
                      />{" "}réf.
                    </span>
                  </div>

                  <div className={styles.pillRow}>
                    {family.subfamilies.slice(0, 3).map((subfamily) => (
                      <span key={subfamily.name} className={styles.pill}>
                        {subfamily.name}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <div className={styles.signalRow}>
              <span className={styles.signal}>Devis sur demande</span>
              <span className={styles.signal}>Minimums de commande</span>
              <span className={styles.signal}>{catalogSummary.stockSignal}</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

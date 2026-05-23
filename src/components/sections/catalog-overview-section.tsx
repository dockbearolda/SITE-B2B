import type { CSSProperties } from "react";
import Link from "next/link";

import { catalogFamilies } from "@/data/catalog";
import { Container } from "@/components/ui/container";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { SectionHeading } from "@/components/ui/section-heading";
import { AnimatedNumber } from "@/components/ui/animated-number";

import styles from "./catalog-overview-section.module.css";

export function CatalogOverviewSection() {
  return (
    <section className={styles.section} id="catalogue">
      <Container>
        <div className={styles.header}>
          <SectionHeading
            eyebrow="Catalogue"
            title="Familles principales."
          />
        </div>

        <div className={styles.grid}>
          {catalogFamilies.map((family) => {
            const cardStyle = {
              "--card-surface": family.surface,
            } as CSSProperties;

            return (
              <Link
                key={family.id}
                className={styles.card}
                href={`/catalogue/${family.id}`}
                style={cardStyle}
              >
                <MediaPlaceholder
                  ratio="landscape"
                  label={`Photo ${family.name}`}
                />

                <div className={styles.cardTop}>
                  <div className={styles.meta}>
                    <h3 className={styles.name}>{family.name}</h3>
                    <span className={styles.count}>
                      <AnimatedNumber
                        target={family.referenceCount}
                        format={(n) => String(n)}
                      />{" "}réf.
                    </span>
                  </div>
                  <p className={styles.strapline}>{family.strapline}</p>
                </div>

                <div className={styles.subfamilyList}>
                  {family.subfamilies.map((subfamily) => (
                    <div key={subfamily.name} className={styles.subfamilyItem}>
                      <div className={styles.subfamilyMeta}>
                        <span>{subfamily.name}</span>
                        <span className={styles.subfamilyCount}>
                          <AnimatedNumber
                            target={subfamily.itemCount}
                            format={(n) => String(n)}
                          />{" "}réf.
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <span className={styles.openLink}>Ouvrir</span>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

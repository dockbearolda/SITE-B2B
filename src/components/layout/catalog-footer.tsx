import styles from "./catalog-footer.module.css";

export function CatalogFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>

        {/* ── Colonne 1 : L'Entreprise ── */}
        <div className={styles.col}>
          <div className={styles.logoBlock}>
            <svg
              className={styles.logo}
              viewBox="60 65 165 180"
              aria-label="OLDA"
              fill="currentColor"
            >
              <path d="M187.85,114.63h33.12c.82,0,1.48.66,1.48,1.48v34.05c0,.82-.66,1.48-1.48,1.48h-73.22c-.82,0-1.48-.66-1.48-1.48v-76.52c0-.82.66-1.48,1.48-1.48h37.15c.82,0,1.48.66,1.48,1.48v39.51c0,.82.66,1.48,1.48,1.48Z" />
              <path d="M141.24,238.96l41.28-77.18c.58-1.05,2.09-1.05,2.67,0l41.39,77.18c.56,1.02-.18,2.26-1.34,2.26h-82.67c-1.16,0-1.89-1.24-1.34-2.26Z" />
              <path d="M101.44,161.74h-2.56l.48,79.48h1.16c20.68,0,38.61-15.44,40.49-36.03,2.14-23.57-16.43-43.44-39.57-43.44Z" />
              <path d="M95.36,161.74h-32.71c-.82,0-1.48.66-1.48,1.48v76.52c0,.82.66,1.48,1.48,1.48h32.26l.45-79.48Z" />
              <path d="M140.12,108.5c-1.61-20.24-18-36.63-38.24-38.24-25.72-2.04-47.09,19.32-45.05,45.04,1.6,20.24,18,36.64,38.24,38.25.12,0,.23,0,.34.02l.23-39.79v-.05l-11.32,11.07s-1.19-11.25,6.13-12.84h-13s4.12-7.32,14.54-4.85l-7.67-7.67s11.86-1.72,12.82,6.62c1.07-8.9,12.54-6.48,12.54-6.48l-7.92,8.04c8.81-3.63,14.91,4.33,14.91,4.33h-13.05c4.85,1.4,6.01,6.08,6.2,9.41.14,2.05-.12,3.59-.12,3.59l-3.54-3.59-7.55-7.62.24,39.91c24-.2,43.23-20.71,41.29-45.17Z" />
            </svg>
            <span className={styles.brandName}>OLDA</span>
          </div>
          <address className={styles.address}>
            <span>Atelier OLDA</span>
            <span>1 Rue Opales, Grand Case</span>
            <span>Saint‑Martin (French West Indies)</span>
          </address>
        </div>

        {/* ── Colonne 2 : Règlement & Comptabilité ── */}
        <div className={styles.col}>
          <div className={styles.colHeader}>
            <svg
              className={styles.icon}
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              aria-hidden="true"
            >
              <path d="M2 7l8-4 8 4v1H2V7z" strokeLinejoin="round" />
              <rect x="4" y="8" width="2" height="6" rx="0.5" />
              <rect x="9" y="8" width="2" height="6" rx="0.5" />
              <rect x="14" y="8" width="2" height="6" rx="0.5" />
              <line x1="2" y1="14" x2="18" y2="14" />
              <line x1="1" y1="16" x2="19" y2="16" />
            </svg>
            <span className={styles.colTitle}>Règlement &amp; Comptabilité</span>
          </div>
          <dl className={styles.dataList}>
            <div className={styles.dataRow}>
              <dt className={styles.dataLabel}>IBAN</dt>
              <dd className={styles.dataValue}>FR76 1027 8053 6000 0217 1400 271</dd>
            </div>
            <div className={styles.dataRow}>
              <dt className={styles.dataLabel}>BIC</dt>
              <dd className={styles.dataValue}>CMCIFR2A</dd>
            </div>
          </dl>
        </div>

        {/* ── Colonne 3 : Légal & Contact ── */}
        <div className={styles.col}>
          <div className={styles.colHeader}>
            <svg
              className={styles.icon}
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              aria-hidden="true"
            >
              <rect x="3" y="2" width="14" height="16" rx="1.5" />
              <line x1="6" y1="7" x2="14" y2="7" />
              <line x1="6" y1="10" x2="14" y2="10" />
              <line x1="6" y1="13" x2="10" y2="13" />
            </svg>
            <span className={styles.colTitle}>Informations Légales</span>
          </div>
          <dl className={styles.dataList}>
            <div className={styles.dataRow}>
              <dt className={styles.dataLabel}>SIRET</dt>
              <dd className={styles.dataValue}>978 296 952 00028</dd>
            </div>
            <div className={styles.dataRow}>
              <dt className={styles.dataLabel}>Contact</dt>
              <dd className={styles.dataValue}>
                <a
                  href="mailto:atelierolda@gmail.com"
                  className={styles.emailLink}
                >
                  atelierolda@gmail.com
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* ── Copyright ── */}
      <p className={styles.copyright}>
        © {new Date().getFullYear()} Atelier Olda · Tous droits réservés.
      </p>
    </footer>
  );
}

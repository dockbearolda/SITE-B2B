"use client";

import styles from "./rolling-number.module.css";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

function defaultFormat(n: number): string {
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
}

interface DigitReelProps {
  digit: number;
  /** true = transition CSS (valeurs dynamiques), false = instantané (count-up RAF) */
  animated: boolean;
}

function DigitReel({ digit, animated }: DigitReelProps) {
  return (
    <span className={styles.digitCol} aria-hidden="true">
      <span
        className={`${styles.digitTrack}${animated ? " " + styles.digitTrackAnimated : ""}`}
        style={{ "--rn-digit": digit } as React.CSSProperties}
      >
        {DIGITS.map((d) => (
          <span key={d} className={styles.digitCell}>
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

export interface RollingNumberProps {
  value: number;
  /** Fonction de formatage — doit produire une string (ex. "1 250,00 €") */
  format?: (n: number) => string;
  /**
   * true (défaut) = transition CSS 420ms entre les digits → pour valeurs dynamiques.
   * false = changement instantané → utiliser avec useCountUp (RAF pilote l'animation).
   */
  animated?: boolean;
  className?: string;
}

/**
 * Affiche un nombre avec un effet odomètre / slot machine.
 * Chaque digit est une colonne verticale (0–9) qui défile via translateY.
 * Les caractères non-digit (€, virgule, espace…) sont rendus statiquement.
 */
export function RollingNumber({
  value,
  format = defaultFormat,
  animated = true,
  className,
}: RollingNumberProps) {
  const text = format(value);

  return (
    <span
      className={[styles.root, className].filter(Boolean).join(" ")}
      aria-label={text}
      suppressHydrationWarning
    >
      {text.split("").map((char, i) => {
        const d = parseInt(char, 10);
        if (!isNaN(d)) {
          return <DigitReel key={i} digit={d} animated={animated} />;
        }
        return (
          <span key={i} className={styles.staticChar} aria-hidden="true">
            {char}
          </span>
        );
      })}
    </span>
  );
}

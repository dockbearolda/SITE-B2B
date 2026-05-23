"use client";

import { RollingNumber } from "@/components/ui/rolling-number";
import styles from "./cart-progress-bar.module.css";

type CartProgressBarProps = {
  currentAmount: number;
  targetAmount?: number;
};

function fmt(n: number): string {
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + "\u00a0€";
}

export function CartProgressBar({
  currentAmount,
  targetAmount = 500,
}: CartProgressBarProps) {
  const isUnlocked = currentAmount >= targetAmount;
  const remaining = Math.max(0, targetAmount - currentAmount);
  const pct = Math.min(100, (currentAmount / targetAmount) * 100);

  return (
    <div className={styles.wrapper} aria-live="polite">
      {/* Label */}
      <p className={`${styles.label} ${isUnlocked ? styles.labelSuccess : ""}`}>
        {isUnlocked ? (
          <span className={styles.successText}>
            <span className={styles.checkmark} aria-hidden="true">✓</span>
            Livraison gratuite
          </span>
        ) : (
          <>
            Plus que{" "}
            <span className={styles.amount}>
              <RollingNumber value={remaining} format={fmt} />
            </span>
            {" "}pour la livraison gratuite
          </>
        )}
      </p>

      {/* Track */}
      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`${styles.fill} ${isUnlocked ? styles.fillSuccess : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

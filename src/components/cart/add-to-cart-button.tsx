"use client";

import { useCallback, useState } from "react";

import { useCart } from "@/lib/cart-context";
import { useToast } from "@/lib/toast-context";

import styles from "./add-to-cart-button.module.css";

type AddToCartButtonProps = {
  productRef: string;
  productLabel: string;
  productPrixAchat?: number;
  productPrixRevente?: number;
  /** Minimum de commande — lu depuis catalog.ts, pas hardcodé */
  moq?: number;
  /** Palier des boutons +/− (= moq si non spécifié) */
  step?: number;
};

function fmt(val: number): string {
  return val.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function AddToCartButton({
  productRef,
  productLabel,
  productPrixAchat,
  productPrixRevente,
  moq = 1,
  step,
}: AddToCartButtonProps) {
  const { add } = useCart();
  const { toast } = useToast();
  const increment = step ?? moq;
  const [pendingQty, setPendingQty] = useState(moq);
  const [phase, setPhase] = useState<"idle" | "loading" | "added">("idle");

  const margeUnitaire =
    productPrixAchat != null && productPrixRevente != null
      ? productPrixRevente - productPrixAchat
      : null;

  const margeEstimee =
    margeUnitaire !== null ? margeUnitaire * pendingQty : null;

  const handleAdd = useCallback(() => {
    setPhase("loading");
    setTimeout(() => {
      add(productRef, productLabel, pendingQty, productPrixAchat, productPrixRevente);
      toast(`${pendingQty}× ${productLabel} ajouté`);
      setPhase("added");
      setTimeout(() => {
        setPhase("idle");
        setPendingQty(moq);
      }, 1500);
    }, 300);
  }, [add, toast, productRef, productLabel, pendingQty, productPrixAchat, productPrixRevente, moq]);

  return (
    <div className={styles.block}>
      {/* Zone 5 — Méta : pastille MOQ (visibility:hidden si absent) + marge unitaire */}
      <div className={styles.meta}>
        <div
          className={`${styles.moqBadge}${moq > 1 ? ` ${styles.moqBadgeVisible}` : ""}`}
          aria-hidden={moq <= 1}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Min.&nbsp;{moq}&nbsp;unités
        </div>
        {margeUnitaire !== null && (
          <span className={styles.margeUnitaire}>
            Marge unitaire&nbsp;:{" "}
            <span className={styles.margeAmount}>+{fmt(margeUnitaire)}&nbsp;€</span>
          </span>
        )}
      </div>

      {/* Zone 6 — Sélecteur quantité + marge estimée (même ligne) */}
      <div className={styles.controlRow}>
        <div className={styles.stepper}>
          <button
            className={styles.qtyBtn}
            aria-label="Diminuer"
            onClick={() => setPendingQty((q) => Math.max(moq, q - increment))}
          >
            −
          </button>
          <span className={styles.qtyValue}>{pendingQty}</span>
          <button
            className={styles.qtyBtn}
            aria-label="Augmenter"
            onClick={() => setPendingQty((q) => q + increment)}
          >
            +
          </button>
        </div>
        {margeEstimee !== null && (
          <span className={styles.gainSummary}>
            Marge estimée&nbsp;:{" "}
            <span className={styles.gainAmount}>+{fmt(margeEstimee)}&nbsp;€</span>
          </span>
        )}
      </div>

      {/* Zone 7 — Bouton Ajouter au panier (toujours pleine largeur, noir) */}
      <button
        className={[
          styles.button,
          phase === "loading" ? styles.buttonLoading : "",
          phase === "added" ? styles.buttonAdded : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={handleAdd}
        disabled={phase !== "idle"}
      >
        {phase === "loading" && (
          <span className={styles.spinner} aria-hidden="true" />
        )}
        {phase === "added" && (
          <>
            <svg
              className={styles.checkIcon}
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="2.5 8.5 6.5 12.5 13.5 4.5" />
            </svg>
            Ajouté ✓
          </>
        )}
        {phase === "idle" && "Ajouter au panier"}
      </button>
    </div>
  );
}

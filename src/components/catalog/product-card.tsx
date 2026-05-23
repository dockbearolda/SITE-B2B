"use client";

import { memo } from "react";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { PremiumPlaceholder } from "@/components/ui/premium-placeholder";
import type { CatalogProduct } from "@/data/catalog";
import { getProductImagePath } from "@/lib/product-image";

import { ProductBadge, getProductBadge } from "./product-badge";
import { ProductImage } from "./product-image";
import styles from "./product-card.module.css";

// ── Color helpers ────────────────────────────────────────────────
const COLOR_MAP: Record<string, string> = {
  rouge: "#d94f4f",
  orange: "#e07c2e",
  rose: "#d95c9a",
  bleu: "#4a87cc",
  vert: "#459e68",
  noir: "#1d1d1f",
  blanc: "#e0e0e0",
  jaune: "#d4b832",
};

const GLOW_SKIP = new Set(["noir", "blanc"]);

function getGlowColor(label: string): string | null {
  const lower = label.toLowerCase();
  for (const [name, hex] of Object.entries(COLOR_MAP)) {
    if (!GLOW_SKIP.has(name) && lower.includes(name)) return hex;
  }
  return null;
}

// ── Price helpers ────────────────────────────────────────────────
function parsePrice(price: string | undefined): number | undefined {
  if (!price) return undefined;
  const n = parseFloat(price.replace(",", ".").replace(/[^\d.]/g, ""));
  return isNaN(n) ? undefined : n;
}

function formatPrice(val: number): string {
  return (
    val.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " €"
  );
}

// ── Pricing block Achat → Revente (sans badge marge) ────────────
function PricingBlock({
  achat,
  revente,
}: {
  achat?: number;
  revente?: number;
}) {
  if (!achat && !revente) return null;

  if (!achat || !revente) {
    return (
      <div className={styles.pricingBlock}>
        <span className={styles.colLabel}>{achat ? "Achat" : "Revente"}</span>
        <span className={styles.colVal}>
          {formatPrice((achat ?? revente)!)}
        </span>
      </div>
    );
  }

  return (
    <div className={styles.pricingBlock}>
      <div className={styles.colAchat}>
        <span className={styles.colLabel}>Achat</span>
        <span className={styles.colVal}>{formatPrice(achat)}</span>
      </div>
      <span className={styles.colArrow} aria-hidden="true">
        →
      </span>
      <div className={styles.colRevente}>
        <span className={styles.colLabel}>Revente</span>
        <span className={`${styles.colVal} ${styles.colValRevente}`}>
          {formatPrice(revente)}
        </span>
      </div>
    </div>
  );
}

// ── ProductCard — composant canonique unique ─────────────────────
export type ProductCardProps = {
  item: CatalogProduct;
  siblingColors: string[];
  onQuickView: (product: CatalogProduct) => void;
};

export const ProductCard = memo(function ProductCard({
  item,
  siblingColors: _siblingColors,
  onQuickView,
}: ProductCardProps) {
  const src = getProductImagePath(item.ref);
  const badge = getProductBadge(item.ref);
  const glowColor = getGlowColor(item.label);
  const is350ml = item.note2 === "350 ml";

  return (
    <article className={styles.card}>
      {/* Zone 1 — Image (hauteur fixe 260px) */}
      <div
        className={styles.imageWrap}
        style={
          glowColor
            ? {
                background: `radial-gradient(ellipse at 50% 58%, ${glowColor}14 0%, ${glowColor}00 68%), #FFFFFF`,
              }
            : { background: "#FFFFFF" }
        }
      >
        {src ? (
          <ProductImage src={src} alt={item.label} className={styles.image} />
        ) : (
          <PremiumPlaceholder />
        )}
        {badge && <ProductBadge type={badge} />}
        <button
          className={styles.quickViewBtn}
          onClick={() => onQuickView(item)}
          aria-label={`Aperçu de ${item.label}`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>
      </div>

      {/* Contenu textuel + actions */}
      <div className={styles.content}>
        {/* Zone 2 — En-tête : ref + contenance */}
        <div className={styles.header}>
          <span className={styles.ref}>{item.ref}</span>
          {is350ml && <span className={styles.volumeTag}>350 ml</span>}
        </div>

        {/* Zone 3 — Titre produit (2 lignes max, min-height: 56px) */}
        <h2 className={styles.title}>{item.label}</h2>

        {/* Zone 4 — Bloc Achat → Revente */}
        <PricingBlock
          achat={parsePrice(item.resellerPrice)}
          revente={parsePrice(item.retailPrice)}
        />

        {/* Zones 5-7 — collées en bas via margin-top: auto */}
        <div className={styles.cartSection}>
          <AddToCartButton
            productRef={item.ref}
            productLabel={item.label}
            productPrixAchat={parsePrice(item.resellerPrice)}
            productPrixRevente={parsePrice(item.retailPrice)}
            moq={item.moq ?? 1}
            step={item.step}
          />
        </div>
      </div>
    </article>
  );
});

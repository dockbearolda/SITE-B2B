"use client";

import { memo, useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { PremiumPlaceholder } from "@/components/ui/premium-placeholder";
import type { CatalogProduct } from "@/data/catalog";
import { getProductImagePath } from "@/lib/product-image";

import { ProductBadge, getProductBadge } from "./product-badge";
import { ProductImage } from "./product-image";
import { QuickViewModal } from "./quick-view-modal";
import styles from "./product-grid.module.css";

// ── Color extraction ────────────────────────────────────────────
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

/** Extract the series prefix from a ref, e.g. "TCF 01" → "TCF" */
function seriesPrefix(ref: string): string {
  return ref.split(" ")[0];
}

/** First color found in a product label */
function labelPrimaryColor(label: string): string | null {
  const lower = label.toLowerCase();
  for (const [name, hex] of Object.entries(COLOR_MAP)) {
    if (lower.includes(name)) return hex;
  }
  return null;
}

/** Build a map of series → unique hex colors from all products in the list */
function buildSeriesSwatches(
  products: readonly CatalogProduct[],
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const p of products) {
    const key = seriesPrefix(p.ref);
    const color = labelPrimaryColor(p.label);
    if (!color) continue;
    const existing = map.get(key) ?? [];
    if (!existing.includes(color)) existing.push(color);
    map.set(key, existing);
  }
  return map;
}

const GLOW_SKIP = new Set(["noir", "blanc"]);

function getGlowColor(label: string): string | null {
  const lower = label.toLowerCase();
  for (const [name, hex] of Object.entries(COLOR_MAP)) {
    if (!GLOW_SKIP.has(name) && lower.includes(name)) return hex;
  }
  return null;
}

function extractColors(products: readonly CatalogProduct[]): string[] {
  const found = new Set<string>();
  products.forEach((p) => {
    const lower = p.label.toLowerCase();
    Object.keys(COLOR_MAP).forEach((color) => {
      if (lower.includes(color)) found.add(color);
    });
  });
  return Array.from(found);
}

function extractNotes(products: readonly CatalogProduct[]): string[] {
  const found = new Set<string>();
  products.forEach((p) => {
    if (p.note1) found.add(p.note1);
    if (p.note2) found.add(p.note2);
  });
  return Array.from(found);
}

// ── Price parsing & formatting ───────────────────────────────────
function parsePrice(price: string | undefined): number | undefined {
  if (!price) return undefined;
  const n = parseFloat(price.replace(",", ".").replace(/[^\d.]/g, ""));
  return isNaN(n) ? undefined : n;
}

function formatPrice(val: number): string {
  return val.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "\u00a0€";
}


// ── Pricing block component ──────────────────────────────────────
function PricingBlock({ achat, revente }: { achat?: number; revente?: number }) {
  if (!achat && !revente) return null;

  // Cas dégradé : un seul prix disponible
  if (!achat || !revente) {
    return (
      <div className={styles.pricingBlock}>
        <span className={styles.colLabel}>{achat ? "Achat" : "Revente"}</span>
        <span className={styles.colVal}>{formatPrice((achat ?? revente)!)}</span>
      </div>
    );
  }

  const marge = revente - achat;

  return (
    <div className={styles.pricingBlock}>
      {/* Colonne gauche : Achat */}
      <div className={styles.colAchat}>
        <span className={styles.colLabel}>Achat</span>
        <span className={styles.colVal}>{formatPrice(achat)}</span>
      </div>

      {/* Flèche centrale */}
      <span className={styles.colArrow} aria-hidden="true">→</span>

      {/* Colonne droite : Revente */}
      <div className={styles.colRevente}>
        <span className={styles.colLabel}>Revente</span>
        <span className={`${styles.colVal} ${styles.colValRevente}`}>{formatPrice(revente)}</span>
      </div>

      {/* Badge marge — seulement si revente > achat */}
      {marge > 0 && (
        <div className={styles.marginRow}>
          <span className={styles.marginBadge}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            +{formatPrice(marge)}&nbsp;de marge
          </span>
        </div>
      )}
    </div>
  );
}


// ── ProductCard (memo) ──────────────────────────────────────────
type CardProps = {
  item: CatalogProduct;
  siblingColors: string[];
  onQuickView: (product: CatalogProduct) => void;
};

const ProductCard = memo(function ProductCard({ item, siblingColors, onQuickView }: CardProps) {
  const src = getProductImagePath(item.ref);
  const badge = getProductBadge(item.ref);
  const glowColor = getGlowColor(item.label);
  const is350ml = item.note2 === "350 ml";

  return (
    <article className={styles.itemCard}>
      <div
        className={styles.imageWrap}
        style={glowColor ? {
          background: `radial-gradient(ellipse at 50% 58%, ${glowColor}14 0%, ${glowColor}00 68%), #FFFFFF`,
        } : { background: "#FFFFFF" }}
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>
      </div>

      <div className={styles.itemContent}>
        <div className={styles.itemMeta}>
          <span className={styles.itemRef}>{item.ref}</span>
          {is350ml && <span className={styles.volumeTag}>350 ml</span>}
        </div>
        <h2 className={styles.itemName}>{item.label}</h2>

        <PricingBlock
          achat={parsePrice(item.resellerPrice)}
          revente={parsePrice(item.retailPrice)}
        />

        <AddToCartButton
          productRef={item.ref}
          productLabel={item.label}
          productPrixAchat={parsePrice(item.resellerPrice)}
          productPrixRevente={parsePrice(item.retailPrice)}
          moq={item.moq ?? 1}
          step={item.step}
        />
      </div>
    </article>
  );
});

// ── ProductListRow ──────────────────────────────────────────────
const ProductListRow = memo(function ProductListRow({ item, onQuickView }: CardProps) {
  const src = getProductImagePath(item.ref);
  const achat = parsePrice(item.resellerPrice);
  const revente = parsePrice(item.retailPrice);

  return (
    <div className={styles.listRow}>
      {/* Thumbnail */}
      <button
        className={styles.listThumb}
        onClick={() => onQuickView(item)}
        aria-label={`Aperçu de ${item.label}`}
        tabIndex={-1}
      >
        {src ? (
          <Image src={src} alt="" fill sizes="48px" className={styles.listThumbImg} />
        ) : (
          <PremiumPlaceholder />
        )}
      </button>

      {/* Ref */}
      <span className={styles.listRef}>{item.ref}</span>

      {/* Label */}
      <span className={styles.listLabel}>{item.label}</span>

      {/* Pricing (desktop: dedicated column; mobile: inline under label) */}
      {(achat || revente) && (
        <div className={styles.listPricing}>
          <div className={styles.listPriceGroup}>
            {achat && <span className={styles.listPriceMain}>{formatPrice(achat)}</span>}
            {revente && achat && (
              <span className={styles.listPricePvc}>→&nbsp;{formatPrice(revente)} boutique</span>
            )}
          </div>
        </div>
      )}

      {/* Add to cart (compact) */}
      <div className={styles.listActions}>
        <AddToCartButton
          productRef={item.ref}
          productLabel={item.label}
          productPrixAchat={achat}
          productPrixRevente={revente}
          moq={item.moq ?? 1}
          step={item.step}
        />
      </div>
    </div>
  );
});

// ── View mode icons ─────────────────────────────────────────────
function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="1" y1="4" x2="15" y2="4" />
      <line x1="1" y1="8" x2="15" y2="8" />
      <line x1="1" y1="12" x2="15" y2="12" />
    </svg>
  );
}

// ── Component ───────────────────────────────────────────────────
type Props = {
  products: readonly CatalogProduct[];
  viewMode?: "grid" | "list";
  onViewModeChange?: (mode: "grid" | "list") => void;
  title?: string;
};

export function ProductGrid({ products, viewMode = "grid", onViewModeChange, title }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeColors, setActiveColors] = useState<Set<string>>(new Set());
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [quickViewProduct, setQuickViewProduct] = useState<CatalogProduct | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const handleCloseModal = useCallback(() => setQuickViewProduct(null), []);

  const availableColors = useMemo(() => extractColors(products), [products]);
  const availableNotes = useMemo(() => extractNotes(products), [products]);
  const hasFilters = availableColors.length > 0 || availableNotes.length > 0;
  const seriesSwatchMap = useMemo(() => buildSeriesSwatches(products), [products]);
  const activeCount = activeColors.size + activeNotes.size;

  const filteredProducts = useMemo(() => {
    let result: readonly CatalogProduct[] = products;

    // Omni-search : ref + label
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.ref.toLowerCase().includes(q) ||
          p.label.toLowerCase().includes(q),
      );
    }

    // Color + note filters
    if (activeColors.size > 0 || activeNotes.size > 0) {
      result = result.filter((p) => {
        const lower = p.label.toLowerCase();
        const colorMatch =
          activeColors.size === 0 ||
          [...activeColors].some((c) => lower.includes(c));
        const noteMatch =
          activeNotes.size === 0 ||
          [...activeNotes].some((n) => p.note1 === n || p.note2 === n);
        return colorMatch && noteMatch;
      });
    }

    return result;
  }, [products, searchQuery, activeColors, activeNotes]);

  function toggleColor(color: string) {
    setActiveColors((prev) => {
      const next = new Set(prev);
      next.has(color) ? next.delete(color) : next.add(color);
      return next;
    });
  }

  function toggleNote(note: string) {
    setActiveNotes((prev) => {
      const next = new Set(prev);
      next.has(note) ? next.delete(note) : next.add(note);
      return next;
    });
  }

  const clearAll = useCallback(() => {
    setActiveColors(new Set());
    setActiveNotes(new Set());
    setSearchQuery("");
    searchRef.current?.focus();
  }, []);

  const totalActiveFilters = activeCount + (searchQuery.trim() ? 1 : 0);

  return (
    <div className={styles.wrapper}>
      {/* ── Header sticky : titre + recherche + filtres ── */}
      <div className={styles.stickyHeader}>
        {/* Titre + toggle vue */}
        {title && (
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{title}</h1>
            {onViewModeChange && (
              <div className={styles.viewToggle} role="group" aria-label="Mode d'affichage">
                <button
                  className={`${styles.viewBtn} ${viewMode === "grid" ? styles.viewBtnActive : ""}`}
                  onClick={() => onViewModeChange("grid")}
                  aria-label="Vue grille"
                  aria-pressed={viewMode === "grid"}
                  title="Vue grille"
                >
                  <GridIcon />
                </button>
                <button
                  className={`${styles.viewBtn} ${viewMode === "list" ? styles.viewBtnActive : ""}`}
                  onClick={() => onViewModeChange("list")}
                  aria-label="Vue liste"
                  aria-pressed={viewMode === "list"}
                  title="Vue liste dense"
                >
                  <ListIcon />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Omni-Search */}
        <div className={styles.searchBar}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={searchRef}
            className={styles.searchInput}
            type="search"
            placeholder="Chercher une référence ou une couleur…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Rechercher un produit"
          />
          {searchQuery && (
            <button
              className={styles.searchClear}
              onClick={() => { setSearchQuery(""); searchRef.current?.focus(); }}
              aria-label="Effacer la recherche"
            >
              ×
            </button>
          )}
        </div>

        {/* Filtres */}
        {hasFilters && (
          <div className={styles.filterBar}>
            {availableColors.length > 0 && (
              <div className={styles.swatches}>
                {availableColors.map((color) => (
                  <button
                    key={color}
                    className={`${styles.swatch} ${activeColors.has(color) ? styles.swatchActive : ""}`}
                    style={{ "--swatch-color": COLOR_MAP[color] } as React.CSSProperties}
                    onClick={() => toggleColor(color)}
                    aria-label={color.charAt(0).toUpperCase() + color.slice(1)}
                    aria-pressed={activeColors.has(color)}
                    title={color.charAt(0).toUpperCase() + color.slice(1)}
                  />
                ))}
              </div>
            )}

            {availableNotes.length > 0 && (
              <div className={styles.pills}>
                {availableNotes.map((note) => (
                  <button
                    key={note}
                    className={`${styles.pill} ${activeNotes.has(note) ? styles.pillActive : ""}`}
                    onClick={() => toggleNote(note)}
                    aria-pressed={activeNotes.has(note)}
                  >
                    {note}
                  </button>
                ))}
              </div>
            )}

            {activeCount > 0 && (
              <button className={styles.clearBtn} onClick={clearAll}>
                Effacer ({activeCount})
              </button>
            )}
          </div>
        )}
      </div>

      <div className={styles.gridContent}>
        {/* ── Résultats ── */}
        {totalActiveFilters > 0 && (
          <p className={styles.filterCount}>
            {filteredProducts.length} résultat{filteredProducts.length !== 1 ? "s" : ""}
            {totalActiveFilters > 0 && (
              <button className={styles.clearAllLink} onClick={clearAll}>
                Tout effacer
              </button>
            )}
          </p>
        )}

        {/* ── Vue Grille ── */}
        {viewMode === "grid" && (
          <div className={styles.itemGrid}>
            {filteredProducts.map((item) => {
              const prefix = seriesPrefix(item.ref);
              const siblingColors = seriesSwatchMap.get(prefix) ?? [];
              return (
                <ProductCard
                  key={item.ref}
                  item={item}
                  siblingColors={siblingColors}
                  onQuickView={setQuickViewProduct}
                />
              );
            })}
          </div>
        )}

        {/* ── Vue Liste ── */}
        {viewMode === "list" && (
          <div className={styles.listView}>
            <div className={styles.listHeader}>
              <span />
              <span>Réf.</span>
              <span>Produit</span>
              <span>Prix achat</span>
              <span>Commander</span>
            </div>
            {filteredProducts.map((item) => {
              const prefix = seriesPrefix(item.ref);
              const siblingColors = seriesSwatchMap.get(prefix) ?? [];
              return (
                <ProductListRow
                  key={item.ref}
                  item={item}
                  siblingColors={siblingColors}
                  onQuickView={setQuickViewProduct}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ── Quick view modal ── */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

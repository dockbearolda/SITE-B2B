"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRef, useState } from "react";

import { useCart, type CartItem } from "@/lib/cart-context";
import { useProjects } from "@/lib/projects-context";
import { useToast } from "@/lib/toast-context";
import { generateQuotePDF } from "@/lib/generate-quote-pdf";
import { getProductImagePath } from "@/lib/product-image";
import { RollingNumber } from "@/components/ui/rolling-number";
import { CartProgressBar } from "./cart-progress-bar";
import { MarginDashboard } from "./margin-dashboard";
import styles from "./cart-sidebar.module.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

/**
 * Génère et déclenche le téléchargement local d'un fichier CSV
 * Excel-ready (BOM UTF-8, séparateur ";", décimales avec virgule).
 */
function exportCartAsCSV(items: CartItem[]): void {
  const BOM = "\uFEFF";
  const SEP = ";";

  const header = [
    "Référence SKU",
    "Désignation Produit",
    "Quantité",
    "Prix Unitaire HT",
    "Total HT",
  ].join(SEP);

  const rows = items.map((item) => {
    const prixUnit = item.prixAchat ?? 0;
    const total = prixUnit * item.quantity;
    const fmtNum = (n: number) =>
      n > 0 ? n.toFixed(2).replace(".", ",") : "";

    // Protège les guillemets dans les libellés
    const safeLabel = `"${item.label.replace(/"/g, '""')}"`;

    return [item.ref, safeLabel, item.quantity, fmtNum(prixUnit), fmtNum(total)].join(SEP);
  });

  const csv = BOM + [header, ...rows].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `nomenclature-olda-${Date.now()}.csv`;
  a.click();

  // Libère la mémoire après le clic
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon} aria-hidden="true">
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
          <rect x="8" y="20" width="48" height="36" rx="5" />
          <path d="M8 32h12l4 6h16l4-6h12" />
          <path d="M22 20V14a10 10 0 0 1 20 0v6" />
        </svg>
      </div>
      <p className={styles.emptyTitle}>Votre devis s&apos;affichera ici</p>
      <p className={styles.emptyHint}>Ajoutez des articles depuis le catalogue</p>
    </div>
  );
}

// ─── SaveDraftModal ───────────────────────────────────────────────────────────

type SaveDraftModalProps = {
  onConfirm: (name: string) => void;
  onCancel: () => void;
};

function SaveDraftModal({ onConfirm, onCancel }: SaveDraftModalProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleConfirm = () => {
    onConfirm(value.trim() || "Projet sans titre");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleConfirm();
    if (e.key === "Escape") onCancel();
  };

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Sauvegarder le projet">
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div className={styles.modalIconWrap} aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
          </div>
          <div>
            <h3 className={styles.modalTitle}>Sauvegarder comme brouillon</h3>
            <p className={styles.modalSubtitle}>
              Votre panier sera mis en pause. Retrouvez-le dans&nbsp;
              <strong>Mes Projets</strong>.
            </p>
          </div>
        </div>

        <div className={styles.modalBody}>
          <label htmlFor="project-name" className={styles.modalLabel}>
            Nom du projet
          </label>
          <input
            ref={inputRef}
            id="project-name"
            type="text"
            className={styles.modalInput}
            placeholder="ex. Goodies Noël 2026"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            maxLength={60}
          />
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.modalCancelBtn} onClick={onCancel}>
            Annuler
          </button>
          <button className={styles.modalConfirmBtn} onClick={handleConfirm}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Offre Privilège (upsell conditionnel ≥ 300 €) ───────────────────────────

const PRIVILEGE_ITEMS = [
  { ref: "STI 01", label: "Sticker personnalisé", moq: 10 },
] as const;

function PrivilegeOfferBlock() {
  const { add, items } = useCart();
  const { toast } = useToast();

  return (
    <div className={styles.privilegeBlock}>
      <div className={styles.privilegeHeader}>
        <p className={styles.privilegeTitle}>Offre Spéciale</p>
        <p className={styles.privilegeSubtitle}>
          Votre sélection dépassant 300 €, profitez de −15 % sur ces articles pour finaliser votre devis.
        </p>
      </div>
      <div className={styles.quickBuyList}>
        {PRIVILEGE_ITEMS.map(({ ref, label, moq }) => {
          const src = getProductImagePath(ref);
          const inCart = items.some((i) => i.ref === ref);
          return (
            <div key={ref} className={styles.quickBuyItem}>
              <div className={styles.quickBuyThumb}>
                {src && (
                  <Image src={src} alt={label} fill sizes="36px" className={styles.thumbImg} />
                )}
              </div>
              <span className={styles.quickBuyLabel}>
                {label}
                <span className={styles.discountBadge}>−15 %</span>
              </span>
              <button
                className={`${styles.quickBuyBtn} ${inCart ? styles.quickBuyBtnIn : ""}`.trim()}
                aria-label={inCart ? `Déjà dans le devis` : `Ajouter ${label} à −15 %`}
                onClick={() => {
                  add(ref, label, moq, undefined, undefined);
                  toast(`${moq}× ${label} ajouté à −15 %`);
                }}
                disabled={inCart}
              >
                {inCart ? "✓" : "+"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CartSidebarContent ───────────────────────────────────────────────────────

type CartSidebarContentProps = {
  onValidate?: () => void;
};

export function CartSidebarContent({ onValidate }: CartSidebarContentProps) {
  const {
    items,
    totalItems,
    totalB2B,
    totalRevente,
    margeNette,
    hasPrices,
    updateQuantity,
    remove,
  } = useCart();

  const { saveCurrentCart } = useProjects();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  const [showSaveModal, setShowSaveModal] = useState(false);

  if (items.length === 0) {
    return <EmptyState />;
  }

  const tauxMarge = totalRevente > 0 ? ((margeNette / totalRevente) * 100).toFixed(1) : "0.0";

  const handleSaveConfirm = (name: string) => {
    saveCurrentCart(name);
    setShowSaveModal(false);
  };

  return (
    <>
      {/* ── Modale de sauvegarde (portée sur le viewport) ── */}
      {showSaveModal && (
        <SaveDraftModal
          onConfirm={handleSaveConfirm}
          onCancel={() => setShowSaveModal(false)}
        />
      )}

      {/* ── Liste scrollable ── */}
      <div className={styles.scrollArea}>
        <p className={styles.count} aria-live="polite">
          <RollingNumber value={totalItems} />{" "}article{totalItems > 1 ? "s" : ""}
        </p>

        <div className={styles.itemList}>
          {items.map((item) => {
            const src = getProductImagePath(item.ref);
            return (
              <div key={item.ref} className={styles.item}>
                <div className={styles.itemThumb}>
                  {src ? (
                    <Image src={src} alt={item.label} fill sizes="40px" className={styles.thumbImg} />
                  ) : (
                    <div className={styles.thumbPlaceholder} />
                  )}
                </div>

                <div className={styles.itemInfo}>
                  <span className={styles.itemRef}>{item.ref}</span>
                  <span className={styles.itemLabel}>{item.label}</span>
                  {item.prixAchat != null && item.prixAchat > 0 && (
                    <span className={styles.itemSubtotal}>
                      <RollingNumber value={item.prixAchat} format={fmt} />
                      &nbsp;
                      <span className={styles.itemSubtotalTotal}>
                        = <RollingNumber value={item.prixAchat * item.quantity} format={fmt} />
                      </span>
                    </span>
                  )}
                </div>

                <div className={styles.itemControls}>
                  <div className={styles.qtyGroup}>
                    <button
                      className={styles.qtyBtn}
                      aria-label="Diminuer"
                      onClick={() => updateQuantity(item.ref, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span className={styles.qtyValue} aria-live="polite">
                      <RollingNumber value={item.quantity} />
                    </span>
                    <button
                      className={styles.qtyBtn}
                      aria-label="Augmenter"
                      onClick={() => updateQuantity(item.ref, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    className={styles.removeBtn}
                    aria-label="Supprimer"
                    onClick={() => remove(item.ref)}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Offre Privilège (upsell conditionnel ≥ 300 €) ── */}
      {totalB2B >= 300 && <PrivilegeOfferBlock />}

      {/* ── Footer sticky ── */}
      <div className={styles.footer}>
        {/* Tableau de marge */}
        <MarginDashboard vertical />

        {/* CTA principal */}
        <Link
          href="/commande"
          className={styles.validateBtn}
          onClick={onValidate}
        >
          Valider ma commande
        </Link>

        {/* Téléchargement devis PDF */}
        <button
          className={styles.pdfBtn}
          onClick={() => {
            const doc = generateQuotePDF(items, undefined, { totalB2B, totalRevente, margeNette });
            doc.save(`devis-olda-${Date.now()}.pdf`);
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Télécharger le devis PDF
        </button>

        {/* Export nomenclature CSV — Excel-ready */}
        <button
          className={styles.csvBtn}
          onClick={() => exportCartAsCSV(items)}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          Exporter (CSV)
        </button>

        {/* Séparateur + Sauvegarde brouillon (clients connectés uniquement) */}
        {isAuthenticated && (
          <>
            <div className={styles.footerDivider} role="separator" aria-hidden="true" />
            <button
              className={styles.saveDraftBtn}
              onClick={() => setShowSaveModal(true)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Sauvegarder comme brouillon…
            </button>
          </>
        )}
      </div>
    </>
  );
}

// ─── CartSidebar (shell) ──────────────────────────────────────────────────────

export function CartSidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <span className={styles.headerLabel}>Votre sélection</span>
      </div>
      <div className={styles.body}>
        <CartSidebarContent />
      </div>
    </aside>
  );
}

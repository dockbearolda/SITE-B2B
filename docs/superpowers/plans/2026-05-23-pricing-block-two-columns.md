# Pricing Block — Deux colonnes + badge marge — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le bloc prix vertical de la carte produit par un layout deux colonnes « Achat → Revente » avec un badge vert « +X,XX € de marge » centré dessous.

**Architecture:** On modifie uniquement le composant `PricingBlock` (JSX + CSS module) dans `product-grid.tsx` / `product-grid.module.css`. Pas de nouvelle dépendance, pas d'API, pas de changement de props.

**Tech Stack:** Next.js 16, React 19, CSS Modules, TypeScript 5

---

## Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `src/components/catalog/product-grid.tsx` | Modifier `PricingBlock` (lignes 101–121) |
| `src/components/catalog/product-grid.module.css` | Remplacer règles pricing (lignes 602–671) + mobile (lignes 818–844) |

Aucun fichier créé, aucune autre dépendance touchée.

---

## Task 1 : Réécrire le composant `PricingBlock`

**Fichiers :**
- Modifier : `src/components/catalog/product-grid.tsx:101-121`

- [ ] **Étape 1 : Remplacer la fonction `PricingBlock`**

  Dans `src/components/catalog/product-grid.tsx`, remplacer entièrement les lignes 101–121 par :

  ```tsx
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
  ```

- [ ] **Étape 2 : Vérifier que TypeScript compile sans erreur**

  ```bash
  cd /Users/charlie/Downloads/SITE-B2B-main
  npx tsc --noEmit 2>&1 | grep -E "error|warning" | head -20
  ```

  Résultat attendu : aucune ligne d'erreur concernant `product-grid.tsx`.

- [ ] **Étape 3 : Commit**

  ```bash
  git add src/components/catalog/product-grid.tsx
  git commit -m "feat(catalog): PricingBlock deux colonnes achat/revente + badge marge"
  ```

---

## Task 2 : Remplacer les règles CSS desktop du pricing block

**Fichiers :**
- Modifier : `src/components/catalog/product-grid.module.css:600-671`

- [ ] **Étape 1 : Remplacer le bloc `/* ── Pricing block ── */` (lignes 600–671)**

  Repérer le commentaire `/* ── Pricing block ── */` (ligne 600) et tout ce qui suit jusqu'à `.gainValue { … }` (ligne 671 incluse). Remplacer par :

  ```css
  /* ── Pricing block ──────────────────────────────────────────── */

  .pricingBlock {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    grid-template-rows: auto auto;
    align-items: center;
    gap: 4px 6px;
    padding: 10px 11px 8px;
    background: var(--color-surface-strong, #f5f5f7);
    border-radius: 12px;
    border: 1px solid rgba(0, 0, 0, 0.06);
  }

  .colAchat {
    text-align: left;
  }

  .colArrow {
    font-size: 1rem;
    color: #c0c0c5;
    line-height: 1;
    padding: 0 1px;
    margin-top: 14px; /* aligner verticalement avec les valeurs */
    align-self: center;
  }

  .colRevente {
    text-align: right;
  }

  .colLabel {
    display: block;
    font-size: 0.57rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-muted);
    line-height: 1;
    margin-bottom: 2px;
  }

  .colVal {
    display: block;
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--color-text, #1d1d1f);
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  .colValRevente {
    color: #555;
  }

  .marginRow {
    grid-column: 1 / -1;
    text-align: center;
    padding-top: 6px;
    margin-top: 4px;
    border-top: 1px dashed rgba(0, 0, 0, 0.10);
  }

  .marginBadge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: #eafaf1;
    border: 1px solid #a8e6c3;
    border-radius: 100px;
    padding: 2px 10px;
    font-size: 0.7rem;
    font-weight: 700;
    color: #1a7f4b;
    font-variant-numeric: tabular-nums;
  }
  ```

- [ ] **Étape 2 : Vérifier TypeScript (garantit que les nouveaux noms de classe existent)**

  ```bash
  cd /Users/charlie/Downloads/SITE-B2B-main
  npx tsc --noEmit 2>&1 | grep -E "error|warning" | head -20
  ```

  Résultat attendu : aucune erreur.

- [ ] **Étape 3 : Commit**

  ```bash
  git add src/components/catalog/product-grid.module.css
  git commit -m "style(catalog): règles CSS pricing block deux colonnes + badge marge"
  ```

---

## Task 3 : Mettre à jour les overrides responsive mobiles

**Fichiers :**
- Modifier : `src/components/catalog/product-grid.module.css` — section `@media (max-width: 979px)`

- [ ] **Étape 1 : Remplacer le bloc « Pricing compact en vue liste mobile »**

  Dans `@media (max-width: 979px)`, repérer et remplacer le bloc commenté `/* Pricing compact en vue liste mobile */` (lignes 817–844 environ) :

  **Avant :**
  ```css
  /* Pricing compact en vue liste mobile */
  .pricingBlock {
    flex-direction: row;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    padding: 5px 9px;
    border-radius: 8px;
  }

  .priceLabelSmall {
    display: none;
  }

  .priceMain {
    font-size: 0.86rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .pricePvc {
    font-size: 0.7rem;
  }

  .priceCoef {
    font-size: 0.64rem;
    padding: 1px 6px;
  }
  ```

  **Après :**
  ```css
  /* Pricing compact en vue liste mobile */
  .pricingBlock {
    padding: 5px 9px;
    border-radius: 8px;
    gap: 2px 4px;
  }

  .colLabel {
    font-size: 0.52rem;
  }

  .colVal {
    font-size: 0.82rem;
  }

  .marginBadge {
    font-size: 0.62rem;
    padding: 1px 7px;
  }
  ```

- [ ] **Étape 2 : Vérifier TypeScript**

  ```bash
  cd /Users/charlie/Downloads/SITE-B2B-main
  npx tsc --noEmit 2>&1 | grep -E "error" | head -10
  ```

  Résultat attendu : aucune erreur.

- [ ] **Étape 3 : Commit**

  ```bash
  git add src/components/catalog/product-grid.module.css
  git commit -m "style(catalog): overrides mobile pricing block deux colonnes"
  ```

---

## Task 4 : Vérification visuelle via dev server

**Fichiers :** aucun (vérification uniquement)

- [ ] **Étape 1 : Lancer le dev server**

  ```bash
  cd /Users/charlie/Downloads/SITE-B2B-main
  npm run dev
  ```

  Ouvrir http://localhost:3000 dans le navigateur.

- [ ] **Étape 2 : Vérifier les 4 cas dans le catalogue**

  Naviguer vers `/catalogue` (ou une sous-famille avec des produits).

  | Cas à vérifier | Attendu |
  |----------------|---------|
  | Produit avec achat + revente | 2 colonnes + badge vert +X,XX € |
  | Produit avec achat seul | 1 colonne « Achat X,XX € » |
  | Mobile (< 979px) | Bloc compact, lisible, badge présent |
  | Marge = 0 ou revente ≤ achat | Pas de badge marge |

- [ ] **Étape 3 : Vérifier l'absence d'erreur TypeScript finale**

  ```bash
  npx tsc --noEmit
  ```

  Résultat attendu : exit 0, aucune sortie.

- [ ] **Étape 4 : Commit final si tout est bon**

  ```bash
  git add -A
  git commit -m "chore: vérification visuelle pricing block deux colonnes OK"
  ```

---

## Récapitulatif des classes CSS supprimées

Ces classes existaient dans le CSS mais ne sont plus utilisées après cette modification — elles ont été retirées dans Task 2 :

| Classe supprimée | Raison |
|-----------------|--------|
| `.priceLabelSmall` | Remplacée par `.colLabel` |
| `.priceMain` | Remplacée par `.colVal` |
| `.priceSecondary` | Layout supprimé |
| `.pricePvc` | Remplacée par `.colValRevente` + `.colLabel` |
| `.priceCoef` | Jamais utilisée dans le TSX |
| `.priceGain` | Jamais utilisée dans le TSX |
| `.gainValue` | Jamais utilisée dans le TSX |

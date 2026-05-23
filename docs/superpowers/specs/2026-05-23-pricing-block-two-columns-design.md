# Design — Bloc prix carte produit : deux colonnes + badge marge

**Date :** 2026-05-23  
**Statut :** Approuvé (Option A)

---

## Contexte

Le `PricingBlock` dans `src/components/catalog/product-grid.tsx` affiche actuellement :
- Le prix d'achat revendeur en grand (primaire)
- Le prix de revente boutique en petit, discret, en dessous

Le prix de revente est l'information clé pour que le revendeur évalue sa marge rapidement. Il doit être au même niveau visuel que le prix d'achat.

---

## Layout validé (Option A)

```
┌─────────────────────────────────────────┐
│ ACHAT           →          REVENTE       │
│ 10,20 €                   18,00 €        │
│ ─────────────────────────────────────── │
│          ▲ +7,80 € de marge             │
└─────────────────────────────────────────┘
```

### Structure HTML cible

```
.pricingBlock (grid 3 colonnes : 1fr auto 1fr)
├── .colAchat
│   ├── .colLabel  "ACHAT"
│   └── .colVal    "10,20 €"
├── .colArrow      "→"
├── .colRevente
│   ├── .colLabel  "REVENTE"
│   └── .colVal    "18,00 €"
└── .marginRow  (grid-column: 1 / -1)
    └── .marginBadge  "▲ +7,80 € de marge"
```

### Règles de comportement

| Cas | Rendu |
|-----|-------|
| achat + revente | 2 colonnes + badge marge |
| achat seul | 1 colonne pleine largeur (pas de flèche ni revente) |
| revente seule | 1 colonne pleine largeur |
| ni l'un ni l'autre | `null` (composant ne s'affiche pas) |

La marge affichée = `revente − achat` (arrondie à 2 décimales).  
Le badge marge n'apparaît que si les deux prix sont présents **et** `revente > achat`.

---

## Tokens visuels

| Propriété | Valeur |
|-----------|--------|
| Background bloc | `var(--color-surface-strong, #f5f5f7)` |
| Border | `1px solid rgba(0,0,0,0.06)` |
| Border-radius | `12px` |
| Padding | `10px 11px 8px` |
| Label (ACHAT / REVENTE) | `0.57rem`, `700`, uppercase, `color-muted` |
| Valeur prix | `0.95rem`, `700`, tabular-nums |
| Valeur achat | `var(--color-text, #1d1d1f)` |
| Valeur revente | `#555` (légèrement atténuée) |
| Flèche | `color: #c0c0c5`, `font-size: 1rem` |
| Badge marge background | `#eafaf1` |
| Badge marge border | `1px solid #a8e6c3` |
| Badge marge texte | `#1a7f4b`, `0.7rem`, `700` |
| Séparateur badge | `1px dashed rgba(0,0,0,0.10)` |

---

## Périmètre des modifications

### `src/components/catalog/product-grid.tsx`
- Réécrire le composant `PricingBlock` (lignes 101–121) :
  - Calcul de la marge : `marge = revente - achat` (si les deux sont présents et revente > achat)
  - JSX : grid 3 colonnes + `.marginRow` conditionnel
- Supprimer les classes CSS devenues obsolètes : `priceSecondary`, `pricePvc`

### `src/components/catalog/product-grid.module.css`
- Remplacer les règles de `.pricingBlock` (lignes 602–671) par les nouvelles règles grid
- Ajouter : `.colAchat`, `.colArrow`, `.colRevente`, `.colLabel`, `.colVal`, `.marginRow`, `.marginBadge`
- Supprimer : `.priceSecondary`, `.pricePvc`
- Adapter le responsive `@media (max-width: 480px)` pour la vue mobile

### Vue liste (`ProductListRow`)
- Pas de changement sur la vue liste (hors périmètre)

### `quick-view-modal.tsx` / `quick-view-modal.module.css`
- Hors périmètre de ce ticket (structure différente, composant autonome)

---

## Tests manuels à effectuer

1. Carte avec achat + revente → 2 colonnes + badge marge vert
2. Carte avec achat seul → colonne pleine, pas de flèche
3. Carte avec revente ≥ achat → badge affiché
4. Responsive mobile (< 480px) → bloc toujours lisible

---

## Hors périmètre

- Vue liste dense (`ProductListRow`) — layout différent
- Quick-view modal — composant séparé
- Affichage de la marge en pourcentage (pas demandé)

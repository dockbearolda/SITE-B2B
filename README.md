# OLDA B2B Showcase

Base Next.js premium et légère pour lancer un site vitrine B2B à partir du catalogue produit fourni.

## Démarrage local

Prérequis : [Node.js 20+](https://nodejs.org).

```bash
npm install        # installe les dépendances (+ prisma generate)
npm run dev        # démarre le serveur de développement
```

Le site est alors disponible sur http://localhost:3000.

Aucune configuration n'est nécessaire pour démarrer : le catalogue s'affiche à
partir des données statiques (`src/data/catalog.ts`). Pour activer la base de
données, la connexion ou l'envoi d'e-mails, copie `.env.example` en `.env.local`
et renseigne les variables souhaitées.

## Pourquoi ce stack

- `Next.js + App Router` pour un rendu rapide, sobre et facile à faire évoluer.
- `TypeScript` pour garder une donnée produit fiable dès les premiers écrans.
- `CSS Modules` pour éviter la dette d'une couche utilitaire trop opaque sur un site vitrine.
- `Composants serveur par défaut` pour limiter le JavaScript côté client.

## Structure recommandée

```text
src/
  app/
    globals.css
    icon.svg
    layout.tsx
    page.tsx
    page.module.css
  components/
    layout/
      site-footer.module.css
      site-footer.tsx
      site-header.module.css
      site-header.tsx
    sections/
      catalog-overview-section.module.css
      catalog-overview-section.tsx
      contact-cta-section.module.css
      contact-cta-section.tsx
      hero-section.module.css
      hero-section.tsx
      process-section.module.css
      process-section.tsx
      showcase-section.module.css
      showcase-section.tsx
    ui/
      container.module.css
      container.tsx
      section-heading.module.css
      section-heading.tsx
  data/
    catalog.ts
    site.ts
```

## Lecture du contenu extrait du sheet

Le document fourni ne décrit pas une arborescence éditoriale, mais un catalogue produit structuré. La fondation du site a donc été pensée autour de ce socle :

- `5` familles majeures : `Goodies`, `Tasses`, `Accessoires`, `Offres spéciales`, `Textiles`.
- `95+` références visibles dans la capture, avec une donnée déjà exploitable pour un site B2B.
- Des signaux commerciaux immédiatement utiles : minimums de commande, prix revendeur, variantes couleur, notes de stock.

## Principes de maintenance

- La donnée est séparée de la présentation dans `src/data`.
- La home se nourrit d'un modèle marketing agrégé, pas d'un tableau brut.
- Les coordonnées de contact restent centralisées dans `src/data/site.ts`.
- Les composants sont petits, dédiés à une seule section et peuvent ensuite être réutilisés pour des pages famille ou catalogue.

## Prochaines étapes naturelles

1. Remplacer les placeholders de contact et les libellés de marque si nécessaire.
2. Ajouter une route `/catalogue` avec filtres famille / sous-famille.
3. Prévoir un import CSV ou Google Sheets pour automatiser `src/data/catalog.ts`.
4. Brancher un vrai point de conversion : formulaire, Calendly, HubSpot ou CRM maison.

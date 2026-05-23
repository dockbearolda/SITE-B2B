# Back-office administrateur complet — OLDA B2B (SITE-B2B)

**Date** : 2026-05-23
**Auteur** : Charlie + Claude
**Statut** : Conception (à valider)
**Repo** : `dockbearolda/SITE-B2B` (Next.js 16, Prisma/Postgres, NextAuth v5, déployé sur Railway)

## 1. Objectif

Permettre à un utilisateur **non-technique** (le patron) de modifier **100 % du contenu visible** du site B2B **sans toucher au code ni redéployer manuellement**, via une interface d'administration intégrée.

## 2. État actuel

- Site vitrine + catalogue B2B avec panier/devis, comptes clients, page commande.
- **Catalogue** déjà piloté par la base (Prisma/Postgres) via `/admin/catalogue` + `/api/admin/catalog` (CRUD familles/catégories/produits). Source de données : Strapi → Postgres → données statiques (`src/data/catalog.ts`), cf. `src/lib/catalog-source.ts`.
- **Admin existant** (`/admin`) : gère uniquement les **comptes clients** en générant un JSON à **copier-coller dans la variable Railway `LOCAL_USERS`** (friction forte), + lien vers le catalogue.
- **Contenu hors catalogue codé en dur** :
  - `src/data/site.ts` (`siteConfig`) → utilisé par le **footer** (nom, navigation, contact) — `contact-cta-section.tsx` l'utilise aussi mais cette section est du **code mort**.
  - `src/app/layout.tsx` → métadonnées SEO (`title`, `description`, OpenGraph) en **dur**.
  - `src/app/page.tsx` (accueil) → logo SVG + libellé/lien d'un unique bouton CTA, en **dur**.
- **Code mort** : `src/components/sections/*` (hero, showcase, process, contact-cta) et `src/components/layout/site-header.tsx` ne sont importés nulle part.
- **Auth** : NextAuth v5, provider Credentials. Modes : Strapi (si `NEXT_PUBLIC_STRAPI_URL`) ou `LOCAL_USERS` (env). Admin déterminé par `ADMIN_EMAILS` (revérifié à chaque requête dans `jwt`/`session`). `middleware.ts` protège `/admin` et `/mon-compte` et **tourne sur l'Edge runtime** (importe `@/auth`).
- `Famille.signauxBusiness` (TEXT[]) **existe déjà** en base mais n'est **pas exposé** par l'API/UI admin.

## 3. Périmètre

**Inclus (contenu visible éditable)** :
- Catalogue : compléter l'admin (signaux business, réordonnancement, mise en ligne, **upload d'images**).
- Marque & contact : nom du site, email, téléphone, lieu.
- Navigation (libellés + liens, utilisés par le footer).
- SEO : titre + description (métadonnées).
- Accueil : slogan/tagline, libellé + lien du bouton CTA.
- Comptes clients : CRUD en base (remplace le copier-coller Railway).

**Hors périmètre** :
- Refonte graphique du site public.
- Réactivation des sections marketing mortes (possible évolution future, cf. §13).
- Logique de commande / emails (`/api/commande`, Resend) — inchangée.
- Gestion des droits **admin** par le patron (les admins restent fixés par `ADMIN_EMAILS`, pour éviter tout verrouillage accidentel).
- Édition du logo SVG (rare ; évolution future).

## 4. Architecture retenue (Approche A)

Étendre l'**admin maison + base de données**, cohérent avec l'existant (Prisma + `/admin` + pattern `isDBConfigured()` avec repli) :

- Le **contenu texte/données** passe en base → lu au runtime → **édition live, sans redéploiement**.
- Les **images** sont uploadées via l'admin puis **commitées dans le repo GitHub** (API Contents) → Railway **redéploie (~1 min)**. C'est le **seul** flux qui redéploie.
- Les **comptes clients** passent en table `User`.
- Repli systématique : si la base est indisponible / non configurée, on retombe sur les valeurs par défaut (`src/data/site.ts`, etc.), comme le catalogue.

## 5. Modèle de données (Prisma)

Ajouts à `prisma/schema.prisma` (+ migration) :

```prisma
// Contenu éditorial du site (ligne unique, id = 1)
model SiteContent {
  id              Int      @id @default(1)
  brandName       String   @default("Atelier OLDA")
  contactEmail    String   @default("")
  contactPhone    String   @default("")
  contactLocation String   @default("")
  metaTitle       String   @default("Atelier OLDA")
  metaDescription String   @default("")
  heroTagline     String   @default("")
  ctaLabel        String   @default("Découvrir nos produits")
  ctaHref         String   @default("/catalogue")
  navigation      Json     @default("[]") // [{ "label": string, "href": string }]
  updatedAt       DateTime @updatedAt
}

// Comptes clients (remplace LOCAL_USERS)
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String
  passwordHash String   // format "sha256:<hex>" (compatible Edge & existant)
  groupe       String   @default("standard")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

- `SiteContent` : **ligne unique** garantie côté code (toujours `id = 1`, `upsert`). `navigation` en `Json` pour une liste ordonnée éditable.
- `User.passwordHash` : on conserve **sha256** (déjà utilisé par `AdminClient` et `auth.ts`, compatible Edge). Upgrade bcrypt = évolution future (note §13).
- `Famille` : pas de changement de schéma (le champ `signauxBusiness` existe) — on l'expose seulement dans l'API/UI.

## 6. Lecture du contenu au runtime

Nouveau module `src/lib/site-content.ts` (mirroir de `catalog-source.ts`) :

```ts
export type SiteContentData = { /* mêmes champs que siteConfig + SEO/home */ };

export async function getSiteContent(): Promise<SiteContentData> {
  if (isDBConfigured()) {
    try {
      const row = await prisma.siteContent.findUnique({ where: { id: 1 } });
      if (row) return mapRow(row);
    } catch (e) { console.warn("[site-content] DB indisponible, repli statique.", e); }
  }
  return defaultsFromSiteTs(); // src/data/site.ts
}
```

Branchements :
- `src/components/layout/site-footer.tsx` → composant serveur async lisant `getSiteContent()`.
- `src/app/layout.tsx` → remplacer l'export statique `metadata` par `export async function generateMetadata()` qui lit `getSiteContent()` (title/description/OG).
- `src/app/page.tsx` (accueil) → lire `heroTagline`, `ctaLabel`, `ctaHref`.

`src/data/site.ts` est **conservé** comme valeurs par défaut + source du seed.

## 7. Structure de l'admin

`/admin` devient un **tableau de bord** listant les zones (tout sous `requireAdmin()`, même style que l'existant, CSS Modules) :

| Route | Rôle |
|---|---|
| `/admin` | Tableau de bord (cartes vers les zones + email connecté) |
| `/admin/catalogue` | **Existant, à compléter** : signaux business (familles), réordonnancement (familles/catégories/produits via `ordre`), upload d'images produit |
| `/admin/contenu` | **Nouveau** : marque, contact, SEO, accueil (tagline/CTA), navigation (liste éditable) |
| `/admin/clients` | **Nouveau** : CRUD comptes clients en base (création, suppression, réinitialisation mot de passe, groupe tarifaire) |

API (toutes en `requireAdmin()`, runtime **Node**) :
- `PUT /api/admin/catalog` — étendre pour gérer `signauxBusiness` (POST + PUT famille) — actuellement absent.
- `GET/PUT /api/admin/content` — lire/écrire la ligne `SiteContent` (upsert id=1).
- `GET/POST/PUT/DELETE /api/admin/clients` — CRUD `User`.
- `POST /api/admin/upload` — upload d'image (cf. §8).

`requireAdmin()` (déjà présent dans `route.ts`) factorisé dans `src/lib/admin-auth.ts` et réutilisé.

## 8. Upload d'images via GitHub

**Endpoint** `POST /api/admin/upload` (runtime Node, `requireAdmin()`), `dynamic = "force-dynamic"` :
1. Reçoit le fichier via multipart `FormData` + un dossier cible (ex. `produits/`).
2. **Validations** : type MIME ∈ {png, jpeg, webp, svg} ; taille ≤ 5 Mo ; nom de fichier **assaini** (slug + extension), **anti-traversée** (`..`, `/` interdits dans le nom) ; chemin final forcé sous `public/images/`.
3. **Commit** dans le repo via l'**API GitHub Contents** :
   `PUT https://api.github.com/repos/{GITHUB_REPO}/contents/public/images/{dossier}/{fichier}` avec `Authorization: Bearer {GITHUB_TOKEN}`, `branch = {GITHUB_BRANCH}`, contenu base64, message de commit auto. (Si le fichier existe : récupérer son `sha` via GET puis le fournir au PUT.)
4. Réponse : `{ path: "/images/{dossier}/{fichier}" }`. L'UI affecte ce chemin au champ `imageUrl` (produit) ou au visuel concerné.
5. **UI** : message clair « image envoyée, visible en ligne après redéploiement (~1 min) ».

**Variables d'env** : `GITHUB_TOKEN` (PAT *fine-grained* limité au repo `SITE-B2B`, permission *Contents: Read & Write*), `GITHUB_REPO=dockbearolda/SITE-B2B`, `GITHUB_BRANCH=main`.

**Sécurité** : endpoint admin only ; le token n'est jamais exposé au client ; refuser tout chemin hors `public/images/`.

> Remarque : commit sur `main` ⇒ déploiement direct. Acceptable pour des images (le contenu texte, lui, est live sans redéploiement). Alternative future : commit sur une branche + PR auto.

## 9. Comptes clients & auth (split Edge/Node)

`middleware.ts` tourne sur **Edge** et importe `@/auth`. Prisma **n'est pas compatible Edge** → on **scinde la config** (pattern NextAuth v5) :

- **`src/auth.config.ts`** (Edge-safe, sans Prisma) : `pages`, callbacks `jwt`/`session` (vérif admin via `ADMIN_EMAILS` = comparaison de chaînes, OK Edge), `providers: []`. Utilisé par `middleware.ts` (`NextAuth(authConfig).auth`).
- **`src/auth.ts`** (Node) : `NextAuth({ ...authConfig, providers: [Credentials({ authorize })] })` où `authorize` fait : Strapi (si configuré) → **`User` en base** (Prisma, hash sha256) → `LOCAL_USERS` (repli rétro-compat). Exporte `handlers`, `auth`, `signIn`, `signOut`.
- `middleware.ts` : remplacer `import { auth } from "@/auth"` par la version issue de `auth.config.ts`.

Migration des `LOCAL_USERS` existants → table `User` : script unique `scripts/migrate-local-users.mjs` (lit la variable, upsert en base). Conservation du repli `LOCAL_USERS` pour ne rien casser pendant la transition.

`/admin/clients` + `/api/admin/clients` remplacent le flux copier-coller ; l'ancienne UI de gestion JSON (`AdminClient`) est retirée.

## 10. Prérequis & variables d'environnement

Confirmés : repo GitHub connecté à Railway (auto-deploy), Postgres en prod.

| Variable | Usage | Statut |
|---|---|---|
| `DATABASE_URL` | Postgres | existe (prod) |
| `AUTH_SECRET` | NextAuth | à vérifier (manquant en local → erreurs `MissingSecret`) |
| `ADMIN_EMAILS` | emails admin | existe |
| `GITHUB_TOKEN` | upload images (PAT fine-grained, Contents RW) | **à créer** |
| `GITHUB_REPO` | `dockbearolda/SITE-B2B` | **à ajouter** |
| `GITHUB_BRANCH` | `main` | **à ajouter** |

Local : créer `.env.local` (gitignoré) avec `AUTH_SECRET`, `ADMIN_EMAILS`, `DATABASE_URL` (base de dev ou la base Railway), `GITHUB_*`, pour tout tester avant déploiement.

## 11. Migrations & seed

- Migration Prisma : `SiteContent` + `User` (`npx prisma migrate dev --name back_office`).
- Seed : `prisma/seed.ts` étendu pour **upsert `SiteContent` (id=1)** à partir des valeurs de `src/data/site.ts` / `page.tsx` actuelles (idempotent, n'écrase pas si déjà personnalisé — stratégie : `create` seulement si absent).
- Script `scripts/migrate-local-users.mjs` (one-shot) pour importer les clients existants.

## 12. Plan de test / vérification

En local (serveur preview déjà actif sur :3000) :
1. `.env.local` complété, `prisma migrate dev` + `seed`.
2. Connexion en admin (`ADMIN_EMAILS`), accès `/admin` → 3 zones visibles.
3. **Contenu** : modifier nom/contact/SEO/CTA/navigation → vérifier le **reflet immédiat** sur footer / `<title>` / accueil (sans redéploiement). Captures.
4. **Catalogue** : éditer signaux business + réordonner + upload image → vérifier en base et sur la page catalogue (image : vérifier l'appel GitHub mocké/réel + chemin renvoyé).
5. **Clients** : créer/supprimer/réinit. mot de passe → tester une connexion client.
6. Vérifier qu'un **non-admin** est refusé sur `/admin/*` et les API.
7. Build : `npm run build` (vérifie Edge/Node + `generateMetadata`).

## 13. Risques & décisions

- **Edge/Node (auth)** : géré par le split de config (§9). Sans ça, le build middleware casse.
- **Commit images sur `main`** : déclenche un déploiement par image. Accepté (choix utilisateur). Repo qui grossit : acceptable à l'échelle du site.
- **`SiteContent` ligne unique** : robustesse via upsert id=1 ; le getter renvoie les défauts si absent.
- **sha256** (mots de passe) : conservé pour compat Edge + existant. Upgrade bcrypt/argon2 = évolution future (nécessite runtime Node only).
- **Token GitHub** : PAT fine-grained limité au repo, permission Contents RW uniquement, stocké en variable serveur.

## 14. Évolutions futures (hors périmètre)

- Réactiver/éditer les sections marketing mortes (hero/process/showcase) avec un éditeur de blocs.
- Médiathèque (galerie d'images uploadées, réutilisation).
- Upload images via branche + PR (au lieu de commit direct `main`).
- Hash mot de passe renforcé (bcrypt/argon2).
- Édition du logo.

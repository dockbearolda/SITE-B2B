# Back-office administrateur — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre au patron (non-dev) d'éditer 100 % du contenu visible du site SITE-B2B depuis `/admin`, sans toucher au code.

**Architecture:** Étendre l'admin maison + Prisma. Le contenu texte/données est lu en base au runtime (édition live, sans redéploiement) avec repli sur les valeurs statiques actuelles. Les images uploadées dans l'admin sont commitées dans le repo GitHub via l'API Contents → Railway redéploie. Comptes clients en base ; split de config NextAuth Edge/Node pour ne pas casser le middleware.

**Tech Stack:** Next.js 16 (App Router), Prisma/PostgreSQL, NextAuth v5, CSS Modules, API GitHub Contents.

**Spec:** `docs/superpowers/specs/2026-05-23-back-office-admin-design.md`

---

## Contraintes d'exécution (lire avant de commencer)

- **Worktree isolé** : tout le travail se fait dans `/Users/charlie/Downloads/SITE-B2B-admin-bo` (branche `claude/admin-back-office-gc`, basée sur `origin/main`). Ne PAS travailler dans `/Users/charlie/Downloads/SITE-B2B-main` (dossier partagé par d'autres sessions Claude).
- **Base de données** : utiliser une **base de dev** (locale/Docker), JAMAIS la `DATABASE_URL` de prod pour `prisma migrate dev`. Voir Phase 0.
- **Git** : commits fréquents, fichiers ajoutés **par nom** (jamais `git add -A` — le dossier peut contenir le WIP d'autres sessions). Push sur la branche dédiée + **PR**. **Jamais** de force-push, jamais de push direct sur `main`.
- **Pas de runner de tests** dans le projet (scripts `dev`/`build`/`lint` seulement). La vérification se fait via : `npm run lint`, `npm run build`, et le **serveur preview** (parcours manuel + captures). On ajoute des vérifications ciblées de comportement plutôt qu'une suite TDD complète (cohérent avec les normes du projet ; priorité : livrer un outil fonctionnel pour le patron).
- Après chaque phase : l'app doit **builder et tourner**. On commite à la fin de chaque tâche.

---

## Structure des fichiers

**Créés :**
- `src/lib/site-content.ts` — adaptateur lecture contenu (DB → repli `src/data/site.ts`)
- `src/lib/admin-auth.ts` — helper `requireAdmin()` partagé
- `src/auth.config.ts` — config NextAuth Edge-safe (sans Prisma) pour le middleware
- `src/app/api/admin/content/route.ts` — GET/PUT `SiteContent`
- `src/app/api/admin/clients/route.ts` — CRUD `User`
- `src/app/api/admin/upload/route.ts` — upload image → commit GitHub
- `src/app/admin/contenu/page.tsx` + `ContenuAdmin.tsx` + `contenu.module.css` — écran "Contenu du site"
- `src/app/admin/clients/page.tsx` + `ClientsAdmin.tsx` + `clients.module.css` — écran "Clients"
- `src/components/admin/image-upload.tsx` (+ `.module.css`) — bouton d'upload réutilisable
- `scripts/migrate-local-users.mjs` — import one-shot des `LOCAL_USERS` → table `User`
- `prisma/migrations/<ts>_back_office/migration.sql` — généré par Prisma

**Modifiés :**
- `prisma/schema.prisma` — modèles `SiteContent`, `User`
- `prisma/seed.ts` — upsert `SiteContent` (id=1) depuis les valeurs actuelles
- `src/auth.ts` — `authorize` lit la table `User` (Node) ; importe `authConfig`
- `middleware.ts` — utilise `auth.config.ts` (Edge, sans Prisma)
- `src/app/layout.tsx` — `metadata` statique → `generateMetadata()` lisant `getSiteContent()`
- `src/components/layout/site-footer.tsx` — composant serveur async lisant `getSiteContent()`
- `src/app/page.tsx` — accueil : tagline + libellé/lien CTA depuis `getSiteContent()`
- `src/app/admin/page.tsx` + `AdminClient.tsx` — tableau de bord (cartes vers les 3 zones) ; retrait de l'ancienne gestion JSON
- `src/app/api/admin/catalog/route.ts` — gérer `signauxBusiness` (POST + PUT famille)
- `src/app/admin/catalogue/CatalogueAdmin.tsx` — champ signaux business + bouton upload image

---

## Phase 0 — Environnement isolé & base de dev

### Task 0.1 : Dépendances + base de dev

**Files:** aucun (setup).

- [ ] **Step 1 — Installer les dépendances dans le worktree**

Run: `cd /Users/charlie/Downloads/SITE-B2B-admin-bo && npm install`
Expected: install OK, `postinstall` exécute `prisma generate`.

- [ ] **Step 2 — Démarrer une base Postgres de dev (Docker)**

Run: `docker run -d --name sb2b-devdb -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=siteb2b -p 5433:5432 postgres:16`
(Si Docker indisponible : demander à l'utilisateur une `DATABASE_URL` de dev, ou utiliser une base Postgres locale. **Ne jamais** pointer vers la prod.)

- [ ] **Step 3 — Créer `.env.local`** (gitignoré)

```
DATABASE_URL="postgresql://postgres:dev@localhost:5433/siteb2b"
AUTH_SECRET="dev-secret-change-me-<openssl rand -base64 32>"
ADMIN_EMAILS="patron@olda.fr"
GITHUB_REPO="dockbearolda/SITE-B2B"
GITHUB_BRANCH="main"
# GITHUB_TOKEN à renseigner pour tester l'upload (PAT fine-grained, Contents RW)
```

- [ ] **Step 4 — Build de référence (état propre)**

Run: `npm run build`
Expected: build réussit (sur `origin/main`).

- [ ] **Step 5 — Commit** (rien à committer ici si pas de fichier suivi modifié ; sinon `.gitignore` déjà couvre `.env*`).

---

## Phase 1 — Modèle de données

### Task 1.1 : Modèles `SiteContent` et `User`

**Files:** Modify `prisma/schema.prisma`

- [ ] **Step 1 — Ajouter les modèles à la fin de `prisma/schema.prisma`**

```prisma
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
  navigation      Json     @default("[]")
  updatedAt       DateTime @updatedAt
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String
  passwordHash String
  groupe       String   @default("standard")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

- [ ] **Step 2 — Générer la migration sur la base de dev**

Run: `npx prisma migrate dev --name back_office`
Expected: nouvelle migration créée dans `prisma/migrations/`, base de dev à jour, client régénéré.

- [ ] **Step 3 — Vérifier le client**

Run: `npx prisma generate`
Expected: pas d'erreur ; types `SiteContent` et `User` disponibles.

- [ ] **Step 4 — Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): ajout des modèles SiteContent et User"
```

---

## Phase 2 — Contenu éditable lu en base (live)

### Task 2.1 : Adaptateur `getSiteContent()`

**Files:** Create `src/lib/site-content.ts`

- [ ] **Step 1 — Écrire l'adaptateur** (mirroir de `catalog-source.ts`)

```ts
import { siteConfig } from "@/data/site";
import { isDBConfigured, prisma } from "./prisma";

export type NavItem = { label: string; href: string };

export type SiteContentData = {
  brandName: string;
  contactEmail: string;
  contactPhone: string;
  contactLocation: string;
  metaTitle: string;
  metaDescription: string;
  heroTagline: string;
  ctaLabel: string;
  ctaHref: string;
  navigation: NavItem[];
};

function defaults(): SiteContentData {
  return {
    brandName: siteConfig.name,
    contactEmail: siteConfig.contact.email,
    contactPhone: siteConfig.contact.phone,
    contactLocation: siteConfig.contact.location,
    metaTitle: siteConfig.name,
    metaDescription: siteConfig.description ?? "",
    heroTagline: siteConfig.baseline ?? "",
    ctaLabel: "Découvrir nos produits",
    ctaHref: "/catalogue",
    navigation: [...siteConfig.navigation],
  };
}

export async function getSiteContent(): Promise<SiteContentData> {
  if (isDBConfigured()) {
    try {
      const row = await prisma.siteContent.findUnique({ where: { id: 1 } });
      if (row) {
        const d = defaults();
        return {
          brandName: row.brandName || d.brandName,
          contactEmail: row.contactEmail || d.contactEmail,
          contactPhone: row.contactPhone || d.contactPhone,
          contactLocation: row.contactLocation || d.contactLocation,
          metaTitle: row.metaTitle || d.metaTitle,
          metaDescription: row.metaDescription || d.metaDescription,
          heroTagline: row.heroTagline || d.heroTagline,
          ctaLabel: row.ctaLabel || d.ctaLabel,
          ctaHref: row.ctaHref || d.ctaHref,
          navigation: Array.isArray(row.navigation) && row.navigation.length
            ? (row.navigation as NavItem[])
            : d.navigation,
        };
      }
    } catch (e) {
      console.warn("[site-content] DB indisponible, repli statique.", e);
    }
  }
  return defaults();
}
```

- [ ] **Step 2 — Lint** : `npm run lint` → pas d'erreur sur ce fichier.
- [ ] **Step 3 — Commit** : `git add src/lib/site-content.ts && git commit -m "feat(content): adaptateur getSiteContent (DB + repli)"`

### Task 2.2 : Seed `SiteContent`

**Files:** Modify `prisma/seed.ts`

- [ ] **Step 1 — Ajouter dans `main()`** un upsert de la ligne unique (create-only pour ne pas écraser les personnalisations) :

```ts
await prisma.siteContent.upsert({
  where: { id: 1 },
  update: {}, // ne rien écraser si déjà présent
  create: {
    id: 1,
    brandName: "Atelier OLDA",
    metaTitle: "Atelier OLDA",
    ctaLabel: "Découvrir nos produits",
    ctaHref: "/catalogue",
    navigation: [
      { label: "Catalogue", href: "/catalogue" },
      { label: "Sélection", href: "/#selection" },
      { label: "Méthode", href: "/#methode" },
      { label: "Contact", href: "/#contact" },
    ],
  },
});
console.log("  ✓ SiteContent (id=1)");
```

- [ ] **Step 2 — Exécuter le seed sur la base de dev** : `npm run db:seed`
Expected: ligne `SiteContent` créée.
- [ ] **Step 3 — Commit** : `git add prisma/seed.ts && git commit -m "feat(seed): valeurs par défaut SiteContent"`

### Task 2.3 : Brancher footer + SEO + accueil

**Files:** Modify `src/components/layout/site-footer.tsx`, `src/app/layout.tsx`, `src/app/page.tsx`

- [ ] **Step 1 — Footer** : transformer en composant serveur async lisant `getSiteContent()`. Remplacer chaque usage de `siteConfig.name` → `content.brandName`, `siteConfig.contact.*` → `content.contact*`, `siteConfig.navigation` → `content.navigation`. Garder le markup/CSS existant.

- [ ] **Step 2 — Layout SEO** : remplacer l'export statique `metadata` par :

```ts
export async function generateMetadata(): Promise<Metadata> {
  const c = await getSiteContent();
  return {
    title: { default: c.metaTitle, template: c.metaTitle },
    description: c.metaDescription,
    applicationName: c.brandName,
    openGraph: { title: c.metaTitle, description: c.metaDescription, siteName: c.brandName },
    twitter: { title: c.metaTitle, description: c.metaDescription },
  };
}
```
(importer `getSiteContent` ; conserver `viewport`.)

- [ ] **Step 3 — Accueil** (`page.tsx`) : rendre la page `async`, lire `const c = await getSiteContent()`, utiliser `c.ctaLabel` et `c.ctaHref` pour le bouton, et afficher `c.heroTagline` si non vide (sous le logo).

- [ ] **Step 4 — Vérifier (build + preview)** : `npm run build` OK. Démarrer le preview sur ce worktree, charger `/` et le footer → contenu inchangé (valeurs par défaut). Capture.

- [ ] **Step 5 — Commit** : `git add src/components/layout/site-footer.tsx src/app/layout.tsx src/app/page.tsx && git commit -m "feat(content): footer/SEO/accueil lus depuis getSiteContent"`

---

## Phase 3 — Tableau de bord admin + zone "Contenu du site"

### Task 3.1 : Helper `requireAdmin()` partagé

**Files:** Create `src/lib/admin-auth.ts` ; Modify `src/app/api/admin/catalog/route.ts` (réutiliser)

- [ ] **Step 1 — Écrire le helper**

```ts
import { auth } from "@/auth";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.isAdmin) return null;
  return session;
}
```

- [ ] **Step 2 — Refactor** `catalog/route.ts` pour importer `requireAdmin` depuis `@/lib/admin-auth` (supprimer la copie locale).
- [ ] **Step 3 — Lint + commit** : `git add src/lib/admin-auth.ts src/app/api/admin/catalog/route.ts && git commit -m "refactor(admin): requireAdmin partagé"`

### Task 3.2 : API contenu `/api/admin/content`

**Files:** Create `src/app/api/admin/content/route.ts`

- [ ] **Step 1 — Écrire la route** (GET lit, PUT upsert id=1)

```ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const content = await prisma.siteContent.findUnique({ where: { id: 1 } });
  return NextResponse.json({ content });
}

export async function PUT(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const b = await req.json() as Record<string, unknown>;
  const str = (k: string) => typeof b[k] === "string" ? (b[k] as string) : undefined;
  const data = {
    ...(str("brandName") !== undefined ? { brandName: str("brandName")! } : {}),
    ...(str("contactEmail") !== undefined ? { contactEmail: str("contactEmail")! } : {}),
    ...(str("contactPhone") !== undefined ? { contactPhone: str("contactPhone")! } : {}),
    ...(str("contactLocation") !== undefined ? { contactLocation: str("contactLocation")! } : {}),
    ...(str("metaTitle") !== undefined ? { metaTitle: str("metaTitle")! } : {}),
    ...(str("metaDescription") !== undefined ? { metaDescription: str("metaDescription")! } : {}),
    ...(str("heroTagline") !== undefined ? { heroTagline: str("heroTagline")! } : {}),
    ...(str("ctaLabel") !== undefined ? { ctaLabel: str("ctaLabel")! } : {}),
    ...(str("ctaHref") !== undefined ? { ctaHref: str("ctaHref")! } : {}),
    ...(Array.isArray(b.navigation) ? { navigation: b.navigation as object } : {}),
  };
  const content = await prisma.siteContent.upsert({
    where: { id: 1 }, update: data, create: { id: 1, ...data },
  });
  return NextResponse.json({ content });
}
```

- [ ] **Step 2 — Vérifier l'auth** : appel non authentifié → 401 (test via preview/console). Commit : `git add src/app/api/admin/content/route.ts && git commit -m "feat(admin): API contenu du site"`

### Task 3.3 : Écran `/admin/contenu`

**Files:** Create `src/app/admin/contenu/page.tsx`, `ContenuAdmin.tsx`, `contenu.module.css`

- [ ] **Step 1 — `page.tsx`** (server) : `requireAdmin` (sinon redirect `/login?callbackUrl=/admin/contenu` ou accès refusé, comme `admin/page.tsx`), lit `getSiteContent()`, passe les données à `<ContenuAdmin initial={...} />`.
- [ ] **Step 2 — `ContenuAdmin.tsx`** (client) : formulaire avec sections **Marque** (brandName), **Contact** (email/phone/location), **SEO** (metaTitle/metaDescription), **Accueil** (heroTagline, ctaLabel, ctaHref), **Navigation** (liste éditable d'items `{label, href}` : ajouter/supprimer/réordonner). Bouton "Enregistrer" → `PUT /api/admin/content`. Toast succès. Mirroir du style de `CatalogueAdmin.tsx` (mêmes classes d'input/boutons).
- [ ] **Step 3 — `contenu.module.css`** : reprendre les motifs de `admin/catalogue/catalogue.module.css`.
- [ ] **Step 4 — Vérifier (preview)** : se connecter admin, `/admin/contenu`, modifier le nom de marque + un libellé de nav → Enregistrer → recharger `/` → footer reflète le changement **sans rebuild**. Capture avant/après.
- [ ] **Step 5 — Commit** : `git add src/app/admin/contenu && git commit -m "feat(admin): écran Contenu du site"`

### Task 3.4 : Tableau de bord `/admin`

**Files:** Modify `src/app/admin/page.tsx`, `src/app/admin/AdminClient.tsx`

- [ ] **Step 1 — `/admin`** : remplacer le contenu par un tableau de bord listant 3 cartes-liens : **Catalogue** (`/admin/catalogue`), **Contenu du site** (`/admin/contenu`), **Clients** (`/admin/clients`). Afficher l'email connecté + lien retour site. Retirer l'ancienne UI de gestion JSON `LOCAL_USERS` (déplacée vers `/admin/clients` en Phase 4). Réutiliser `page.module.css`.
- [ ] **Step 2 — Vérifier (preview)** : `/admin` montre 3 cartes ; non-admin → "Accès refusé". Capture.
- [ ] **Step 3 — Commit** : `git add src/app/admin/page.tsx src/app/admin/AdminClient.tsx && git commit -m "feat(admin): tableau de bord 3 zones"`

---

## Phase 4 — Comptes clients en base + split auth Edge/Node

### Task 4.1 : Split de config NextAuth

**Files:** Create `src/auth.config.ts` ; Modify `src/auth.ts`, `middleware.ts`

- [ ] **Step 1 — `src/auth.config.ts`** (Edge-safe, AUCUN import Prisma) : exporter un objet `NextAuthConfig` contenant `pages: { signIn: "/login" }`, les callbacks `jwt` et `session` (la logique `ADMIN_EMAILS` actuelle — comparaison de chaînes, OK Edge), et `providers: []`. Déplacer ici les types de session.

- [ ] **Step 2 — `src/auth.ts`** (Node) : `import authConfig from "./auth.config"`. Conserver `getLocalUsers`/`checkPassword`. Définir `authorize` qui, dans l'ordre : (a) Strapi si configuré (code existant) ; (b) **table `User`** via Prisma si `isDBConfigured()` — `prisma.user.findUnique({ where: { email } })` + `checkPassword` ; (c) repli `LOCAL_USERS`. Exporter `NextAuth({ ...authConfig, providers: [Credentials({ authorize })] })`.

```ts
// extrait — branche DB dans authorize, après l'échec Strapi :
if (isDBConfigured()) {
  const u = await prisma.user.findUnique({ where: { email } });
  if (u && await checkPassword(password, u.passwordHash)) {
    const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
    return { id: u.id, email: u.email, name: u.name, groupeSlug: u.groupe, isAdmin: adminEmails.includes(u.email.toLowerCase()) };
  }
}
```

- [ ] **Step 3 — `middleware.ts`** : remplacer `import { auth } from "@/auth"` par une instance Edge issue de la config :

```ts
import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import { NextResponse } from "next/server";
const { auth } = NextAuth(authConfig);
export default auth((req) => { /* logique de redirection existante */ });
export const config = { matcher: ["/mon-compte/:path*", "/admin", "/admin/:path*"] };
```

- [ ] **Step 4 — Vérifier (build)** : `npm run build` réussit (le bundle middleware ne contient PAS Prisma). C'est la vérification clé de cette tâche.
- [ ] **Step 5 — Commit** : `git add src/auth.config.ts src/auth.ts middleware.ts && git commit -m "feat(auth): split Edge/Node + login via table User"`

### Task 4.2 : API + écran Clients

**Files:** Create `src/app/api/admin/clients/route.ts`, `src/app/admin/clients/page.tsx`, `ClientsAdmin.tsx`, `clients.module.css`

- [ ] **Step 1 — API `/api/admin/clients`** (Node, `requireAdmin`) : `GET` liste les `User` (sans `passwordHash`) ; `POST` crée (hash sha256 du mot de passe fourni) ; `PUT` met à jour nom/groupe/mot de passe ; `DELETE ?id=` supprime. Réutiliser le hash sha256 (Web Crypto).

```ts
async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return "sha256:" + Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
}
```

- [ ] **Step 2 — Écran `/admin/clients`** : tableau des clients (nom, email, groupe) + formulaire d'ajout + actions (supprimer, réinitialiser mot de passe, changer groupe). Mirroir de l'ancien `AdminClient.tsx` MAIS les actions appellent l'API (plus de copier-coller JSON). `groupe` ∈ {standard, distributeur, grossiste, vip}.
- [ ] **Step 3 — Vérifier (preview)** : créer un client → il apparaît ; se déconnecter, se connecter avec ce client → OK ; un non-admin ne peut pas accéder à `/admin/clients` ni à l'API (401). Captures.
- [ ] **Step 4 — Commit** : `git add src/app/api/admin/clients src/app/admin/clients && git commit -m "feat(admin): gestion des comptes clients en base"`

### Task 4.3 : Script de migration des `LOCAL_USERS`

**Files:** Create `scripts/migrate-local-users.mjs`

- [ ] **Step 1 — Écrire le script** : lit `process.env.LOCAL_USERS` (JSON), pour chaque user `prisma.user.upsert({ where:{email}, create:{...}, update:{} })` (idempotent, ne touche pas aux existants). Log du nombre importé.
- [ ] **Step 2 — Documenter l'exécution** (commentaire en tête) : `node scripts/migrate-local-users.mjs` une fois en prod avec `DATABASE_URL` + `LOCAL_USERS` définis.
- [ ] **Step 3 — Commit** : `git add scripts/migrate-local-users.mjs && git commit -m "chore(admin): script d'import des clients LOCAL_USERS"`

---

## Phase 5 — Catalogue : compléter + upload d'images

### Task 5.1 : Exposer `signauxBusiness`

**Files:** Modify `src/app/api/admin/catalog/route.ts`, `src/app/admin/catalogue/CatalogueAdmin.tsx`

- [ ] **Step 1 — API** : dans `POST` (type famille) et `PUT` (type famille), gérer `signauxBusiness` (`string[]`) : `...(Array.isArray(body.signauxBusiness) ? { signauxBusiness: body.signauxBusiness } : {})`.
- [ ] **Step 2 — UI** : dans l'édition d'une famille, ajouter une liste éditable de signaux business (ajouter/supprimer une ligne de texte), envoyée dans le PUT.
- [ ] **Step 3 — Vérifier (preview)** : éditer les signaux d'une famille → Enregistrer → visibles sur la page catalogue de la famille. Capture.
- [ ] **Step 4 — Commit** : `git add src/app/api/admin/catalog/route.ts src/app/admin/catalogue/CatalogueAdmin.tsx && git commit -m "feat(catalogue): édition des signaux business"`

### Task 5.2 : Upload d'image via GitHub

**Files:** Create `src/app/api/admin/upload/route.ts`, `src/components/admin/image-upload.tsx` (+ css)

- [ ] **Step 1 — Route `/api/admin/upload`** (Node, `requireAdmin`, `export const runtime = "nodejs"`) :
  - Lire `formData()` : `file` (Blob) + `folder` (string, ex. `produits`).
  - Valider : type ∈ {image/png, image/jpeg, image/webp, image/svg+xml} ; taille ≤ 5 Mo.
  - Assainir le nom : slug + extension d'origine ; refuser `..`, `/`, `\`.
  - Chemin cible : `public/images/{folder}/{slug}.{ext}` (folder lui-même slugifié, pas de traversée).
  - Commit via GitHub Contents API :

```ts
const path = `public/images/${folder}/${name}`;
const repo = process.env.GITHUB_REPO!, branch = process.env.GITHUB_BRANCH || "main";
const token = process.env.GITHUB_TOKEN!;
const base = `https://api.github.com/repos/${repo}/contents/${path}`;
// récupérer le sha si le fichier existe déjà
const head = await fetch(`${base}?ref=${branch}`, { headers: { Authorization: `Bearer ${token}`, "User-Agent": "site-b2b-admin" } });
const sha = head.ok ? (await head.json()).sha : undefined;
const put = await fetch(base, {
  method: "PUT",
  headers: { Authorization: `Bearer ${token}`, "User-Agent": "site-b2b-admin", "Content-Type": "application/json" },
  body: JSON.stringify({ message: `chore(images): upload ${path}`, content: base64, branch, ...(sha ? { sha } : {}) }),
});
if (!put.ok) return NextResponse.json({ error: "Échec de l'envoi GitHub." }, { status: 502 });
return NextResponse.json({ path: `/images/${folder}/${name}`, redeploy: true });
```
  - Si `GITHUB_TOKEN` absent : 400 avec message clair.

- [ ] **Step 2 — Composant `image-upload.tsx`** (client) : input file + aperçu + appel `POST /api/admin/upload` (FormData) ; au succès, callback `onUploaded(path)` + message "image envoyée, visible en ligne après redéploiement (~1 min)".

- [ ] **Step 3 — Intégrer** dans `CatalogueAdmin.tsx` (champ image produit) : à côté du champ `imageUrl`, le bouton d'upload qui remplit `imageUrl` avec le chemin renvoyé. (Optionnel : réutiliser dans `/admin/contenu` plus tard.)

- [ ] **Step 4 — Vérifier** : si `GITHUB_TOKEN` de test fourni → uploader une petite image → vérifier le commit sur la branche et le chemin renvoyé. Sinon, vérifier le 400 propre + la validation (type/taille). Capture.
- [ ] **Step 5 — Commit** : `git add src/app/api/admin/upload src/components/admin && git commit -m "feat(admin): upload d'images via GitHub Contents API"`

---

## Phase 6 — Vérification globale & PR

### Task 6.1 : Build + lint + parcours complet

- [ ] **Step 1 — Lint** : `npm run lint` → 0 erreur.
- [ ] **Step 2 — Build** : `npm run build` → succès (Edge/Node OK, `generateMetadata` OK).
- [ ] **Step 3 — Parcours preview (admin)** : `/admin` → 3 zones ; éditer Contenu (marque/contact/nav/SEO/CTA) → reflet live ; éditer Catalogue (signaux + image) ; gérer Clients (créer/connexion). Captures de chaque zone.
- [ ] **Step 4 — Parcours non-admin** : un compte non listé dans `ADMIN_EMAILS` est refusé sur `/admin/*` et reçoit 401 sur les API admin.

### Task 6.2 : Push + PR

- [ ] **Step 1 — Re-vérifier l'état git** : `git -C <worktree> status -sb` ; `git fetch origin`.
- [ ] **Step 2 — Push la branche** : `git push -u origin claude/admin-back-office-gc` (jamais `--force`).
- [ ] **Step 3 — Ouvrir la PR** vers `main` : `gh pr create -R dockbearolda/SITE-B2B -B main -H claude/admin-back-office-gc --title "Back-office admin complet" --body "<résumé + checklist + variables d'env à définir sur Railway>"`.
- [ ] **Step 4 — Checklist de déploiement** dans la PR : variables Railway à définir/vérifier (`AUTH_SECRET`, `ADMIN_EMAILS`, `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH`) ; lancer la migration prod (`prisma migrate deploy`) + seed `SiteContent` ; exécuter `migrate-local-users.mjs` une fois.

---

## Auto-revue (à faire après rédaction — déjà passée)

- **Couverture spec** : §catalogue→Phase 5 ; §marque/contact/SEO/accueil→Phase 2-3 ; §navigation→Task 3.3 ; §clients→Phase 4 ; §images→Task 5.2 ; §auth split→Task 4.1. ✅
- **Pas de placeholder** : code fourni pour les parties critiques (modèles, adaptateur, auth split, API content/clients/upload, seed). UI : motifs existants référencés (`CatalogueAdmin.tsx`, `AdminClient.tsx`, `*.module.css`).
- **Cohérence des noms** : `SiteContent`/`User`, `getSiteContent`/`SiteContentData`, `requireAdmin`, `/api/admin/{content,clients,upload}`, env `GITHUB_{TOKEN,REPO,BRANCH}` — cohérents entre les tâches.

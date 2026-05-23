/**
 * Configuration Auth.js (next-auth v5) — partie Node (accès base de données).
 * La config Edge-safe (callbacks, pages) est dans src/auth.config.ts (middleware).
 *
 * Ordre d'authentification dans authorize() :
 *   1. Strapi          (si NEXT_PUBLIC_STRAPI_URL défini)
 *   2. Base de données — table User (si DATABASE_URL défini, géré via /admin/clients)
 *   3. LOCAL_USERS     (variable d'env — héritage / repli)
 *
 * Variables : AUTH_SECRET (requis), ADMIN_EMAILS, NEXT_PUBLIC_STRAPI_URL,
 *   STRAPI_API_TOKEN, LOCAL_USERS, DATABASE_URL.
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import authConfig from "@/auth.config";
import { isDBConfigured, prisma } from "@/lib/prisma";

const STRAPI_URL = (process.env.NEXT_PUBLIC_STRAPI_URL ?? "").replace(/\/$/, "");

type StrapiAuthResponse = {
  jwt?: string;
  user?: { id: number; email: string; username: string };
};

type StrapiMeResponse = {
  id: number;
  email: string;
  username: string;
  groupe_client?: { id: number; slug: string; nom: string } | null;
};

export type LocalUser = {
  id: string;
  email: string;
  /** Mot de passe : "sha256:<hex>" (recommandé) ou texte brut */
  password: string;
  name: string;
  groupe?: string;
};

function getLocalUsers(): LocalUser[] {
  const raw = process.env.LOCAL_USERS ?? "";
  if (!raw) return [];
  try {
    return JSON.parse(raw) as LocalUser[];
  } catch {
    console.error("[auth] LOCAL_USERS: JSON invalide — vérifiez la variable d'environnement");
    return [];
  }
}

/** Vérifie un mot de passe contre le hash stocké ("sha256:<hex>" ou texte brut). Web Crypto (Edge & Node). */
async function checkPassword(input: string, stored: string): Promise<boolean> {
  if (stored.startsWith("sha256:")) {
    const data = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex === stored.slice(7);
  }
  return input === stored;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      authorize: async (credentials) => {
        const password = String(credentials?.password ?? "");

        // ── 0. Accès admin par mot de passe unique (ADMIN_PASSWORD) ──
        // Permet au patron d'entrer dans /admin avec UN seul mot de passe (sans email).
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (adminPassword && password === adminPassword) {
          const adminEmail =
            (process.env.ADMIN_EMAILS ?? "").split(",")[0]?.trim().toLowerCase() || "admin@olda";
          return { id: "admin", email: adminEmail, name: "Administrateur" };
        }

        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email).trim().toLowerCase();

        // ── 1. Strapi ────────────────────────────────────────────
        if (STRAPI_URL) {
          try {
            const authRes = await fetch(`${STRAPI_URL}/api/auth/local`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                identifier: credentials.email,
                password: credentials.password,
              }),
            });

            if (authRes.ok) {
              const authData = (await authRes.json()) as StrapiAuthResponse;
              if (authData.jwt && authData.user) {
                let groupeId: number | undefined;
                let groupeSlug: string | undefined;
                try {
                  const meRes = await fetch(
                    `${STRAPI_URL}/api/users/me?populate=groupe_client`,
                    { headers: { Authorization: `Bearer ${authData.jwt}` } },
                  );
                  if (meRes.ok) {
                    const me = (await meRes.json()) as StrapiMeResponse;
                    if (me.groupe_client) {
                      groupeId = me.groupe_client.id;
                      groupeSlug = me.groupe_client.slug;
                    }
                  }
                } catch {
                  // Non bloquant
                }
                return {
                  id: String(authData.user.id),
                  email: authData.user.email,
                  name: authData.user.username,
                  strapiToken: authData.jwt,
                  strapiId: String(authData.user.id),
                  groupeId,
                  groupeSlug,
                };
              }
            }
          } catch {
            // Strapi inaccessible — on passe aux modes suivants
          }
        }

        // ── 2. Base de données — table User ──────────────────────
        if (isDBConfigured()) {
          try {
            const u = await prisma.user.findUnique({ where: { email } });
            if (u && (await checkPassword(password, u.passwordHash))) {
              return { id: u.id, email: u.email, name: u.name, groupeSlug: u.groupe };
            }
          } catch (e) {
            console.warn("[auth] Recherche User en base échouée.", e);
          }
        }

        // ── 3. LOCAL_USERS (héritage) ────────────────────────────
        const localUsers = getLocalUsers();
        if (localUsers.length > 0) {
          const user = localUsers.find((u) => u.email.trim().toLowerCase() === email);
          if (user && (await checkPassword(password, user.password))) {
            return { id: user.id, email: user.email, name: user.name, groupeSlug: user.groupe };
          }
        }

        return null;
      },
    }),
  ],
});

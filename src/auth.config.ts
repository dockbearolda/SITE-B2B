/**
 * Configuration Auth.js Edge-safe (sans Prisma ni accès réseau).
 * Utilisée par le middleware (Edge runtime) ET étendue par src/auth.ts (Node).
 * Ne PAS importer Prisma ici : le bundle middleware tourne sur l'Edge runtime.
 */

import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  // Les providers (avec accès base/réseau) sont ajoutés dans src/auth.ts (Node).
  providers: [],
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const u = user as typeof user & {
          strapiToken?: string;
          strapiId?: string;
          groupeId?: number;
          groupeSlug?: string;
        };
        token.strapiToken = u.strapiToken;
        token.strapiId = u.strapiId;
        token.groupeId = u.groupeId;
        token.groupeSlug = u.groupeSlug;
      }
      // Re-vérification admin à chaque renouvellement (comparaison de chaînes — Edge-safe).
      const adminEmails = (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      const tokenEmail = (token.email ?? "").trim().toLowerCase();
      token.isAdmin =
        adminEmails.length > 0 && tokenEmail !== "" && adminEmails.includes(tokenEmail);
      return token;
    },
    session({ session, token }) {
      session.user.strapiToken = token.strapiToken as string | undefined;
      session.user.strapiId = token.strapiId as string | undefined;
      session.user.groupeId = token.groupeId as number | undefined;
      session.user.groupeSlug = token.groupeSlug as string | undefined;

      const adminEmails = (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      const userEmail = (session.user?.email ?? "").trim().toLowerCase();
      session.user.isAdmin =
        adminEmails.length > 0 && userEmail !== "" && adminEmails.includes(userEmail);

      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;

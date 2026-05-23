/**
 * Import one-shot des clients LOCAL_USERS (variable d'env) vers la table User.
 * À lancer une seule fois en production (ou local) :
 *   DATABASE_URL=... LOCAL_USERS='[...]' node scripts/migrate-local-users.mjs
 * Idempotent : ne modifie pas les clients déjà présents (upsert sans update).
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const raw = process.env.LOCAL_USERS ?? "";
if (!raw) {
  console.log("LOCAL_USERS vide — rien à importer.");
  process.exit(0);
}

let users;
try {
  users = JSON.parse(raw);
} catch {
  console.error("LOCAL_USERS : JSON invalide.");
  process.exit(1);
}

let imported = 0;
for (const u of users) {
  if (!u.email || !u.password || !u.name) continue;
  const email = String(u.email).trim().toLowerCase();
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: u.name,
      passwordHash: u.password, // conserve le format existant ("sha256:..." ou texte brut)
      groupe: u.groupe || "standard",
    },
  });
  imported++;
  console.log(`  ✓ ${email}`);
}

console.log(`Terminé — ${imported} client(s) traité(s).`);
await prisma.$disconnect();

/**
 * POST /api/admin/upload — upload d'une image vers le repo GitHub (admin uniquement).
 * Reçoit un FormData { file, folder? }. Valide type/taille, assainit le nom,
 * commit dans public/images/<folder>/<nom> via l'API GitHub Contents.
 * Railway (connecté au repo) redéploie ⇒ image en ligne (~1 min).
 *
 * Variables : GITHUB_TOKEN (PAT fine-grained, Contents RW), GITHUB_REPO (owner/repo), GITHUB_BRANCH.
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};
const MAX_BYTES = 5 * 1024 * 1024;

function slugifySegment(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  if (!token || !repo) {
    return NextResponse.json(
      { error: "Upload non configuré : variables GITHUB_TOKEN et GITHUB_REPO requises." },
      { status: 400 },
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  const folderRaw = String(form.get("folder") ?? "produits");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant." }, { status: 400 });
  }
  const ext = ALLOWED[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Type non autorisé (png, jpg, webp, svg)." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image trop lourde (max 5 Mo)." }, { status: 400 });
  }

  const folder = slugifySegment(folderRaw) || "produits";
  const base = slugifySegment(file.name.replace(/\.[^.]+$/, "")) || "image";
  const fileName = `${base}-${Date.now()}.${ext}`;
  const repoPath = `public/images/${folder}/${fileName}`;

  const contentB64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${repoPath}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "site-b2b-admin",
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: `chore(images): ajout ${repoPath} via admin`,
      content: contentB64,
      branch,
    }),
  });

  if (!res.ok) {
    console.error("[upload] GitHub", res.status, await res.text());
    return NextResponse.json({ error: "Échec de l'envoi vers GitHub." }, { status: 502 });
  }

  return NextResponse.json({ path: `/images/${folder}/${fileName}`, redeploy: true });
}

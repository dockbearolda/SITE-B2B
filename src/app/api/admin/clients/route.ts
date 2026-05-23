/**
 * CRUD des comptes clients (table User) — admin uniquement.
 * GET    — liste (sans hash)
 * POST   — crée { email, name, password, groupe }
 * PUT    — met à jour { id, name?, groupe?, password? }
 * DELETE — ?id=...
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const SELECT = { id: true, email: true, name: true, groupe: true, createdAt: true } as const;

async function hashPassword(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  const hex = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `sha256:${hex}`;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const clients = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, select: SELECT });
  return NextResponse.json({ clients });
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const b = (await req.json()) as {
    email?: string;
    name?: string;
    password?: string;
    groupe?: string;
  };
  if (!b.email || !b.name || !b.password) {
    return NextResponse.json({ error: "Email, nom et mot de passe obligatoires." }, { status: 400 });
  }
  const email = b.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Un client avec cet email existe déjà." }, { status: 409 });
  }
  const client = await prisma.user.create({
    data: {
      email,
      name: b.name.trim(),
      passwordHash: await hashPassword(b.password),
      groupe: b.groupe || "standard",
    },
    select: SELECT,
  });
  return NextResponse.json({ client });
}

export async function PUT(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const b = (await req.json()) as {
    id?: string;
    name?: string;
    groupe?: string;
    password?: string;
  };
  if (!b.id) return NextResponse.json({ error: "ID manquant." }, { status: 400 });

  const data: { name?: string; groupe?: string; passwordHash?: string } = {};
  if (typeof b.name === "string") data.name = b.name.trim();
  if (typeof b.groupe === "string") data.groupe = b.groupe;
  if (typeof b.password === "string" && b.password) data.passwordHash = await hashPassword(b.password);

  const client = await prisma.user.update({ where: { id: b.id }, data, select: SELECT });
  return NextResponse.json({ client });
}

export async function DELETE(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID manquant." }, { status: 400 });
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

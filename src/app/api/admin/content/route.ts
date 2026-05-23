/**
 * GET /api/admin/content — lit la ligne unique SiteContent (id=1)
 * PUT /api/admin/content — met à jour / crée la ligne (admin uniquement)
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const STRING_FIELDS = [
  "brandName",
  "contactEmail",
  "contactPhone",
  "contactLocation",
  "footerAddress",
  "iban",
  "bic",
  "siret",
  "metaTitle",
  "metaDescription",
  "heroTagline",
  "ctaLabel",
  "ctaHref",
] as const;

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const content = await prisma.siteContent.findUnique({ where: { id: 1 } });
  return NextResponse.json({ content });
}

export async function PUT(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const body = (await req.json()) as Record<string, unknown>;
  const data: Record<string, string> = {};
  for (const field of STRING_FIELDS) {
    if (typeof body[field] === "string") {
      data[field] = body[field] as string;
    }
  }
  const content = await prisma.siteContent.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });
  return NextResponse.json({ content });
}

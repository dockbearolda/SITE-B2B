/**
 * Adaptateur de contenu éditorial — lit la ligne unique SiteContent (id=1)
 * en base si DATABASE_URL est défini, sinon repli sur des valeurs par défaut
 * (qui reproduisent le contenu codé en dur d'origine du site).
 * Même logique de repli que catalog-source.ts.
 */

import { isDBConfigured, prisma } from "./prisma";

export type NavItem = { label: string; href: string };

export type SiteContentData = {
  brandName: string;
  contactEmail: string;
  contactPhone: string;
  contactLocation: string;
  footerAddress: string;
  iban: string;
  bic: string;
  siret: string;
  metaTitle: string;
  metaDescription: string;
  heroTagline: string;
  ctaLabel: string;
  ctaHref: string;
  navigation: NavItem[];
};

/** Valeurs par défaut = contenu actuellement codé en dur (préserve l'apparence si pas de DB). */
export function siteContentDefaults(): SiteContentData {
  return {
    brandName: "Atelier OLDA",
    contactEmail: "atelierolda@gmail.com",
    contactPhone: "",
    contactLocation: "",
    footerAddress: "Atelier OLDA\n1 Rue Opales, Grand Case\nSaint-Martin (French West Indies)",
    iban: "FR76 1027 8053 6000 0217 1400 271",
    bic: "CMCIFR2A",
    siret: "978 296 952 00028",
    metaTitle: "Atelier OLDA",
    metaDescription: "",
    heroTagline: "",
    ctaLabel: "Découvrir nos produits",
    ctaHref: "/catalogue/tasses/tasse-ceramique-fuck",
    navigation: [
      { label: "Catalogue", href: "/catalogue" },
      { label: "Sélection", href: "/#selection" },
      { label: "Méthode", href: "/#methode" },
      { label: "Contact", href: "/#contact" },
    ],
  };
}

function isNavArray(value: unknown): value is NavItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (n) =>
        typeof n === "object" &&
        n !== null &&
        typeof (n as NavItem).label === "string" &&
        typeof (n as NavItem).href === "string",
    )
  );
}

export async function getSiteContent(): Promise<SiteContentData> {
  const d = siteContentDefaults();
  if (isDBConfigured()) {
    try {
      const row = await prisma.siteContent.findUnique({ where: { id: 1 } });
      if (row) {
        return {
          brandName: row.brandName || d.brandName,
          contactEmail: row.contactEmail || d.contactEmail,
          contactPhone: row.contactPhone || d.contactPhone,
          contactLocation: row.contactLocation || d.contactLocation,
          footerAddress: row.footerAddress || d.footerAddress,
          iban: row.iban,
          bic: row.bic,
          siret: row.siret,
          metaTitle: row.metaTitle || d.metaTitle,
          metaDescription: row.metaDescription || d.metaDescription,
          heroTagline: row.heroTagline,
          ctaLabel: row.ctaLabel || d.ctaLabel,
          ctaHref: row.ctaHref || d.ctaHref,
          navigation:
            isNavArray(row.navigation) && row.navigation.length
              ? row.navigation
              : d.navigation,
        };
      }
    } catch (e) {
      console.warn("[site-content] DB indisponible, repli statique.", e);
    }
  }
  return d;
}

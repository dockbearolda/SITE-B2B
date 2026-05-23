"use client";

import { useState } from "react";
import styles from "../page.module.css";

type Content = {
  brandName: string;
  contactEmail: string;
  footerAddress: string;
  iban: string;
  bic: string;
  siret: string;
  metaTitle: string;
  metaDescription: string;
  heroTagline: string;
  ctaLabel: string;
  ctaHref: string;
};

export function ContenuAdmin({
  initial,
  adminEmail,
}: {
  initial: Content;
  adminEmail: string;
}) {
  const [form, setForm] = useState<Content>(initial);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<null | "ok" | "err">(null);

  const set =
    (k: keyof Content) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setStatus(res.ok ? "ok" : "err");
    } catch {
      setStatus("err");
    }
    setSaving(false);
  };

  return (
    <form className={styles.admin} onSubmit={save}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Contenu du site</h1>
          <p className={styles.subtitle}>Connecté : {adminEmail}</p>
        </div>
        <a href="/admin" className={styles.backLink}>← Tableau de bord</a>
      </div>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Marque</h2>
        <label className={styles.fieldLabel}>
          Nom de la marque
          <input className={styles.input} value={form.brandName} onChange={set("brandName")} />
        </label>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Coordonnées &amp; mentions légales</h2>
        <div className={styles.addForm}>
          <label className={styles.fieldLabel}>
            Adresse (une information par ligne)
            <textarea
              className={styles.input}
              rows={3}
              value={form.footerAddress}
              onChange={set("footerAddress")}
            />
          </label>
          <label className={styles.fieldLabel}>
            Email de contact
            <input
              className={styles.input}
              type="email"
              value={form.contactEmail}
              onChange={set("contactEmail")}
            />
          </label>
          <div className={styles.formRow}>
            <label className={styles.fieldLabel}>
              IBAN
              <input className={styles.input} value={form.iban} onChange={set("iban")} />
            </label>
            <label className={styles.fieldLabel}>
              BIC
              <input className={styles.input} value={form.bic} onChange={set("bic")} />
            </label>
          </div>
          <label className={styles.fieldLabel}>
            SIRET
            <input className={styles.input} value={form.siret} onChange={set("siret")} />
          </label>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Référencement (SEO)</h2>
        <div className={styles.addForm}>
          <label className={styles.fieldLabel}>
            Titre (onglet du navigateur)
            <input className={styles.input} value={form.metaTitle} onChange={set("metaTitle")} />
          </label>
          <label className={styles.fieldLabel}>
            Description
            <textarea
              className={styles.input}
              rows={2}
              value={form.metaDescription}
              onChange={set("metaDescription")}
            />
          </label>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Page d&apos;accueil</h2>
        <div className={styles.addForm}>
          <label className={styles.fieldLabel}>
            Slogan (optionnel, sous le logo)
            <input className={styles.input} value={form.heroTagline} onChange={set("heroTagline")} />
          </label>
          <div className={styles.formRow}>
            <label className={styles.fieldLabel}>
              Texte du bouton
              <input className={styles.input} value={form.ctaLabel} onChange={set("ctaLabel")} />
            </label>
            <label className={styles.fieldLabel}>
              Lien du bouton
              <input className={styles.input} value={form.ctaHref} onChange={set("ctaHref")} />
            </label>
          </div>
        </div>
      </section>

      <div className={styles.saveBar}>
        <button type="submit" className={styles.addBtn} disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        {status === "ok" && (
          <span className={styles.saveOk}>✓ Enregistré — visible immédiatement sur le site</span>
        )}
        {status === "err" && (
          <span className={styles.saveErr}>Erreur lors de l&apos;enregistrement</span>
        )}
      </div>
    </form>
  );
}

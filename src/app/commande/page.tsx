"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Container } from "@/components/ui/container";
import { MarginDashboard } from "@/components/cart/margin-dashboard";
import { useCart } from "@/lib/cart-context";
import { generateQuotePDF, generateQuotePDFBase64 } from "@/lib/generate-quote-pdf";
import { getProductImagePath } from "@/lib/product-image";

import styles from "./page.module.css";

type FormFields = {
  company: string;
  name: string;
  email: string;
  phone: string;
  pickupDate: string;
  message: string;
};

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  const parts: string[] = [];
  for (let i = 0; i < digits.length; i += 2) parts.push(digits.slice(i, i + 2));
  return parts.join(" ");
}

function validateField(field: keyof FormFields, value: string): string | null {
  switch (field) {
    case "company":
      return value.trim().length < 2 ? "Nom requis (2 car. min.)" : null;
    case "name":
      return value.trim().length < 2 ? "Nom requis (2 car. min.)" : null;
    case "email":
      if (!value.trim()) return "Email requis";
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : "Format email invalide";
    default:
      return null;
  }
}

function fmt(n: number): string {
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " €";
}

function CheckIcon() {
  return (
    <span className={`${styles.fieldIcon} ${styles.fieldIconValid}`} aria-hidden="true">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
}

function ErrorIcon() {
  return (
    <span className={`${styles.fieldIcon} ${styles.fieldIconInvalid}`} aria-hidden="true">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </span>
  );
}

export default function CommandePage() {
  const router = useRouter();
  const { items, totalItems, totalB2B, totalRevente, margeNette, hasPrices, updateQuantity, remove, clear } = useCart();

  const [submitState, setSubmitState] = useState<"idle" | "sending" | "success">("idle");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState<Partial<Record<keyof FormFields, boolean>>>({});
  const [successRef, setSuccessRef] = useState<string | null>(null);
  const [lastForm, setLastForm] = useState<FormFields | null>(null);
  const [lastItems, setLastItems] = useState(items);

  const [form, setForm] = useState<FormFields>({
    company: "",
    name: "",
    email: "",
    phone: "",
    pickupDate: "",
    message: "",
  });

  const updateField = useCallback((field: keyof FormFields, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleBlur = useCallback((field: keyof FormFields) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  function fieldStatus(field: keyof FormFields): "valid" | "invalid" | "pristine" {
    if (!touched[field]) return "pristine";
    return validateField(field, form[field]) === null ? "valid" : "invalid";
  }

  function inputClass(field: keyof FormFields) {
    const s = fieldStatus(field);
    if (s === "valid") return `${styles.input} ${styles.inputValid}`;
    if (s === "invalid") return `${styles.input} ${styles.inputInvalid}`;
    return styles.input;
  }

  const todayStr = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;

    setTouched({ company: true, name: true, email: true, phone: true, pickupDate: true, message: true });

    const requiredFields: (keyof FormFields)[] = ["company", "name", "email"];
    const hasError = requiredFields.some((f) => validateField(f, form[f]) !== null);
    if (hasError) return;

    setSubmitState("sending");
    setError("");

    // Générer le PDF base64 côté client pour la pièce jointe email
    let pdfBase64: string | null = null;
    try {
      pdfBase64 = generateQuotePDFBase64(items, form, { totalB2B, totalRevente, margeNette });
    } catch {
      // PDF optionnel — ne bloque pas la soumission
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20_000);

    try {
      const res = await fetch("/api/commande", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items, pdfBase64 }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(errData.error ?? "Erreur lors de l'envoi");
      }

      const data = await res.json() as { ok: boolean; ref?: string };
      const ref = data.ref ?? `CMD-${Date.now()}`;

      setLastForm(form);
      setLastItems([...items]);
      setSuccessRef(ref);
      clear();
      setSubmitState("success");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setError("Le serveur ne répond pas (délai dépassé). Vérifiez votre connexion et réessayez.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Une erreur est survenue. Veuillez réessayer.");
      }
      setSubmitState("idle");
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ── Écran de succès ──────────────────────────────────────────
  if (submitState === "success" && successRef) {
    return (
      <main className={styles.page} onClick={() => router.back()}>
        <Container onClick={(e) => e.stopPropagation()}>
          <div className={styles.success}>
            <div className={styles.successIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className={styles.successTitle}>Commande envoyée</h1>
            <p className={styles.successText}>
              Un email de confirmation a été envoyé à <strong>{lastForm?.email}</strong>.
              Notre équipe vous contactera prochainement.
            </p>
            <p className={styles.successRef}>{successRef}</p>

            <button
              className={styles.pdfBtn}
              onClick={() => {
                if (!lastForm || !lastItems.length) return;
                const doc = generateQuotePDF(lastItems, lastForm, { totalB2B, totalRevente, margeNette });
                doc.save(`devis-olda-${successRef}.pdf`);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Télécharger mon devis PDF
            </button>

            <div className={styles.successLinks}>
              <Link href="/catalogue" className={styles.backLink}>
                Retour au catalogue
              </Link>
              <Link href="/mon-compte/commandes" className={styles.portalLink}>
                Mes commandes
              </Link>
            </div>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className={styles.page} onClick={() => router.back()}>
      <Container onClick={(e) => e.stopPropagation()}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Continuer mes achats
        </button>
        <h1 className={styles.title}>Récapitulatif</h1>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <p>Votre sélection est vide.</p>
            <Link href="/catalogue" className={styles.backLink}>
              Parcourir le catalogue
            </Link>
          </div>
        ) : (
          <>
          <div className={styles.layout}>
            {/* ── Col 1 : Récapitulatif articles ── */}
            <div className={styles.cartSection}>
              <div className={styles.cartHeader}>
                <span>{totalItems} article{totalItems > 1 ? "s" : ""} sélectionné{totalItems > 1 ? "s" : ""}</span>
              </div>

              <div className={styles.cartList}>
                {items.map((item) => {
                  const src = getProductImagePath(item.ref);
                  return (
                    <div key={item.ref} className={styles.cartItem}>
                      <div className={styles.cartItemLeft}>
                        <div className={styles.cartItemThumb}>
                          {src ? (
                            <Image src={src} alt={item.label} fill sizes="52px" className={styles.thumbImg} />
                          ) : (
                            <div className={styles.thumbPlaceholder} />
                          )}
                        </div>
                        <div className={styles.cartItemInfo}>
                          <span className={styles.cartItemRef}>{item.ref}</span>
                          <span className={styles.cartItemLabel}>{item.label}</span>
                          {/* Prix masqués temporairement */}
                        </div>
                      </div>

                      <div className={styles.cartItemActions}>
                        <div className={styles.quantityControl}>
                          <button className={styles.qtyBtn} aria-label="Diminuer" onClick={() => updateQuantity(item.ref, item.quantity - 1)}>−</button>
                          <span className={styles.qtyValue}>{item.quantity}</span>
                          <button className={styles.qtyBtn} aria-label="Augmenter" onClick={() => updateQuantity(item.ref, item.quantity + 1)}>+</button>
                        </div>
                        <button
                          className={styles.removeBtn}
                          aria-label="Retirer l'article"
                          onClick={() => remove(item.ref)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Col 2 : Formulaire de contact ── */}
            <form className={styles.formSection} onSubmit={handleSubmit} noValidate>
              <div className={styles.formHeader}>
                <h2 className={styles.formTitle}>Vos informations</h2>
                <p className={styles.formSubtitle}>Commande · Retrait en boutique</p>
              </div>

              <div className={styles.fieldGroup}>

                {/* Entreprise */}
                <label className={styles.label}>
                  <span>Entreprise <span className={styles.required}>*</span></span>
                  <div className={styles.inputWrap}>
                    <input
                      className={inputClass("company")}
                      type="text"
                      placeholder="Nom de votre société"
                      autoFocus
                      value={form.company}
                      onChange={(e) => updateField("company", e.target.value)}
                      onBlur={() => handleBlur("company")}
                      aria-invalid={fieldStatus("company") === "invalid"}
                    />
                    {fieldStatus("company") === "valid" && <CheckIcon />}
                    {fieldStatus("company") === "invalid" && <ErrorIcon />}
                  </div>
                  {fieldStatus("company") === "invalid" && (
                    <span className={styles.fieldHint} role="alert">{validateField("company", form.company)}</span>
                  )}
                </label>

                {/* Nom */}
                <label className={styles.label}>
                  <span>Nom et prénom <span className={styles.required}>*</span></span>
                  <div className={styles.inputWrap}>
                    <input
                      className={inputClass("name")}
                      type="text"
                      placeholder="Votre nom"
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      onBlur={() => handleBlur("name")}
                      aria-invalid={fieldStatus("name") === "invalid"}
                    />
                    {fieldStatus("name") === "valid" && <CheckIcon />}
                    {fieldStatus("name") === "invalid" && <ErrorIcon />}
                  </div>
                  {fieldStatus("name") === "invalid" && (
                    <span className={styles.fieldHint} role="alert">{validateField("name", form.name)}</span>
                  )}
                </label>

                {/* Email + Téléphone */}
                <div className={styles.fieldRow}>
                  <label className={styles.label}>
                    <span>Email <span className={styles.required}>*</span></span>
                    <div className={styles.inputWrap}>
                      <input
                        className={inputClass("email")}
                        type="email"
                        placeholder="vous@exemple.fr"
                        value={form.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        onBlur={() => handleBlur("email")}
                        aria-invalid={fieldStatus("email") === "invalid"}
                      />
                      {fieldStatus("email") === "valid" && <CheckIcon />}
                      {fieldStatus("email") === "invalid" && <ErrorIcon />}
                    </div>
                    {fieldStatus("email") === "invalid" && (
                      <span className={styles.fieldHint} role="alert">{validateField("email", form.email)}</span>
                    )}
                  </label>

                  <label className={styles.label}>
                    Téléphone
                    <input
                      className={styles.input}
                      type="tel"
                      inputMode="tel"
                      placeholder="06 00 00 00 00"
                      value={form.phone}
                      onChange={(e) => updateField("phone", formatPhone(e.target.value))}
                    />
                  </label>
                </div>

                {/* Date */}
                <label className={styles.label}>
                  Date de retrait souhaitée
                  <input
                    className={styles.input}
                    type="date"
                    min={todayStr}
                    value={form.pickupDate}
                    onChange={(e) => updateField("pickupDate", e.target.value)}
                  />
                </label>

                {/* Message */}
                <label className={styles.label}>
                  Message ou précisions
                  <textarea
                    className={styles.textarea}
                    rows={3}
                    placeholder="Informations complémentaires, variantes souhaitées…"
                    value={form.message}
                    onChange={(e) => updateField("message", e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                        e.currentTarget.form?.requestSubmit();
                      }
                    }}
                  />
                  <span className={styles.fieldHint} style={{ color: "var(--color-muted)", fontWeight: 500 }}>
                    ⌘ + Entrée pour valider
                  </span>
                </label>
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <button
                type="submit"
                className={[styles.submitBtn, submitState === "sending" ? styles.submitBtnSending : ""].filter(Boolean).join(" ")}
                disabled={submitState !== "idle"}
              >
                {submitState === "sending" && (
                  <>
                    <span className={styles.spinner} aria-hidden="true" />
                    Envoi en cours…
                  </>
                )}
                {submitState === "idle" && "Valider ma commande"}
              </button>

              <button
                type="button"
                className={styles.pdfBtn}
                onClick={() => {
                  const doc = generateQuotePDF(items, form, { totalB2B, totalRevente, margeNette });
                  doc.save(`devis-olda-${Date.now()}.pdf`);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Télécharger le devis PDF
              </button>

            </form>
          </div>

          {/* ── Récap financier ── */}
          {hasPrices && (
            <div className={styles.recapFinancier}>
              <p className={styles.recapFinancierTitle}>Récap financier</p>
              <div className={styles.recapMetrics}>
                <div className={styles.recapMetric}>
                  <span className={styles.recapValue}>{fmt(totalB2B)}</span>
                  <span className={styles.recapLabel}>Investissement</span>
                  <span className={styles.recapSub}>coût total B2B</span>
                </div>
                <div className={styles.recapMetric}>
                  <span className={styles.recapValue}>{fmt(totalRevente)}</span>
                  <span className={styles.recapLabel}>CA Potentiel</span>
                  <span className={styles.recapSub}>chiffre d&apos;affaires à la revente</span>
                </div>
                <div className={styles.recapMetric}>
                  <span className={`${styles.recapValue} ${margeNette >= 0 ? styles.recapValuePositive : styles.recapValueNegative}`}>
                    {margeNette >= 0 ? "+" : ""}{fmt(margeNette)}
                  </span>
                  <span className={styles.recapLabel}>Bénéfice</span>
                  <span className={styles.recapSub}>bénéfice net projeté</span>
                </div>
              </div>
            </div>
          )}
          </>
        )}
      </Container>
    </main>
  );
}

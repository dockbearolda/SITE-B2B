"use client";

import { useState, useCallback, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import styles from "./page.module.css";

const STRAPI_URL = (process.env.NEXT_PUBLIC_STRAPI_URL ?? "").replace(/\/$/, "");

type Tab = "login" | "register" | "admin";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/mon-compte/commandes";

  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const switchTab = useCallback((t: Tab) => {
    setTab(t);
    setError("");
    setPassword("");
  }, []);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Email ou mot de passe incorrect.");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }, [email, password, callbackUrl, router]);

  // Accès administrateur : mot de passe unique, sans email.
  const handleAdminLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email: "",
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Mot de passe incorrect.");
    } else {
      const dest = callbackUrl.startsWith("/admin") ? callbackUrl : "/admin";
      router.push(dest);
      router.refresh();
    }
  }, [password, callbackUrl, router]);

  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!STRAPI_URL) {
      setError("Pour créer un compte, contactez-nous directement — nous vous enverrons vos identifiants.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${STRAPI_URL}/api/auth/local/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json() as { error?: { message?: string }; jwt?: string };

      if (!res.ok) {
        setError(data.error?.message ?? "Erreur lors de la création du compte.");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      setLoading(false);

      if (result?.error) {
        setRegistered(true);
        setTab("login");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
      setLoading(false);
    }
  }, [username, email, password, callbackUrl, router]);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Link href="/" className={styles.logo}>OLDA</Link>
        <h1 className={styles.title}>
          {tab === "admin" ? "Administration" : "Espace client"}
        </h1>
        <p className={styles.subtitle}>
          {tab === "admin"
            ? "Entrez le mot de passe administrateur"
            : "Accédez à votre historique de commandes"}
        </p>
      </div>

      {registered && (
        <div className={styles.successBanner}>
          Compte créé ! Connectez-vous avec vos identifiants.
        </div>
      )}

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === "login" ? styles.tabActive : ""}`}
          onClick={() => switchTab("login")}
        >
          Connexion
        </button>
        <button
          className={`${styles.tab} ${tab === "register" ? styles.tabActive : ""}`}
          onClick={() => switchTab("register")}
        >
          Créer un compte
        </button>
        <button
          className={`${styles.tab} ${tab === "admin" ? styles.tabActive : ""}`}
          onClick={() => switchTab("admin")}
        >
          Admin
        </button>
      </div>

      {tab === "login" && (
        <form className={styles.form} onSubmit={handleLogin} noValidate>
          <label className={styles.label}>
            Email
            <input
              className={styles.input}
              type="email"
              autoComplete="email"
              placeholder="vous@exemple.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className={styles.label}>
            Mot de passe
            <input
              className={styles.input}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : "Se connecter"}
          </button>
        </form>
      )}

      {tab === "admin" && (
        <form className={styles.form} onSubmit={handleAdminLogin} noValidate>
          <label className={styles.label}>
            Mot de passe administrateur
            <input
              className={styles.input}
              type="password"
              autoComplete="off"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : "Entrer dans l'administration"}
          </button>
        </form>
      )}

      {tab === "register" && (
        <form className={styles.form} onSubmit={handleRegister} noValidate>
          <label className={styles.label}>
            Nom d&apos;utilisateur
            <input
              className={styles.input}
              type="text"
              autoComplete="username"
              placeholder="Votre prénom ou pseudo"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>

          <label className={styles.label}>
            Email
            <input
              className={styles.input}
              type="email"
              autoComplete="email"
              placeholder="vous@exemple.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className={styles.label}>
            Mot de passe
            <input
              className={styles.input}
              type="password"
              autoComplete="new-password"
              placeholder="8 caractères minimum"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : "Créer mon compte"}
          </button>
        </form>
      )}

      <p className={styles.footer}>
        <Link href="/catalogue" className={styles.footerLink}>
          ← Retour au catalogue
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <Container>
        <Suspense fallback={<div className={styles.card} style={{ minHeight: 300 }} />}>
          <LoginForm />
        </Suspense>
      </Container>
    </main>
  );
}

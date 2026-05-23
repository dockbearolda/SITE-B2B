"use client";

import { useState } from "react";
import styles from "../page.module.css";

type Client = { id: string; email: string; name: string; groupe: string };

const GROUPES = ["standard", "distributeur", "grossiste", "vip"];

export function ClientsAdmin({
  initial,
  adminEmail,
}: {
  initial: Client[];
  adminEmail: string;
}) {
  const [clients, setClients] = useState<Client[]>(initial);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [groupe, setGroupe] = useState("standard");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPass, setResetPass] = useState("");

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, groupe }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur");
      } else {
        setClients((c) => [data.client, ...c]);
        setName("");
        setEmail("");
        setPassword("");
        setGroupe("standard");
      }
    } catch {
      setError("Erreur réseau");
    }
    setAdding(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce client ?")) return;
    const res = await fetch(`/api/admin/clients?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) setClients((c) => c.filter((x) => x.id !== id));
  };

  const changeGroupe = async (id: string, newGroupe: string) => {
    const res = await fetch("/api/admin/clients", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, groupe: newGroupe }),
    });
    if (res.ok) setClients((c) => c.map((x) => (x.id === id ? { ...x, groupe: newGroupe } : x)));
  };

  const resetPassword = async (id: string) => {
    if (!resetPass) return;
    const res = await fetch("/api/admin/clients", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, password: resetPass }),
    });
    if (res.ok) {
      setResetId(null);
      setResetPass("");
    }
  };

  return (
    <div className={styles.admin}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Clients</h1>
          <p className={styles.subtitle}>Connecté : {adminEmail}</p>
        </div>
        <a href="/admin" className={styles.backLink}>← Tableau de bord</a>
      </div>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Ajouter un client</h2>
        <form className={styles.addForm} onSubmit={add}>
          <div className={styles.formRow}>
            <label className={styles.fieldLabel}>
              Nom complet
              <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label className={styles.fieldLabel}>
              Email
              <input
                className={styles.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
          </div>
          <div className={styles.formRow}>
            <label className={styles.fieldLabel}>
              Mot de passe
              <input
                className={styles.input}
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </label>
            <label className={styles.fieldLabel}>
              Groupe tarifaire
              <select className={styles.input} value={groupe} onChange={(e) => setGroupe(e.target.value)}>
                {GROUPES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </label>
          </div>
          <button type="submit" className={styles.addBtn} disabled={adding}>
            {adding ? "Ajout…" : "+ Ajouter le client"}
          </button>
          {error && <span className={styles.saveErr}>{error}</span>}
        </form>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Clients ({clients.length})</h2>
        {clients.length === 0 ? (
          <p className={styles.empty}>Aucun client pour l&apos;instant.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Groupe</th>
                  <th>Mot de passe</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((u) => (
                  <tr key={u.id}>
                    <td className={styles.tdName}>{u.name}</td>
                    <td className={styles.tdEmail}>{u.email}</td>
                    <td>
                      <select
                        className={styles.inputSm}
                        value={u.groupe}
                        onChange={(e) => changeGroupe(u.id, e.target.value)}
                      >
                        {GROUPES.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </td>
                    <td className={styles.tdPass}>
                      {resetId === u.id ? (
                        <div className={styles.passRow}>
                          <input
                            className={styles.inputSm}
                            type="text"
                            placeholder="Nouveau mdp"
                            value={resetPass}
                            onChange={(e) => setResetPass(e.target.value)}
                          />
                          <button type="button" className={styles.btnSm} onClick={() => resetPassword(u.id)}>OK</button>
                          <button
                            type="button"
                            className={styles.btnSmCancel}
                            onClick={() => { setResetId(null); setResetPass(""); }}
                          >✕</button>
                        </div>
                      ) : (
                        <button type="button" className={styles.btnLink} onClick={() => setResetId(u.id)}>
                          Réinitialiser
                        </button>
                      )}
                    </td>
                    <td>
                      <button type="button" className={styles.deleteBtn} onClick={() => remove(u.id)}>
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

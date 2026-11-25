"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminKey, api, save } from "@/lib/client";

export function CreateBoard() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const { slug, adminToken } = await api<{ slug: string; adminToken: string }>("/api/boards", {
        method: "POST",
        body: JSON.stringify({ title: f.get("title"), dueDate: f.get("dueDate"), prize: f.get("prize") }),
      });
      save(adminKey(slug), adminToken);
      router.push(`/b/${slug}?nieuw=1`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <section className="card" aria-labelledby="create-title">
      <h2 id="create-title">Maak jullie gokbord</h2>
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="title">Naam van het bord</label>
          <input id="title" name="title" required maxLength={80} placeholder="bijv. Baby van Sara en Tom" />
        </div>
        <div className="field">
          <label htmlFor="dueDate">Uitgerekende datum (optioneel)</label>
          <input id="dueDate" name="dueDate" type="date" />
        </div>
        <div className="field">
          <label htmlFor="prize">Wat valt er te winnen? (optioneel)</label>
          <input id="prize" name="prize" maxLength={200} placeholder="bijv. Een fles bubbels en de eer" />
          <p className="hint">Een prijs die jullie zelf geven. Geld inzamelen gebeurt niet via deze site.</p>
        </div>
        <div className="row">
          <button type="submit" disabled={busy}>{busy ? "Bezig…" : "Bord aanmaken"}</button>
          {error && <p className="msg err" role="alert">{error}</p>}
        </div>
      </form>
    </section>
  );
}

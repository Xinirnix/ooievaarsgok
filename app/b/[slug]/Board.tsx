"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type Gender, sameName, winnerIds } from "@/lib/game";
import type { PublicBoard } from "@/lib/api";
import { adminKey, api, guessKey, load, save } from "@/lib/client";

type Mine = { id: string; token: string };
const label = (g: Gender) => (g === "boy" ? "jongen" : "meisje");

export function Board({ initial }: { initial: PublicBoard }) {
  const slug = initial.slug;
  const [board, setBoard] = useState(initial);
  const [admin, setAdmin] = useState<string | null>(null);
  const [mine, setMine] = useState<Mine | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [origin, setOrigin] = useState("");

  // Pick up tokens: from localStorage, or from a "#beheer=..." admin link.
  useEffect(() => {
    const m = location.hash.match(/beheer=([\w-]+)/);
    if (m) {
      save(adminKey(slug), m[1]);
      history.replaceState(null, "", location.pathname);
    }
    setAdmin(load<string>(adminKey(slug)));
    setMine(load<Mine>(guessKey(slug)));
    setIsNew(new URLSearchParams(location.search).has("nieuw"));
    setOrigin(location.origin);
  }, [slug]);

  const refresh = useCallback(async () => {
    try {
      const data = await api<PublicBoard & { isAdmin: boolean }>(`/api/boards/${slug}`, {
        headers: admin ? { "x-admin-token": admin } : {},
      });
      setBoard(data);
      if (admin && !data.isAdmin) { save(adminKey(slug), null); setAdmin(null); }
    } catch { /* keep showing what we have */ }
  }, [slug, admin]);

  useEffect(() => {
    refresh();
    const t = setInterval(() => { if (document.visibilityState === "visible") refresh(); }, 15000);
    return () => clearInterval(t);
  }, [refresh]);

  const reveal = board.reveal;
  const guesses = board.guesses;
  const myGuess = mine ? guesses.find((g) => g.id === mine.id) : undefined;
  const winners = useMemo(() => winnerIds(guesses, reveal), [guesses, reveal]);
  const shareUrl = origin ? `${origin}/b/${slug}` : "";

  return (
    <>
      <header className="intro">
        <span className="eyebrow">Wat brengt de ooievaar?</span>
        <h1>{board.title}</h1>
        <div className="meta">
          {board.dueDate && <span>Uitgerekend op {new Date(board.dueDate + "T12:00:00").toLocaleDateString("nl-BE", { day: "numeric", month: "long", year: "numeric" })}</span>}
          <span>{guesses.length === 1 ? "1 gok" : `${guesses.length} gokken`}</span>
        </div>
      </header>

      {isNew && admin && <Welcome shareUrl={shareUrl} adminUrl={`${shareUrl}#beheer=${admin}`} />}

      {reveal && <RevealBanner board={board} />}

      <Tally guesses={guesses} />

      {board.prize && <p className="prize">Te winnen: {board.prize}</p>}

      {!reveal && (
        <GuessForm slug={slug} mine={mine} current={myGuess}
          onSaved={(m) => { save(guessKey(slug), m); setMine(m); refresh(); }}
          onRemoved={() => { save(guessKey(slug), null); setMine(null); refresh(); }} />
      )}

      <section aria-labelledby="list-title" style={{ display: "grid", gap: 12 }}>
        <div className="list-head">
          <h2 id="list-title">Alle gokken</h2>
          {!reveal && shareUrl && <ShareButton url={shareUrl} title={board.title} />}
        </div>
        {guesses.length === 0 ? (
          <p className="empty">Nog geen gokken. Wees de eerste!</p>
        ) : (
          <ul className="guesses">
            {guesses.map((g) => {
              const gOk = !!reveal && g.gender === reveal.gender;
              const nOk = !!reveal && sameName(g.babyName, reveal.name);
              return (
                <li key={g.id} className={g.id === mine?.id ? "me" : ""}>
                  <span className={`pill ${g.gender}`}>{label(g.gender)}</span>
                  <div className="who">
                    <div className="baby">{g.babyName}</div>
                    <div className="by">{g.guesserName}{g.id === mine?.id ? " (jij)" : ""}</div>
                  </div>
                  <div className="end">
                    {reveal && (winners.has(g.id) ? <span className="badge win">Winnaar</span>
                      : nOk ? <span className="badge">Naam goed</span>
                      : gOk ? <span className="badge">{label(reveal.gender)} ✓</span> : null)}
                    {admin && (
                      <button className="link" aria-label={`Gok van ${g.guesserName} verwijderen`}
                        onClick={async () => {
                          if (!confirm(`Gok van ${g.guesserName} verwijderen?`)) return;
                          await api(`/api/boards/${slug}/guesses/${g.id}`, { method: "DELETE", headers: { "x-admin-token": admin } }).catch(() => {});
                          refresh();
                        }}>wis</button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {admin && <HostPanel slug={slug} admin={admin} board={board} shareUrl={shareUrl} onChange={refresh} />}

      <footer className="foot">
        <a href="/">Maak zelf een gokbord</a> · Er wordt niet om geld gespeeld op deze site.
      </footer>
    </>
  );
}

function Welcome({ shareUrl, adminUrl }: { shareUrl: string; adminUrl: string }) {
  return (
    <section className="card" aria-labelledby="welcome-title">
      <h2 id="welcome-title">Jullie bord staat klaar</h2>
      <p className="hint">Deel deze link met familie en vrienden:</p>
      <CopyField value={shareUrl} />
      <p className="hint">
        <strong>Bewaar deze beheerlink voor jezelf.</strong> Daarmee onthul je later de baby, ook vanaf een andere telefoon.
        Deel hem niet.
      </p>
      <CopyField value={adminUrl} />
    </section>
  );
}

function CopyField({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="copy">
      <input readOnly value={value} onFocus={(e) => e.currentTarget.select()} aria-label="Link" />
      <button type="button" className="ghost" onClick={async () => {
        try { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 2000); } catch {}
      }}>{done ? "Gekopieerd" : "Kopieer"}</button>
    </div>
  );
}

function ShareButton({ url, title }: { url: string; title: string }) {
  const text = `${title}: wordt het een jongen of een meisje, en hoe gaat de baby heten? Doe je gok!`;
  return (
    <div className="row">
      <a className="button ghost" href={`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`} target="_blank" rel="noopener noreferrer">Deel via WhatsApp</a>
    </div>
  );
}

function Tally({ guesses }: { guesses: PublicBoard["guesses"] }) {
  const boys = guesses.filter((g) => g.gender === "boy").length;
  const total = guesses.length;
  const bp = total ? Math.round((boys / total) * 100) : 50;
  return (
    <section className="tally" aria-label="Stand jongen tegen meisje">
      <div className="bar"><span className="b" style={{ width: bp + "%" }} /><span className="g" style={{ width: 100 - bp + "%" }} /></div>
      <div className="tally-legend">
        <span className="lb">Jongen {boys}{total ? ` · ${bp}%` : ""}</span>
        <span className="lg">Meisje {total - boys}{total ? ` · ${100 - bp}%` : ""}</span>
      </div>
    </section>
  );
}

function RevealBanner({ board }: { board: PublicBoard }) {
  const r = board.reveal!;
  const gs = board.guesses;
  const gotG = gs.filter((g) => g.gender === r.gender).length;
  const gotN = gs.filter((g) => sameName(g.babyName, r.name)).length;
  return (
    <section className={`reveal ${r.gender}`} aria-live="polite">
      <span className="eyebrow">Het is een {label(r.gender)}!</span>
      <div className="big">{r.name}</div>
      <p>{gotG} van de {gs.length} gokten {label(r.gender)}, en {gotN} {gotN === 1 ? "had" : "hadden"} de naam goed.</p>
    </section>
  );
}

function GuessForm({ slug, mine, current, onSaved, onRemoved }: {
  slug: string; mine: Mine | null; current?: PublicBoard["guesses"][number];
  onSaved: (m: Mine) => void; onRemoved: () => void;
}) {
  const [gender, setGender] = useState<Gender | "">("");
  const [babyName, setBabyName] = useState("");
  const [guesserName, setGuesserName] = useState("");
  const [msg, setMsg] = useState<{ text: string; kind: "ok" | "err" | "" }>({ text: "", kind: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (current) { setGender(current.gender); setBabyName(current.babyName); setGuesserName(current.guesserName); }
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const editing = !!(mine && current);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!gender) return setMsg({ text: "Kies eerst jongen of meisje.", kind: "err" });
    setBusy(true);
    try {
      const payload = JSON.stringify({ gender, babyName, guesserName });
      if (editing) {
        await api(`/api/boards/${slug}/guesses/${mine!.id}`, { method: "PUT", body: payload, headers: { "x-edit-token": mine!.token } });
        onSaved(mine!);
        setMsg({ text: "Je gok is aangepast.", kind: "ok" });
      } else {
        const r = await api<{ id: string; editToken: string }>(`/api/boards/${slug}/guesses`, { method: "POST", body: payload });
        onSaved({ id: r.id, token: r.editToken });
        setMsg({ text: "Je gok staat erbij!", kind: "ok" });
      }
    } catch (err) {
      setMsg({ text: (err as Error).message, kind: "err" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card" aria-labelledby="form-title">
      <h2 id="form-title">{editing ? "Jouw gok (je kunt hem aanpassen)" : "Doe je gok"}</h2>
      <form onSubmit={submit} noValidate>
        <div className="choice" role="radiogroup" aria-label="Jongen of meisje">
          <input type="radio" name="gender" id="g-boy" value="boy" checked={gender === "boy"} onChange={() => setGender("boy")} />
          <label htmlFor="g-boy">Jongen<small>team blauw</small></label>
          <input type="radio" name="gender" id="g-girl" value="girl" checked={gender === "girl"} onChange={() => setGender("girl")} />
          <label htmlFor="g-girl">Meisje<small>team roze</small></label>
        </div>
        <div className="field">
          <label htmlFor="baby-name">Naam van de baby</label>
          <input id="baby-name" maxLength={40} autoComplete="off" placeholder="bijv. Noor" value={babyName} onChange={(e) => setBabyName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="guesser-name">Jouw naam</label>
          <input id="guesser-name" maxLength={40} autoComplete="name" placeholder="Zodat iedereen weet wie er gokte" value={guesserName} onChange={(e) => setGuesserName(e.target.value)} />
        </div>
        <div className="row">
          <button type="submit" disabled={busy}>{busy ? "Opslaan…" : editing ? "Gok aanpassen" : "Gok opslaan"}</button>
          {editing && (
            <button type="button" className="link" onClick={async () => {
              await api(`/api/boards/${slug}/guesses/${mine!.id}`, { method: "DELETE", headers: { "x-edit-token": mine!.token } }).catch(() => {});
              setGender(""); setBabyName(""); setMsg({ text: "Je gok is verwijderd.", kind: "ok" });
              onRemoved();
            }}>Gok verwijderen</button>
          )}
          {msg.text && <p className={`msg ${msg.kind}`} role="status">{msg.text}</p>}
        </div>
        <p className="hint">Eén gok per persoon. Je kunt hem op dit toestel aanpassen tot de baby er is.</p>
      </form>
    </section>
  );
}

function HostPanel({ slug, admin, board, shareUrl, onChange }: {
  slug: string; admin: string; board: PublicBoard; shareUrl: string; onChange: () => void;
}) {
  const [gender, setGender] = useState<Gender | "">(board.reveal?.gender ?? "");
  const [name, setName] = useState(board.reveal?.name ?? "");
  const [msg, setMsg] = useState({ text: "", kind: "" });

  async function send(payload: object, okText: string) {
    try {
      await api(`/api/boards/${slug}/reveal`, { method: "POST", body: JSON.stringify(payload), headers: { "x-admin-token": admin } });
      setMsg({ text: okText, kind: "ok" });
      onChange();
    } catch (err) {
      setMsg({ text: (err as Error).message, kind: "err" });
    }
  }

  return (
    <details className="host">
      <summary>Voor de ouders: onthul de baby</summary>
      <div className="card">
        <p className="hint">Na de onthulling sluit het gokken en zien alle gasten wie er gewonnen heeft.</p>
        <div className="field">
          <label htmlFor="r-gender">Het is een</label>
          <select id="r-gender" value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
            <option value="">Kies…</option><option value="boy">Jongen</option><option value="girl">Meisje</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="r-name">Naam</label>
          <input id="r-name" maxLength={40} autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="row">
          <button type="button" onClick={() => send({ gender, name }, "Onthuld!")}>Onthul aan iedereen</button>
          {board.reveal && <button type="button" className="ghost" onClick={() => send({ undo: true }, "Onthulling verborgen. Gokken is weer open.")}>Onthulling verbergen</button>}
          {msg.text && <p className={`msg ${msg.kind}`} role="status">{msg.text}</p>}
        </div>
        <p className="hint">Jouw beheerlink, om op een ander toestel te onthullen:</p>
        <CopyField value={`${shareUrl}#beheer=${admin}`} />
      </div>
    </details>
  );
}

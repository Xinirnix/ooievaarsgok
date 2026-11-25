// Storage: Supabase in production, a local JSON file in development.
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Gender, Reveal } from "./game";

export interface BoardRow {
  slug: string;
  title: string;
  dueDate: string | null;
  prize: string;
  adminHash: string;
  reveal: Reveal | null;
  createdAt: string;
}

export interface GuessRow {
  id: string;
  boardSlug: string;
  guesserName: string;
  gender: Gender;
  babyName: string;
  editHash: string;
  createdAt: string;
}

export interface Store {
  createBoard(b: BoardRow): Promise<void>;
  getBoard(slug: string): Promise<BoardRow | null>;
  setReveal(slug: string, reveal: Reveal | null): Promise<void>;
  listGuesses(slug: string): Promise<GuessRow[]>;
  addGuess(g: GuessRow): Promise<void>;
  updateGuess(id: string, fields: Pick<GuessRow, "guesserName" | "gender" | "babyName">): Promise<void>;
  deleteGuess(id: string): Promise<void>;
}

/* ---------- Supabase ---------- */

type DbBoard = {
  slug: string; title: string; due_date: string | null; prize: string; admin_hash: string;
  reveal_gender: Gender | null; reveal_name: string | null; created_at: string;
};
type DbGuess = {
  id: string; board_slug: string; guesser_name: string; gender: Gender; baby_name: string;
  edit_hash: string; created_at: string;
};

function check(error: { message: string } | null) {
  if (error) throw new Error("Database: " + error.message);
}

class SupabaseStore implements Store {
  constructor(private db: SupabaseClient) {}

  async createBoard(b: BoardRow) {
    const { error } = await this.db.from("boards").insert({
      slug: b.slug, title: b.title, due_date: b.dueDate, prize: b.prize, admin_hash: b.adminHash,
      reveal_gender: null, reveal_name: null, created_at: b.createdAt,
    });
    check(error);
  }

  async getBoard(slug: string) {
    const { data, error } = await this.db.from("boards").select("*").eq("slug", slug).maybeSingle<DbBoard>();
    check(error);
    if (!data) return null;
    return {
      slug: data.slug, title: data.title, dueDate: data.due_date, prize: data.prize ?? "",
      adminHash: data.admin_hash, createdAt: data.created_at,
      reveal: data.reveal_gender ? { gender: data.reveal_gender, name: data.reveal_name ?? "" } : null,
    };
  }

  async setReveal(slug: string, reveal: Reveal | null) {
    const { error } = await this.db.from("boards")
      .update({ reveal_gender: reveal?.gender ?? null, reveal_name: reveal?.name ?? null })
      .eq("slug", slug);
    check(error);
  }

  async listGuesses(slug: string) {
    const { data, error } = await this.db.from("guesses").select("*")
      .eq("board_slug", slug).order("created_at", { ascending: true }).returns<DbGuess[]>();
    check(error);
    return (data ?? []).map((g) => ({
      id: g.id, boardSlug: g.board_slug, guesserName: g.guesser_name, gender: g.gender,
      babyName: g.baby_name, editHash: g.edit_hash, createdAt: g.created_at,
    }));
  }

  async addGuess(g: GuessRow) {
    const { error } = await this.db.from("guesses").insert({
      id: g.id, board_slug: g.boardSlug, guesser_name: g.guesserName, gender: g.gender,
      baby_name: g.babyName, edit_hash: g.editHash, created_at: g.createdAt,
    });
    check(error);
  }

  async updateGuess(id: string, f: Pick<GuessRow, "guesserName" | "gender" | "babyName">) {
    const { error } = await this.db.from("guesses")
      .update({ guesser_name: f.guesserName, gender: f.gender, baby_name: f.babyName }).eq("id", id);
    check(error);
  }

  async deleteGuess(id: string) {
    const { error } = await this.db.from("guesses").delete().eq("id", id);
    check(error);
  }
}

/* ---------- Local file (development only) ---------- */

type FileData = { boards: BoardRow[]; guesses: GuessRow[] };

class FileStore implements Store {
  private file = path.join(process.cwd(), ".data", "db.json");
  private queue: Promise<unknown> = Promise.resolve();

  private async read(): Promise<FileData> {
    try {
      return JSON.parse(await fs.readFile(this.file, "utf8")) as FileData;
    } catch {
      return { boards: [], guesses: [] };
    }
  }

  // Serialises writes so concurrent requests don't overwrite each other.
  private change(fn: (d: FileData) => void): Promise<void> {
    const run = this.queue.then(async () => {
      const d = await this.read();
      fn(d);
      await fs.mkdir(path.dirname(this.file), { recursive: true });
      await fs.writeFile(this.file, JSON.stringify(d, null, 2));
    });
    this.queue = run.catch(() => {});
    return run;
  }

  async createBoard(b: BoardRow) { await this.change((d) => { d.boards.push(b); }); }
  async getBoard(slug: string) { return (await this.read()).boards.find((b) => b.slug === slug) ?? null; }
  async setReveal(slug: string, reveal: Reveal | null) {
    await this.change((d) => { const b = d.boards.find((x) => x.slug === slug); if (b) b.reveal = reveal; });
  }
  async listGuesses(slug: string) {
    return (await this.read()).guesses.filter((g) => g.boardSlug === slug)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  async addGuess(g: GuessRow) { await this.change((d) => { d.guesses.push(g); }); }
  async updateGuess(id: string, f: Pick<GuessRow, "guesserName" | "gender" | "babyName">) {
    await this.change((d) => { const g = d.guesses.find((x) => x.id === id); if (g) Object.assign(g, f); });
  }
  async deleteGuess(id: string) {
    await this.change((d) => { d.guesses = d.guesses.filter((g) => g.id !== id); });
  }
}

let store: Store | null = null;

export function getStore(): Store {
  if (store) return store;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    store = new SupabaseStore(createClient(url, key, { auth: { persistSession: false } }));
  } else {
    if (process.env.NODE_ENV === "production" && !process.env.ALLOW_FILE_STORE) {
      throw new Error("SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY ontbreken.");
    }
    store = new FileStore();
  }
  return store;
}

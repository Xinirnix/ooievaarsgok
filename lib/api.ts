import "server-only";
import { NextResponse } from "next/server";
import type { Guess, Reveal } from "./game";
import type { BoardRow, GuessRow } from "./store";

export const MAX_GUESSES = 300;

export interface PublicBoard {
  slug: string;
  title: string;
  dueDate: string | null;
  prize: string;
  reveal: Reveal | null;
  guesses: Guess[];
}

export function publicBoard(b: BoardRow, guesses: GuessRow[]): PublicBoard {
  return {
    slug: b.slug, title: b.title, dueDate: b.dueDate, prize: b.prize, reveal: b.reveal,
    guesses: guesses.map(({ id, guesserName, gender, babyName, createdAt }) => ({ id, guesserName, gender, babyName, createdAt })),
  };
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function body(req: Request): Promise<Record<string, unknown>> {
  try {
    const v = await req.json();
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { clean, isGender, LIMITS } from "@/lib/game";
import { getStore } from "@/lib/store";
import { hash, secret } from "@/lib/tokens";
import { body, fail, MAX_GUESSES } from "@/lib/api";

type Ctx = { params: Promise<{ slug: string }> };

// Add a guess. Returns an edit token the browser keeps, so the guest can change it later.
export async function POST(req: Request, { params }: Ctx) {
  const { slug } = await params;
  const store = getStore();
  const board = await store.getBoard(slug);
  if (!board) return fail("Dit bord bestaat niet.", 404);
  if (board.reveal) return fail("De baby is er al: gokken is gesloten.", 409);

  const b = await body(req);
  const guesserName = clean(b.guesserName, LIMITS.name);
  const babyName = clean(b.babyName, LIMITS.name);
  if (!isGender(b.gender)) return fail("Kies jongen of meisje.");
  if (!babyName) return fail("Vul een naam voor de baby in.");
  if (!guesserName) return fail("Vul je eigen naam in.");

  const existing = await store.listGuesses(slug);
  if (existing.length >= MAX_GUESSES) return fail("Dit bord zit vol.", 409);

  const editToken = secret();
  const guess = {
    id: randomUUID(), boardSlug: slug, guesserName, babyName, gender: b.gender,
    editHash: hash(editToken), createdAt: new Date().toISOString(),
  };
  await store.addGuess(guess);
  return NextResponse.json({ id: guess.id, editToken }, { status: 201 });
}

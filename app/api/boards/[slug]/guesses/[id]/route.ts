import { NextResponse } from "next/server";
import { clean, isGender, LIMITS } from "@/lib/game";
import { getStore } from "@/lib/store";
import { matches } from "@/lib/tokens";
import { body, fail } from "@/lib/api";

type Ctx = { params: Promise<{ slug: string; id: string }> };

async function load(slug: string, id: string) {
  const store = getStore();
  const board = await store.getBoard(slug);
  const guess = board ? (await store.listGuesses(slug)).find((g) => g.id === id) : undefined;
  return { store, board, guess };
}

// Change your own guess (edit token) until the reveal.
export async function PUT(req: Request, { params }: Ctx) {
  const { slug, id } = await params;
  const { store, board, guess } = await load(slug, id);
  if (!board || !guess) return fail("Deze gok bestaat niet.", 404);
  if (!matches(req.headers.get("x-edit-token"), guess.editHash)) return fail("Je kunt alleen je eigen gok aanpassen.", 403);
  if (board.reveal) return fail("De baby is er al: gokken is gesloten.", 409);

  const b = await body(req);
  const guesserName = clean(b.guesserName, LIMITS.name);
  const babyName = clean(b.babyName, LIMITS.name);
  if (!isGender(b.gender) || !babyName || !guesserName) return fail("Vul alles in.");
  await store.updateGuess(id, { guesserName, babyName, gender: b.gender });
  return NextResponse.json({ ok: true });
}

// Remove a guess: the guest themself, or the parents (admin token).
export async function DELETE(req: Request, { params }: Ctx) {
  const { slug, id } = await params;
  const { store, board, guess } = await load(slug, id);
  if (!board || !guess) return fail("Deze gok bestaat niet.", 404);
  const own = matches(req.headers.get("x-edit-token"), guess.editHash);
  const admin = matches(req.headers.get("x-admin-token"), board.adminHash);
  if (!own && !admin) return fail("Dat mag niet.", 403);
  await store.deleteGuess(id);
  return NextResponse.json({ ok: true });
}

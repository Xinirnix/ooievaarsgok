import { NextResponse } from "next/server";
import { clean, LIMITS } from "@/lib/game";
import { getStore } from "@/lib/store";
import { hash, secret, slug } from "@/lib/tokens";
import { body, fail } from "@/lib/api";

// Create a board. Returns the admin token once; only its hash is stored.
export async function POST(req: Request) {
  const b = await body(req);
  const title = clean(b.title, LIMITS.title);
  const prize = clean(b.prize, LIMITS.prize);
  const dueRaw = clean(b.dueDate, 10);
  const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(dueRaw) ? dueRaw : null;
  if (!title) return fail("Geef het bord een naam, bijvoorbeeld 'Baby van Sara en Tom'.");

  const adminToken = secret();
  const board = {
    slug: slug(), title, prize, dueDate, adminHash: hash(adminToken), reveal: null,
    createdAt: new Date().toISOString(),
  };
  await getStore().createBoard(board);
  return NextResponse.json({ slug: board.slug, adminToken }, { status: 201 });
}

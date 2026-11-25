import { NextResponse } from "next/server";
import { clean, isGender, LIMITS } from "@/lib/game";
import { getStore } from "@/lib/store";
import { matches } from "@/lib/tokens";
import { body, fail } from "@/lib/api";

type Ctx = { params: Promise<{ slug: string }> };

// Parents reveal the baby (closes guessing) or undo it.
export async function POST(req: Request, { params }: Ctx) {
  const { slug } = await params;
  const store = getStore();
  const board = await store.getBoard(slug);
  if (!board) return fail("Dit bord bestaat niet.", 404);
  if (!matches(req.headers.get("x-admin-token"), board.adminHash)) return fail("Alleen de ouders kunnen onthullen.", 403);

  const b = await body(req);
  if (b.undo === true) {
    await store.setReveal(slug, null);
    return NextResponse.json({ ok: true });
  }
  if (!isGender(b.gender)) return fail("Kies jongen of meisje.");
  const name = clean(b.name, LIMITS.name);
  if (!name) return fail("Vul de naam van de baby in.");
  await store.setReveal(slug, { gender: b.gender, name });
  return NextResponse.json({ ok: true });
}

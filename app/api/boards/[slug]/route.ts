import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { fail, publicBoard } from "@/lib/api";
import { matches } from "@/lib/tokens";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const { slug } = await params;
  const store = getStore();
  const board = await store.getBoard(slug);
  if (!board) return fail("Dit bord bestaat niet.", 404);
  const admin = matches(req.headers.get("x-admin-token"), board.adminHash);
  return NextResponse.json(
    { ...publicBoard(board, await store.listGuesses(slug)), isAdmin: admin },
    { headers: { "cache-control": "no-store" } },
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { publicBoard } from "@/lib/api";
import { Stork } from "../../Stork";
import { Board } from "./Board";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const board = await getStore().getBoard(slug);
  if (!board) return { title: "Ooievaarsgok" };
  return {
    title: `${board.title} · Ooievaarsgok`,
    description: "Jongen of meisje, en hoe gaat de baby heten? Doe je gok!",
    robots: { index: false },
  };
}

export default async function BoardPage({ params }: Props) {
  const { slug } = await params;
  const store = getStore();
  const board = await store.getBoard(slug);
  if (!board) notFound();
  return (
    <main className="wrap">
      <Link href="/" className="brand"><Stork /> Ooievaarsgok</Link>
      <Board initial={publicBoard(board, await store.listGuesses(slug))} />
    </main>
  );
}

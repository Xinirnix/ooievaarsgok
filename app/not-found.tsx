import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrap">
      <h1>Dit bord bestaat niet</h1>
      <p className="lede">Controleer de link, of <Link href="/">maak zelf een gokbord</Link>.</p>
    </main>
  );
}

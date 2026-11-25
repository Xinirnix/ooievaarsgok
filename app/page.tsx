import Link from "next/link";
import { Stork } from "./Stork";
import { CreateBoard } from "./CreateBoard";

export default function Home() {
  return (
    <main className="wrap">
      <Link href="/" className="brand"><Stork /> Ooievaarsgok</Link>
      <header className="intro">
        <span className="eyebrow">Voor aanstaande ouders</span>
        <h1>Wat brengt de ooievaar?</h1>
        <p className="lede">
          Maak in een minuut een gokbord aan en deel de link met familie en vrienden. Iedereen gokt of het een
          jongen of een meisje wordt, en hoe de baby gaat heten. Na de geboorte onthul je het en zie je wie het goed had.
        </p>
      </header>

      <ol className="steps">
        <li><span><strong>Maak een bord</strong> voor jullie baby. Een account is niet nodig.</span></li>
        <li><span><strong>Deel de link</strong> via WhatsApp, mail of een kaartje.</span></li>
        <li><span><strong>Onthul</strong> na de geboorte het geslacht en de naam. De winnaars verschijnen meteen.</span></li>
      </ol>

      <CreateBoard />

      <footer className="foot">
        Ooievaarsgok is gratis. Er wordt niet om geld gespeeld op deze site.
      </footer>
    </main>
  );
}

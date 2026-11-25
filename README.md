# Ooievaarsgok

**Wat brengt de ooievaar?** Ooievaarsgok is een gratis website waarop aanstaande ouders een gokbord maken voor hun baby. Ze delen de link met familie en vrienden, en iedereen gokt of het een jongen of een meisje wordt en hoe de baby gaat heten. Na de geboorte onthullen de ouders het geslacht en de naam, en de site toont meteen wie er gewonnen heeft.

## Hoe het werkt

1. **Bord maken.** De ouders geven het bord een naam, met een uitgerekende datum en een prijs als ze willen (bijvoorbeeld "een fles bubbels"). Een account is niet nodig.
2. **Link delen.** Ze krijgen een deellink voor de gasten en een geheime beheerlink voor zichzelf.
3. **Gokken.** Gasten kiezen jongen of meisje, vullen een naam in en zetten hun eigen naam erbij. Op hetzelfde toestel kunnen ze hun gok aanpassen of verwijderen tot de onthulling.
4. **Onthullen.** Met de beheerlink vullen de ouders het geslacht en de naam in. Daarna sluit het gokken.

**Wie wint?** Iedereen die zowel het geslacht als de naam goed heeft. Heeft niemand de naam goed, dan wint iedereen met het juiste geslacht. Namen worden vergeleken zonder op hoofdletters of accenten te letten, dus "Zoë" telt voor "zoe".

**Geen geld.** Op de site wordt niet om geld gespeeld en er gaan geen betalingen doorheen. Een geldpot met inzet en prijs is een weddenschap, en daarvoor is in België een vergunning van de Kansspelcommissie nodig (in Nederland van de Kansspelautoriteit).

## Techniek

- [Next.js](https://nextjs.org) (App Router) met TypeScript
- [Supabase](https://supabase.com) (Postgres) als database. De app praat alleen vanaf de server met de database.
- Geen accounts. De beheerlink en het bewerkrecht op een gok zijn willekeurige tokens. De database bewaart er alleen een hash van, en de browser bewaart ze in `localStorage`.

```
app/                 pagina's en API-routes
  page.tsx           startpagina met formulier "bord aanmaken"
  b/[slug]/          het gokbord
  api/boards/...     bord maken, gokken, onthullen
lib/game.ts          spelregels (winnaars bepalen), met tests
lib/store.ts         opslag: Supabase, of een lokaal bestand tijdens ontwikkeling
supabase/schema.sql  tabellen voor Supabase
```

## Lokaal draaien

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # spelregels testen
```

Zonder Supabase-gegevens bewaart de app alles in `.data/db.json`. Dat is alleen bedoeld om te ontwikkelen.

## Online zetten (Vercel + Supabase, allebei gratis)

1. Maak een project aan op [supabase.com](https://supabase.com). Open de **SQL Editor** en voer `supabase/schema.sql` uit.
2. Zoek onder **Project Settings → API** de *Project URL* en de *service_role key* op.
3. Importeer deze repository op [vercel.com](https://vercel.com/new) en stel twee omgevingsvariabelen in:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy. Koppel daarna eventueel je eigen domein, zoals `ooievaarsgok.be`.

De service_role key is geheim. Zet hem alleen in Vercel, nooit in de code.

## Ideeën voor later

- Extra gokken: geboortedatum, gewicht en lengte
- Een deelbare uitslagkaart na de onthulling
- Premiumborden (eigen thema, foto), affiliate-links naar geboortekaartjes en kraamcadeaus
- Beperking op het aantal verzoeken tegen spam

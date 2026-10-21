# SanTySlots

Česká arkádová aplikace se třemi vlastními automaty, nulovým startovním zůstatkem, minihrou Crystal Catch, nákupem bonusu, free spiny, turbo režimem, automatickou hrou a společným žebříčkem.

## Technologie
HTML/CSS a klientský React/TypeScript (kompilovaný do JavaScriptu), serverové HTTP API ve Workeru a databáze D1. Server určuje výhry a mění zůstatek; souběžné zápisy chrání verze účtu. Nejde o prostý soubor otevíraný dvojklikem: společný toplist potřebuje server.

## Spuštění
Node.js 22.13+ a pnpm. `pnpm install`, `pnpm build`, první lokální migrace:
`node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_young_legion.sql`
Poté `pnpm start`. Lokální data a produkční data jsou oddělená.

## Soubory
- app/page.tsx: lobby, automaty, minihra, dialogy
- app/globals.css: responzivní vzhled a vlastní vektorové motivy
- app/api/game/route.ts: účty, kredity, herní tahy, žebříček
- lib/games.ts: matematika automatů a tabulka her
- db/schema.ts a drizzle/: databáze a migrace

## Ověření
`node --experimental-strip-types engine.test.mjs` ověřuje 12 000 náhodných výsledků.
`node api.test.mjs` vyžaduje lokální server na portu 5173. Vytvoří pouze lokální testovací účet a výsledky. Ověřuje nulový start, minihru, dvojí požadavky, bonus, ukládání a společný žebříček.
`node node_modules/typescript/bin/tsc --noEmit` kontroluje typy.

## Účty a omezení
Anonymní účet používá HttpOnly cookie s roční platností. Smazáním cookie ztrácí hráč přístup k anonymnímu účtu. Hostingem ověřená identita se používá místo cookie, pokud ji hosting poskytuje. Přezdívky nejsou unikátní a není implementováno slučování anonymního a přihlášeného účtu.

Veškeré kredity jsou bez peněžní hodnoty. Žádné platby ani výběry. Vlastní pravidla a vlastní matematika bez tvrzení o certifikovaném RTP. SanTySlots není propojen s Pragmatic Play. Výchozí publikace Sites je soukromá; dostupnost dalším návštěvníkům se řídí sdílením webu.

Inspirace obecnými principy tumble, scatter a free spins: https://www.pragmaticplay.com/en/games/sugar-rush-1000/ . Grafika, témata, kód a konkrétní pravidla této aplikace jsou vlastní.

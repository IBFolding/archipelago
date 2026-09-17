# ARCHipelago — $ISLAND

A vacation-booking site for a 3D island world where players buy plots of land,
land on them with nothing, and build them out.

The archipelago is laid out as the letter **A** — for ARC / ARChipelago — matching
the logo: one apex island, two diagonal stroke islands, two leg islands, plus a
volcano that sits off the letterform on the horizon.

## Status

**Phase 1 (this repo, done): the site.** Next.js + React Three Fiber, with a
procedural 3D archipelago hero and the full booking-styled marketing page.

**Not built yet:** the playable island world (plot claiming, building,
excursions as real missions), any backend, and the smart contracts. Nothing here
touches a wallet, and no land or token is live. The booking flow is deliberately
a gag — it reserves nothing.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3210.

Other scripts: `npm run build`, `npm run typecheck`.

## Layout

```
src/
  app/            Next.js app router + global stylesheet
  components/     Nav, Hero, IslandMap, Sections, BookingModal (+ CSS modules)
  world/          The 3D scene
    ocean.ts        Custom water shader: swell, depth gradient, shoreline foam,
                    sun glitter, night grade, horizon haze
    geometry.ts     Procedural islands, palms, huts, docks, boats
    HeroWorld.tsx   Scene assembly, lighting, day cycle, camera rig
  lib/content.ts  All copy + the island/excursion/treasury data model
public/assets/    Logo and hero reference art
```

`src/lib/content.ts` is the single source of truth. The 3D hero and the 2D map
both read island positions from it, so the world and the map cannot drift apart.
The game will read the same definitions.

## Notable behaviour

- **Resort time.** "Live" runs an eight-minute day off the wall clock, weighted
  so it is sunny most of the time with a short golden hour and night. Day /
  sunset / night can be forced from the control under the nav.
- **Aspect-aware camera.** The camera backs off on portrait viewports so the
  whole letterform stays in frame on a phone.
- **Graceful degradation.** No WebGL falls back to the hero still image;
  `prefers-reduced-motion` pauses the animation loop.

## Land sale split

35% buyback & burn · 30% team · 20% development & infra · 10% treasury ·
5% giveaways. Defined once in `TREASURY` in `src/lib/content.ts` and rendered
from there.

## Next phases

1. **The island world** — Three.js/R3F world at its own route: land on a plot,
   clear it, build, decorate, day/night, excursions as missions, hazards
   (sharks, lava, piranhas), hidden grottos and treasure.
2. **Backend** — authoritative plot ownership and build state.
3. **Contracts** — Solidity on Circle's Arc (EVM): ERC-721 land + $ISLAND
   ERC-20, primary sale, and a buyback/burn router. Testnet first, audited
   before any mainnet deployment.

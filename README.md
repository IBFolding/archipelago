# ARCHipelago — $ISLAND

A vacation-booking site for a 3D island world where players buy plots of land,
land on them with nothing, and build them out.

The archipelago spells **ARC**. Three letter-sections, 18 islands, **1,161
surveyed lots**, of which **605 are currently for sale**.

- **The A** — arrivals. Every boat lands here. Six islands including the volcano
  that sits off the letterform and was not invited.
- **The R** — the working letter. Markets, bars, the amphitheatre. Seven islands.
- **The C** — the quiet crescent. Retreats, sea caves, a grotto nobody discusses.
  Five islands.

**Land is bought and sold in USD** and can be resold by its owner on the
secondary market. **$ISLAND is the in-island currency** — adventures, materials,
upgrades, bar tabs. The link between them runs one way: 35% of land revenue buys
$ISLAND on the open market and burns it.

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
  components/     Nav, Hero, IslandMap, LandOffice, Sections, BookingModal,
                  Reveal + Motion (the animation primitives)
  hooks/          useInView, useReducedMotion
  world/          The 3D scene
    ocean.ts        Custom water shader: swell, depth gradient, shoreline foam,
                    sun glitter, night grade, horizon haze
    geometry.ts     Procedural islands, palms, huts, docks, boats
    HeroWorld.tsx   Scene assembly, lighting, day cycle, camera rig
    IslandPreview.tsx  Single island on a turntable for the islands section
  lib/
    content.ts    All copy + the island/excursion/treasury data model
    plots.ts      Deterministic subdivision plats: streets, lots, prices, resales
public/assets/    Logo and hero reference art
```

`src/lib/content.ts` is the single source of truth for islands. The 3D hero and
the 2D map both read island positions from it, so the world and the map cannot
drift apart. The game will read the same definitions.

`src/lib/plots.ts` generates each island's subdivision plat deterministically
from its id: rows of blocks separated by named streets, cut by avenues, filled
with rectangular lots of varying frontage and depth, clipped to the shoreline.
Lots carry an address, size in paces, USD price, ownership and an optional
resale listing. Every count and price on the site derives from this rather than
being hand-written, and the world will subdivide land the same way.

## Notable behaviour

- **Resort time.** "Live" runs an eight-minute day off the wall clock, weighted
  so it is sunny most of the time with a short golden hour and night. Day /
  sunset / night can be forced from the control under the nav.
- **Aspect-aware camera.** The camera backs off on portrait viewports so the
  whole letterform stays in frame on a phone.
- **Graceful degradation.** No WebGL falls back to the hero still image;
  `prefers-reduced-motion` pauses the animation loop.
- **The land office.** Islands grouped by letter. Each has a real subdivision
  plat — coast road, named streets, avenues, and rectangular lots in blocks.
  Filter by land-office stock, owner resales, or everything; sort by price or
  size; claim a specific numbered address.
- **Events.** Squalls, hurricanes, pirates, squatters, wildlife and the caldera
  arrive on their own schedule. Each has a defence. Your build survives or
  becomes a story.
- **Scroll reveal.** The hero arrives over the A, then climbs and pans right as
  you scroll until the whole ARC is in frame.
- **Live island preview.** The islands section renders the selected island in
  real 3D on a turntable, built from the same procedural geometry as the hero,
  so the preview and the world can never look like different games. It mounts
  only while the section is on screen.
- **Tropical backdrop.** A fixed atmosphere layer sits behind the whole page:
  a low sun burning in from the top right, four slow-drifting washes of lagoon,
  mango, coral and palm green, swaying palm-frond shadows cast from off-screen
  trees, and a little paper grain. Sections float over it as rounded slabs
  rather than cutting the page into flat bands.
- **Motion system.** `Reveal` / `SplitHeading` (IntersectionObserver entrances
  and word-by-word headlines), `Counter` (numbers that count up on view),
  `TiltCard` (cards that lean toward the pointer with a light that follows),
  `GrowBar` and a marquee `Ticker`. All of it respects
  `prefers-reduced-motion`.

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

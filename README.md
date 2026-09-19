# ARCHipelago — $ISLAND

**Live: https://ibfolding.github.io/archipelago/**

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

**Built:** the site, the land office, the island world view at `/island`, and
the lot builder at `/build`.

**Not built yet:** a backend (everything is local to your browser), excursions
as real missions, world events actually firing, and the smart contracts.
Nothing here touches a wallet, and no land or token is live. Claiming a lot
reserves nothing.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3210.

## Deploying

The site is fully client-side, so it exports to static files and is served
from GitHub Pages. Pushing to `main` runs `.github/workflows/deploy.yml`,
which builds with `NEXT_PUBLIC_BASE_PATH=/archipelago` and publishes `out/`.

To serve from a domain root instead, drop `NEXT_PUBLIC_BASE_PATH` — every
public asset goes through `asset()` in `src/lib/paths.ts`, so the same code
works either way.

Build locally with `npm run build`; typecheck with `npm run typecheck`.

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
    IslandWorld.tsx    A whole island at survey scale: terrain, roads, lots,
                       and a building on every sold one
    buildKit.ts        The 20-piece placeable catalogue for the builder
    BuildWorld.tsx     The lot editor scene
  lib/
    content.ts    All copy + the island/excursion/treasury data model
    plots.ts      Deterministic subdivision plats: streets, lots, prices, resales
    neighbours.ts Generated buildings for sold lots, seeded per lot id
    build.ts      Lot state, placement rules, persistence, sign artwork
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
- **One scale, end to end.** A builder cell is one pace, and a lot's grid is
  its real frontage and depth, so the builder's lot is the lot the survey sold
  you. Builds render on the island at the size they were designed, rather than
  standing in as a marker.
- **The island world (`/island`).** Fly over any of the 18 islands and see the
  actual plat in 3D: terrain, coast road, named streets, every lot, and a
  building on every sold one. Click a lot to see its address, size and price,
  and go straight to claiming it. Everything static is merged into one
  vertex-coloured mesh, so a hundred-lot island costs a couple of draw calls
  rather than several hundred.

  Buildings on sold lots are **generated, not other players** — derived
  deterministically from each lot id, so every visitor sees the same
  neighbourhood. When a backend exists, real shared builds replace them lot by
  lot, which means an island is never empty even at ten users.
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

import { ISLANDS, type Island } from './content';

/**
 * Deterministic subdivision plat.
 *
 * Land is priced and sold in USD. $ISLAND is the in-island currency for
 * adventures, materials and upgrades, and is never used to buy land — the
 * connection runs the other way: land revenue buys $ISLAND back and burns it.
 *
 * Each island is laid out the way a real resort subdivision is: a coastal road
 * around the shoreline, east-west residential streets at regular intervals,
 * north-south avenues cutting across, and rectangular lots filling the blocks
 * between them. Lots that fall outside the shoreline are dropped, so every
 * island ends up with its own organic lot count and street pattern.
 *
 * Generation is seeded from the island id, so the plat is identical for every
 * visitor and the 3D world can subdivide land exactly the same way.
 */

export type PlotTier = 'beachfront' | 'inland' | 'headland';

/** Lot geometry in island-local units (same units as Island.shape). */
export interface LotRect {
  x: number;
  z: number;
  w: number;
  d: number;
}

export interface Plot {
  id: string;
  islandId: string;
  /** Street address, e.g. "14 Hammock Walk". */
  address: string;
  label: string;
  tier: PlotTier;
  rect: LotRect;
  /** Frontage and depth in paces — the island's unit, such as it is. */
  frontage: number;
  depth: number;
  /** Asking price in USD. */
  price: number;
  claimed: boolean;
  /**
   * Set when a current owner has relisted the lot on the secondary market.
   * Land can be resold, so a sold lot is not necessarily gone forever.
   */
  resale?: number;
  quirk: string;
}

export interface PlatStreet {
  kind: 'street' | 'avenue';
  name?: string;
  /** Centre line + extent in island-local units. */
  x: number;
  z: number;
  w: number;
  d: number;
}

export interface Plat {
  islandId: string;
  plots: Plot[];
  streets: PlatStreet[];
  /** Radius fraction of the coastal ring road. */
  coastalR: number;
}

export const TIER_LABEL: Record<PlotTier, string> = {
  beachfront: 'Beachfront',
  inland: 'Inland',
  headland: 'Headland',
};

export const TIER_BLURB: Record<PlotTier, string> = {
  beachfront: 'Sand at your door. Water at your door during storms.',
  inland: 'Cheaper, shadier, and a walk from everything. Character-building.',
  headland: 'High ground. Best view on the island, worst walk home.',
};

const TIER_MULT: Record<PlotTier, number> = {
  inland: 1,
  beachfront: 2.4,
  headland: 3.2,
};

/* ---------------------------------------------------------------- layout -- */

/** Street dimensions, in island-local units. */
const STREET_W = 0.26;
const AVENUE_W = 0.34;
const SHORE = 0.94; // lots must sit inside this fraction of the shoreline

/** Frontage options, so blocks differ: cottage, standard, estate. */
const FRONTAGES = [0.38, 0.46, 0.46, 0.58, 0.72];
/** Depth options, paired per block row. */
const DEPTHS = [0.54, 0.62, 0.62, 0.78];
/** Reference lot area used to price everything else relative to it. */
const REF_AREA = 0.46 * 0.62;

const STREET_NAMES = [
  'Hammock Walk',
  'Sunset Row',
  'Coconut Mile',
  'Low Tide Lane',
  'Regret Road',
  'Two Drink Way',
  'Barefoot Row',
  'Long Weekend Lane',
  'Flip Flop Walk',
  'Sunburn Street',
  'Nap Terrace',
  'Reef Road',
  'Driftwood Row',
  'Last Boat Lane',
];

const AVENUE_NAMES = [
  'First Avenue',
  'Palm Avenue',
  'Dock Avenue',
  'Market Avenue',
  'Lagoon Avenue',
  'Summit Avenue',
];

const QUIRKS: Record<PlotTier, string[]> = {
  beachfront: [
    'Comes with a rock that is apparently load-bearing.',
    'Sunrise hits this one first. So do the birds.',
    'Previous owner left a hammock and no explanation.',
    'Direct dock access. Direct shark access.',
    'The sand here is the good sand. People notice.',
    'Storm surge reaches the back fence twice a year.',
  ],
  inland: [
    'Three palms, one aggressively dropping coconuts.',
    'Quiet. Suspiciously quiet.',
    'Backs onto the trail to the waterfall.',
    'Slight slope. Your drinks will know.',
    'Shaded all afternoon, which you will pretend you planned.',
    'Neighbour keeps chickens. Nobody agreed to this.',
  ],
  headland: [
    'You can see the whole letterform from up here.',
    'Wind. Constant, characterful wind.',
    'There is a cave mouth below this parcel. Do not ask.',
    'Closest parcel to whatever the volcano is doing.',
    'Cell signal up here. One bar. Enough to ruin things.',
  ],
};

/** Small deterministic hash so a given plot always gets the same values. */
function seeded(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Share of each island already built out, and whether it has a dead centre. */
const PLAN: Record<string, { taken: number; hollow: number }> = {
  arrivals: { taken: 0.55, hollow: 0 },
  nap: { taken: 0.62, hollow: 0 },
  snack: { taken: 0.68, hollow: 0 },
  boat: { taken: 0.72, hollow: 0 },
  main: { taken: 0.86, hollow: 0 },
  // The caldera itself is not for sale, however keen anyone is.
  smoking: { taken: 0.12, hollow: 0.26 },

  // The R — the working letter, built out hardest around the market.
  neon: { taken: 0.74, hollow: 0 },
  market: { taken: 0.81, hollow: 0 },
  lastcall: { taken: 0.6, hollow: 0 },
  rooftop: { taken: 0.78, hollow: 0 },
  bowl: { taken: 0.7, hollow: 0.18 },
  waist: { taken: 0.42, hollow: 0 },
  kickstand: { taken: 0.5, hollow: 0 },

  // The C — quieter, emptier, and one island with a hole in the middle.
  crescent: { taken: 0.58, hollow: 0 },
  silent: { taken: 0.44, hollow: 0 },
  hollow: { taken: 0.36, hollow: 0.3 },
  moonrise: { taken: 0.3, hollow: 0 },
  lastlight: { taken: 0.64, hollow: 0 },
};

function buildPlat(island: Island): Plat {
  const { rx, rz } = island.shape;
  const plan = PLAN[island.id] ?? { taken: 0.5, hollow: 0 };
  const rand = seeded(island.id);

  const plots: Plot[] = [];
  const streets: PlatStreet[] = [];

  /** Normalised distance from island centre; 1 is the shoreline. */
  const norm = (x: number, z: number) => Math.hypot(x / rx, z / rz);

  /** All four corners of a lot must sit inside the buildable shoreline. */
  const fits = (r: LotRect) => {
    const corners: [number, number][] = [
      [r.x, r.z],
      [r.x + r.w, r.z],
      [r.x, r.z + r.d],
      [r.x + r.w, r.z + r.d],
    ];
    let maxN = 0;
    for (const [cx, cz] of corners) {
      const n = norm(cx, cz);
      if (n > SHORE) return null;
      maxN = Math.max(maxN, n);
    }
    const centreN = norm(r.x + r.w / 2, r.z + r.d / 2);
    if (plan.hollow && centreN < plan.hollow) return null;
    return { maxN, centreN };
  };

  // Lay out rows first so each block can have its own lot dimensions.
  const rows: { z: number; lotW: number; lotD: number }[] = [];
  {
    let cursor = -rz - 0.4;
    while (cursor < rz + 0.4) {
      const lotW = FRONTAGES[Math.floor(rand() * FRONTAGES.length)];
      const lotD = DEPTHS[Math.floor(rand() * DEPTHS.length)];
      rows.push({ z: cursor, lotW, lotD });
      // A block is two rows of lots backing onto each other, then a street.
      cursor += lotD * 2 + STREET_W;
    }
  }

  const x0 = -rx - 0.5;

  let n = 0;
  let streetIdx = 0;

  for (let row = 0; row < rows.length; row++) {
    const { z: blockZ, lotW: LOT_W, lotD: LOT_D } = rows[row];
    const lotsPerBlock = LOT_W > 0.6 ? 4 : LOT_W < 0.42 ? 8 : 6;
    // The street running along the top of this block.
    const streetZ = blockZ - STREET_W / 2;
    const streetName = STREET_NAMES[streetIdx % STREET_NAMES.length];
    let streetUsed = false;

    for (let half = 0; half < 2; half++) {
      const lotZ = blockZ + half * LOT_D;

      let col = 0;
      let xCursor = x0;
      while (xCursor < rx + LOT_W) {
        // Insert an avenue at block boundaries.
        const sinceAvenue = col % lotsPerBlock;
        if (col > 0 && sinceAvenue === 0) {
          xCursor += AVENUE_W;
        }

        const rect: LotRect = { x: xCursor, z: lotZ, w: LOT_W, d: LOT_D };
        const hit = fits(rect);

        if (hit) {
          const r = seeded(`${island.id}:${row}:${half}:${col}`);
          const tier: PlotTier =
            hit.maxN > 0.8 ? 'beachfront' : hit.centreN < 0.3 ? 'headland' : 'inland';

          // Bigger lots cost more, so a wide estate lot on the beach is the
          // top of the market and a cottage lot inland is the entry point.
          const area = (LOT_W * LOT_D) / REF_AREA;
          const jitter = 0.88 + r() * 0.3;
          const price =
            Math.round((island.fromPrice * TIER_MULT[tier] * area * jitter) / 10) * 10;

          const quirks = QUIRKS[tier];
          const claimed = r() < plan.taken;
          n += 1;
          const label = String(n).padStart(3, '0');

          // Roughly one in six sold lots is back on the market, at a markup
          // its owner is very confident about.
          const relisted = claimed && r() < 0.17;

          plots.push({
            id: `${island.num}-${label}`,
            islandId: island.id,
            label,
            address: `${n * 2} ${streetName}`,
            tier,
            rect,
            frontage: Math.round(LOT_W * 40),
            depth: Math.round(LOT_D * 40),
            price,
            claimed,
            resale: relisted
              ? Math.round((price * (1.25 + r() * 0.85)) / 10) * 10
              : undefined,
            quirk: quirks[Math.floor(r() * quirks.length)],
          });
          streetUsed = true;
        }

        xCursor += LOT_W;
        col += 1;
      }
    }

    if (streetUsed) {
      streets.push({
        kind: 'street',
        name: streetName,
        x: -rx,
        z: streetZ,
        w: rx * 2,
        d: STREET_W,
      });
      streetIdx += 1;
    }
  }

  // North-south avenues cutting across the blocks.
  const avenuePitch = rx / 1.6;
  for (let ax = -rx + avenuePitch; ax < rx; ax += avenuePitch) {
    streets.push({
      kind: 'avenue',
      name: AVENUE_NAMES[streets.filter((s) => s.kind === 'avenue').length % AVENUE_NAMES.length],
      x: ax - AVENUE_W / 2,
      z: -rz,
      w: AVENUE_W,
      d: rz * 2,
    });
  }

  return { islandId: island.id, plots, streets, coastalR: 0.97 };
}

export const PLAT_BY_ISLAND: Record<string, Plat> = Object.fromEntries(
  ISLANDS.map((i) => [i.id, buildPlat(i)]),
);

export function platFor(islandId: string): Plat {
  return PLAT_BY_ISLAND[islandId];
}

export function plotsFor(islandId: string): Plot[] {
  return PLAT_BY_ISLAND[islandId]?.plots ?? [];
}

/** Lots available from the land office (never sold). */
export function availableFor(islandId: string): Plot[] {
  return plotsFor(islandId).filter((p) => !p.claimed);
}

/** Sold lots their owners have relisted on the secondary market. */
export function resalesFor(islandId: string): Plot[] {
  return plotsFor(islandId).filter((p) => p.claimed && p.resale);
}

/** Anything a buyer can actually acquire right now, either way. */
export function forSaleFor(islandId: string): Plot[] {
  return plotsFor(islandId).filter((p) => !p.claimed || p.resale);
}

/** What a lot costs today, from the land office or from its owner. */
export function askingPrice(p: Plot): number {
  return p.claimed ? (p.resale ?? 0) : p.price;
}

export const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function fromPriceFor(islandId: string): number {
  const open = availableFor(islandId);
  if (!open.length) return 0;
  return Math.min(...open.map((p) => p.price));
}

export const ALL_PLOTS: Plot[] = ISLANDS.flatMap((i) => plotsFor(i.id));

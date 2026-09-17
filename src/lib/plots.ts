import { ISLANDS, type Island } from './content';

/**
 * Deterministic plot inventory.
 *
 * Every island is subdivided into parcels the same way the world will do it:
 * an outer beachfront ring, an inland ring, and a couple of headland parcels
 * on the high ground. Generation is seeded from the island id so the plot
 * numbers, prices and ownership are identical for every visitor and for the
 * 3D world later.
 */

export type PlotTier = 'beachfront' | 'inland' | 'headland';

export interface Plot {
  id: string;
  islandId: string;
  /** Human label, e.g. "B07". */
  label: string;
  tier: PlotTier;
  /** Parcel geometry in island-local space, used to draw the plan. */
  ring: { a0: number; a1: number; r0: number; r1: number };
  /** Frontage in paces — the island's unit of measurement, such as it is. */
  paces: number;
  price: number;
  claimed: boolean;
  quirk: string;
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
  beachfront: 2.1,
  headland: 3.2,
};

const QUIRKS: Record<PlotTier, string[]> = {
  beachfront: [
    'Comes with a rock that is apparently load-bearing.',
    'Sunrise hits this one first. So do the birds.',
    'Previous owner left a hammock and no explanation.',
    'Direct dock access. Direct shark access.',
    'The sand here is the good sand. People notice.',
  ],
  inland: [
    'Three palms, one of which is aggressively dropping coconuts.',
    'Quiet. Suspiciously quiet.',
    'Backs onto the trail to the waterfall.',
    'Slight slope. Your drinks will know.',
    'Shaded all afternoon, which you will pretend you planned.',
  ],
  headland: [
    'You can see the whole letterform from up here.',
    'Wind. Constant, characterful wind.',
    'There is a cave mouth below this parcel. Do not ask.',
    'Closest parcel to whatever the volcano is doing.',
  ],
};

/** Small deterministic hash so the same plot always gets the same values. */
function hash(str: string) {
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

/** How much of each island is already taken, and how big it is. */
const PLAN: Record<string, { beach: number; inland: number; head: number; taken: number }> = {
  arrivals: { beach: 10, inland: 8, head: 2, taken: 0.55 },
  nap: { beach: 9, inland: 7, head: 2, taken: 0.62 },
  snack: { beach: 9, inland: 7, head: 2, taken: 0.68 },
  boat: { beach: 11, inland: 6, head: 2, taken: 0.72 },
  main: { beach: 12, inland: 8, head: 3, taken: 0.88 },
  smoking: { beach: 8, inland: 10, head: 3, taken: 0.1 },
};

function buildPlots(island: Island): Plot[] {
  const plan = PLAN[island.id] ?? { beach: 8, inland: 6, head: 2, taken: 0.5 };
  const rand = hash(island.id);
  const plots: Plot[] = [];

  const rings: { tier: PlotTier; count: number; r0: number; r1: number; prefix: string }[] = [
    { tier: 'beachfront', count: plan.beach, r0: 0.72, r1: 1.0, prefix: 'B' },
    { tier: 'inland', count: plan.inland, r0: 0.36, r1: 0.7, prefix: 'I' },
    { tier: 'headland', count: plan.head, r0: 0, r1: 0.34, prefix: 'H' },
  ];

  for (const ring of rings) {
    for (let i = 0; i < ring.count; i++) {
      const a0 = (i / ring.count) * Math.PI * 2;
      const a1 = ((i + 1) / ring.count) * Math.PI * 2;
      const label = `${ring.prefix}${String(i + 1).padStart(2, '0')}`;

      const sizeRoll = rand();
      const paces = Math.round(18 + sizeRoll * 46);
      const price =
        Math.round(
          (island.fromPrice * TIER_MULT[ring.tier] * (0.8 + sizeRoll * 0.55)) / 10,
        ) * 10;

      const quirks = QUIRKS[ring.tier];

      plots.push({
        id: `${island.num}-${label}`,
        islandId: island.id,
        label,
        tier: ring.tier,
        ring: { a0, a1, r0: ring.r0, r1: ring.r1 },
        paces,
        price,
        claimed: rand() < plan.taken,
        quirk: quirks[Math.floor(rand() * quirks.length)],
      });
    }
  }

  return plots;
}

export const PLOTS_BY_ISLAND: Record<string, Plot[]> = Object.fromEntries(
  ISLANDS.map((i) => [i.id, buildPlots(i)]),
);

export const ALL_PLOTS: Plot[] = ISLANDS.flatMap((i) => PLOTS_BY_ISLAND[i.id]);

export function plotsFor(islandId: string): Plot[] {
  return PLOTS_BY_ISLAND[islandId] ?? [];
}

export function availableFor(islandId: string): Plot[] {
  return plotsFor(islandId).filter((p) => !p.claimed);
}

/** Cheapest available plot on an island, used for the "from" price. */
export function fromPriceFor(islandId: string): number {
  const open = availableFor(islandId);
  if (!open.length) return 0;
  return Math.min(...open.map((p) => p.price));
}

/**
 * SVG path for a parcel, in island-local units. Drawn as an annulus sector
 * squashed onto the island's ellipse so parcels follow the coastline.
 */
export function plotPath(plot: Plot, rx: number, rz: number, gap = 0.035): string {
  const { a0, a1, r0, r1 } = plot.ring;
  const pad = gap;
  const A0 = a0 + pad;
  const A1 = a1 - pad;
  const steps = 10;

  const pt = (a: number, r: number) =>
    `${(Math.cos(a) * rx * r).toFixed(3)},${(Math.sin(a) * rz * r).toFixed(3)}`;

  const outer: string[] = [];
  for (let i = 0; i <= steps; i++) outer.push(pt(A0 + ((A1 - A0) * i) / steps, r1));

  if (r0 === 0) {
    // Headland parcels are wedges that meet at the summit.
    return `M ${outer.join(' L ')} L ${pt(0, 0)} Z`;
  }

  const inner: string[] = [];
  for (let i = steps; i >= 0; i--) inner.push(pt(A0 + ((A1 - A0) * i) / steps, r0));

  return `M ${outer.join(' L ')} L ${inner.join(' L ')} Z`;
}

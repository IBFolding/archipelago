import { ALL_PLOTS } from './plots';

/**
 * Secrets.
 *
 * Nothing here is advertised. Uncharted islands do not appear in the switcher,
 * the land office or the nav — they are simply absent until you find them, and
 * then they are permanently present. There is no quest log and no "???" slot
 * teasing you with something you have not got.
 *
 * Discovery rides on the event engine rather than adding a verb: when
 * something disturbs a lot that happens to be concealing something — the
 * overgrowth takes it back, a storm opens a hole, salvage washes up — whatever
 * was under there comes up with it. So finding things is unpredictable in the
 * same way everything else on the island is, and cannot be farmed.
 */

export type OutlierTheme = 'jungle' | 'monkey' | 'wreck' | 'void';

export interface Outlier {
  id: string;
  name: string;
  /** What the chart calls it, once there is a chart. */
  subtitle: string;
  /** Read once, on the night you find it. */
  lore: string;
  /** Far off the ARC, in world coordinates. */
  pos: [number, number];
  shape: { rx: number; rz: number; rot: number };
  theme: OutlierTheme;
}

/**
 * The islands that are not on the map. They exist in the world from the first
 * day; they are just not drawn until somebody charts them.
 */
export const OUTLIERS: Outlier[] = [
  {
    id: 'perdida',
    name: 'Isla Perdida',
    subtitle: 'Uncharted · the resort insists this is a themed attraction',
    lore: 'The brochure calls it a themed attraction with animatronics. The brochure has never been there. The ferns are the wrong size, the birds are the wrong shape, and something very large walks the ridge at dusk and does not care that you are watching.',
    pos: [-62, 26],
    shape: { rx: 7.5, rz: 5.5, rot: -0.2 },
    theme: 'jungle',
  },
  {
    id: 'monkey',
    name: 'Monkey King Island',
    subtitle: 'Uncharted · sovereign, apparently',
    lore: 'They have a functioning economy, enforceable property rights and a king. All three are in better order than the ARC. You are permitted ashore as a guest, a status that can be revoked, and has been.',
    pos: [118, 30],
    shape: { rx: 5.5, rz: 5.0, rot: 0.3 },
    theme: 'monkey',
  },
  {
    id: 'consequence',
    name: 'The Consequence',
    subtitle: 'Uncharted · went down in 1911, mostly',
    lore: 'She has been down there since 1911 and people are still arguing about the manifest. At low water a third of her comes back up, which is when the arguing gets loudest. Whatever she was carrying, some of it never made the beach.',
    pos: [30, 62],
    shape: { rx: 6.0, rz: 3.2, rot: 0.5 },
    theme: 'wreck',
  },
  {
    id: 'null',
    name: 'Null Atoll',
    subtitle: 'Uncharted · not reliably present',
    lore: 'It is not on any chart because it is not always there. People who have landed on it agree about the sand, the ring of water and the silence, and disagree about everything else, including how they got home.',
    pos: [42, -58],
    shape: { rx: 4.2, rz: 4.0, rot: 0 },
    theme: 'void',
  },
];

export const OUTLIER_BY_ID: Record<string, Outlier> = Object.fromEntries(
  OUTLIERS.map((o) => [o.id, o]),
);

export type SecretKind = 'chart' | 'grotto' | 'cache';

export interface Secret {
  id: string;
  kind: SecretKind;
  /** The lot that has been sitting on it this whole time. */
  lotId: string;
  title: string;
  copy: string;
  /** Charts an outlier island, if this is a chart. */
  charts?: string;
  /** Pays out, if this is a cache. */
  islandReward?: number;
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h += 0x6d2b79f5;
  let t = h;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const GROTTO_COPY: [string, string][] = [
  [
    'A grotto opens',
    'The ground gives way onto a sea cave nobody has used in a very long time, lit blue from underneath by water that connects to somewhere else.',
  ],
  [
    'The cave behind the waterfall',
    'It was always there. The locals were not being coy; they genuinely hoped you would not ask again.',
  ],
  [
    'A drowned stair',
    'Cut steps going down into clear water, worn smooth, far older than anything the resort built.',
  ],
];

const CACHE_COPY: [string, string][] = [
  ['A buried cache', 'A tin box, wrapped twice, holding more than it has any business holding.'],
  ['Something under the roots', 'Whoever put it here meant to come back. They did not.'],
  ['A sealed jar', 'Coins, a ring, and a note that is mostly water damage and one legible word.'],
];

/**
 * Every secret in the world, placed deterministically. They are here from the
 * first day; the map simply does not mention them.
 */
export const SECRETS: Secret[] = (() => {
  const out: Secret[] = [];
  const used = new Set<string>();

  // One chart per uncharted island, hidden on a lot chosen by the island's own
  // name, so the same lot always holds the same chart for everyone.
  OUTLIERS.forEach((o) => {
    const idx = Math.floor(hash(`chart:${o.id}`) * ALL_PLOTS.length);
    const plot = ALL_PLOTS[idx];
    used.add(plot.id);
    out.push({
      id: `chart-${o.id}`,
      kind: 'chart',
      lotId: plot.id,
      title: 'A chart, rolled and sealed',
      copy: 'Hand drawn, badly, and certain of itself. There is an island on it that is on nothing else.',
      charts: o.id,
    });
  });

  // A scattering of grottos and caches across everything else.
  ALL_PLOTS.forEach((p) => {
    if (used.has(p.id)) return;
    const r = hash(`secret:${p.id}`);
    if (r > 0.018) return;
    if (r < 0.007) {
      const [title, copy] = GROTTO_COPY[Math.floor(hash(`g:${p.id}`) * GROTTO_COPY.length)];
      out.push({ id: `grotto-${p.id}`, kind: 'grotto', lotId: p.id, title, copy });
    } else {
      const [title, copy] = CACHE_COPY[Math.floor(hash(`c:${p.id}`) * CACHE_COPY.length)];
      out.push({
        id: `cache-${p.id}`,
        kind: 'cache',
        lotId: p.id,
        title,
        copy,
        islandReward: Math.round((400 + hash(`v:${p.id}`) * 2600) / 50) * 50,
      });
    }
  });

  return out;
})();

const SECRET_BY_LOT: Record<string, Secret> = Object.fromEntries(
  SECRETS.map((s) => [s.lotId, s]),
);

/** What, if anything, this lot has been sitting on. */
export function secretUnder(lotId: string): Secret | null {
  return SECRET_BY_LOT[lotId] ?? null;
}

/**
 * Events that disturb the ground or wash things ashore can turn something up.
 * A quiet week never will, which is why secrets cannot be farmed.
 */
const DISTURBING = new Set([
  'overgrowth',
  'salvage',
  'hurricane',
  'kingtide',
  'landslide',
  'squall',
  'eruption',
]);

export function disturbs(eventId: string): boolean {
  return DISTURBING.has(eventId);
}

/* ------------------------------------------------------------ discovery -- */

export interface Found {
  secrets: string[];
  charted: string[];
}

const KEY = 'archipelago.found.v1';

export function loadFound(): Found {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { secrets: [], charted: [] };
    const p = JSON.parse(raw) as Found;
    return {
      secrets: Array.isArray(p.secrets) ? p.secrets : [],
      charted: Array.isArray(p.charted) ? p.charted : [],
    };
  } catch {
    return { secrets: [], charted: [] };
  }
}

export function saveFound(found: Found): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(found));
  } catch {
    // Blocked storage means the find does not persist. It still happened.
  }
}

/** Charted islands, in the order they were found. */
export function chartedOutliers(found: Found): Outlier[] {
  return found.charted.map((id) => OUTLIER_BY_ID[id]).filter(Boolean);
}

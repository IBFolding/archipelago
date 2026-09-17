import type { Plot } from './plots';

/**
 * Generated neighbours.
 *
 * Sold lots that nobody has actually built on still need something standing on
 * them, or an island reads as abandoned. Each sold lot gets a building derived
 * deterministically from its own id, so every visitor sees the same
 * neighbourhood and it never shuffles between loads.
 *
 * These are generated, not real players. When real shared builds exist they
 * replace these lot by lot, which means an island is never empty even at ten
 * users — the usual failure mode of launching a shared world too early.
 */

export type NeighbourStyle =
  | 'shack'
  | 'house'
  | 'villa'
  | 'bar'
  | 'tower'
  | 'shop'
  | 'ruin';

export interface Neighbour {
  style: NeighbourStyle;
  /** Yaw in radians, snapped to quarter turns. */
  rot: number;
  /** Storeys, where the style supports them. */
  storeys: number;
  /** Palms scattered on the lot. */
  palms: number;
  pool: boolean;
  /** Roof colour index, for a bit of variety along a street. */
  roof: number;
  /** Wall colour index. */
  wall: number;
}

/** Deterministic PRNG seeded from a string. */
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

export const ROOF_COLORS = [0xd8a860, 0xb5854f, 0x8c6239, 0xc45b3c, 0x3f6f5e];
export const WALL_COLORS = [0xfff6e8, 0xfdeccd, 0xf3e3cf, 0xe8ecef, 0xffe9d2];

/**
 * What stands on a sold lot. Beachfront skews expensive, headland skews
 * towers, and the cheapest inland lots occasionally hold a ruin nobody has
 * dealt with.
 */
export function neighbourFor(plot: Plot): Neighbour | null {
  if (!plot.claimed) return null;

  const r = seeded(`n:${plot.id}`);
  const roll = r();
  const big = plot.frontage * plot.depth > 700;

  let style: NeighbourStyle;
  if (plot.tier === 'beachfront') {
    style = roll < 0.42 ? 'villa' : roll < 0.62 ? 'house' : roll < 0.8 ? 'bar' : 'shack';
  } else if (plot.tier === 'headland') {
    style = roll < 0.45 ? 'tower' : roll < 0.75 ? 'villa' : 'house';
  } else {
    style =
      roll < 0.34
        ? 'house'
        : roll < 0.54
          ? 'shack'
          : roll < 0.7
            ? 'shop'
            : roll < 0.86
              ? 'bar'
              : 'ruin';
  }

  if (big && style === 'shack') style = 'house';

  return {
    style,
    rot: Math.floor(r() * 4) * (Math.PI / 2),
    storeys: style === 'villa' || style === 'tower' ? (r() < 0.5 ? 2 : 3) : 1,
    palms: Math.floor(r() * 3),
    pool: style === 'villa' && r() < 0.55,
    roof: Math.floor(r() * ROOF_COLORS.length),
    wall: Math.floor(r() * WALL_COLORS.length),
  };
}

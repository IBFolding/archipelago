import { KIT_BY_ID, totalCost } from '@/world/buildKit';
import { loadLot, type Placed } from './build';
import { neighbourFor, type NeighbourStyle } from './neighbours';
import { platFor, type Plot } from './plots';

/**
 * What a lot is worth.
 *
 * Land is bought and sold in dollars, so a lot has to be able to gain value or
 * the secondary market is decoration. Three things move it:
 *
 *  - What you put on it. Building is paid in $ISLAND, and it raises the dollar
 *    value of the land. That is the whole point of the token: it is the thing
 *    that turns cheap dirt into an asset.
 *  - Who you are next to. A street where everyone has built well lifts every
 *    lot on it; a derelict two doors down drags its neighbours with it.
 *  - What shape it is in. Storm damage costs you until you repair it.
 */

/** A dollar of land value per this much $ISLAND spent building. */
const ISLAND_TO_USD = 0.09;
/** Improvements can only take a lot so far above its land. */
const MAX_IMPROVEMENT = 2.2;

/** How developed a generated neighbour reads as, for the street average. */
const STYLE_SCORE: Record<NeighbourStyle, number> = {
  villa: 0.92,
  tower: 0.86,
  bar: 0.72,
  house: 0.6,
  shop: 0.48,
  shack: 0.3,
  ruin: 0.04,
};

export interface LotValue {
  /** What the land office lists it at, before anything is built. */
  list: number;
  /** Value added by what stands on it. */
  improvement: number;
  /** 0.85 to 1.25, from the neighbours. */
  streetFactor: number;
  /** 0.75 to 1, from wear. */
  conditionFactor: number;
  /** What it is worth today. */
  value: number;
  /** How the street is trending, for display. */
  street: 'struggling' | 'steady' | 'improving' | 'sought after';
  /** Lots the street factor was read from. */
  neighbours: number;
}

/** How built-out a lot reads as, whether it is yours or generated. */
function developmentOf(plot: Plot, ownedIds: Set<string>): number {
  if (ownedIds.has(plot.id)) {
    const items = loadLot(plot.id).items;
    if (!items.length) return 0.08;
    const area = items.reduce((n, i) => {
      const k = KIT_BY_ID[i.kitId];
      return n + (k ? k.size[0] * k.size[1] : 0);
    }, 0);
    const levels = items.reduce((n, i) => n + ((i.level ?? 1) - 1), 0);
    const lot = plot.frontage * plot.depth;
    return Math.min(1, area / lot + levels * 0.06);
  }

  const n = neighbourFor(plot);
  if (!n) return 0.08;
  return Math.min(1, STYLE_SCORE[n.style] + (n.storeys - 1) * 0.05);
}

/** The nearest lots, which is what a street actually means spatially. */
export function neighboursOf(plot: Plot, count = 6): Plot[] {
  const all = platFor(plot.islandId).plots;
  const cx = plot.rect.x + plot.rect.w / 2;
  const cz = plot.rect.z + plot.rect.d / 2;
  return all
    .filter((p) => p.id !== plot.id)
    .map((p) => ({
      p,
      d: Math.hypot(p.rect.x + p.rect.w / 2 - cx, p.rect.z + p.rect.d / 2 - cz),
    }))
    .sort((a, b) => a.d - b.d)
    .slice(0, count)
    .map((x) => x.p);
}

export function valueOf(
  plot: Plot,
  ownedIds: Set<string>,
  opts: { items?: Placed[]; condition?: number } = {},
): LotValue {
  const list = plot.price;

  // What stands on it. Building spends $ISLAND and lifts dollar value.
  const items = opts.items ?? (ownedIds.has(plot.id) ? loadLot(plot.id).items : []);
  const spent = items.reduce((n, i) => n + totalCost(i.kitId, i.level ?? 1), 0);
  const improvement = Math.min(list * MAX_IMPROVEMENT, spent * ISLAND_TO_USD);

  // Who you are next to.
  const neighbours = neighboursOf(plot);
  const avg = neighbours.length
    ? neighbours.reduce((n, p) => n + developmentOf(p, ownedIds), 0) / neighbours.length
    : 0.4;
  const streetFactor = 0.85 + avg * 0.4;

  const condition = opts.condition ?? 100;
  const conditionFactor = 0.75 + (condition / 100) * 0.25;

  const value = Math.round(((list + improvement) * streetFactor * conditionFactor) / 10) * 10;

  const street: LotValue['street'] =
    avg < 0.25 ? 'struggling' : avg < 0.5 ? 'steady' : avg < 0.75 ? 'improving' : 'sought after';

  return {
    list,
    improvement: Math.round(improvement),
    streetFactor,
    conditionFactor,
    value,
    street,
    neighbours: neighbours.length,
  };
}

export const STREET_NOTE: Record<LotValue['street'], string> = {
  struggling: 'Half the street is empty or falling down. Cheap to buy into, hard to sell out of.',
  steady: 'Nothing remarkable either way. The street is getting on with it.',
  improving: 'People are building. Anything you put up here is worth more than it cost.',
  'sought after': 'Everyone nearby has built well, and the whole street carries the premium.',
};

import { KIT_BY_ID } from '@/world/buildKit';
import type { Placed } from './build';
import type { Plot } from './plots';

/**
 * The event engine.
 *
 * Events are driven by what you built, not by a clock. Stockpile value and
 * pirates take an interest; leave land bare and squatters move in; build tall
 * on a headland and the wind finds you. Every lot ends up with its own threat
 * profile, authored by its owner's choices, which is what stops this going
 * stale the way a "pirate season" would.
 *
 * Three rules hold it together:
 *  - Risk is visible, timing is not. You can read the pressure; you cannot
 *    read the clock.
 *  - Pressure rises while an event stays dormant and resets when it fires, so
 *    you get neither long droughts nor three hits in a row.
 *  - Seasons tilt the odds rather than scheduling anything.
 */

export type EventKind = 'hazard' | 'boon' | 'mixed';
export type EventSeverity = 'nuisance' | 'serious' | 'catastrophic' | 'windfall';

/** What a lot looks like to the engine. */
export interface LotProfile {
  /** Total $ISLAND standing on the lot. */
  value: number;
  /** Share of the lot covered by anything at all, 0-1. */
  developed: number;
  /** Tallest thing built, in paces. */
  height: number;
  /** Counts of what is present, by kit id. */
  has: Record<string, number>;
  tier: Plot['tier'];
  islandId: string;
  /** Defences that reduce pressure or improve outcomes. */
  defences: { fence: boolean; tower: boolean; lockup: boolean; lights: boolean };
}

export interface IslandEventDef {
  id: string;
  icon: string;
  name: string;
  kind: EventKind;
  severity: EventSeverity;
  /** One line shown before it fires, describing the exposure. */
  exposure: string;
  /** What happens. */
  copy: string;
  /** How to reduce the risk, or turn it to your advantage. */
  defence: string;
  /**
   * How exposed this lot is, 0 (cannot happen) to 1 (extremely exposed).
   * This is the whole design: it reads the build, not the calendar.
   */
  pressure: (lot: LotProfile) => number;
  /** Seasonal weighting, by season index 0-3. */
  season?: [number, number, number, number];
}

export const SEASONS = ['Dry', 'Storm', 'Green', 'Still'] as const;
export type Season = (typeof SEASONS)[number];

/** A slow year that tilts the odds. Nothing here schedules an event. */
export function seasonAt(date = new Date()): { index: number; name: Season } {
  // An island year is eight real days, so a season turns every two.
  const cycle = 8 * 24 * 60 * 60 * 1000;
  const p = (date.getTime() % cycle) / cycle;
  const index = Math.min(3, Math.floor(p * 4));
  return { index, name: SEASONS[index] };
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/**
 * How fast pressure builds, by severity. A nuisance is a regular part of
 * island life; "the big one" should be something you talk about for months,
 * so it accumulates roughly twenty times more slowly.
 */
const SEVERITY_RATE: Record<EventSeverity, number> = {
  nuisance: 0.05,
  windfall: 0.045,
  serious: 0.018,
  catastrophic: 0.0025,
};

export const EVENT_DEFS: IslandEventDef[] = [
  /* ------------------------------------------------------------ weather -- */
  {
    id: 'squall',
    icon: '⛈️',
    name: 'Squall',
    kind: 'hazard',
    severity: 'nuisance',
    exposure: 'Anything loose on the lot is one gust from being somebody else’s.',
    copy: 'Roofs lift, fences lean, and whatever you did not tie down is now on a different island.',
    defence: 'Sturdier roofing and a fence line. Or accept the donation to Snack Key.',
    pressure: (l) => clamp01(0.18 + l.developed * 0.4 + (l.has.fence ? -0.08 : 0.06)),
    season: [0.6, 2.4, 1, 0.5],
  },
  {
    id: 'hurricane',
    icon: '🌀',
    name: 'The big one',
    kind: 'hazard',
    severity: 'catastrophic',
    exposure: 'A named storm is forming somewhere out past the C.',
    copy: 'It crosses the whole ARC. Everyone gets warning. Nobody is ever ready. Streets go back to sand.',
    defence: 'Shutters, a seawall and neighbours who turn up. Rebuilt lots come back tougher.',
    pressure: (l) => clamp01(0.04 + l.height / 120 + l.developed * 0.08),
    season: [0.2, 3, 0.6, 0.1],
  },
  {
    id: 'kingtide',
    icon: '🌊',
    name: 'King tide',
    kind: 'hazard',
    severity: 'serious',
    exposure: 'The water comes further up than the tide chart admits.',
    copy: 'Half the lot goes under for six hours. Anything at ground level learns to swim.',
    defence: 'Build on stilts, or keep the ground floor for things that do not mind.',
    pressure: (l) =>
      clamp01((l.tier === 'beachfront' ? 0.4 : 0.06) + (l.has.dock ? 0.15 : 0) - (l.has.hut ? 0.12 : 0)),
    season: [0.5, 2, 1, 0.8],
  },
  {
    id: 'glass',
    icon: '☀️',
    name: 'A glass-calm week',
    kind: 'boon',
    severity: 'windfall',
    exposure: 'The forecast is doing nothing at all, which around here is an event.',
    copy: 'No wind, no swell, no weather. Everyone comes outside. Anything with a bar does very well.',
    defence: 'Nothing to defend. Open early.',
    pressure: (l) => clamp01(0.12 + (l.has.bar ? 0.25 : 0) + (l.has.pool ? 0.12 : 0)),
    season: [1.6, 0.2, 1, 1.8],
  },

  /* ------------------------------------------------------------- wealth -- */
  {
    id: 'pirates',
    icon: '🏴‍☠️',
    name: 'Pirates',
    kind: 'mixed',
    severity: 'serious',
    exposure: 'Word travels about which docks are worth visiting and which are watched.',
    copy: 'They come for stock and takings, not structures. A defended raid is worth more than a quiet night.',
    defence: 'A watchtower, a lock-up, or a neighbour who owes you one.',
    pressure: (l) =>
      clamp01(
        l.value / 9000 +
          (l.has.dock ? 0.14 : 0) +
          (l.defences.tower ? -0.22 : 0.05) +
          (l.defences.lights ? -0.08 : 0),
      ),
    season: [1.4, 0.5, 1, 1.2],
  },
  {
    id: 'boom',
    icon: '📈',
    name: 'Tourist boom',
    kind: 'boon',
    severity: 'windfall',
    exposure: 'Somebody posted a photograph of your street and it went further than expected.',
    copy: 'The boats arrive full for a week. Anything you built that serves people pays for itself.',
    defence: 'None needed. Raise your prices.',
    pressure: (l) => clamp01(l.developed * 0.35 + (l.has.bar ? 0.2 : 0) + (l.has.container ? 0.12 : 0)),
    season: [1.8, 0.3, 1.2, 1],
  },
  {
    id: 'influencer',
    icon: '📸',
    name: 'An influencer stays',
    kind: 'mixed',
    severity: 'windfall',
    exposure: 'Your build is photogenic, which is not the unqualified good you think it is.',
    copy: 'They stay four nights, film everything, and leave. Attention arrives. So does everyone else.',
    defence: 'Enjoy it. The neighbours will not.',
    pressure: (l) => clamp01((l.has.villa ? 0.22 : 0) + (l.has.pool ? 0.18 : 0) + l.height / 200),
    season: [1.5, 0.4, 1, 1.1],
  },

  /* ------------------------------------------------------------ neglect -- */
  {
    id: 'squatters',
    icon: '🏕️',
    name: 'Squatters',
    kind: 'hazard',
    severity: 'nuisance',
    exposure: 'Empty land does not stay empty on an island this size.',
    copy: 'Someone moves on, builds something worse than you would have, and becomes hard to remove politely.',
    defence: 'Build something. Anything. A fence counts, barely.',
    pressure: (l) => clamp01(0.55 - l.developed * 1.1),
    season: [1, 0.6, 1.4, 1],
  },
  {
    id: 'overgrowth',
    icon: '🌿',
    name: 'Overgrowth',
    kind: 'mixed',
    severity: 'nuisance',
    exposure: 'The forest is extremely relaxed about property lines.',
    copy: 'The green takes back whatever you left alone. Occasionally it uncovers something while it does.',
    defence: 'Clear it. Or do not, and see what turns up.',
    pressure: (l) => clamp01(0.3 - l.developed * 0.5 + (l.has.palms ? 0.2 : 0) + (l.has.planter ? 0.1 : 0)),
    season: [0.5, 1, 2.2, 0.8],
  },

  /* -------------------------------------------------------------- place -- */
  {
    id: 'sharks',
    icon: '🦈',
    name: 'Something with a jaw',
    kind: 'hazard',
    severity: 'serious',
    exposure: 'The reef drops off fast here, and the reef has residents.',
    copy: 'The dock is closed for a few days, and the story gets better every time it is told.',
    defence: 'Nets and lights, and not swimming at dusk.',
    pressure: (l) =>
      clamp01((l.has.dock ? 0.35 : 0.05) + (l.tier === 'beachfront' ? 0.15 : 0) - (l.defences.lights ? 0.1 : 0)),
    season: [1.3, 0.8, 1, 1.2],
  },
  {
    id: 'piranha',
    icon: '🐟',
    name: 'The lagoon turns',
    kind: 'hazard',
    severity: 'serious',
    exposure: 'The lagoon was completely fine last season.',
    copy: 'It is less fine now. Nobody is swimming, and the pool suddenly looks like a very good investment.',
    defence: 'Stay out of the water. Charge for pool access.',
    pressure: (l) => clamp01(0.1 + (l.has.pool ? -0.05 : 0.08) + (l.islandId === 'waist' ? 0.25 : 0)),
    season: [1.2, 0.7, 1.5, 1],
  },
  {
    id: 'landslide',
    icon: '⛰️',
    name: 'The hill moves',
    kind: 'hazard',
    severity: 'catastrophic',
    exposure: 'High ground is high because it has not finished falling down yet.',
    copy: 'A section of headland goes into the sea, taking whatever was standing on it.',
    defence: 'Terracing and planting. Roots hold hills together.',
    pressure: (l) =>
      clamp01((l.tier === 'headland' ? 0.3 : 0.02) + l.height / 150 - (l.has.planter ? 0.12 : 0)),
    season: [0.4, 2.2, 1.1, 0.5],
  },
  {
    id: 'eruption',
    icon: '🌋',
    name: 'The caldera stirs',
    kind: 'hazard',
    severity: 'catastrophic',
    exposure: 'You bought next to a volcano. This was always in the price.',
    copy: 'Ash first, then the glow, then the part where the cheapest land in the archipelago justifies itself.',
    defence: 'None. That was the deal.',
    pressure: (l) => clamp01(l.islandId === 'smoking' ? 0.42 + l.developed * 0.1 : 0),
    season: [1, 1, 1, 1.4],
  },

  /* --------------------------------------------------------------- rare -- */
  {
    id: 'salvage',
    icon: '📦',
    name: 'Salvage washes up',
    kind: 'boon',
    severity: 'windfall',
    exposure: 'Things that go into the sea out there come back in here.',
    copy: 'Timber, rope, a crate of something, and one item nobody can identify. All of it yours.',
    defence: 'Get down to the beach before your neighbours do.',
    pressure: (l) => clamp01(0.1 + (l.tier === 'beachfront' ? 0.2 : 0) + (l.has.dock ? 0.1 : 0)),
    season: [0.8, 2, 0.8, 0.9],
  },
  {
    id: 'crab',
    icon: '🦀',
    name: 'The crab returns',
    kind: 'mixed',
    severity: 'nuisance',
    exposure: 'It has learned how doors work. It is not clear what it wants.',
    copy: 'It gets in, rearranges something, and leaves. Guests find it charming. You have stopped finding it charming.',
    defence: 'There is no defence. There is only the crab.',
    pressure: () => 0.07,
    season: [1, 1, 1, 1],
  },
];

export const EVENT_BY_ID: Record<string, IslandEventDef> = Object.fromEntries(
  EVENT_DEFS.map((e) => [e.id, e]),
);

/** Reads a build into the profile the engine reasons about. */
export function profileOf(items: Placed[], plot: Plot | null): LotProfile {
  const has: Record<string, number> = {};
  let value = 0;
  let area = 0;
  let height = 0;

  for (const p of items) {
    const kit = KIT_BY_ID[p.kitId];
    if (!kit) continue;
    has[p.kitId] = (has[p.kitId] ?? 0) + 1;
    value += kit.cost;
    area += kit.size[0] * kit.size[1];
    // A rough stand-in for how tall a thing is, from what it is.
    const tall = p.kitId === 'tower' ? 18 : p.kitId === 'villa' ? 12 : p.kitId === 'billboard' ? 12 : 6;
    height = Math.max(height, tall);
  }

  const lotArea = plot ? plot.frontage * plot.depth : 18 * 25;

  return {
    value,
    developed: clamp01(area / lotArea),
    height,
    has,
    tier: plot?.tier ?? 'inland',
    islandId: plot?.islandId ?? 'arrivals',
    defences: {
      fence: !!has.fence,
      tower: !!has.tower,
      lockup: !!has.container,
      lights: !!has.torch || !!has.neon,
    },
  };
}

export interface Exposure {
  def: IslandEventDef;
  /** 0-1 after seasonal weighting. */
  risk: number;
  /**
   * Exposure weighted by how quickly this severity builds — a catastrophe you
   * are badly exposed to is still rarer than a nuisance you are not, and the
   * reading should say so rather than shouting HIGH at everything.
   */
  likelihood: number;
  band: 'none' | 'low' | 'watch' | 'high';
}

/** What this lot is exposed to right now, most exposed first. */
export function exposures(profile: LotProfile, season = seasonAt().index): Exposure[] {
  return EVENT_DEFS.map((def) => {
    const base = def.pressure(profile);
    const weight = def.season ? def.season[season] : 1;
    const risk = clamp01(base * weight);
    const likelihood = risk * SEVERITY_RATE[def.severity];
    const band: Exposure['band'] =
      risk <= 0.001
        ? 'none'
        : likelihood < 0.003
          ? 'low'
          : likelihood < 0.012
            ? 'watch'
            : 'high';
    return { def, risk, likelihood, band };
  })
    .filter((e) => e.band !== 'none')
    .sort((a, b) => b.likelihood - a.likelihood);
}

/* ------------------------------------------------------------- firing -- */

export interface FiredEvent {
  id: string;
  /** Tick it fired on, so the log can be replayed identically. */
  tick: number;
  at: number;
}

export interface EventState {
  /** Tick index this lot was last brought up to date. */
  lastTick: number;
  /** Accumulated pressure per event id. */
  tension: Record<string, number>;
  log: FiredEvent[];
  /** 0-100. Hazards lower it, repairs raise it. Never destroys anything. */
  condition: number;
  /** How many times each event has visited, so they can escalate. */
  visits: Record<string, number>;
}

export const NEW_EVENT_STATE: EventState = {
  lastTick: 0,
  tension: {},
  log: [],
  condition: 100,
  visits: {},
};

/** One tick per hour of real time. */
const TICK_MS = 60 * 60 * 1000;
/** Never resolve more than this after a long absence. */
const MAX_CATCHUP = 8;
/** However long you have been away, only this many things happened. */
const MAX_PER_VISIT = 3;


export function tickNow(date = new Date()): number {
  return Math.floor(date.getTime() / TICK_MS);
}

/** Deterministic roll, so reloading cannot reroll an outcome. */
function roll(lotId: string, tick: number, eventId: string): number {
  let h = 2166136261;
  const str = `${lotId}:${tick}:${eventId}`;
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

const SEVERITY_WEAR: Record<EventSeverity, number> = {
  nuisance: 4,
  serious: 11,
  catastrophic: 22,
  windfall: 0,
};

/**
 * Wear never runs a lot into the ground. Neglect should make a place look
 * weathered, not punish someone for having a life away from it.
 */
const CONDITION_FLOOR = 25;

/**
 * Brings a lot up to date. Pressure accumulates while an event stays away and
 * resets when it arrives, so you get neither long droughts nor three hits in a
 * row. Nothing here removes what you built — hazards wear a lot down, and
 * wear is repairable.
 */
export function advance(
  lotId: string,
  state: EventState,
  profile: LotProfile,
  now = new Date(),
): { state: EventState; fired: FiredEvent[] } {
  const target = tickNow(now);
  const from = state.lastTick === 0 ? target - 1 : state.lastTick;
  const start = Math.max(from, target - MAX_CATCHUP);

  const next: EventState = {
    ...state,
    tension: { ...state.tension },
    visits: { ...state.visits },
    log: [...state.log],
  };
  const fired: FiredEvent[] = [];

  for (let tick = start + 1; tick <= target; tick++) {
    const season = Math.floor(
      ((tick * TICK_MS) % (8 * 24 * 60 * 60 * 1000)) / (2 * 24 * 60 * 60 * 1000),
    );

    // The island does one thing at a time. Everything builds pressure, but
    // only the one that actually breaks through arrives.
    let winner: { id: string; def: IslandEventDef } | null = null;
    let winnerMargin = 0;

    for (const e of exposures(profile, season)) {
      const id = e.def.id;
      const grown = (next.tension[id] ?? 0) + e.risk * SEVERITY_RATE[e.def.severity];
      const r = roll(lotId, tick, id);
      if (r < grown) {
        const margin = grown - r;
        if (margin > winnerMargin) {
          winnerMargin = margin;
          winner = { id, def: e.def };
        }
      }
      next.tension[id] = Math.min(0.9, grown);
    }

    if (winner && fired.length < MAX_PER_VISIT) {
      next.tension[winner.id] = 0;
      next.visits[winner.id] = (next.visits[winner.id] ?? 0) + 1;
      const rec = { id: winner.id, tick, at: tick * TICK_MS };
      fired.push(rec);
      next.log.push(rec);
      if (winner.def.kind !== 'boon') {
        next.condition = Math.max(
          CONDITION_FLOOR,
          next.condition - SEVERITY_WEAR[winner.def.severity],
        );
      }
    }
  }

  next.lastTick = target;
  // Keep the log readable.
  next.log = next.log.slice(-40);
  return { state: next, fired };
}

/** Repairing wear costs $ISLAND and is always available. */
export function repairCost(condition: number): number {
  return Math.round((100 - condition) * 12);
}

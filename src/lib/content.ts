/**
 * All site copy lives here so the tone stays in one place and the world/game
 * can reuse the same island + excursion definitions later.
 */

export type Vibe = 'good' | 'mixed' | 'cursed';

export interface Island {
  id: string;
  num: string;
  name: string;
  tagline: string;
  blurb: string;
  perks: string[];
  /**
   * World-space position (x, z). The five main islands are laid out so the
   * archipelago reads as the ARCHipelago "A" from above, matching the logo:
   * one apex island, two diagonal stroke islands, two leg islands.
   */
  pos: [number, number];
  /** Footprint of the landmass: radii along x/z plus a yaw, in radians. */
  shape: { rx: number; rz: number; rot: number };
  /** True for the five islands that form the letter; false for outliers. */
  letterform: boolean;
  /** plot pricing shown on the booking card, in $ISLAND */
  fromPrice: number;
  plotsLeft: number;
  vibe: Vibe;
}

export const ISLANDS: Island[] = [
  {
    id: 'arrivals',
    num: '01',
    name: 'Arrivals Cay',
    tagline: 'Where everybody lands with one bag and zero plan.',
    blurb:
      'The dock, the welcome rum, the guy who tells you about his portfolio before he tells you his name. Your first plot is cheap here because the neighbours are, frankly, a lot.',
    perks: ['🛬 Boat every 20 min', '🥤 Welcome drink', '🧍 Aggressive small talk'],
    pos: [0, -10.5],
    shape: { rx: 2.5, rz: 2.2, rot: 0 },
    letterform: true,
    fromPrice: 250,
    plotsLeft: 88,
    vibe: 'good',
  },
  {
    id: 'nap',
    num: '02',
    name: 'Nap Atoll',
    tagline: 'Hammocks, private coves, and a strict ban on the phrase "quick sync".',
    blurb:
      'Signal is suspiciously weak. Time moves differently. People have gone in for an afternoon and come out with a beard and a new philosophy.',
    perks: ['😴 Elite napping', '🌴 Quiet beach', '📵 Suspiciously weak signal'],
    pos: [-5.4, -2.6],
    shape: { rx: 2.0, rz: 4.0, rot: -0.42 },
    letterform: true,
    fromPrice: 400,
    plotsLeft: 41,
    vibe: 'good',
  },
  {
    id: 'snack',
    num: '03',
    name: 'Snack Key',
    tagline: 'Open-air kitchens and a bakery that treats 2 PM like breakfast.',
    blurb:
      'Ridiculous fruit. Late-night fries. A grill that has been on since 2019. Build here and you will never cook again, but you will develop opinions about mango.',
    perks: ['🍟 Emergency fries', '🥐 Late breakfast', '🥭 Fruit with main-character energy'],
    pos: [5.4, -2.6],
    shape: { rx: 2.0, rz: 4.0, rot: 0.42 },
    letterform: true,
    fromPrice: 520,
    plotsLeft: 27,
    vibe: 'good',
  },
  {
    id: 'boat',
    num: '04',
    name: 'Boat People Cay',
    tagline: 'Sail somewhere, anchor nowhere, return with a better hat.',
    blurb:
      'The marina island. Everyone here owns a boat and a strong opinion about knots. Also: the reef drops off fast, and the reef has residents.',
    perks: ['⛵ Tiny boats', '🤿 Reef trips', '🦈 Occasional incident'],
    pos: [-10.4, 5.6],
    shape: { rx: 3.4, rz: 1.9, rot: -0.30 },
    letterform: true,
    fromPrice: 610,
    plotsLeft: 19,
    vibe: 'mixed',
  },
  {
    id: 'main',
    num: '05',
    name: 'Main Character Island',
    tagline: 'The postcard. Long beach, absurd sunsets, temporarily fixes your personality.',
    blurb:
      'Beachfront is beachfront. The golden-hour bar is the single most photographed structure in the archipelago. Plots here are the reason the buyback exists.',
    perks: ['🌅 Sunset beach', '📸 Aggressive scenery', '🍸 Golden-hour bar'],
    pos: [10.4, 5.6],
    shape: { rx: 3.4, rz: 1.9, rot: 0.30 },
    letterform: true,
    fromPrice: 1200,
    plotsLeft: 6,
    vibe: 'good',
  },
  {
    id: 'smoking',
    num: '06',
    name: 'The Smoking Caldera',
    tagline: 'Technically an island. Legally a warning.',
    blurb:
      'Cheapest dirt in the archipelago, for reasons that become obvious around 3 AM. Rich soil, unbeatable views, non-zero lava. The locals call it "the opportunity".',
    perks: ['🌋 Non-zero lava', '💎 Absurd soil', '📉 Priced accordingly'],
    pos: [16.5, -9.5],
    shape: { rx: 2.6, rz: 2.4, rot: 0.2 },
    letterform: false,
    fromPrice: 90,
    plotsLeft: 212,
    vibe: 'cursed',
  },
];

export interface Excursion {
  id: string;
  time: string;
  duration: string;
  title: string;
  copy: string;
  icon: string;
  vibe: Vibe;
  /** what the concierge will not put in the brochure */
  smallPrint: string;
}

export const EXCURSIONS: Excursion[] = [
  {
    id: 'yacht',
    time: '11:00',
    duration: '3 hrs',
    title: 'Yacht to Nowhere',
    copy: 'Three hours. Twelve photos. Zero destination. Perfect.',
    icon: '⛵',
    vibe: 'good',
    smallPrint: 'Captain is licensed. Captain is not sober. These are separate facts.',
  },
  {
    id: 'reef',
    time: '09:30',
    duration: '2 hrs',
    title: 'Reef With Benefits',
    copy: 'Snorkel with fish who have never opened X. Learn from them.',
    icon: '🐠',
    vibe: 'mixed',
    smallPrint: 'Roughly 1 in 40 guests meets something with a jaw. Photos are incredible either way.',
  },
  {
    id: 'grotto',
    time: 'Unlisted',
    duration: '???',
    title: 'The Grotto Nobody Mentions',
    copy: 'There is a cave behind the waterfall. There is something in the cave.',
    icon: '🕳️',
    vibe: 'mixed',
    smallPrint: 'Not on the map. Not on the schedule. Ask the wrong local twice.',
  },
  {
    id: 'mushroom',
    time: '16:00',
    duration: 'Subjective',
    title: 'Guided Forest Tea Ceremony',
    copy: 'A local hands you a cup. The palm trees begin to have opinions.',
    icon: '🍄',
    vibe: 'mixed',
    smallPrint: 'Duration listed as "subjective" for legal and metaphysical reasons.',
  },
  {
    id: 'float',
    time: 'All day',
    duration: 'Very hard',
    title: 'Competitive Floating',
    copy: 'Pool float. Cold drink. Defend your title by barely moving.',
    icon: '🦩',
    vibe: 'good',
    smallPrint: 'Reigning champion has not stood up since Thursday.',
  },
  {
    id: 'caldera',
    time: '05:00',
    duration: '90 min',
    title: 'Sunrise Caldera Hike',
    copy: 'Climb the volcano. Watch the sun come up. Feel the ground do something.',
    icon: '🌋',
    vibe: 'cursed',
    smallPrint: 'The ground doing something is included in the price and is not refundable.',
  },
];

export interface Villa {
  id: string;
  name: string;
  copy: string;
  nightly: number;
  tag: string;
  features: string[];
}

export const VILLAS: Villa[] = [
  {
    id: 'bungalow',
    name: 'The Barely Online Bungalow',
    copy: 'One room, one hammock, one bar of signal that comes and goes like a rumour.',
    nightly: 120,
    tag: 'Starter shack',
    features: ['Sleeps 2', 'Outdoor shower', 'Roof: mostly'],
  },
  {
    id: 'groupchat',
    name: 'The Group Chat Villa',
    copy: 'Six beds, one bathroom, and a shared decision-making process that will not survive the week.',
    nightly: 380,
    tag: 'Most regretted',
    features: ['Sleeps 6', 'Private pool', 'Conflict guaranteed'],
  },
  {
    id: 'founder',
    name: "The Founder's Nap Suite",
    copy: 'Beachfront. Absurd. Comes with a hammock positioned so the sunset hits you personally.',
    nightly: 900,
    tag: 'Beachfront',
    features: ['Sleeps 4', 'Infinity pool', 'Butler who judges you'],
  },
];

export interface TreasuryLine {
  pct: number;
  label: string;
  detail: string;
  color: string;
}

/** Land-sale proceeds split. This is the real allocation, told as a resort invoice. */
export const TREASURY: TreasuryLine[] = [
  {
    pct: 35,
    label: 'Buyback & burn',
    detail: 'Every plot sold buys $ISLAND off the market and sets it on fire on the beach.',
    color: 'var(--coral)',
  },
  {
    pct: 30,
    label: 'Team',
    detail: 'The people building the island, and the ones who have to keep building it.',
    color: 'var(--mango)',
  },
  {
    pct: 20,
    label: 'Development & infra',
    detail: 'Servers, world-building, art, the boats, the shark budget.',
    color: 'var(--blue)',
  },
  {
    pct: 10,
    label: 'Treasury',
    detail: 'Runway, liquidity and whatever the island needs next.',
    color: 'var(--leaf)',
  },
  {
    pct: 5,
    label: 'Giveaways',
    detail: 'Free plots, events, and bribing people to show up.',
    color: 'var(--cyan)',
  },
];

export const FAQS: { q: string; a: string }[] = [
  {
    q: 'Is ARCHipelago a real resort?',
    a: 'No. It is a 3D island you buy land in and build on. Please do not arrive at an actual airport demanding the coconut transfer.',
  },
  {
    q: 'So what am I actually buying?',
    a: 'A plot of land in the world. You land on it with nothing, clear it, build on it, decorate it, and defend it from whatever the island decides to do that week.',
  },
  {
    q: 'What is $ISLAND for?',
    a: 'In-game only. Excursions, materials, upgrades, cosmetics, bar tabs. Land is sold separately, and 35% of every land sale is used to buy $ISLAND back and burn it.',
  },
  {
    q: 'Can bad things happen to my island?',
    a: 'Yes. That is the fun part. Sharks, lava, piranhas, weather, and one excursion we are not allowed to describe in the brochure.',
  },
  {
    q: 'Is there hidden treasure?',
    a: 'There are hidden grottos. What is in them is between you and the grotto. We have said too much.',
  },
  {
    q: 'Is there Wi-Fi?',
    a: 'Yes. We hate that for you.',
  },
];

export const REVIEWS: { stars: number; quote: string; who: string }[] = [
  {
    stars: 5,
    quote: 'Came for the ticker. Stayed because checkout was at noon and I own the hotel now.',
    who: 'Chad, still by the pool',
  },
  {
    stars: 5,
    quote: 'Built a bar on my plot. A shark ate my dock. Rebuilt the dock. This is the best week of my life.',
    who: 'Brenda, Boat People Cay',
  },
  {
    stars: 4,
    quote: 'Found a grotto. Cannot discuss the grotto. Four stars because of the grotto.',
    who: 'Anonymous, SPF 70',
  },
];

/**
 * All site copy lives here so the tone stays in one place and the world/game
 * can reuse the same island + excursion definitions later.
 */

export type Vibe = 'good' | 'mixed' | 'cursed';

/** The archipelago spells ARC. Each letter is its own section of islands. */
export type Letter = 'A' | 'R' | 'C';

/** World-space x offset of each letter, so the three read left to right. */
export const LETTER_ORIGIN: Record<Letter, number> = { A: 0, R: 42, C: 70 };

export const LETTERS: { id: Letter; name: string; blurb: string }[] = [
  {
    id: 'A',
    name: 'The A',
    blurb:
      'Arrivals. Every boat lands here, so every mistake starts here. Tourist-facing, loud at the dock, cheap at the edges.',
  },
  {
    id: 'R',
    name: 'The R',
    blurb:
      'The working letter. Markets, bars, the amphitheatre, and whoever is running a business out of a shipping container this month.',
  },
  {
    id: 'C',
    name: 'The C',
    blurb:
      'The quiet crescent. Retreats, weird tea, a hollow nobody will give you directions to. People come here to disappear tastefully.',
  },
];

export interface Island {
  id: string;
  num: string;
  name: string;
  tagline: string;
  blurb: string;
  perks: string[];
  /** Which letter of ARC this island belongs to. */
  letter: Letter;
  /**
   * Position (x, z). In ISLAND_DEFS this is local to the island's letter; the
   * exported ISLANDS array adds the letter origin to give world space.
   */
  pos: [number, number];
  /** Footprint of the landmass: radii along x/z plus a yaw, in radians. */
  shape: { rx: number; rz: number; rot: number };
  /** True for islands that draw the letter; false for outliers like the volcano. */
  letterform: boolean;
  /**
   * Indicative "from" price for the island, in USD. Land is sold for dollars;
   * $ISLAND is the in-island currency and is never used to buy land. Real
   * per-lot prices and availability come from lib/plots.ts.
   */
  fromPrice: number;
  vibe: Vibe;
}

const ISLAND_DEFS: Island[] = [
  {
    id: 'arrivals',
    letter: 'A',
    num: '01',
    name: 'Arrivals Cay',
    tagline: 'Where everybody lands with one bag and zero plan.',
    blurb:
      'The dock, the welcome rum, the guy who tells you about his portfolio before he tells you his name. Your first plot is cheap here because the neighbours are, frankly, a lot.',
    perks: ['🛬 Boat every 20 min', '🥤 Welcome drink', '🧍 Aggressive small talk'],
    pos: [0.0, -15.75],
    shape: { rx: 3.75, rz: 3.3, rot: 0 },
    letterform: true,
    fromPrice: 250,
    vibe: 'good',
  },
  {
    id: 'nap',
    letter: 'A',
    num: '02',
    name: 'Nap Atoll',
    tagline: 'Hammocks, private coves, and a strict ban on the phrase "quick sync".',
    blurb:
      'Signal is suspiciously weak. Time moves differently. People have gone in for an afternoon and come out with a beard and a new philosophy.',
    perks: ['😴 Elite napping', '🌴 Quiet beach', '📵 Suspiciously weak signal'],
    pos: [-8.1, -3.9],
    shape: { rx: 3.0, rz: 6.0, rot: -0.42 },
    letterform: true,
    fromPrice: 400,
    vibe: 'good',
  },
  {
    id: 'snack',
    letter: 'A',
    num: '03',
    name: 'Snack Key',
    tagline: 'Open-air kitchens and a bakery that treats 2 PM like breakfast.',
    blurb:
      'Ridiculous fruit. Late-night fries. A grill that has been on since 2019. Build here and you will never cook again, but you will develop opinions about mango.',
    perks: ['🍟 Emergency fries', '🥐 Late breakfast', '🥭 Fruit with main-character energy'],
    pos: [8.1, -3.9],
    shape: { rx: 3.0, rz: 6.0, rot: 0.42 },
    letterform: true,
    fromPrice: 520,
    vibe: 'good',
  },
  {
    id: 'boat',
    letter: 'A',
    num: '04',
    name: 'Boat People Cay',
    tagline: 'Sail somewhere, anchor nowhere, return with a better hat.',
    blurb:
      'The marina island. Everyone here owns a boat and a strong opinion about knots. Also: the reef drops off fast, and the reef has residents.',
    perks: ['⛵ Tiny boats', '🤿 Reef trips', '🦈 Occasional incident'],
    pos: [-15.6, 8.4],
    shape: { rx: 5.1, rz: 2.85, rot: -0.30 },
    letterform: true,
    fromPrice: 610,
    vibe: 'mixed',
  },
  {
    id: 'main',
    letter: 'A',
    num: '05',
    name: 'Main Character Island',
    tagline: 'The postcard. Long beach, absurd sunsets, temporarily fixes your personality.',
    blurb:
      'Beachfront is beachfront. The golden-hour bar is the single most photographed structure in the archipelago. Plots here are the reason the buyback exists.',
    perks: ['🌅 Sunset beach', '📸 Aggressive scenery', '🍸 Golden-hour bar'],
    pos: [15.6, 8.4],
    shape: { rx: 5.1, rz: 2.85, rot: 0.30 },
    letterform: true,
    fromPrice: 1200,
    vibe: 'good',
  },
  {
    id: 'smoking',
    letter: 'A',
    num: '06',
    name: 'The Smoking Caldera',
    tagline: 'Technically an island. Legally a warning.',
    blurb:
      'Cheapest dirt in the archipelago, for reasons that become obvious around 3 AM. Rich soil, unbeatable views, non-zero lava. The locals call it "the opportunity".',
    perks: ['🌋 Non-zero lava', '💎 Absurd soil', '📉 Priced accordingly'],
    pos: [-27.0, -13.5],
    shape: { rx: 3.9, rz: 3.6, rot: 0.2 },
    letterform: false,
    fromPrice: 90,
    vibe: 'cursed',
  },

  /* ------------------------------------------------------------ the R -- */
  {
    id: 'neon',
    letter: 'R',
    num: '07',
    name: 'Neon Spit',
    tagline: 'The top of the stem. Nothing here opens before four in the afternoon.',
    blurb:
      'A thin strip of bars stacked shoulder to shoulder, all of them insisting they are the original. The light is pink, the floor is tacky, and nobody has seen a sunrise on purpose.',
    perks: ['🍸 Bars, mostly', '🎶 Someone is DJing', '🌃 Opens at four'],
    pos: [-10, -12],
    shape: { rx: 2.4, rz: 5.0, rot: 0 },
    letterform: true,
    fromPrice: 700,
    vibe: 'mixed',
  },
  {
    id: 'market',
    letter: 'R',
    num: '08',
    name: 'Market Mile',
    tagline: 'The middle of the stem, and the only place on the ARC that actually works.',
    blurb:
      'Fish, fruit, rope, rum, counterfeit sunglasses, and a man who will sell you a boat he does not own. If your build needs materials, it came through here first.',
    perks: ['📦 Materials', '🐟 Fish at dawn', '🕶️ Legally distinct sunglasses'],
    pos: [-10, -3],
    shape: { rx: 2.4, rz: 5.0, rot: 0 },
    letterform: true,
    fromPrice: 880,
    vibe: 'good',
  },
  {
    id: 'lastcall',
    letter: 'R',
    num: '09',
    name: 'Last Call Point',
    tagline: 'The bottom of the stem, where the night goes to end badly.',
    blurb:
      'One pier, one bar, one bell. When the bell goes, the boats stop and you are a resident of this island until morning whether you planned to be or not.',
    perks: ['🔔 The bell', '🚤 Last boat', '😵 Regret, catered'],
    pos: [-10, 6],
    shape: { rx: 2.4, rz: 5.0, rot: 0 },
    letterform: true,
    fromPrice: 540,
    vibe: 'mixed',
  },
  {
    id: 'rooftop',
    letter: 'R',
    num: '10',
    name: 'Rooftop Reef',
    tagline: 'The top bar of the R. Everything is built upward because there is no room outward.',
    blurb:
      'The most vertical island in the archipelago. Stacked decks, rope bridges between roofs, and a reef directly underneath that people keep diving into from the third floor.',
    perks: ['🏗️ Build upward', '🌉 Rope bridges', '🤕 Third-floor diving'],
    pos: [-1, -14],
    shape: { rx: 5.5, rz: 2.2, rot: 0 },
    letterform: true,
    fromPrice: 960,
    vibe: 'mixed',
  },
  {
    id: 'bowl',
    letter: 'R',
    num: '11',
    name: 'The Bowl',
    tagline: 'A natural amphitheatre that the island has decided is a venue.',
    blurb:
      'Curved rock, absurd acoustics, and a crowd every night that nobody organised. Own a lot on the rim and you are effectively selling tickets to your own porch.',
    perks: ['🎤 Absurd acoustics', '🎟️ Porch economics', '📣 Never quiet'],
    pos: [5, -9],
    shape: { rx: 2.2, rz: 4.2, rot: 0 },
    letterform: true,
    fromPrice: 1050,
    vibe: 'good',
  },
  {
    id: 'waist',
    letter: 'R',
    num: '12',
    name: 'Waist Deep',
    tagline: 'The crossbar. Half of it is underwater at high tide and everyone is fine with this.',
    blurb:
      'Stilt houses, wooden walkways, and a tide chart on the wall of every building. Cheapest lots on the R, for reasons that arrive twice a day.',
    perks: ['🪵 Stilt houses', '🌊 Twice-daily tide', '💸 Priced for it'],
    pos: [-1, -4],
    shape: { rx: 5.0, rz: 2.1, rot: 0 },
    letterform: true,
    fromPrice: 380,
    vibe: 'mixed',
  },
  {
    id: 'kickstand',
    letter: 'R',
    num: '13',
    name: 'Kickstand Cay',
    tagline: "The R's leg, kicked out at an angle nobody has explained.",
    blurb:
      'A long diagonal spit pointing away from everything. Workshops, half-finished boats, and the only people on the ARC who own tools and know where they are.',
    perks: ['🔧 Workshops', '⛵ Half-built boats', '🧰 Actual tools'],
    pos: [4, 6],
    shape: { rx: 2.4, rz: 5.2, rot: 0.5 },
    letterform: true,
    fromPrice: 620,
    vibe: 'good',
  },

  /* ------------------------------------------------------------ the C -- */
  {
    id: 'crescent',
    letter: 'C',
    num: '14',
    name: 'Crescent Point',
    tagline: 'The top of the C, and the first quiet you have had in days.',
    blurb:
      'The noise from the R stops somewhere in the channel and does not make it here. Long pale beach, low buildings, and an unspoken rule about volume.',
    perks: ['🤫 Enforced calm', '🏖️ Pale beach', '📉 Low buildings'],
    pos: [2, -13],
    shape: { rx: 5.5, rz: 2.2, rot: 0 },
    letterform: true,
    fromPrice: 820,
    vibe: 'good',
  },
  {
    id: 'silent',
    letter: 'C',
    num: '15',
    name: 'Silent Bay',
    tagline: 'A retreat island. People arrive talkative and leave insufferable.',
    blurb:
      'Tea ceremonies, breathing workshops, and one guide who will take you into the forest and hand you a cup without explaining anything. Come back different.',
    perks: ['🍄 Forest tea', '🧘 Breathing, apparently', '🌫️ Morning fog'],
    pos: [-6, -9],
    shape: { rx: 2.4, rz: 4.0, rot: -0.5 },
    letterform: true,
    fromPrice: 760,
    vibe: 'mixed',
  },
  {
    id: 'hollow',
    letter: 'C',
    num: '16',
    name: 'The Hollow',
    tagline: 'There is a grotto here. Nobody will give you directions to it.',
    blurb:
      'The spine of the C, honeycombed with sea caves. Locals are polite, helpful, and completely unwilling to discuss what is behind the waterfall on the west side.',
    perks: ['🕳️ Sea caves', '💧 The waterfall', '🤐 Nobody will say'],
    pos: [-9, -2],
    shape: { rx: 2.2, rz: 5.0, rot: 0 },
    letterform: true,
    fromPrice: 690,
    vibe: 'mixed',
  },
  {
    id: 'moonrise',
    letter: 'C',
    num: '17',
    name: 'Moonrise Flats',
    tagline: 'Tidal flats that go silver at night and swallow anything you leave out.',
    blurb:
      'Enormous shallow flats, walkable at low tide, extremely not walkable otherwise. The moonrise here is the second most photographed thing in the archipelago and it knows it.',
    perks: ['🌕 Silver at night', '🚶 Low-tide walking', '🩴 Lost footwear'],
    pos: [-6, 5],
    shape: { rx: 2.4, rz: 4.0, rot: 0.5 },
    letterform: true,
    fromPrice: 580,
    vibe: 'mixed',
  },
  {
    id: 'lastlight',
    letter: 'C',
    num: '18',
    name: 'Last Light Cay',
    tagline: 'The bottom tip of the C. The final island before open water.',
    blurb:
      'A lighthouse, a bar attached to the lighthouse, and a view of absolutely nothing in three directions. The last sunset on the ARC happens here about forty seconds after everywhere else.',
    perks: ['🗼 Working lighthouse', '🌇 Latest sunset', '🌊 Open water'],
    pos: [2, 8],
    shape: { rx: 5.5, rz: 2.2, rot: 0 },
    letterform: true,
    fromPrice: 900,
    vibe: 'good',
  },
];

/**
 * Islands in world space. Letter-local coordinates get their letter's origin
 * added, so the three sections read as ARC from left to right.
 */
export const ISLANDS: Island[] = ISLAND_DEFS.map((d) => ({
  ...d,
  pos: [d.pos[0] + LETTER_ORIGIN[d.letter], d.pos[1]] as [number, number],
}));

export function islandsOfLetter(letter: Letter): Island[] {
  return ISLANDS.filter((i) => i.letter === letter);
}


export interface Excursion {
  id: string;
  time: string;
  duration: string;
  title: string;
  copy: string;
  icon: string;
  vibe: Vibe;
  /** Cost in $ISLAND. Adventures are what the token is for. */
  price: number;
  /** what the concierge will not put in the brochure */
  smallPrint: string;
}

export const EXCURSIONS: Excursion[] = [
  {
    id: 'yacht',
    price: 450,
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
    price: 280,
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
    price: 900,
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
    price: 320,
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
    price: 60,
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
    price: 640,
    time: '05:00',
    duration: '90 min',
    title: 'Sunrise Caldera Hike',
    copy: 'Climb the volcano. Watch the sun come up. Feel the ground do something.',
    icon: '🌋',
    vibe: 'cursed',
    smallPrint: 'The ground doing something is included in the price and is not refundable.',
  },
  {
    id: 'wreck',
    price: 780,
    time: '07:00',
    duration: '4 hrs',
    title: 'The Shipwreck Dive',
    copy: 'Something went down out there in 1911 and people are still arguing about what was on it.',
    icon: '\ud83e\udd3f',
    vibe: 'mixed',
    smallPrint: 'Anything you surface with is yours. Anything that surfaces with you is also yours.',
  },
  {
    id: 'pigs',
    price: 210,
    time: '10:00',
    duration: '90 min',
    title: 'The Pig Beach Situation',
    copy: 'There are pigs. They swim. They will board your boat. This is the whole activity.',
    icon: '\ud83d\udc16',
    vibe: 'good',
    smallPrint: 'Do not hold food above your head. Do not make eye contact with the big one.',
  },
  {
    id: 'fishing',
    price: 190,
    time: '20:00',
    duration: '3 hrs',
    title: 'Night Fishing With Gary',
    copy: 'Gary has one lantern, one cooler and forty years of stories, six of which are true.',
    icon: '\ud83c\udfa3',
    vibe: 'good',
    smallPrint: 'You will catch nothing. You will come back happier. Gary knows what he is doing.',
  },
  {
    id: 'cliff',
    price: 150,
    time: '17:30',
    duration: '45 min',
    title: 'Cliff Jump at Last Light',
    copy: 'A rock, a long drop, and the entire bar watching from above with opinions.',
    icon: '\ud83e\uddd7',
    vibe: 'mixed',
    smallPrint: 'The ledge everyone dares you to use is four metres higher and considerably stupider.',
  },
  {
    id: 'piranha',
    price: 410,
    time: '13:00',
    duration: '2 hrs',
    title: 'Piranha Lagoon Kayak',
    copy: 'The lagoon was completely fine last season. It is less fine now. Paddle briskly.',
    icon: '\ud83d\udc1f',
    vibe: 'cursed',
    smallPrint: 'Keep hands, feet and any recent cuts inside the kayak. Especially recent cuts.',
  },
  {
    id: 'parasail',
    price: 540,
    time: '15:00',
    duration: '40 min',
    title: 'Parasail Over the R',
    copy: 'Six hundred feet up, straight over Market Mile. The only way to see the letter you live on.',
    icon: '\ud83e\ude82',
    vibe: 'good',
    smallPrint: 'The winch is operated by a man who is also running the bar. It has been fine so far.',
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
    detail:
      'Land sells in dollars. 35 cents of every dollar buys $ISLAND on the open market and burns it.',
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

import * as THREE from 'three';
import { MATS, palm } from './geometry';

/**
 * The build catalogue. Every piece is procedural Three.js geometry built from
 * the same materials as the islands, so a lot you build reads as part of the
 * same world as the hero.
 */

export type KitCategory = 'structures' | 'leisure' | 'nature' | 'utility' | 'signage';

export interface KitItem {
  id: string;
  name: string;
  blurb: string;
  category: KitCategory;
  /** Cost in $ISLAND. */
  cost: number;
  /** Footprint in paces, which is what a builder cell measures. */
  size: [number, number];
  /** Build the mesh. */
  make: () => THREE.Group;
}

export const CATEGORY_LABEL: Record<KitCategory, string> = {
  structures: 'Structures',
  leisure: 'Leisure',
  nature: 'Nature',
  utility: 'Utility',
  signage: 'Signage',
};

const M = {
  ...MATS,
  plaster: new THREE.MeshStandardMaterial({ color: 0xfff6e8, roughness: 0.9 }),
  teak: new THREE.MeshStandardMaterial({ color: 0xa8703c, roughness: 0.85 }),
  darkwood: new THREE.MeshStandardMaterial({ color: 0x6b4526, roughness: 0.9 }),
  glass: new THREE.MeshStandardMaterial({
    color: 0x9fe8ff,
    roughness: 0.1,
    metalness: 0.2,
    transparent: true,
    opacity: 0.55,
  }),
  water: new THREE.MeshStandardMaterial({
    color: 0x35c9dd,
    roughness: 0.15,
    metalness: 0.15,
  }),
  canvasCol: new THREE.MeshStandardMaterial({
    color: 0xff7258,
    roughness: 0.9,
    side: THREE.DoubleSide,
  }),
  metal: new THREE.MeshStandardMaterial({ color: 0xb9c4cb, roughness: 0.4, metalness: 0.7 }),
  neon: new THREE.MeshStandardMaterial({
    color: 0x38d7f4,
    emissive: 0x38d7f4,
    emissiveIntensity: 2.2,
  }),
  ember: new THREE.MeshStandardMaterial({
    color: 0xff7b1f,
    emissive: 0xff5500,
    emissiveIntensity: 2.6,
  }),
  container: new THREE.MeshStandardMaterial({ color: 0xd4663f, roughness: 0.7 }),
};

function mesh(g: THREE.BufferGeometry, m: THREE.Material, y = 0) {
  const o = new THREE.Mesh(g, m);
  o.position.y = y;
  o.castShadow = true;
  o.receiveShadow = true;
  return o;
}

/* ------------------------------------------------------------ structures -- */

function shack() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.9, 0.62, 0.8), M.plaster, 0.31));
  const roof = mesh(new THREE.ConeGeometry(0.78, 0.44, 4), M.thatch, 0.83);
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  const door = mesh(new THREE.BoxGeometry(0.26, 0.4, 0.04), M.darkwood, 0.2);
  door.position.z = 0.41;
  g.add(door);
  return g;
}

function beachHut() {
  const g = new THREE.Group();
  // Raised on stilts, because the tide has opinions.
  for (const [x, z] of [[-0.42, -0.36], [0.42, -0.36], [-0.42, 0.36], [0.42, 0.36]]) {
    const p = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.42, 6), M.darkwood, 0.21);
    p.position.set(x, 0.21, z);
    g.add(p);
  }
  g.add(mesh(new THREE.BoxGeometry(1.05, 0.08, 0.9), M.teak, 0.46));
  g.add(mesh(new THREE.BoxGeometry(0.92, 0.6, 0.78), M.plaster, 0.8));
  const roof = mesh(new THREE.ConeGeometry(0.84, 0.4, 4), M.thatch, 1.3);
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  return g;
}

function villa() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(1.9, 0.78, 1.5), M.plaster, 0.39));
  g.add(mesh(new THREE.BoxGeometry(1.1, 0.7, 1.1), M.plaster, 1.13));
  const roof = mesh(new THREE.BoxGeometry(2.05, 0.1, 1.65), M.teak, 0.83);
  g.add(roof);
  g.add(mesh(new THREE.BoxGeometry(1.2, 0.08, 1.2), M.teak, 1.52));
  // Glass frontage facing the water.
  const win = mesh(new THREE.BoxGeometry(1.5, 0.46, 0.04), M.glass, 0.42);
  win.position.z = 0.76;
  g.add(win);
  return g;
}

function beachBar() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(1.7, 0.1, 1.3), M.teak, 0.05));
  // Bar counter
  g.add(mesh(new THREE.BoxGeometry(1.4, 0.5, 0.3), M.darkwood, 0.35));
  // Four posts and a thatch roof
  for (const [x, z] of [[-0.75, -0.55], [0.75, -0.55], [-0.75, 0.55], [0.75, 0.55]]) {
    const p = mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 6), M.trunk, 0.5);
    p.position.set(x, 0.5, z);
    g.add(p);
  }
  const roof = mesh(new THREE.ConeGeometry(1.35, 0.44, 4), M.thatch, 1.2);
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  // Bottles
  for (let i = 0; i < 5; i++) {
    const b = mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.16, 6), M.glass, 0.68);
    b.position.set(-0.45 + i * 0.22, 0.68, -0.05);
    g.add(b);
  }
  return g;
}

function watchtower() {
  const g = new THREE.Group();
  for (const [x, z] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) {
    const p = mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.7, 6), M.darkwood, 0.85);
    p.position.set(x, 0.85, z);
    g.add(p);
  }
  g.add(mesh(new THREE.BoxGeometry(0.9, 0.08, 0.9), M.teak, 1.72));
  g.add(mesh(new THREE.BoxGeometry(0.76, 0.34, 0.76), M.plaster, 1.93));
  const roof = mesh(new THREE.ConeGeometry(0.72, 0.34, 4), M.thatch, 2.26);
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  const lamp = mesh(new THREE.SphereGeometry(0.09, 10, 8), M.ember, 1.95);
  lamp.position.z = 0.4;
  g.add(lamp);
  return g;
}

function containerShop() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(1.9, 0.72, 0.85), M.container, 0.36));
  // Corrugation
  for (let i = 0; i < 9; i++) {
    const r = mesh(new THREE.BoxGeometry(0.03, 0.72, 0.87), M.container, 0.36);
    r.position.x = -0.85 + i * 0.21;
    g.add(r);
  }
  const awn = mesh(new THREE.BoxGeometry(1.5, 0.03, 0.5), M.canvasCol, 0.78);
  awn.position.z = 0.5;
  awn.rotation.x = -0.28;
  g.add(awn);
  return g;
}

/* --------------------------------------------------------------- leisure -- */

function pool() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(1.9, 0.14, 1.5), M.plaster, 0.07));
  const w = mesh(new THREE.BoxGeometry(1.6, 0.1, 1.2), M.water, 0.12);
  g.add(w);
  return g;
}

function cabana() {
  const g = new THREE.Group();
  for (const [x, z] of [[-0.42, -0.42], [0.42, -0.42], [-0.42, 0.42], [0.42, 0.42]]) {
    const p = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 6), M.teak, 0.45);
    p.position.set(x, 0.45, z);
    g.add(p);
  }
  const top = mesh(new THREE.BoxGeometry(1.05, 0.06, 1.05), M.canvasCol, 0.92);
  g.add(top);
  const bed = mesh(new THREE.BoxGeometry(0.7, 0.12, 0.5), M.plaster, 0.16);
  g.add(bed);
  return g;
}

function firePit() {
  const g = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const r = mesh(new THREE.DodecahedronGeometry(0.11, 0), M.rock, 0.08);
    r.position.set(Math.cos(a) * 0.34, 0.08, Math.sin(a) * 0.34);
    g.add(r);
  }
  const fire = mesh(new THREE.ConeGeometry(0.2, 0.34, 7), M.ember, 0.17);
  fire.name = 'flicker';
  g.add(fire);
  const light = new THREE.PointLight(0xff7b1f, 6, 5, 2);
  light.position.y = 0.4;
  g.add(light);
  return g;
}

function dockPiece() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.9, 0.08, 1.9), M.deck, 0.18));
  for (const z of [-0.7, 0, 0.7]) {
    for (const x of [-0.33, 0.33]) {
      const p = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.6, 6), M.trunk, -0.1);
      p.position.set(x, -0.1, z);
      g.add(p);
    }
  }
  return g;
}

/* ---------------------------------------------------------------- nature -- */

function palmSingle() {
  const g = new THREE.Group();
  const p = palm(1.05, 3);
  g.add(p);
  return g;
}

function palmCluster() {
  const g = new THREE.Group();
  const spots: [number, number, number][] = [
    [-0.3, 0.9, 0.2],
    [0.28, 1.15, -0.25],
    [0.05, 0.8, 0.42],
  ];
  spots.forEach(([x, s, z], i) => {
    const p = palm(s, i * 2.3);
    p.position.set(x, 0, z);
    g.add(p);
  });
  return g;
}

function boulder() {
  const g = new THREE.Group();
  const r = mesh(new THREE.DodecahedronGeometry(0.42, 0), M.rock, 0.3);
  r.scale.set(1, 0.78, 0.9);
  r.rotation.set(0.4, 0.8, 0.2);
  g.add(r);
  const r2 = mesh(new THREE.DodecahedronGeometry(0.22, 0), M.rock, 0.16);
  r2.position.set(0.38, 0.16, 0.24);
  g.add(r2);
  return g;
}

function planter() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.9, 0.22, 0.9), M.teak, 0.11));
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const b = mesh(new THREE.IcosahedronGeometry(0.15, 0), M.leaf, 0.3);
    b.position.set(Math.cos(a) * 0.24, 0.3 + (i % 2) * 0.06, Math.sin(a) * 0.24);
    g.add(b);
  }
  return g;
}

/* --------------------------------------------------------------- utility -- */

function fence() {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const p = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 6), M.darkwood, 0.25);
    p.position.x = -0.42 + i * 0.28;
    g.add(p);
  }
  for (const y of [0.2, 0.38]) {
    g.add(mesh(new THREE.BoxGeometry(1, 0.05, 0.04), M.darkwood, y));
  }
  return g;
}

function pathTile() {
  const g = new THREE.Group();
  const t = mesh(new THREE.BoxGeometry(0.96, 0.06, 0.96), M.sandWet, 0.03);
  g.add(t);
  return g;
}

function tikiTorch() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.1, 6), M.darkwood, 0.55));
  const bowl = mesh(new THREE.CylinderGeometry(0.1, 0.06, 0.14, 8), M.metal, 1.15);
  g.add(bowl);
  const flame = mesh(new THREE.ConeGeometry(0.08, 0.2, 6), M.ember, 1.3);
  flame.name = 'flicker';
  g.add(flame);
  const l = new THREE.PointLight(0xff9a3c, 3.4, 4, 2);
  l.position.y = 1.32;
  g.add(l);
  return g;
}

/* --------------------------------------------------------------- signage -- */

/** Frames only — the panel itself is added by the billboard component. */
function billboardFrame() {
  const g = new THREE.Group();
  // Deliberately oversized: a billboard nobody can read is just a fence post.
  for (const x of [-1.0, 1.0]) {
    const p = mesh(new THREE.BoxGeometry(0.12, 2.9, 0.12), M.metal, 1.45);
    p.position.x = x;
    g.add(p);
  }
  g.add(mesh(new THREE.BoxGeometry(2.5, 0.12, 0.18), M.metal, 2.92));
  g.add(mesh(new THREE.BoxGeometry(2.5, 0.1, 0.18), M.metal, 1.22));
  // Diagonal braces, so it looks like it would survive a squall.
  for (const x of [-1.0, 1.0]) {
    const b = mesh(new THREE.BoxGeometry(0.07, 1.5, 0.07), M.metal, 0.75);
    b.position.set(x, 0.75, 0.35);
    b.rotation.x = -0.42;
    g.add(b);
  }
  g.name = 'billboard';
  return g;
}

function signPost() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 6), M.darkwood, 0.7));
  g.name = 'sign';
  return g;
}

function neonSign() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.1, 6), M.metal, 0.55));
  const ring = mesh(new THREE.TorusGeometry(0.3, 0.035, 8, 24), M.neon, 1.35);
  g.add(ring);
  const l = new THREE.PointLight(0x38d7f4, 5, 5, 2);
  l.position.y = 1.35;
  g.add(l);
  g.name = 'neon';
  return g;
}

export const KIT: KitItem[] = [
  {
    id: 'shack',
    name: 'Starter shack',
    blurb: 'One room. Technically shelter. Everyone starts here.',
    category: 'structures',
    cost: 120,
    size: [4, 4],
    make: shack,
  },
  {
    id: 'hut',
    name: 'Stilt hut',
    blurb: 'Raised, because the tide has opinions.',
    category: 'structures',
    cost: 340,
    size: [4, 4],
    make: beachHut,
  },
  {
    id: 'villa',
    name: 'Beach villa',
    blurb: 'Two storeys and a glass front pointed at the water.',
    category: 'structures',
    cost: 1400,
    size: [8, 8],
    make: villa,
  },
  {
    id: 'bar',
    name: 'Beach bar',
    blurb: 'Thatch roof, long counter, questionable licensing.',
    category: 'structures',
    cost: 900,
    size: [8, 8],
    make: beachBar,
  },
  {
    id: 'tower',
    name: 'Watchtower',
    blurb: 'Spot pirates early. Or just enjoy being taller than everyone.',
    category: 'structures',
    cost: 760,
    size: [4, 4],
    make: watchtower,
  },
  {
    id: 'container',
    name: 'Container shop',
    blurb: 'Someone is running a business out of this. Possibly you.',
    category: 'structures',
    cost: 520,
    size: [8, 4],
    make: containerShop,
  },
  {
    id: 'pool',
    name: 'Pool',
    blurb: 'Deep end 1.8m. Life choices deeper.',
    category: 'leisure',
    cost: 880,
    size: [8, 8],
    make: pool,
  },
  {
    id: 'cabana',
    name: 'Cabana',
    blurb: 'Shade, a daybed, and nowhere to be.',
    category: 'leisure',
    cost: 260,
    size: [4, 4],
    make: cabana,
  },
  {
    id: 'firepit',
    name: 'Fire pit',
    blurb: 'Where the evening goes once the bar closes.',
    category: 'leisure',
    cost: 180,
    size: [4, 4],
    make: firePit,
  },
  {
    id: 'dock',
    name: 'Dock section',
    blurb: 'Run it to the water. Sharks are a separate conversation.',
    category: 'leisure',
    cost: 300,
    size: [4, 8],
    make: dockPiece,
  },
  {
    id: 'palm',
    name: 'Palm',
    blurb: 'The whole brand, in one plant.',
    category: 'nature',
    cost: 40,
    size: [3, 3],
    make: palmSingle,
  },
  {
    id: 'palms',
    name: 'Palm cluster',
    blurb: 'Three palms pretending they grew there naturally.',
    category: 'nature',
    cost: 100,
    size: [4, 4],
    make: palmCluster,
  },
  {
    id: 'boulder',
    name: 'Boulder',
    blurb: 'Load-bearing, apparently.',
    category: 'nature',
    cost: 50,
    size: [4, 4],
    make: boulder,
  },
  {
    id: 'planter',
    name: 'Planter bed',
    blurb: 'Greenery you did not have to negotiate with.',
    category: 'nature',
    cost: 70,
    size: [4, 4],
    make: planter,
  },
  {
    id: 'fence',
    name: 'Fence',
    blurb: 'Deters squatters. Barely. But it counts.',
    category: 'utility',
    cost: 35,
    size: [4, 4],
    make: fence,
  },
  {
    id: 'path',
    name: 'Path tile',
    blurb: 'So you stop tracking sand indoors.',
    category: 'utility',
    cost: 20,
    size: [4, 4],
    make: pathTile,
  },
  {
    id: 'torch',
    name: 'Tiki torch',
    blurb: 'Light, atmosphere, and a modest fire risk.',
    category: 'utility',
    cost: 60,
    size: [2, 2],
    make: tikiTorch,
  },
  {
    id: 'billboard',
    name: 'Billboard',
    blurb: 'Put your token or your business on it. Everyone will see it.',
    category: 'signage',
    cost: 650,
    size: [10, 4],
    make: billboardFrame,
  },
  {
    id: 'sign',
    name: 'Sign post',
    blurb: 'Small, tasteful, still an advert.',
    category: 'signage',
    cost: 150,
    size: [4, 4],
    make: signPost,
  },
  {
    id: 'neon',
    name: 'Neon sign',
    blurb: 'Glows all night. Your neighbours have feelings about it.',
    category: 'signage',
    cost: 420,
    size: [4, 4],
    make: neonSign,
  },
];

export const KIT_BY_ID: Record<string, KitItem> = Object.fromEntries(
  KIT.map((k) => [k.id, k]),
);

/** Items that carry brandable artwork. */
export const BRANDABLE = new Set(['billboard', 'sign', 'neon']);

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
  /**
   * Structures grow upward rather than outward, so an upgrade never changes
   * the footprint it was placed on. Undefined means it cannot be upgraded.
   */
  maxLevel?: number;
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

/** Dark recess used for windows and doorways. */
const OPENING = new THREE.MeshStandardMaterial({
  color: 0x2b4a5c,
  roughness: 0.25,
  metalness: 0.2,
});

/**
 * Punches a band of windows into each face of a box. Recessing glazing and
 * letting a roof overhang it is most of what separates a low-poly building
 * from a crate with a lid.
 */
function windows(
  g: THREE.Group,
  w: number,
  h: number,
  d: number,
  y: number,
  count = 3,
) {
  const winW = (w / count) * 0.5;
  const winH = h * 0.4;
  const t = 0.02;
  for (let i = 0; i < count; i++) {
    const x = -w / 2 + (w / count) * (i + 0.5);
    for (const sz of [-1, 1]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(winW, winH, t), OPENING);
      m.position.set(x, y, (sz * d) / 2);
      g.add(m);
    }
  }
  for (let i = 0; i < Math.max(1, count - 1); i++) {
    const z = -d / 2 + (d / Math.max(1, count - 1)) * (i + 0.5);
    for (const sx of [-1, 1]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(t, winH, winW), OPENING);
      m.position.set((sx * w) / 2, y, z);
      g.add(m);
    }
  }
}

/** Overhanging eave, the cheapest way to make a roof look designed. */
function eave(g: THREE.Group, w: number, d: number, y: number, mat: THREE.Material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, d), mat);
  m.position.y = y;
  m.castShadow = true;
  m.receiveShadow = true;
  g.add(m);
}

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
  windows(g, 0.9, 0.62, 0.8, 0.42, 2);
  eave(g, 1.04, 0.94, 0.63, M.teak);
  const roof = mesh(new THREE.ConeGeometry(0.8, 0.44, 4), M.thatch, 0.65);
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  // Recessed doorway with a frame around it.
  const frame = mesh(new THREE.BoxGeometry(0.34, 0.46, 0.05), M.darkwood, 0.23);
  frame.position.z = 0.4;
  g.add(frame);
  const door = mesh(new THREE.BoxGeometry(0.24, 0.38, 0.06), OPENING, 0.19);
  door.position.z = 0.42;
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
  windows(g, 0.92, 0.6, 0.78, 0.92, 2);
  // Veranda rail along the front of the deck.
  for (let i = 0; i < 5; i++) {
    const p = mesh(new THREE.BoxGeometry(0.03, 0.18, 0.03), M.darkwood, 0.59);
    p.position.set(-0.4 + i * 0.2, 0.59, 0.44);
    g.add(p);
  }
  g.add(mesh(new THREE.BoxGeometry(0.94, 0.03, 0.03), M.darkwood, 0.68)).position.z = 0.44;
  eave(g, 1.12, 0.98, 1.1, M.teak);
  const roof = mesh(new THREE.ConeGeometry(0.86, 0.4, 4), M.thatch, 1.12);
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  return g;
}

function villa() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(1.9, 0.78, 1.5), M.plaster, 0.39));
  windows(g, 1.9, 0.78, 1.5, 0.5, 4);

  // Deep eave over the ground floor, which also reads as a veranda roof.
  eave(g, 2.18, 1.78, 0.8, M.teak);

  // Veranda posts under the overhang.
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const p = mesh(new THREE.BoxGeometry(0.06, 0.78, 0.06), M.teak, 0.39);
      p.position.set(sx * 1.02, 0.39, sz * 0.83);
      g.add(p);
    }
  }

  g.add(mesh(new THREE.BoxGeometry(1.1, 0.7, 1.1), M.plaster, 0.85));
  windows(g, 1.1, 0.7, 1.1, 1.0, 2);
  eave(g, 1.34, 1.34, 1.57, M.teak);

  // Glass frontage facing the water.
  const win = mesh(new THREE.BoxGeometry(1.5, 0.5, 0.05), M.glass, 0.42);
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
  eave(g, 2.1, 1.7, 1.02, M.teak);
  const roof = mesh(new THREE.ConeGeometry(1.4, 0.46, 4), M.thatch, 1.05);
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  // Bar front panelling, so the counter is not one flat slab.
  for (let i = 0; i < 6; i++) {
    const slat = mesh(new THREE.BoxGeometry(0.03, 0.46, 0.02), M.teak, 0.35);
    slat.position.set(-0.6 + i * 0.24, 0.35, 0.16);
    g.add(slat);
  }
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
  const legs: [number, number][] = [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]];
  for (const [x, z] of legs) {
    const p = mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.7, 6), M.darkwood, 0.85);
    p.position.set(x, 0.85, z);
    g.add(p);
  }

  // Cross-bracing between the legs, which is what makes a tower look built
  // rather than balanced.
  for (const sz of [-0.3, 0.3]) {
    for (const dir of [1, -1]) {
      const b = mesh(new THREE.BoxGeometry(0.85, 0.035, 0.035), M.darkwood, 0.75);
      b.position.set(0, 0.75, sz);
      b.rotation.z = dir * 0.62;
      g.add(b);
    }
  }

  // Ladder up the front.
  for (let i = 0; i < 6; i++) {
    const r = mesh(new THREE.BoxGeometry(0.28, 0.025, 0.025), M.darkwood, 0.25 + i * 0.23);
    r.position.z = 0.33;
    g.add(r);
  }

  g.add(mesh(new THREE.BoxGeometry(1.0, 0.08, 1.0), M.teak, 1.72));
  // Platform rail.
  for (let i = 0; i < 5; i++) {
    const t = i / 4 - 0.5;
    for (const sz of [-1, 1]) {
      const p = mesh(new THREE.BoxGeometry(0.03, 0.2, 0.03), M.darkwood, 1.86);
      p.position.set(t * 0.96, 1.86, sz * 0.48);
      g.add(p);
    }
  }

  g.add(mesh(new THREE.BoxGeometry(0.72, 0.34, 0.72), M.plaster, 1.93));
  windows(g, 0.72, 0.34, 0.72, 2.05, 2);
  eave(g, 0.98, 0.98, 2.28, M.teak);
  const roof = mesh(new THREE.ConeGeometry(0.7, 0.32, 4), M.thatch, 2.3);
  roof.rotation.y = Math.PI / 4;
  g.add(roof);

  const housing = mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.14, 8), M.metal, 1.98);
  housing.position.z = 0.42;
  g.add(housing);
  const lamp = mesh(new THREE.SphereGeometry(0.08, 10, 8), M.ember, 1.98);
  lamp.position.z = 0.48;
  g.add(lamp);
  return g;
}

function containerShop() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(1.9, 0.72, 0.85), M.container, 0.36));

  // Corrugation, tighter and shallower so it reads as steel.
  for (let i = 0; i < 15; i++) {
    const r = mesh(new THREE.BoxGeometry(0.02, 0.66, 0.88), M.container, 0.36);
    r.position.x = -0.88 + i * 0.126;
    g.add(r);
  }

  // Serving hatch cut into the front.
  const hatch = mesh(new THREE.BoxGeometry(1.1, 0.34, 0.04), OPENING, 0.44);
  hatch.position.z = 0.44;
  g.add(hatch);
  const counter = mesh(new THREE.BoxGeometry(1.24, 0.05, 0.16), M.teak, 0.26);
  counter.position.z = 0.5;
  g.add(counter);

  // End doors with hinge bars, the detail that says shipping container.
  for (const sx of [-1, 1]) {
    const door = mesh(new THREE.BoxGeometry(0.03, 0.66, 0.78), M.darkwood, 0.36);
    door.position.x = sx * 0.96;
    g.add(door);
    for (const sz of [-0.22, 0.22]) {
      const bar = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.62, 6), M.metal, 0.36);
      bar.position.set(sx * 0.99, 0.36, sz);
      g.add(bar);
    }
  }

  // Feet, so it sits on the ground rather than sinking into it.
  for (const sx of [-0.85, 0.85]) {
    for (const sz of [-0.36, 0.36]) {
      const f = mesh(new THREE.BoxGeometry(0.12, 0.06, 0.12), M.metal, 0.03);
      f.position.set(sx, 0.03, sz);
      g.add(f);
    }
  }

  const awn = mesh(new THREE.BoxGeometry(1.5, 0.035, 0.52), M.canvasCol, 0.8);
  awn.position.z = 0.54;
  awn.rotation.x = -0.3;
  g.add(awn);
  for (const sx of [-0.7, 0.7]) {
    const strut = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.4, 5), M.metal, 0.68);
    strut.position.set(sx, 0.68, 0.62);
    strut.rotation.x = 0.5;
    g.add(strut);
  }
  return g;
}

/* --------------------------------------------------------------- leisure -- */

function pool() {
  const g = new THREE.Group();
  // Deck, then a recessed basin, then water sitting below the coping.
  g.add(mesh(new THREE.BoxGeometry(1.9, 0.12, 1.5), M.plaster, 0.06));
  g.add(mesh(new THREE.BoxGeometry(1.62, 0.1, 1.22), OPENING, 0.08));
  const w = mesh(new THREE.BoxGeometry(1.54, 0.07, 1.14), M.water, 0.1);
  g.add(w);

  // Coping lip around the edge.
  for (const sx of [-1, 1]) {
    const c = mesh(new THREE.BoxGeometry(0.08, 0.04, 1.36), M.plaster, 0.14);
    c.position.x = sx * 0.81;
    g.add(c);
  }
  for (const sz of [-1, 1]) {
    const c = mesh(new THREE.BoxGeometry(1.7, 0.04, 0.08), M.plaster, 0.14);
    c.position.z = sz * 0.65;
    g.add(c);
  }

  // Steps into the shallow end.
  for (let i = 0; i < 3; i++) {
    const st = mesh(new THREE.BoxGeometry(0.4, 0.025, 0.1), M.plaster, 0.1 - i * 0.02);
    st.position.set(-0.5, 0.1 - i * 0.02, 0.44 - i * 0.1);
    g.add(st);
  }

  // Two loungers, because an empty pool deck looks unfinished.
  for (const sx of [-0.45, 0.2]) {
    const bed = mesh(new THREE.BoxGeometry(0.18, 0.04, 0.42), M.canvasCol, 0.2);
    bed.position.set(sx, 0.2, -0.82);
    bed.rotation.x = -0.14;
    g.add(bed);
    for (const sz of [-0.14, 0.14]) {
      const leg = mesh(new THREE.BoxGeometry(0.02, 0.1, 0.02), M.teak, 0.13);
      leg.position.set(sx, 0.13, -0.82 + sz);
      g.add(leg);
    }
  }
  return g;
}

function cabana() {
  const g = new THREE.Group();
  for (const [x, z] of [[-0.42, -0.42], [0.42, -0.42], [-0.42, 0.42], [0.42, 0.42]]) {
    const p = mesh(new THREE.CylinderGeometry(0.03, 0.038, 0.9, 6), M.teak, 0.45);
    p.position.set(x, 0.45, z);
    g.add(p);
  }

  // Canopy with a valance hanging off it, rather than a flat plate.
  const top = mesh(new THREE.BoxGeometry(1.1, 0.05, 1.1), M.canvasCol, 0.92);
  g.add(top);
  for (const sz of [-1, 1]) {
    const v = mesh(new THREE.BoxGeometry(1.1, 0.1, 0.02), M.canvasCol, 0.86);
    v.position.z = sz * 0.55;
    g.add(v);
  }
  for (const sx of [-1, 1]) {
    const v = mesh(new THREE.BoxGeometry(0.02, 0.1, 1.1), M.canvasCol, 0.86);
    v.position.x = sx * 0.55;
    g.add(v);
  }

  // Drapes tied at two corners.
  for (const [dx, dz] of [[-0.42, 0.42], [0.42, 0.42]]) {
    const drape = mesh(new THREE.BoxGeometry(0.08, 0.66, 0.06), M.sail, 0.52);
    drape.position.set(dx, 0.52, dz);
    g.add(drape);
  }

  // Daybed with cushions.
  const bed = mesh(new THREE.BoxGeometry(0.74, 0.1, 0.54), M.teak, 0.12);
  g.add(bed);
  const mat = mesh(new THREE.BoxGeometry(0.7, 0.07, 0.5), M.plaster, 0.21);
  g.add(mat);
  for (const sx of [-0.2, 0.2]) {
    const cush = mesh(new THREE.BoxGeometry(0.2, 0.08, 0.16), M.canvasCol, 0.28);
    cush.position.set(sx, 0.28, -0.14);
    g.add(cush);
  }
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
  // Individual planks with gaps, rather than one slab.
  for (let i = 0; i < 11; i++) {
    const plank = mesh(new THREE.BoxGeometry(0.88, 0.05, 0.14), M.deck, 0.18);
    plank.position.z = -0.85 + i * 0.17;
    g.add(plank);
  }
  // Stringers under the planks.
  for (const sx of [-0.34, 0.34]) {
    const s2 = mesh(new THREE.BoxGeometry(0.06, 0.06, 1.88), M.darkwood, 0.12);
    s2.position.x = sx;
    g.add(s2);
  }

  for (const z of [-0.78, 0, 0.78]) {
    for (const x of [-0.34, 0.34]) {
      const p = mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.66, 6), M.trunk, -0.13);
      p.position.set(x, -0.13, z);
      g.add(p);
    }
  }

  // Mooring posts at the seaward end, with a rope slung between them.
  for (const sx of [-0.34, 0.34]) {
    const post = mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.34, 7), M.darkwood, 0.32);
    post.position.set(sx, 0.32, 0.9);
    g.add(post);
    const cap = mesh(new THREE.SphereGeometry(0.055, 8, 6), M.darkwood, 0.49);
    cap.position.set(sx, 0.49, 0.9);
    g.add(cap);
  }
  const rope = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.68, 5), M.thatch, 0.4);
  rope.rotation.z = Math.PI / 2;
  rope.position.set(0, 0.4, 0.9);
  g.add(rope);
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
  // Service ladder up the left post and lamp hoods along the top rail.
  for (let i = 0; i < 7; i++) {
    const r = mesh(new THREE.BoxGeometry(0.16, 0.02, 0.02), M.metal, 0.35 + i * 0.36);
    r.position.x = -1.0;
    g.add(r);
  }
  for (const sx of [-0.8, 0, 0.8]) {
    const hood = mesh(new THREE.BoxGeometry(0.22, 0.06, 0.12), M.metal, 3.08);
    hood.position.set(sx, 3.08, 0.16);
    hood.rotation.x = 0.5;
    g.add(hood);
    const arm = mesh(new THREE.BoxGeometry(0.03, 0.14, 0.03), M.metal, 2.99);
    arm.position.set(sx, 2.99, 0.1);
    g.add(arm);
  }
  g.name = 'billboard';
  return g;
}

function signPost() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.045, 0.055, 1.4, 7), M.darkwood, 0.7));
  // Bracket arm the board hangs from, plus a diagonal stay.
  const arm = mesh(new THREE.BoxGeometry(0.5, 0.04, 0.04), M.darkwood, 1.3);
  arm.position.x = 0.2;
  g.add(arm);
  const stay = mesh(new THREE.BoxGeometry(0.26, 0.03, 0.03), M.darkwood, 1.18);
  stay.position.set(0.1, 1.18, 0);
  stay.rotation.z = 0.7;
  g.add(stay);
  // Chains down to the board.
  for (const sx of [0.06, 0.36]) {
    const ch = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 4), M.metal, 1.24);
    ch.position.x = sx;
    g.add(ch);
  }
  const cap = mesh(new THREE.SphereGeometry(0.055, 8, 6), M.metal, 1.42);
  g.add(cap);
  g.name = 'sign';
  return g;
}

function neonSign() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.045, 0.06, 1.1, 7), M.metal, 0.55));
  // Backing plate, so the tube is mounted to something.
  const plate = mesh(new THREE.BoxGeometry(0.72, 0.5, 0.04), M.darkwood, 1.35);
  g.add(plate);
  const frame = mesh(new THREE.BoxGeometry(0.78, 0.56, 0.02), M.metal, 1.35);
  frame.position.z = -0.02;
  g.add(frame);
  const ring = mesh(new THREE.TorusGeometry(0.19, 0.028, 8, 24), M.neon, 1.35);
  ring.position.z = 0.04;
  g.add(ring);
  // Feet where the plate meets the post.
  for (const sx of [-0.2, 0.2]) {
    const br = mesh(new THREE.BoxGeometry(0.04, 0.16, 0.04), M.metal, 1.06);
    br.position.x = sx;
    g.add(br);
  }
  const l = new THREE.PointLight(0x38d7f4, 5, 5, 2);
  l.position.set(0, 1.35, 0.2);
  g.add(l);
  g.name = 'neon';
  return g;
}

export const KIT: KitItem[] = [
  {
    id: 'shack',
    maxLevel: 3,
    name: 'Starter shack',
    blurb: 'One room. Technically shelter. Everyone starts here.',
    category: 'structures',
    cost: 120,
    size: [4, 4],
    make: shack,
  },
  {
    id: 'hut',
    maxLevel: 3,
    name: 'Stilt hut',
    blurb: 'Raised, because the tide has opinions.',
    category: 'structures',
    cost: 340,
    size: [4, 4],
    make: beachHut,
  },
  {
    id: 'villa',
    maxLevel: 3,
    name: 'Beach villa',
    blurb: 'Two storeys and a glass front pointed at the water.',
    category: 'structures',
    cost: 1400,
    size: [8, 8],
    make: villa,
  },
  {
    id: 'bar',
    maxLevel: 3,
    name: 'Beach bar',
    blurb: 'Thatch roof, long counter, questionable licensing.',
    category: 'structures',
    cost: 900,
    size: [8, 8],
    make: beachBar,
  },
  {
    id: 'tower',
    maxLevel: 3,
    name: 'Watchtower',
    blurb: 'Spot pirates early. Or just enjoy being taller than everyone.',
    category: 'structures',
    cost: 760,
    size: [4, 4],
    make: watchtower,
  },
  {
    id: 'container',
    maxLevel: 3,
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

/** Names shown as a structure grows. */
export const LEVEL_NAME: Record<number, string> = {
  1: 'Built',
  2: 'Extended',
  3: 'Landmark',
};

/** Cost of taking a piece from the level below up to this one. */
export function upgradeCost(kitId: string, toLevel: number): number {
  const item = KIT_BY_ID[kitId];
  if (!item?.maxLevel || toLevel < 2 || toLevel > item.maxLevel) return 0;
  // Each storey costs more than the last, so a landmark is a real commitment.
  return Math.round((item.cost * (toLevel === 2 ? 0.8 : 1.6)) / 10) * 10;
}

/** Everything sunk into a piece at its current level. */
export function totalCost(kitId: string, level = 1): number {
  const item = KIT_BY_ID[kitId];
  if (!item) return 0;
  let n = item.cost;
  for (let l = 2; l <= level; l++) n += upgradeCost(kitId, l);
  return n;
}

/** Items that carry brandable artwork. */
export const BRANDABLE = new Set(['billboard', 'sign', 'neon']);

'use client';

import { useEffect, useMemo, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Island } from '@/lib/content';
import { platFor, type Plot } from '@/lib/plots';
import { ROOF_COLORS, WALL_COLORS, neighbourFor, type Neighbour } from '@/lib/neighbours';
import { blobShape } from './geometry';
import { buildPiece } from './BuildWorld';
import { PIECE_SCALE, footprint, loadLot } from '@/lib/build';
import type { Outlier } from '@/lib/secrets';

/**
 * A whole island at survey scale: terrain, coast road, named streets, every
 * platted lot, and a building on each sold one.
 *
 * Everything static is merged into a single vertex-coloured mesh, so an island
 * with a hundred lots and several hundred buildings costs a couple of draw
 * calls rather than several hundred.
 */

const SAND = 0xffe7a3;
const GRASS = 0x6fbf7d;
const GRASS_DARK = 0x4ea562;
const ROAD = 0xfdf7ea;
const PAD_OPEN = 0xffd166;
const PAD_SOLD = 0xa9b4ba;
const PAD_MINE = 0x38d7f4;
const TRUNK = 0x8a5a31;
const LEAF = 0x1a7f47;
const POOL = 0x35c9dd;

/** Paints a geometry with one flat colour so it can join the merged mesh. */
function tint(geo: THREE.BufferGeometry, hex: number) {
  const c = new THREE.Color(hex);
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    arr[i * 3] = c.r;
    arr[i * 3 + 1] = c.g;
    arr[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  // Merging requires identical attribute sets across every geometry.
  geo.deleteAttribute('uv');
  return geo;
}

function box(w: number, h: number, d: number, x: number, y: number, z: number, hex: number) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y + h / 2, z);
  return tint(g, hex);
}

function pyramid(r: number, h: number, x: number, y: number, z: number, hex: number, rot = 0) {
  const g = new THREE.ConeGeometry(r, h, 4);
  g.rotateY(Math.PI / 4 + rot);
  g.translate(x, y + h / 2, z);
  return tint(g, hex);
}

function palmGeo(x: number, y: number, z: number, scale: number) {
  const out: THREE.BufferGeometry[] = [];
  const t = new THREE.CylinderGeometry(0.012 * scale, 0.022 * scale, 0.34 * scale, 5);
  t.translate(x, y + 0.17 * scale, z);
  out.push(tint(t, TRUNK));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const l = new THREE.ConeGeometry(0.05 * scale, 0.22 * scale, 4);
    l.rotateZ(Math.PI / 2);
    l.rotateY(-a);
    l.scale(0.6, 1, 0.3);
    l.translate(
      x + Math.cos(a) * 0.07 * scale,
      y + 0.35 * scale,
      z + Math.sin(a) * 0.07 * scale,
    );
    out.push(tint(l, LEAF));
  }
  return out;
}

/** Geometry for one generated neighbour, in island-local space. */
function neighbourGeo(plot: Plot, n: Neighbour): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  const cx = plot.rect.x + plot.rect.w / 2;
  const cz = plot.rect.z + plot.rect.d / 2;

  // Building sits on most of the lot, leaving a margin of garden.
  const bw = plot.rect.w * 0.66;
  const bd = plot.rect.d * 0.6;
  const wall = WALL_COLORS[n.wall];
  const roof = ROOF_COLORS[n.roof];

  const swap = n.rot === Math.PI / 2 || n.rot === (3 * Math.PI) / 2;
  const w = swap ? bd : bw;
  const d = swap ? bw : bd;

  switch (n.style) {
    case 'shack': {
      out.push(box(w, 0.16, d, cx, 0, cz, wall));
      out.push(pyramid(Math.max(w, d) * 0.72, 0.11, cx, 0.16, cz, roof, n.rot));
      break;
    }
    case 'house': {
      out.push(box(w, 0.2, d, cx, 0, cz, wall));
      out.push(pyramid(Math.max(w, d) * 0.74, 0.14, cx, 0.2, cz, roof, n.rot));
      break;
    }
    case 'villa': {
      const h = 0.19 * n.storeys;
      out.push(box(w, h, d, cx, 0, cz, wall));
      out.push(box(w * 0.6, 0.16, d * 0.6, cx, h, cz, wall));
      out.push(box(w * 1.08, 0.03, d * 1.08, cx, h - 0.01, cz, roof));
      out.push(box(w * 0.66, 0.02, d * 0.66, cx, h + 0.16, cz, roof));
      if (n.pool) {
        out.push(box(w * 0.5, 0.02, d * 0.34, cx, 0.005, cz + d * 0.72, POOL));
      }
      break;
    }
    case 'bar': {
      out.push(box(w, 0.03, d, cx, 0, cz, 0xb5854f));
      out.push(box(w * 0.7, 0.12, d * 0.3, cx, 0.03, cz, 0x6b4526));
      for (const sx of [-0.45, 0.45]) {
        for (const sz of [-0.45, 0.45]) {
          out.push(
            box(0.022, 0.2, 0.022, cx + sx * w, 0.03, cz + sz * d, TRUNK),
          );
        }
      }
      out.push(pyramid(Math.max(w, d) * 0.8, 0.12, cx, 0.23, cz, roof, n.rot));
      break;
    }
    case 'tower': {
      const h = 0.16 * (n.storeys + 1);
      out.push(box(w * 0.7, h, d * 0.7, cx, 0, cz, wall));
      out.push(box(w * 0.86, 0.03, d * 0.86, cx, h, cz, roof));
      out.push(box(w * 0.5, 0.12, d * 0.5, cx, h + 0.03, cz, wall));
      out.push(pyramid(Math.max(w, d) * 0.55, 0.1, cx, h + 0.15, cz, roof, n.rot));
      break;
    }
    case 'shop': {
      out.push(box(w, 0.17, d * 0.8, cx, 0, cz, 0xd4663f));
      out.push(box(w * 0.9, 0.02, d * 0.42, cx, 0.17, cz + d * 0.34, 0xff7258));
      break;
    }
    case 'ruin': {
      out.push(box(w * 0.8, 0.09, d * 0.7, cx, 0, cz, 0x9aa7ae));
      out.push(box(w * 0.22, 0.14, d * 0.2, cx - w * 0.28, 0, cz - d * 0.2, 0x8c9aa2));
      break;
    }
  }

  for (let i = 0; i < n.palms; i++) {
    const a = (i / Math.max(1, n.palms)) * Math.PI * 2 + 0.7;
    out.push(
      ...palmGeo(
        cx + Math.cos(a) * plot.rect.w * 0.42,
        0,
        cz + Math.sin(a) * plot.rect.d * 0.42,
        1,
      ),
    );
  }

  return out;
}

/** Local (island) coordinates -> world, applying the island's place in ARC. */
export function localToWorld(island: Island, x: number, z: number) {
  const c = Math.cos(island.shape.rot);
  const s = Math.sin(island.shape.rot);
  return [island.pos[0] + x * c - z * s, island.pos[1] + x * s + z * c] as const;
}

/** World coordinates -> island-local, for hit testing against the plat. */
export function worldToLocal(island: Island, x: number, z: number) {
  const dx = x - island.pos[0];
  const dz = z - island.pos[1];
  const c = Math.cos(-island.shape.rot);
  const s = Math.sin(-island.shape.rot);
  return [dx * c - dz * s, dx * s + dz * c] as const;
}

/** True when a world point falls on this island's landmass. */
export function hitsIsland(island: Island, x: number, z: number) {
  const [lx, lz] = worldToLocal(island, x, z);
  return Math.hypot(lx / (island.shape.rx * 1.12), lz / (island.shape.rz * 1.12)) <= 1;
}

/**
 * An uncharted island. No plat, no lots, no neighbours — these are places you
 * reach, not places you own, so they are built from theme rather than survey.
 */
function buildOutlier(o: Outlier) {
  const { rx, rz } = o.shape;
  const group = new THREE.Group();
  const rand = (() => {
    let h = 2166136261;
    for (let i = 0; i < o.id.length; i++) {
      h ^= o.id.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return () => {
      h += 0x6d2b79f5;
      let t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  })();

  const PALETTE: Record<string, { sand: number; ground: number; prop: number; accent: number }> = {
    jungle: { sand: 0xd9c98f, ground: 0x2f6b34, prop: 0x1d4a24, accent: 0x8a6b3a },
    monkey: { sand: 0xffe7a3, ground: 0x5aa863, prop: 0xa8703c, accent: 0xffc44d },
    wreck: { sand: 0xcfc3a0, ground: 0x7d8a76, prop: 0x4a3a2a, accent: 0x8e9aa2 },
    void: { sand: 0xf2ece0, ground: 0xe4dccd, prop: 0x2b2b33, accent: 0xbfd9dd },
  };
  const pal = PALETTE[o.theme];

  const sandShape = blobShape(rx * 1.1, rz * 1.1, 7, 0.8);
  const sandGeo = new THREE.ExtrudeGeometry(sandShape, {
    depth: 0.4,
    bevelEnabled: true,
    bevelSize: 0.16,
    bevelThickness: 0.16,
    bevelSegments: 2,
    steps: 1,
    curveSegments: 28,
  });
  sandGeo.rotateX(Math.PI / 2);
  const sand = new THREE.Mesh(
    sandGeo,
    new THREE.MeshStandardMaterial({ color: pal.sand, roughness: 0.95 }),
  );
  sand.position.y = -0.2;
  sand.receiveShadow = true;
  group.add(sand);

  if (o.theme !== 'void') {
    const g2 = new THREE.CircleGeometry(1, 56);
    g2.rotateX(-Math.PI / 2);
    const ground = new THREE.Mesh(
      g2,
      new THREE.MeshStandardMaterial({ color: pal.ground, roughness: 0.96 }),
    );
    ground.scale.set(rx * 0.97, 1, rz * 0.97);
    ground.position.y = 0.004;
    ground.receiveShadow = true;
    group.add(ground);
  }

  const geos: THREE.BufferGeometry[] = [];
  const inside = (x: number, z: number, k = 0.8) =>
    Math.hypot(x / (rx * k), z / (rz * k)) <= 1;

  if (o.theme === 'jungle') {
    // A ridge, then very large ferns, then bones.
    const ridge = new THREE.ConeGeometry(Math.min(rx, rz) * 0.7, 3.4, 7);
    ridge.translate(rx * 0.15, 1.5, -rz * 0.1);
    geos.push(tint(ridge, pal.ground));
    for (let i = 0; i < 90; i++) {
      const x = (rand() - 0.5) * rx * 1.7;
      const z = (rand() - 0.5) * rz * 1.7;
      if (!inside(x, z)) continue;
      const h = 0.6 + rand() * 1.5;
      geos.push(box(0.09, h, 0.09, x, 0, z, pal.accent));
      for (let f = 0; f < 5; f++) {
        const a = (f / 5) * Math.PI * 2;
        const frond = new THREE.ConeGeometry(0.16, 0.9, 4);
        frond.rotateZ(Math.PI / 2);
        frond.rotateY(-a);
        frond.scale(0.7, 1, 0.3);
        frond.translate(x + Math.cos(a) * 0.3, h, z + Math.sin(a) * 0.3);
        geos.push(tint(frond, pal.prop));
      }
    }
    for (let i = 0; i < 9; i++) {
      const x = (rand() - 0.5) * rx * 1.3;
      const z = (rand() - 0.5) * rz * 1.3;
      if (!inside(x, z, 0.7)) continue;
      const rib = new THREE.BoxGeometry(0.1, 1.1, 0.1);
      rib.rotateX(0.5 + rand());
      rib.translate(x, 0.4, z);
      geos.push(tint(rib, 0xe8e2d2));
    }
  }

  if (o.theme === 'monkey') {
    // A tower of stacked huts, then a shanty town of smaller ones.
    for (let l = 0; l < 6; l++) {
      const w = 2.2 - l * 0.3;
      geos.push(box(w, 0.5, w, 0, l * 0.58, 0, l % 2 ? pal.prop : pal.accent));
      geos.push(box(w * 1.2, 0.07, w * 1.2, 0, l * 0.58 + 0.5, 0, pal.prop));
    }
    const crown = new THREE.ConeGeometry(0.8, 1.0, 5);
    crown.translate(0, 4.0, 0);
    geos.push(tint(crown, pal.accent));
    for (let i = 0; i < 40; i++) {
      const a = rand() * Math.PI * 2;
      const r = 0.35 + rand() * 0.55;
      const x = Math.cos(a) * rx * r;
      const z = Math.sin(a) * rz * r;
      const h = 0.35 + rand() * 0.5;
      geos.push(box(0.5, h, 0.5, x, 0, z, pal.prop));
      const roof = new THREE.ConeGeometry(0.42, 0.3, 4);
      roof.rotateY(Math.PI / 4);
      roof.translate(x, h + 0.15, z);
      geos.push(tint(roof, pal.accent));
    }
  }

  if (o.theme === 'wreck') {
    // A hull broken across the reef, with masts still up.
    const hull = new THREE.CylinderGeometry(1.5, 1.0, 8.5, 9, 1, false);
    hull.rotateZ(Math.PI / 2);
    hull.rotateY(0.25);
    hull.scale(1, 0.6, 1);
    hull.translate(0, 0.5, 0);
    geos.push(tint(hull, pal.prop));
    const stern = new THREE.CylinderGeometry(1.1, 0.7, 3.0, 9);
    stern.rotateZ(Math.PI / 2.4);
    stern.translate(rx * 0.75, 0.9, rz * 0.3);
    geos.push(tint(stern, pal.prop));
    for (const mx of [-1.8, 0.6]) {
      const mast = new THREE.CylinderGeometry(0.11, 0.14, 4.6, 7);
      mast.rotateZ(0.35);
      mast.translate(mx, 2.2, 0);
      geos.push(tint(mast, pal.prop));
      const spar = new THREE.BoxGeometry(0.07, 0.07, 2.4);
      spar.translate(mx + 0.5, 3.2, 0);
      geos.push(tint(spar, pal.accent));
    }
    for (let i = 0; i < 30; i++) {
      const x = (rand() - 0.5) * rx * 1.9;
      const z = (rand() - 0.5) * rz * 1.9;
      if (!inside(x, z, 1.0)) continue;
      geos.push(box(0.3 + rand() * 0.5, 0.16, 0.22, x, 0, z, pal.accent));
    }
  }

  if (o.theme === 'void') {
    // Nothing but a ring of pale sand and one thing that should not be here.
    const mono = new THREE.BoxGeometry(0.7, 5.0, 0.7);
    mono.rotateY(0.4);
    mono.translate(0, 2.5, 0);
    geos.push(tint(mono, pal.prop));
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      const r = 0.62;
      geos.push(
        box(0.22, 0.5 + (i % 3) * 0.2, 0.22, Math.cos(a) * rx * r, 0, Math.sin(a) * rz * r, pal.accent),
      );
    }
  }

  const merged = mergeGeometries(geos, false);
  geos.forEach((g) => g.dispose());
  if (merged) {
    merged.computeVertexNormals();
    const mesh = new THREE.Mesh(
      merged,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92 }),
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  group.position.set(o.pos[0], 0, o.pos[1]);
  group.rotation.y = o.shape.rot;
  return group;
}

export interface WorldProps {
  islands: Island[];
  /** Charted uncharted islands. Absent entirely until someone finds them. */
  outliers: Outlier[];
  /** null shows the whole archipelago; an id flies to that island. */
  focusId: string | null;
  ownedIds: Set<string>;
  selectedLotId: string | null;
  night: number;
  onPickIsland: (id: string) => void;
  onPickLot: (plot: Plot | null) => void;
}

/** Terrain + merged roads, pads and buildings for one island, at its place. */
function buildIsland(island: Island, ownedIds: Set<string>) {
  const { rx, rz } = island.shape;
  const plat = platFor(island.id);
  const group = new THREE.Group();

  // --- terrain ---
  const sandShape = blobShape(rx * 1.1, rz * 1.1, 3, 0.6);
  const sandGeo = new THREE.ExtrudeGeometry(sandShape, {
    depth: 0.3,
    bevelEnabled: true,
    bevelSize: 0.12,
    bevelThickness: 0.12,
    bevelSegments: 2,
    steps: 1,
    curveSegments: 30,
  });
  sandGeo.rotateX(Math.PI / 2);
  const sand = new THREE.Mesh(
    sandGeo,
    new THREE.MeshStandardMaterial({ color: SAND, roughness: 0.95 }),
  );
  sand.position.y = -0.16;
  sand.receiveShadow = true;
  group.add(sand);

  const grassGeo = new THREE.CircleGeometry(1, 64);
  grassGeo.rotateX(-Math.PI / 2);
  const grass = new THREE.Mesh(
    grassGeo,
    new THREE.MeshStandardMaterial({ color: GRASS, roughness: 0.96 }),
  );
  grass.scale.set(rx * 0.995, 1, rz * 0.995);
  grass.position.y = 0.002;
  grass.receiveShadow = true;
  group.add(grass);

  // --- roads, pads, buildings, all merged into one mesh ---
  const geos: THREE.BufferGeometry[] = [];
  // Player builds keep their own materials, so they sit outside the merge.
  const built: THREE.Object3D[] = [];

  const SEG = 72;
  for (let i = 0; i < SEG; i++) {
    const a0 = (i / SEG) * Math.PI * 2;
    const a1 = ((i + 1) / SEG) * Math.PI * 2;
    const r = 0.965;
    const x0 = Math.cos(a0) * rx * r;
    const z0 = Math.sin(a0) * rz * r;
    const x1 = Math.cos(a1) * rx * r;
    const z1 = Math.sin(a1) * rz * r;
    const len = Math.hypot(x1 - x0, z1 - z0) * 1.15;
    const g = new THREE.BoxGeometry(len, 0.02, 0.2);
    g.rotateY(-Math.atan2(z1 - z0, x1 - x0));
    g.translate((x0 + x1) / 2, 0.012, (z0 + z1) / 2);
    geos.push(tint(g, ROAD));
  }

  for (const st of plat.streets) {
    if (st.kind === 'street') {
      const zc = st.z + st.d / 2;
      const k = 1 - (zc / rz) ** 2;
      if (k <= 0.01) continue;
      const halfW = rx * Math.sqrt(k) * 0.95;
      const g = new THREE.BoxGeometry(halfW * 2, 0.02, st.d);
      g.translate(0, 0.012, zc);
      geos.push(tint(g, ROAD));
    } else {
      const xc = st.x + st.w / 2;
      const k = 1 - (xc / rx) ** 2;
      if (k <= 0.01) continue;
      const halfD = rz * Math.sqrt(k) * 0.95;
      const g = new THREE.BoxGeometry(st.w, 0.02, halfD * 2);
      g.translate(xc, 0.012, 0);
      geos.push(tint(g, ROAD));
    }
  }

  for (const p of plat.plots) {
    const mine = ownedIds.has(p.id);
    const pad = mine ? PAD_MINE : p.claimed ? PAD_SOLD : PAD_OPEN;
    const g = new THREE.BoxGeometry(p.rect.w * 0.94, 0.014, p.rect.d * 0.94);
    g.translate(p.rect.x + p.rect.w / 2, 0.02, p.rect.z + p.rect.d / 2);
    geos.push(tint(g, pad));

    if (mine) {
      // Your own build, at the scale the survey sold you: one builder cell is
      // one pace, and a pace is this much of the island.
      const pace = p.rect.w / p.frontage;
      const saved = loadLot(p.id).items;

      for (const piece of saved) {
        const mesh = buildPiece(piece, PIECE_SCALE * pace);
        const [pw, pd] = footprint(piece.kitId, piece.rot);
        mesh.position.set(
          p.rect.x + (piece.x + pw / 2) * pace,
          0.02,
          p.rect.z + (piece.z + pd / 2) * pace,
        );
        mesh.rotation.y = (-piece.rot * Math.PI) / 2;
        mesh.traverse((o) => {
          const m = o as THREE.Mesh;
          if (m.isMesh) {
            m.castShadow = true;
            m.receiveShadow = true;
          }
        });
        built.push(mesh);
      }

      // An empty claimed lot still needs a marker so you can find it.
      if (!saved.length) {
        const cx = p.rect.x + p.rect.w / 2;
        const cz = p.rect.z + p.rect.d / 2;
        geos.push(box(0.03, 0.5, 0.03, cx, 0.02, cz, 0x04314f));
        geos.push(box(0.2, 0.12, 0.02, cx + 0.1, 0.4, cz, PAD_MINE));
      }
      continue;
    }

    const n = neighbourFor(p);
    if (n) geos.push(...neighbourGeo(p, n));
  }

  const merged = mergeGeometries(geos, false);
  geos.forEach((g) => g.dispose());
  if (merged) {
    merged.computeVertexNormals();
    const mesh = new THREE.Mesh(
      merged,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }),
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  built.forEach((b) => group.add(b));

  group.position.set(island.pos[0], 0, island.pos[1]);
  group.rotation.y = island.shape.rot;
  return group;
}

/** Flies the camera between the archipelago overview and a single island. */
function CameraRig({
  islands,
  focus,
  controls,
}: {
  islands: { pos: [number, number]; shape: Island['shape'] }[];
  focus: { pos: [number, number]; shape: Island['shape'] } | null;
  controls: React.RefObject<{ target: THREE.Vector3; update: () => void } | null>;
}) {
  const wanted = useRef({
    pos: new THREE.Vector3(),
    target: new THREE.Vector3(),
    settled: false,
    aspect: 0,
  });

  // Bounds of the whole word, used to frame the overview.
  const world = useMemo(() => {
    const xs = islands.flatMap((i) => [i.pos[0] - i.shape.rx, i.pos[0] + i.shape.rx]);
    const zs = islands.flatMap((i) => [i.pos[1] - i.shape.rz, i.pos[1] + i.shape.rz]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);
    return {
      cx: (minX + maxX) / 2,
      cz: (minZ + maxZ) / 2,
      w: maxX - minX,
      d: maxZ - minZ,
    };
  }, [islands]);

  /** Distance needed to fit a width/depth in frame at this camera and aspect. */
  const fit = (cam: THREE.PerspectiveCamera, w: number, d: number, pad: number) => {
    const half = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2);
    const forH = d / 2 / half;
    const forW = w / 2 / (half * (cam.aspect || 1));
    return Math.max(forH, forW) * pad;
  };

  useFrame((state, delta) => {
    const cam = state.camera as THREE.PerspectiveCamera;

    // A resize changes what fits in frame, so re-frame rather than keeping a
    // distance computed for the old aspect.
    const aspect = cam.aspect || 1;
    if (Math.abs(aspect - wanted.current.aspect) > 0.02) {
      wanted.current.aspect = aspect;
      wanted.current.settled = false;
    }

    // Look down from a fixed angle, at whatever distance frames the subject.
    const DIR = new THREE.Vector3(0, 0.66, 0.75).normalize();

    if (focus) {
      const d = fit(cam, focus.shape.rx * 2.6, focus.shape.rz * 2.6, 1.05);
      wanted.current.target.set(focus.pos[0], 0, focus.pos[1]);
      wanted.current.pos
        .copy(wanted.current.target)
        .addScaledVector(DIR, d);
    } else {
      const d = fit(cam, world.w * 1.1, world.d * 1.4, 1.02);
      wanted.current.target.set(world.cx, 0, world.cz);
      wanted.current.pos
        .copy(wanted.current.target)
        .addScaledVector(DIR, d);
    }

    // Ease in; once close enough, hand control back to the user's orbiting.
    const k = 1 - Math.pow(0.0015, delta);
    if (!wanted.current.settled) {
      cam.position.lerp(wanted.current.pos, k);
      const c = controls.current;
      if (c) c.target.lerp(wanted.current.target, k);
      // Aim the camera here rather than relying on the controls to do it:
      // OrbitControls only re-aims on input unless damping is running, so a
      // programmatic move can otherwise leave it staring at the horizon.
      cam.lookAt(c ? c.target : wanted.current.target);
      c?.update();
      if (cam.position.distanceTo(wanted.current.pos) < 0.4) {
        wanted.current.settled = true;
      }
    }
  });

  // Any change of focus restarts the flight.
  useEffect(() => {
    wanted.current.settled = false;
  }, [focus]);

  return null;
}

export function IslandWorld({
  islands,
  outliers,
  focusId,
  ownedIds,
  selectedLotId,
  night,
  onPickIsland,
  onPickLot,
}: WorldProps) {
  const { scene } = useThree();
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const controls = useRef<{ target: THREE.Vector3; update: () => void } | null>(null);

  const focusIslandDef = islands.find((i) => i.id === focusId) ?? null;
  const focusOutlier = outliers.find((o) => o.id === focusId) ?? null;
  // Both kinds frame the same way; only their contents differ.
  const focus: { pos: [number, number]; shape: Island['shape'] } | null =
    focusIslandDef ?? focusOutlier ?? null;

  // Every island is built once and reused; only ownership changes rebuild it.
  const groups = useMemo(() => {
    const g = new THREE.Group();
    islands.forEach((i) => g.add(buildIsland(i, ownedIds)));
    outliers.forEach((o) => g.add(buildOutlier(o)));
    return g;
  }, [islands, ownedIds, outliers]);

  const marker = useMemo(() => {
    if (!focusIslandDef || !selectedLotId) return null;
    const focus = focusIslandDef;
    const sel = platFor(focus.id).plots.find((p) => p.id === selectedLotId);
    if (!sel) return null;
    const geo = new THREE.BoxGeometry(sel.rect.w, 0.5, sel.rect.d);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: '#ff7258' }),
    );
    const [wx, wz] = localToWorld(
      focus,
      sel.rect.x + sel.rect.w / 2,
      sel.rect.z + sel.rect.d / 2,
    );
    edges.position.set(wx, 0.25, wz);
    edges.rotation.y = focus.shape.rot;
    return edges;
  }, [focusIslandDef, selectedLotId]);

  useEffect(() => {
    scene.background = new THREE.Color('#8fdcf6');
    scene.fog = new THREE.FogExp2(0x8fdcf6, 0.0022);
  }, [scene]);

  useFrame(() => {
    const sky = new THREE.Color('#8fdcf6').lerp(new THREE.Color('#071d33'), night);
    scene.background = sky;
    if (!scene.fog) scene.fog = new THREE.FogExp2(sky.getHex(), 0.0022);
    const fog = scene.fog as THREE.FogExp2;
    fog.color.copy(sky);
    // Thin haze across the whole word, heavier when standing over one island.
    const want = focus ? 0.011 : 0.0022;
    fog.density += (want - fog.density) * 0.06;

    if (sunRef.current) {
      const arc = Math.PI * (0.2 + night * 0.64);
      const d = 80;
      sunRef.current.position.set(
        (focus?.pos[0] ?? 30) + Math.cos(arc) * d,
        Math.max(6, Math.sin(arc) * d),
        (focus?.pos[1] ?? 0) - d * 0.4,
      );
      sunRef.current.target.position.set(focus?.pos[0] ?? 30, 0, focus?.pos[1] ?? 0);
      sunRef.current.target.updateMatrixWorld();
      sunRef.current.intensity = 4.4 - night * 3.2;
    }
  });

  /** One ocean-wide pick plane; islands and lots resolve mathematically. */
  const pick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const { x, z } = e.point;

    const hitOutlier = outliers.find((o) =>
      hitsIsland({ pos: o.pos, shape: o.shape } as Island, x, z),
    );
    if (hitOutlier) {
      if (focusId !== hitOutlier.id) onPickIsland(hitOutlier.id);
      else onPickLot(null);
      return;
    }

    const hitIsland = islands.find((i) => hitsIsland(i, x, z));
    if (!hitIsland) {
      onPickLot(null);
      return;
    }
    if (focusId !== hitIsland.id) {
      onPickIsland(hitIsland.id);
      return;
    }

    const [lx, lz] = worldToLocal(hitIsland, x, z);
    const hit = platFor(hitIsland.id).plots.find(
      (p) =>
        lx >= p.rect.x &&
        lx <= p.rect.x + p.rect.w &&
        lz >= p.rect.z &&
        lz <= p.rect.z + p.rect.d,
    );
    onPickLot(hit ?? null);
  };

  // Shadows follow whatever is being looked at.
  const span = focus ? Math.max(focus.shape.rx, focus.shape.rz) * 1.5 : 70;

  return (
    <>
      <hemisphereLight args={['#cdf7ff', '#3d6a55', 2.2]} intensity={2.2 - night * 1.4} />
      <directionalLight
        ref={sunRef}
        castShadow
        position={[40, 60, -20]}
        intensity={4.4}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-span}
        shadow-camera-right={span}
        shadow-camera-top={span}
        shadow-camera-bottom={-span}
        shadow-camera-far={220}
        shadow-bias={-0.0006}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <planeGeometry args={[900, 900]} />
        <meshStandardMaterial color="#13a8ce" roughness={0.2} metalness={0.1} />
      </mesh>

      <primitive object={groups} />
      {marker && <primitive object={marker} />}

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.03, 0]}
        onClick={pick}
        visible={false}
      >
        <planeGeometry args={[600, 600]} />
      </mesh>

      <OrbitControls
        ref={controls as never}
        makeDefault
        enablePan
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={1.45}
        minDistance={4}
        maxDistance={900}
      />
      <CameraRig islands={[...islands, ...outliers]} focus={focus} controls={controls} />
    </>
  );
}

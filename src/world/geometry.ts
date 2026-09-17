import * as THREE from 'three';
import type { Island } from '@/lib/content';

/** Deterministic PRNG so every visitor sees the same archipelago. */
export function rng(seed: number) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export const MATS = {
  sand: new THREE.MeshStandardMaterial({ color: 0xffe7a3, roughness: 0.95 }),
  sandWet: new THREE.MeshStandardMaterial({ color: 0xf3d190, roughness: 0.7 }),
  grass: new THREE.MeshStandardMaterial({ color: 0x35a75e, roughness: 0.96 }),
  grassDark: new THREE.MeshStandardMaterial({ color: 0x14764a, roughness: 0.98 }),
  rock: new THREE.MeshStandardMaterial({ color: 0x8b9d97, roughness: 1 }),
  trunk: new THREE.MeshStandardMaterial({ color: 0x8a5a31, roughness: 1 }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x1a7f47, roughness: 0.9 }),
  thatch: new THREE.MeshStandardMaterial({ color: 0xd8a860, roughness: 1 }),
  wall: new THREE.MeshStandardMaterial({ color: 0xfff4de, roughness: 0.85 }),
  deck: new THREE.MeshStandardMaterial({ color: 0xb5854f, roughness: 0.95 }),
  lava: new THREE.MeshStandardMaterial({
    color: 0xff5a1f,
    emissive: 0xff3300,
    emissiveIntensity: 2.4,
    roughness: 0.6,
  }),
  ash: new THREE.MeshStandardMaterial({ color: 0x4a4048, roughness: 1 }),
  hull: new THREE.MeshStandardMaterial({ color: 0xfdfdfd, roughness: 0.42 }),
  hullTrim: new THREE.MeshStandardMaterial({ color: 0x073e5a, roughness: 0.5 }),
  sail: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.8,
    side: THREE.DoubleSide,
  }),
};

/** A wobbly closed blob, used for every landmass so nothing reads as a circle. */
export function blobShape(rx: number, rz: number, seed: number, wobble = 1) {
  const shape = new THREE.Shape();
  const n = 26;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const w =
      1 +
      (Math.sin(a * 3 + seed) * 0.11 +
        Math.cos(a * 5 - seed * 0.7) * 0.07 +
        Math.sin(a * 7 + seed * 1.3) * 0.04) *
        wobble;
    pts.push(new THREE.Vector2(Math.cos(a) * rx * w, Math.sin(a) * rz * w));
  }
  shape.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < n; i++) shape.lineTo(pts[i].x, pts[i].y);
  shape.closePath();
  return shape;
}

export function extrudeBlob(
  shape: THREE.Shape,
  depth: number,
  mat: THREE.Material,
  bevel = 0.2,
) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: bevel,
    bevelThickness: bevel,
    curveSegments: 26,
  });
  g.rotateX(Math.PI / 2);
  g.center();
  const m = new THREE.Mesh(g, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function palm(scale = 1, seed = 0) {
  const g = new THREE.Group();
  const lean = (seed % 10) / 40;

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045 * scale, 0.09 * scale, 1.3 * scale, 7),
    MATS.trunk,
  );
  trunk.position.y = 0.65 * scale;
  trunk.rotation.z = lean;
  trunk.castShadow = true;
  g.add(trunk);

  const crownY = 1.32 * scale;
  const crownX = Math.sin(lean) * 1.3 * scale;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + seed;
    const leaf = new THREE.Mesh(
      new THREE.ConeGeometry(0.18 * scale, 0.9 * scale, 5),
      MATS.leaf,
    );
    leaf.position.set(
      crownX + Math.cos(a) * 0.3 * scale,
      crownY - 0.05 * scale,
      Math.sin(a) * 0.3 * scale,
    );
    leaf.rotation.z = Math.PI / 2;
    leaf.rotation.y = -a;
    leaf.scale.set(0.55, 1, 0.22);
    leaf.castShadow = true;
    g.add(leaf);
  }

  // Coconuts, because the brochure promised coconuts.
  const nuts = new THREE.Mesh(
    new THREE.SphereGeometry(0.06 * scale, 6, 5),
    MATS.trunk,
  );
  nuts.position.set(crownX, crownY - 0.08 * scale, 0.06 * scale);
  g.add(nuts);

  return g;
}

/** Thatched hut — the thing every player builds first. */
export function hut(scale = 1) {
  const g = new THREE.Group();
  const walls = new THREE.Mesh(
    new THREE.BoxGeometry(0.62 * scale, 0.38 * scale, 0.52 * scale),
    MATS.wall,
  );
  walls.position.y = 0.19 * scale;
  walls.castShadow = true;
  walls.receiveShadow = true;
  g.add(walls);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(0.56 * scale, 0.36 * scale, 4),
    MATS.thatch,
  );
  roof.position.y = 0.56 * scale;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  g.add(roof);

  return g;
}

/** Over-water deck with a couple of pilings. */
export function dock(length = 1.6, scale = 1) {
  const g = new THREE.Group();
  const boards = new THREE.Mesh(
    new THREE.BoxGeometry(0.34 * scale, 0.06 * scale, length * scale),
    MATS.deck,
  );
  boards.position.y = 0.16 * scale;
  boards.castShadow = true;
  g.add(boards);

  const posts = Math.max(2, Math.round(length * 2));
  for (let i = 0; i < posts; i++) {
    const p = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03 * scale, 0.03 * scale, 0.5 * scale, 5),
      MATS.trunk,
    );
    p.position.set(
      (i % 2 ? 1 : -1) * 0.13 * scale,
      -0.08 * scale,
      (i / (posts - 1) - 0.5) * length * scale,
    );
    g.add(p);
  }
  return g;
}

/** Builds one island group from its content definition. */
export function buildIsland(def: Island) {
  const group = new THREE.Group();
  const { rx, rz, rot } = def.shape;
  const seed = def.pos[0] * 3.7 + def.pos[1] * 1.9 + 4;
  const rand = rng(Math.abs(Math.round(seed * 100)) + 7);
  const volcano = def.id === 'smoking';

  // Sand shelf, slightly larger than the vegetation so there is a real beach.
  const sand = extrudeBlob(blobShape(rx, rz, seed), 0.36, MATS.sand, 0.22);
  sand.position.y = -0.3;
  group.add(sand);

  // Vegetation cap.
  const veg = extrudeBlob(
    blobShape(rx * 0.76, rz * 0.74, seed + 1.9),
    0.46,
    volcano ? MATS.ash : MATS.grass,
    0.2,
  );
  veg.position.y = 0.04;
  group.add(veg);

  if (volcano) {
    // Cone + glowing caldera, the island the brochure calls "the opportunity".
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(Math.min(rx, rz) * 0.85, 2.6, 9),
      MATS.ash,
    );
    cone.position.y = 1.25;
    cone.castShadow = true;
    group.add(cone);

    const caldera = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.26, 0.18, 9),
      MATS.lava,
    );
    caldera.position.y = 2.5;
    group.add(caldera);

    const glow = new THREE.PointLight(0xff5518, 9, 9, 2);
    glow.position.set(0, 2.7, 0);
    glow.name = 'calderaGlow';
    group.add(glow);
  } else {
    // Rolling interior hill.
    const hill = new THREE.Mesh(
      new THREE.IcosahedronGeometry(Math.min(rx, rz) * 0.6, 2),
      MATS.grassDark,
    );
    hill.scale.set(1.15, 0.7, 0.92);
    hill.position.y = 0.55;
    hill.castShadow = true;
    hill.receiveShadow = true;
    group.add(hill);
  }

  // Palms scattered inside the vegetation line.
  const treeCount = volcano ? 3 : Math.round(9 + rx * 2);
  for (let i = 0; i < treeCount; i++) {
    const a = rand() * Math.PI * 2;
    const r = 0.25 + rand() * 0.5;
    const p = palm(0.7 + rand() * 0.35, i * 1.7 + seed);
    p.position.set(Math.cos(a) * rx * r, 0.62, Math.sin(a) * rz * r);
    p.rotation.y = a;
    group.add(p);
  }

  // Shoreline rocks.
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + seed;
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.2 + rand() * 0.16, 0),
      MATS.rock,
    );
    rock.scale.y = 0.62;
    rock.position.set(Math.cos(a) * rx * 0.94, -0.04, Math.sin(a) * rz * 0.94);
    rock.rotation.set(rand() * 3, rand() * 3, 0);
    rock.castShadow = true;
    group.add(rock);
  }

  // A few huts + a dock, so the islands read as inhabited, not decorative.
  if (!volcano) {
    const huts = def.id === 'main' ? 4 : def.id === 'arrivals' ? 3 : 2;
    for (let i = 0; i < huts; i++) {
      const a = rand() * Math.PI * 2;
      const h = hut(0.8 + rand() * 0.3);
      h.position.set(Math.cos(a) * rx * 0.42, 0.62, Math.sin(a) * rz * 0.42);
      h.rotation.y = rand() * Math.PI;
      group.add(h);
    }

    const d = dock(1.4 + rand());
    const da = rand() * Math.PI * 2;
    d.position.set(Math.cos(da) * rx * 1.05, 0.05, Math.sin(da) * rz * 1.05);
    d.rotation.y = -da;
    group.add(d);
  }

  // Drop the landmass so the swell actually laps the beach.
  group.position.set(def.pos[0], -0.15, def.pos[1]);
  group.rotation.y = rot;
  group.userData.islandId = def.id;
  return group;
}

/** Small sailing boat with a wake, for the middle distance. */
export function sailboat() {
  const g = new THREE.Group();

  const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.8, 5, 10), MATS.hull);
  hull.rotation.z = Math.PI / 2;
  hull.scale.set(1, 0.46, 0.55);
  hull.castShadow = true;
  g.add(hull);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.11, 0.32), MATS.hullTrim);
  cabin.position.y = 0.14;
  g.add(cabin);

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.05, 5), MATS.trunk);
  mast.position.y = 0.62;
  g.add(mast);

  const sail = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.78), MATS.sail);
  sail.position.set(0.14, 0.62, 0);
  sail.rotation.y = Math.PI / 2;
  g.add(sail);

  return g;
}

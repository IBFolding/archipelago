'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Island } from '@/lib/content';
import { platFor, type Plot } from '@/lib/plots';
import { ROOF_COLORS, WALL_COLORS, neighbourFor, type Neighbour } from '@/lib/neighbours';
import { blobShape } from './geometry';

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

export interface IslandWorldProps {
  island: Island;
  /** Lot ids the visitor has a saved build on. */
  ownedIds: Set<string>;
  selectedId: string | null;
  night: number;
  onPickLot: (plot: Plot | null) => void;
}

export function IslandWorld({
  island,
  ownedIds,
  selectedId,
  night,
  onPickLot,
}: IslandWorldProps) {
  const { scene } = useThree();
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const { rx, rz } = island.shape;
  const plat = useMemo(() => platFor(island.id), [island.id]);

  // ------------------------------------------------------------ terrain --
  const terrain = useMemo(() => {
    const g = new THREE.Group();

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
    g.add(sand);

    const grassGeo = new THREE.CircleGeometry(1, 64);
    grassGeo.rotateX(-Math.PI / 2);
    const grass = new THREE.Mesh(
      grassGeo,
      new THREE.MeshStandardMaterial({ color: GRASS, roughness: 0.96 }),
    );
    grass.scale.set(rx * 0.995, 1, rz * 0.995);
    grass.position.y = 0.002;
    grass.receiveShadow = true;
    g.add(grass);

    return g;
  }, [rx, rz]);

  // ------------------------------- roads, pads and buildings, all merged --
  const built = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];

    // Coast road: a ring of short segments following the shoreline.
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

    // Streets and avenues, trimmed to the island's chord so they stop at the
    // coast instead of running out over the water.
    for (const s of plat.streets) {
      if (s.kind === 'street') {
        const zc = s.z + s.d / 2;
        const k = 1 - (zc / rz) ** 2;
        if (k <= 0.01) continue;
        const halfW = rx * Math.sqrt(k) * 0.95;
        const g = new THREE.BoxGeometry(halfW * 2, 0.02, s.d);
        g.translate(0, 0.012, zc);
        geos.push(tint(g, ROAD));
      } else {
        const xc = s.x + s.w / 2;
        const k = 1 - (xc / rx) ** 2;
        if (k <= 0.01) continue;
        const halfD = rz * Math.sqrt(k) * 0.95;
        const g = new THREE.BoxGeometry(s.w, 0.02, halfD * 2);
        g.translate(xc, 0.012, 0);
        geos.push(tint(g, ROAD));
      }
    }

    // Lot pads + whatever stands on them.
    for (const p of plat.plots) {
      const mine = ownedIds.has(p.id);
      const pad = mine ? PAD_MINE : p.claimed ? PAD_SOLD : PAD_OPEN;
      const g = new THREE.BoxGeometry(p.rect.w * 0.94, 0.014, p.rect.d * 0.94);
      g.translate(p.rect.x + p.rect.w / 2, 0.02, p.rect.z + p.rect.d / 2);
      geos.push(tint(g, pad));

      if (mine) {
        // Your lot gets a marker post rather than a building — the builder
        // works at walking scale and does not map onto a survey parcel yet.
        geos.push(
          box(0.03, 0.5, 0.03, p.rect.x + p.rect.w / 2, 0.02, p.rect.z + p.rect.d / 2, 0x04314f),
        );
        geos.push(
          box(0.2, 0.12, 0.02, p.rect.x + p.rect.w / 2 + 0.1, 0.4, p.rect.z + p.rect.d / 2, PAD_MINE),
        );
        continue;
      }

      const n = neighbourFor(p);
      if (n) geos.push(...neighbourGeo(p, n));
    }

    const merged = mergeGeometries(geos, false);
    geos.forEach((g) => g.dispose());
    if (!merged) return new THREE.Group();

    merged.computeVertexNormals();
    const mesh = new THREE.Mesh(
      merged,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }),
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const g = new THREE.Group();
    g.add(mesh);
    return g;
  }, [plat, ownedIds, rx, rz]);

  // Highlight ring on the selected lot.
  const marker = useMemo(() => {
    const sel = plat.plots.find((p) => p.id === selectedId);
    if (!sel) return null;
    const geo = new THREE.BoxGeometry(sel.rect.w, 0.5, sel.rect.d);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: '#ff7258' }),
    );
    edges.position.set(sel.rect.x + sel.rect.w / 2, 0.25, sel.rect.z + sel.rect.d / 2);
    return edges;
  }, [plat, selectedId]);

  useEffect(() => {
    scene.background = new THREE.Color('#8fdcf6');
    scene.fog = new THREE.FogExp2(0x8fdcf6, 0.02);
  }, [scene]);

  useFrame(() => {
    const sky = new THREE.Color('#8fdcf6').lerp(new THREE.Color('#071d33'), night);
    scene.background = sky;
    if (!scene.fog) scene.fog = new THREE.FogExp2(sky.getHex(), 0.02);
    (scene.fog as THREE.FogExp2).color.copy(sky);

    if (sunRef.current) {
      const arc = Math.PI * (0.2 + night * 0.64);
      const d = Math.max(rx, rz) * 2.4;
      sunRef.current.position.set(Math.cos(arc) * d, Math.max(3, Math.sin(arc) * d), -d * 0.5);
      sunRef.current.intensity = 4.4 - night * 3.2;
    }
  });

  /** Ground clicks resolve to a lot mathematically, not by raycasting each. */
  const pick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const x = e.point.x;
    const z = e.point.z;
    const hit = plat.plots.find(
      (p) =>
        x >= p.rect.x &&
        x <= p.rect.x + p.rect.w &&
        z >= p.rect.z &&
        z <= p.rect.z + p.rect.d,
    );
    onPickLot(hit ?? null);
  };

  const shadowSpan = Math.max(rx, rz) * 1.4;

  return (
    <>
      <hemisphereLight args={['#cdf7ff', '#3d6a55', 2.2]} intensity={2.2 - night * 1.4} />
      <directionalLight
        ref={sunRef}
        castShadow
        position={[10, 16, -8]}
        intensity={4.4}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-shadowSpan}
        shadow-camera-right={shadowSpan}
        shadow-camera-top={shadowSpan}
        shadow-camera-bottom={-shadowSpan}
        shadow-bias={-0.0006}
      />

      {/* sea */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#13a8ce" roughness={0.2} metalness={0.1} />
      </mesh>

      <primitive object={terrain} />
      <primitive object={built} />
      {marker && <primitive object={marker} />}

      {/* Invisible pick plane sitting just above the ground. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} onClick={pick} visible={false}>
        <planeGeometry args={[rx * 2.4, rz * 2.4]} />
      </mesh>
    </>
  );
}

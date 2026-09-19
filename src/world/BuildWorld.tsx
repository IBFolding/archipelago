'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import {
  DEMO_GRID,
  PIECE_SCALE,
  drawBrandPanel,
  footprint,
  type Grid,
  type Placed,
} from '@/lib/build';
import { BRANDABLE, KIT_BY_ID } from './buildKit';
import { MATS } from './geometry';

/** Materials for the storeys an upgrade adds. */
const MATS_UP = {
  wall: new THREE.MeshStandardMaterial({ color: 0xfff4de, roughness: 0.85 }),
  trim: new THREE.MeshStandardMaterial({ color: 0xa8703c, roughness: 0.85 }),
};

const CELL = 1;

/** Grid cell -> world centre of a piece with the given footprint. */
export function cellToWorld(x: number, z: number, w: number, d: number, grid: Grid) {
  return new THREE.Vector3(x - grid.w / 2 + w / 2, 0, z - grid.d / 2 + d / 2);
}

/**
 * Builds the mesh for one placed piece, including any brand artwork. Kit
 * geometry is authored small and scaled up to its footprint in paces, so the
 * same piece can be rendered on a lot here or out on the island.
 */
export function buildPiece(p: Placed, scale = PIECE_SCALE): THREE.Group {
  const item = KIT_BY_ID[p.kitId];
  const g = new THREE.Group();
  if (!item) return g;

  const body = item.make();

  // Upgrades stack storeys on top of whatever the piece already is, measured
  // from its own bounds, so a growing structure never outgrows its footprint.
  const level = Math.max(1, p.level ?? 1);
  if (item.maxLevel && level > 1) {
    const box = new THREE.Box3().setFromObject(body);
    const size = new THREE.Vector3();
    const centre = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(centre);

    let y = box.max.y;
    for (let l = 2; l <= level; l++) {
      const shrink = l === 2 ? 0.82 : 0.66;
      const h = size.y * 0.42;
      const storey = new THREE.Mesh(
        new THREE.BoxGeometry(size.x * shrink, h, size.z * shrink),
        MATS_UP.wall,
      );
      storey.position.set(centre.x, y + h / 2, centre.z);
      storey.castShadow = true;
      storey.receiveShadow = true;
      body.add(storey);

      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(size.x * (shrink + 0.12), size.y * 0.06, size.z * (shrink + 0.12)),
        MATS_UP.trim,
      );
      slab.position.set(centre.x, y + h, centre.z);
      slab.castShadow = true;
      body.add(slab);

      y += h + size.y * 0.06;
    }
  }

  body.scale.setScalar(scale);
  g.add(body);

  if (BRANDABLE.has(p.kitId) && p.brand) {
    const tex = new THREE.CanvasTexture(drawBrandPanel(p.brand));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.75,
      side: THREE.DoubleSide,
      emissive: p.kitId === 'neon' ? new THREE.Color('#ffffff') : new THREE.Color('#000'),
      emissiveMap: p.kitId === 'neon' ? tex : null,
      emissiveIntensity: p.kitId === 'neon' ? 0.85 : 0,
    });

    if (p.kitId === 'billboard') {
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(2.36 * scale, 1.62 * scale), mat);
      panel.position.set(0, 2.08 * scale, 0.06 * scale);
      panel.castShadow = true;
      g.add(panel);
      // Backing board so the reverse is not a floating image.
      const back = new THREE.Mesh(
        new THREE.BoxGeometry(2.42 * scale, 1.68 * scale, 0.08 * scale),
        new THREE.MeshStandardMaterial({ color: 0x8e9aa2, roughness: 0.8 }),
      );
      back.position.set(0, 2.08 * scale, -0.01 * scale);
      back.castShadow = true;
      g.add(back);
    } else if (p.kitId === 'sign') {
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.9 * scale, 0.56 * scale), mat);
      panel.position.set(0, 1.18 * scale, 0.05 * scale);
      panel.castShadow = true;
      g.add(panel);
    } else {
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.62 * scale, 0.36 * scale), mat);
      panel.position.set(0, 1.35 * scale, 0.06 * scale);
      g.add(panel);
    }
  }

  g.rotation.y = (-p.rot * Math.PI) / 2;
  g.userData.uid = p.uid;
  return g;
}

export interface BuildWorldProps {
  /** The lot's size in paces. */
  grid: Grid;
  items: Placed[];
  selectedUid: string | null;
  /** Kit id currently being placed, if any. */
  brush: string | null;
  brushRot: number;
  night: number;
  onCellClick: (x: number, z: number) => void;
  onCellHover: (x: number, z: number) => void;
  onSelect: (uid: string | null) => void;
  /** Where the ghost preview sits, and whether it is a legal placement. */
  ghost: { x: number; z: number; ok: boolean } | null;
}

export function BuildWorld({
  grid,
  items,
  selectedUid,
  brush,
  brushRot,
  night,
  onCellClick,
  onCellHover,
  onSelect,
  ghost,
}: BuildWorldProps) {
  const { scene } = useThree();
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const flickers = useRef<THREE.Object3D[]>([]);

  // ------------------------------------------------------------- placed --
  const placedGroup = useMemo(() => {
    const g = new THREE.Group();
    flickers.current = [];
    for (const p of items) {
      const piece = buildPiece(p);
      const [pw, pd] = footprint(p.kitId, p.rot);
      piece.position.copy(cellToWorld(p.x, p.z, pw, pd, grid));
      piece.traverse((o) => {
        if (o.name === 'flicker') flickers.current.push(o);
      });
      g.add(piece);
    }
    return g;
  }, [items, grid]);

  // ------------------------------------------------------------- ghost ---
  const ghostGroup = useMemo(() => {
    if (!brush || !ghost) return null;
    const item = KIT_BY_ID[brush];
    if (!item) return null;
    const g = item.make();
    const col = new THREE.Color(ghost.ok ? '#3ad46a' : '#ff4d4d');
    g.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = false;
      m.material = new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      });
    });
    g.scale.setScalar(PIECE_SCALE);
    const [w, d] = footprint(brush, brushRot);
    const holder = new THREE.Group();
    holder.add(g);
    holder.position.copy(cellToWorld(ghost.x, ghost.z, w, d, grid));
    holder.rotation.y = (-brushRot * Math.PI) / 2;
    return holder;
  }, [brush, brushRot, ghost, grid]);

  // ---------------------------------------------------------- selection --
  const selectionBox = useMemo(() => {
    const sel = items.find((i) => i.uid === selectedUid);
    if (!sel) return null;
    const [w, d] = footprint(sel.kitId, sel.rot);
    const geo = new THREE.BoxGeometry(w * CELL, 0.06, d * CELL);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: '#ffb020', linewidth: 2 }),
    );
    edges.position.copy(cellToWorld(sel.x, sel.z, w, d, grid));
    edges.position.y = 0.05;
    return edges;
  }, [items, selectedUid, grid]);

  // ------------------------------------------------------------- grid ----
  const gridLines = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    // A line per pace would be noise; rule it every few paces instead.
    const STEP = 2;
    for (let i = 0; i <= grid.w; i += STEP) {
      pts.push(new THREE.Vector3(i - grid.w / 2, 0.02, -grid.d / 2));
      pts.push(new THREE.Vector3(i - grid.w / 2, 0.02, grid.d / 2));
    }
    for (let j = 0; j <= grid.d; j += STEP) {
      pts.push(new THREE.Vector3(-grid.w / 2, 0.02, j - grid.d / 2));
      pts.push(new THREE.Vector3(grid.w / 2, 0.02, j - grid.d / 2));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    return new THREE.LineSegments(
      geo,
      new THREE.LineBasicMaterial({
        color: '#0b5f8f',
        transparent: true,
        opacity: 0.16,
      }),
    );
  }, [grid]);

  useEffect(() => {
    scene.background = new THREE.Color('#8fdcf6');
    scene.fog = new THREE.FogExp2(0x8fdcf6, 0.012);
  }, [scene]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const sky = new THREE.Color('#8fdcf6').lerp(new THREE.Color('#071d33'), night);
    scene.background = sky;
    // The effect that installs the fog can lag the first frame (and Strict
    // Mode remounts clear it), so make sure it exists before touching it.
    if (!scene.fog) scene.fog = new THREE.FogExp2(sky.getHex(), 0.012);
    (scene.fog as THREE.FogExp2).color.copy(sky);

    if (sunRef.current) {
      const arc = Math.PI * (0.18 + night * 0.68);
      sunRef.current.position.set(Math.cos(arc) * 26, Math.max(3, Math.sin(arc) * 26), -12);
      sunRef.current.intensity = 4.6 - night * 3.4;
      sunRef.current.color.set(
        new THREE.Color('#fff3cf').lerp(new THREE.Color('#9fc4ff'), night),
      );
    }

    // Torches and fire pits breathe.
    for (const f of flickers.current) {
      const s = 0.85 + Math.sin(t * 9 + f.id) * 0.12;
      f.scale.set(s, 1 + Math.sin(t * 7 + f.id) * 0.16, s);
    }
  });

  /** Ground pointer -> grid cell, accounting for the brush footprint. */
  const toCell = (e: { point: THREE.Vector3 }) => {
    const [w, d] = brush ? footprint(brush, brushRot) : [1, 1];
    const x = Math.round(e.point.x + grid.w / 2 - w / 2);
    const z = Math.round(e.point.z + grid.d / 2 - d / 2);
    return { x, z };
  };

  return (
    <>
      <hemisphereLight args={['#cdf7ff', '#3d6a55', 2.1]} intensity={2.1 - night * 1.3} />
      <directionalLight
        ref={sunRef}
        castShadow
        position={[30, 42, -24]}
        intensity={4.6}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-bias={-0.0005}
      />

      {/* Sea around the lot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]}>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial color="#13a8ce" roughness={0.2} metalness={0.1} />
      </mesh>

      {/* Beach skirt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]} receiveShadow>
        <planeGeometry args={[grid.w + 26, grid.d + 26]} />
        <primitive object={MATS.sand} attach="material" />
      </mesh>

      {/* The lot itself — the click surface */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        onPointerMove={(e) => {
          e.stopPropagation();
          const { x, z } = toCell(e);
          onCellHover(x, z);
        }}
        onClick={(e) => {
          e.stopPropagation();
          const { x, z } = toCell(e);
          if (brush) onCellClick(x, z);
          else onSelect(null);
        }}
      >
        <planeGeometry args={[grid.w, grid.d]} />
        <meshStandardMaterial color="#6fbf7d" roughness={0.95} />
      </mesh>

      <primitive object={gridLines} />

      <group
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (brush) return;
          e.stopPropagation();
          let o: THREE.Object3D | null = e.object;
          while (o && !o.userData.uid) o = o.parent;
          onSelect(o?.userData.uid ?? null);
        }}
      >
        <primitive object={placedGroup} />
      </group>

      {selectionBox && <primitive object={selectionBox} />}
      {ghostGroup && <primitive object={ghostGroup} />}
    </>
  );
}

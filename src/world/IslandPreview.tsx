'use client';

import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Island } from '@/lib/content';
import { buildIsland } from './geometry';

/**
 * A single island, lifted out of the world and put on a turntable. Uses the
 * same procedural geometry as the hero so the preview and the archipelago can
 * never look like different games.
 */
function PreviewScene({ island, spin }: { island: Island; spin: boolean }) {
  const group = useMemo(() => {
    const g = buildIsland(island);
    // Centre it and cancel the letterform yaw so every island presents square.
    g.position.set(0, -0.15, 0);
    g.rotation.set(0, 0, 0);
    return g;
  }, [island]);

  const holder = useRef<THREE.Group>(null);
  const water = useRef<THREE.Mesh>(null);

  // Frame the island regardless of how long or round it is.
  const radius = Math.max(island.shape.rx, island.shape.rz);
  const dist = radius * 3.1 + 6;

  useFrame((state, delta) => {
    if (!holder.current) return;
    if (spin) holder.current.rotation.y += delta * 0.18;
    const t = state.clock.getElapsedTime();
    holder.current.position.y = Math.sin(t * 0.7) * 0.12;
    if (water.current) {
      (water.current.material as THREE.MeshStandardMaterial).opacity =
        0.82 + Math.sin(t * 1.3) * 0.05;
    }
  });

  return (
    <>
      <hemisphereLight args={['#cdf7ff', '#2f5c4d', 2.4]} />
      <directionalLight
        castShadow
        position={[radius * 2, radius * 3, radius * 1.4]}
        intensity={3.6}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-radius * 2}
        shadow-camera-right={radius * 2}
        shadow-camera-top={radius * 2}
        shadow-camera-bottom={-radius * 2}
      />
      <group ref={holder} position={[0, 0, 0]}>
        <primitive object={group} />
        {/* lagoon disc the island sits in */}
        <mesh
          ref={water}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.62, 0]}
          receiveShadow
        >
          <circleGeometry args={[radius * 1.85, 64]} />
          <meshStandardMaterial
            color="#2ec7cf"
            transparent
            opacity={0.85}
            roughness={0.25}
            metalness={0.1}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.78, 0]}>
          <circleGeometry args={[radius * 2.3, 64]} />
          <meshBasicMaterial color="#0a6ba4" transparent opacity={0.5} />
        </mesh>
      </group>
      <PreviewCamera dist={dist} />
    </>
  );
}

function PreviewCamera({ dist }: { dist: number }) {
  useFrame((state) => {
    const cam = state.camera;
    const targetX = state.pointer.x * dist * 0.06;
    const targetY = dist * 0.52 - state.pointer.y * dist * 0.04;
    cam.position.x += (targetX - cam.position.x) * 0.05;
    cam.position.y += (targetY - cam.position.y) * 0.05;
    cam.position.z = dist;
    cam.lookAt(0, -0.4, 0);
  });
  return null;
}

export function IslandPreview({
  island,
  active,
}: {
  island: Island;
  /** Only render while the section is on screen. */
  active: boolean;
}) {
  if (!active) return null;

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: 38, position: [0, 8, 18], near: 0.1, far: 200 }}
    >
      <Suspense fallback={null}>
        <PreviewScene island={island} spin={active} />
      </Suspense>
    </Canvas>
  );
}

'use client';

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ISLANDS, LETTER_ORIGIN } from '@/lib/content';
import { buildIsland, sailboat, rng } from './geometry';
import { createOceanMaterial } from './ocean';

/** 0 = midday, 1 = night. Drives lighting, water grade and sky. */
export interface WorldProps {
  night: number;
  /** 0 at the top of the page, 1 once the hero has scrolled away. */
  scroll: number;
  paused?: boolean;
}

const SKY_DAY = new THREE.Color('#8fdcf6');
const SKY_DUSK = new THREE.Color('#f5a26b');
const SKY_NIGHT = new THREE.Color('#061a32');

const SUN_DAY = new THREE.Color('#fff3cf');
const SUN_DUSK = new THREE.Color('#ff9a52');
const SUN_NIGHT = new THREE.Color('#9fc4ff');

export function HeroWorld({ night, scroll, paused = false }: WorldProps) {
  const { scene } = useThree();

  const ocean = useMemo(() => createOceanMaterial(), []);

  const islandGroup = useMemo(() => {
    const g = new THREE.Group();
    ISLANDS.forEach((def) => g.add(buildIsland(def)));
    return g;
  }, []);

  const boats = useMemo(() => {
    const rand = rng(31);
    return Array.from({ length: 5 }, (_, i) => {
      const b = sailboat();
      b.userData.phase = rand() * Math.PI * 2;
      b.userData.radius = 26 + i * 16;
      b.userData.speed = 0.055 + rand() * 0.04;
      b.scale.setScalar(0.9 + rand() * 0.5);
      return b;
    });
  }, []);

  const clouds = useMemo(() => {
    const rand = rng(77);
    const g = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    });
    for (let i = 0; i < 18; i++) {
      const c = new THREE.Mesh(new THREE.SphereGeometry(2.2 + rand() * 3.0, 14, 8), mat);
      c.scale.set(2.6, 0.38, 1.2);
      // Ring them around the horizon so they never sit between the camera
      // and the archipelago.
      const a = (i / 18) * Math.PI * 2 + rand() * 0.3;
      const radius = 86 + rand() * 40;
      c.position.set(
        LETTER_ORIGIN.R + Math.cos(a) * radius,
        5 + rand() * 9,
        Math.sin(a) * radius - 4,
      );
      c.userData.drift = 0.12 + rand() * 0.2;
      g.add(c);
    }
    return g;
  }, []);

  const sunRef = useRef<THREE.DirectionalLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const camRig = useRef({ x: 0, y: 0, lookX: 0 });

  // Sky colour + fog react to the day phase.
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const n = night;

    const sky = SKY_DAY.clone()
      .lerp(SKY_DUSK, Math.min(1, n * 2))
      .lerp(SKY_NIGHT, Math.max(0, n * 2 - 1));
    scene.background = sky;
    if (!scene.fog) scene.fog = new THREE.FogExp2(sky.getHex(), 0.0125);
    (scene.fog as THREE.FogExp2).color.copy(sky);

    const sunCol = SUN_DAY.clone()
      .lerp(SUN_DUSK, Math.min(1, n * 2))
      .lerp(SUN_NIGHT, Math.max(0, n * 2 - 1));

    if (sunRef.current) {
      const arc = Math.PI * (0.15 + n * 0.72);
      sunRef.current.position.set(Math.cos(arc) * 34, Math.max(2, Math.sin(arc) * 32), -18);
      sunRef.current.color.copy(sunCol);
      sunRef.current.intensity = 5.4 - n * 3.9;
    }
    if (hemiRef.current) hemiRef.current.intensity = 2.2 - n * 1.5;

    ocean.uniforms.uNight.value = n;
    ocean.uniforms.uSky.value.copy(sky);
    ocean.uniforms.uSunColor.value.copy(sunCol);
    if (sunRef.current) {
      ocean.uniforms.uSunDir.value.copy(sunRef.current.position).normalize();
    }

    if (paused) return;
    ocean.uniforms.uTime.value = t;

    // Boats circle the archipelago on lazy, offset orbits.
    boats.forEach((b) => {
      const a = t * b.userData.speed + b.userData.phase;
      b.position.set(
        LETTER_ORIGIN.R + Math.sin(a) * b.userData.radius,
        -0.16 + Math.sin(t * 1.6 + b.userData.phase) * 0.06,
        6 + Math.cos(a * 0.92) * b.userData.radius * 0.45,
      );
      b.rotation.y = -a + Math.PI / 2;
      b.rotation.z = Math.sin(t * 1.2 + b.userData.phase) * 0.05;
    });

    clouds.children.forEach((c) => {
      c.position.x += (c as THREE.Mesh).userData.drift * delta;
      if (c.position.x > LETTER_ORIGIN.R + 130) c.position.x = LETTER_ORIGIN.R - 130;
    });

    // Islands bob almost imperceptibly so the scene never feels frozen.
    islandGroup.children.forEach((g, i) => {
      g.position.y = Math.sin(t * 0.5 + i) * 0.015;
    });

    // Camera: pointer parallax plus a scroll-driven lift and pull-back.
    const cam = state.camera;
    // R3F keeps state.pointer in -1..1 NDC across the canvas.
    // Portrait viewports crop the letterform, so back the camera off until the
    // whole letter fits regardless of aspect.
    const persp = cam as THREE.PerspectiveCamera;
    const fit = THREE.MathUtils.clamp(1.5 / (persp.aspect || 1), 1, 1.8);

    // Arrive over the A, then climb and pan right as the page scrolls until
    // the whole ARC is in frame. Landing on the A is the point; seeing the
    // word you live on is the payoff.
    const reveal = THREE.MathUtils.smoothstep(scroll, 0.08, 0.85);
    const WORD_CENTRE = (LETTER_ORIGIN.C + 7 - 27) / 2;

    const panX = THREE.MathUtils.lerp(0, WORD_CENTRE, reveal);
    const climb = THREE.MathUtils.lerp(33, 132, reveal);
    const back = THREE.MathUtils.lerp(34, 96, reveal);

    const targetX = panX + state.pointer.x * 3.0 * fit;
    const targetY = (climb - state.pointer.y * 2.0) * fit;
    camRig.current.x += (targetX - camRig.current.x) * 0.035;
    camRig.current.y += (targetY - camRig.current.y) * 0.035;
    cam.position.x = camRig.current.x;
    cam.position.y = camRig.current.y;
    cam.position.z = back * fit;
    camRig.current.lookX += (panX - camRig.current.lookX) * 0.035;
    // Aim below the waterline so the archipelago rides high in frame and the
    // headline gets clean water underneath it.
    cam.lookAt(camRig.current.lookX, -4.5 * fit, -4 + reveal * -3);
  });

  return (
    <group>
      <hemisphereLight ref={hemiRef} args={['#cdf7ff', '#2f5c4d', 2.2]} />
      <directionalLight
        ref={sunRef}
        castShadow
        position={[-18, 30, -18]}
        intensity={5.4}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-90}
        shadow-camera-right={90}
        shadow-camera-top={90}
        shadow-camera-bottom={-90}
        shadow-bias={-0.0004}
      />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[LETTER_ORIGIN.R, -0.72, 0]}
        receiveShadow
      >
        <planeGeometry args={[620, 460, 300, 220]} />
        <primitive object={ocean} attach="material" />
      </mesh>

      <primitive object={islandGroup} />
      {boats.map((b, i) => (
        <primitive key={i} object={b} />
      ))}
      <primitive object={clouds} />
    </group>
  );
}

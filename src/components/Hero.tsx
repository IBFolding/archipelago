'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { HeroWorld } from '@/world/HeroWorld';
import { ISLANDS } from '@/lib/content';
import styles from './Hero.module.css';

type Phase = 'live' | 'day' | 'sunset' | 'night';

const PHASE_NIGHT: Record<Exclude<Phase, 'live'>, number> = {
  day: 0,
  sunset: 0.5,
  night: 1,
};

function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export function Hero({ onBook }: { onBook: (islandId?: string) => void }) {
  const [phase, setPhase] = useState<Phase>('live');
  const [night, setNight] = useState(0);
  const [scroll, setScroll] = useState(0);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [reduced, setReduced] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setWebgl(supportsWebGL());
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Live mode runs an eight-minute resort day off the wall clock, so every
  // visitor on the site at the same moment sees the same light.
  useEffect(() => {
    if (phase !== 'live') {
      setNight(PHASE_NIGHT[phase]);
      return;
    }
    const tick = () => {
      const cycle = 8 * 60 * 1000;
      const p = (Date.now() % cycle) / cycle;
      // Weighted so the resort is sunny most of the time: a long day, a short
      // golden hour, a brief night, then dawn back to day.
      let n: number;
      if (p < 0.58) n = 0;
      else if (p < 0.72) n = (p - 0.58) / 0.14;
      else if (p < 0.86) n = 1;
      else n = 1 - (p - 0.86) / 0.14;
      setNight(Math.max(0, Math.min(1, n)));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    const onScroll = () => {
      const h = sectionRef.current?.offsetHeight ?? window.innerHeight;
      setScroll(Math.min(1, window.scrollY / h));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section className={styles.hero} ref={sectionRef} id="top">
      <div className={styles.canvasWrap} aria-hidden="true">
        {webgl === false && (
          <img className={styles.fallback} src="/assets/hero-reference.png" alt="" />
        )}
        {webgl && (
          <Canvas
            shadows
            dpr={[1, 1.75]}
            gl={{ antialias: true, powerPreference: 'high-performance' }}
            camera={{ fov: 42, position: [0, 33, 34], near: 0.1, far: 300 }}
            onCreated={({ gl }) => {
              gl.toneMappingExposure = 1.12;
            }}
          >
            <Suspense fallback={null}>
              <HeroWorld night={night} scroll={scroll} paused={reduced} />
            </Suspense>
          </Canvas>
        )}
        <div className={styles.scrim} />
      </div>

      <div className={styles.annotations} aria-hidden="true">
        <span className={styles.annLeft}>
          More
          <br />
          than a coin
        </span>
        <span className={styles.annRight}>
          A brighter
          <br />
          getaway
        </span>
        <span className={styles.annScript}>A Higher State of Island</span>
      </div>

      <div className={styles.copy}>
        <p className={styles.eyebrow}>The ARC archipelago · now taking arrivals</p>
        <h1 className={styles.title}>
          Buy your own <em>island</em>
        </h1>
        <p className={styles.sub}>Kick back. Relax. Let the degens cook.</p>

        <div className={styles.ctas}>
          <a className={styles.primary} href="#tokenomics">
            Get $ISLAND <span aria-hidden="true">→</span>
          </a>
          <button className={styles.secondary} onClick={() => onBook()}>
            See available land
          </button>
        </div>
      </div>

      {/* The booking bar is the land funnel, dressed as a hotel search. */}
      <form
        className={styles.booking}
        onSubmit={(e) => {
          e.preventDefault();
          const island = new FormData(e.currentTarget).get('island');
          onBook(typeof island === 'string' ? island : undefined);
        }}
      >
        <label>
          <small>Destination</small>
          <select name="island" defaultValue="main">
            {ISLANDS.map((i) => (
              <option key={i.id} value={i.id}>
                {i.num} · {i.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <small>Arriving</small>
          <select name="when" defaultValue="now">
            <option value="now">Immediately, obviously</option>
            <option value="soon">When the chart recovers</option>
            <option value="never">Purely hypothetically</option>
          </select>
        </label>
        <label>
          <small>Party size</small>
          <select name="party" defaultValue="2">
            <option value="1">1 · escaping alone</option>
            <option value="2">2 · escaping together</option>
            <option value="6">6 · the group chat</option>
            <option value="99">The whole timeline</option>
          </select>
        </label>
        <button type="submit">Check availability</button>
      </form>

      <div className={styles.phase} role="group" aria-label="Resort time">
        {(['live', 'day', 'sunset', 'night'] as Phase[]).map((p) => (
          <button
            key={p}
            className={phase === p ? styles.phaseOn : undefined}
            aria-pressed={phase === p}
            onClick={() => setPhase(p)}
          >
            {p}
          </button>
        ))}
      </div>
    </section>
  );
}

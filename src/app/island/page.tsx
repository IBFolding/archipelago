'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Link from 'next/link';
import { ISLANDS, LETTERS } from '@/lib/content';
import { USD, askingPrice, forSaleFor, platFor, type Plot } from '@/lib/plots';
import { TIER_LABEL } from '@/lib/plots';
import { neighbourFor } from '@/lib/neighbours';
import { IslandWorld } from '@/world/IslandWorld';
import styles from './island.module.css';

const STYLE_LABEL: Record<string, string> = {
  shack: 'a shack',
  house: 'a house',
  villa: 'a villa',
  bar: 'a bar',
  tower: 'a tower',
  shop: 'a shop',
  ruin: 'a ruin nobody has dealt with',
};

/** Reads which lots this browser has a saved build on. */
function readOwned(): Set<string> {
  const out = new Set<string>();
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith('archipelago.lot.v1.')) {
        const id = k.replace('archipelago.lot.v1.', '');
        if (id !== 'demo') out.add(id);
      }
    }
  } catch {
    // Blocked storage just means we show no owned lots.
  }
  return out;
}

export default function IslandPage() {
  const [islandId, setIslandId] = useState(ISLANDS[0].id);
  const [selected, setSelected] = useState<Plot | null>(null);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [night, setNight] = useState(0);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('i');
    if (q && ISLANDS.some((i) => i.id === q)) setIslandId(q);
    setOwned(readOwned());
  }, []);

  const island = ISLANDS.find((i) => i.id === islandId)!;
  const plat = useMemo(() => platFor(islandId), [islandId]);
  const openCount = forSaleFor(islandId).length;
  const dist = Math.max(island.shape.rx, island.shape.rz) * 3.4;

  const neighbour = selected && !owned.has(selected.id) ? neighbourFor(selected) : null;
  const isMine = selected ? owned.has(selected.id) : false;

  return (
    <div className={styles.page}>
      <div className={styles.canvasWrap}>
        <Canvas
          shadows
          dpr={[1, 1.6]}
          gl={{ antialias: true }}
          camera={{ fov: 40, position: [0, dist * 0.7, dist], near: 0.1, far: 600 }}
        >
          <Suspense fallback={null}>
            <IslandWorld
              island={island}
              ownedIds={owned}
              selectedId={selected?.id ?? null}
              night={night}
              onPickLot={setSelected}
            />
            <OrbitControls
              makeDefault
              enablePan
              maxPolarAngle={1.45}
              minDistance={dist * 0.25}
              maxDistance={dist * 2.2}
            />
          </Suspense>
        </Canvas>
      </div>

      <header className={styles.topbar}>
        <Link href="/" className={styles.back}>
          ← ARCHipelago
        </Link>
        <div className={styles.title}>
          <small>
            {island.letter} section · island {island.num}
          </small>
          <strong>{island.name}</strong>
        </div>
        <div className={styles.counts}>
          <span>
            <b>{plat.plots.length}</b> lots
          </span>
          <span>
            <b>{openCount}</b> for sale
          </span>
        </div>
        <div className={styles.topActions}>
          <button onClick={() => setNight((n) => (n > 0.5 ? 0 : 1))}>
            {night > 0.5 ? '☀ Day' : '☾ Night'}
          </button>
          <Link href="/#land" className={styles.landLink}>
            Land office
          </Link>
        </div>
      </header>

      {/* Island switcher, grouped by letter */}
      <aside className={styles.switcher}>
        {LETTERS.map((L) => (
          <div key={L.id} className={styles.letterRow}>
            <span className={styles.letterMark}>{L.id}</span>
            <div className={styles.letterIslands}>
              {ISLANDS.filter((i) => i.letter === L.id).map((i) => (
                <button
                  key={i.id}
                  className={i.id === islandId ? styles.isleOn : styles.isle}
                  onClick={() => {
                    setIslandId(i.id);
                    setSelected(null);
                  }}
                  title={i.name}
                >
                  {i.num}
                </button>
              ))}
            </div>
          </div>
        ))}
      </aside>

      <p className={styles.legend}>
        <i className={styles.lgOpen} /> for sale
        <i className={styles.lgSold} /> built
        <i className={styles.lgMine} /> yours
      </p>

      {selected && (
        <aside className={styles.inspector}>
          <div className={styles.inspHead}>
            <div>
              <small>
                Lot {selected.id} · {TIER_LABEL[selected.tier]}
              </small>
              <strong>{selected.address}</strong>
            </div>
            <button onClick={() => setSelected(null)} aria-label="Close">
              ×
            </button>
          </div>

          <p className={styles.spec}>
            {selected.frontage}×{selected.depth} paces · {island.name}
          </p>

          {isMine ? (
            <>
              <p className={styles.note}>You have a build saved on this lot.</p>
              <Link className={styles.cta} href={`/build?lot=${selected.id}`}>
                Open in the builder →
              </Link>
            </>
          ) : selected.claimed ? (
            <>
              <p className={styles.note}>
                Built out — {STYLE_LABEL[neighbour?.style ?? 'house']} stands here.
                {selected.resale
                  ? ' The owner has it back on the market.'
                  : ' Not for sale.'}
              </p>
              {selected.resale && (
                <>
                  <div className={styles.price}>
                    <small>Owner resale</small>
                    <strong>{USD.format(selected.resale)}</strong>
                  </div>
                  <Link className={styles.cta} href="/#land">
                    Buy it in the land office →
                  </Link>
                </>
              )}
            </>
          ) : (
            <>
              <p className={styles.note}>{selected.quirk}</p>
              <div className={styles.price}>
                <small>From the land office</small>
                <strong>{USD.format(askingPrice(selected) || selected.price)}</strong>
              </div>
              <Link className={styles.cta} href="/#land">
                Claim it →
              </Link>
            </>
          )}
        </aside>
      )}

      <p className={styles.disclaimer}>
        Buildings on sold lots are generated, not other players. Real shared
        builds replace them lot by lot once there is a backend.
      </p>
    </div>
  );
}

'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import Link from 'next/link';
import { ISLANDS, LETTERS } from '@/lib/content';
import { USD, askingPrice, forSaleFor, platFor, type Plot } from '@/lib/plots';
import { TIER_LABEL } from '@/lib/plots';
import { neighbourFor } from '@/lib/neighbours';
import { OUTLIER_BY_ID, chartedOutliers, loadFound } from '@/lib/secrets';
import { STREET_NOTE, valueOf } from '@/lib/value';
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
  // null focus means the whole archipelago is in view.
  const [focusId, setFocusId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Plot | null>(null);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [charted, setCharted] = useState<ReturnType<typeof chartedOutliers>>([]);
  const [night, setNight] = useState(0);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('i');
    if (q && ISLANDS.some((i) => i.id === q)) setFocusId(q);
    setOwned(readOwned());
    // Uncharted islands are absent from every list until someone finds them.
    setCharted(chartedOutliers(loadFound()));
  }, []);

  const island = focusId ? (ISLANDS.find((i) => i.id === focusId) ?? null) : null;
  const outlier = focusId ? (OUTLIER_BY_ID[focusId] ?? null) : null;
  const plat = useMemo(() => (focusId ? platFor(focusId) : null), [focusId]);
  const openCount = focusId ? forSaleFor(focusId).length : 0;
  const totalOpen = useMemo(
    () => ISLANDS.reduce((n, i) => n + forSaleFor(i.id).length, 0),
    [],
  );
  const totalLots = useMemo(
    () => ISLANDS.reduce((n, i) => n + platFor(i.id).plots.length, 0),
    [],
  );

  const focusIsland = (id: string | null) => {
    setFocusId(id);
    setSelected(null);
  };

  const neighbour = selected && !owned.has(selected.id) ? neighbourFor(selected) : null;
  const isMine = selected ? owned.has(selected.id) : false;
  const market = useMemo(
    () => (selected ? valueOf(selected, owned) : null),
    [selected, owned],
  );

  return (
    <div className={styles.page}>
      <div className={styles.canvasWrap}>
        <Canvas
          shadows
          dpr={[1, 1.6]}
          gl={{ antialias: true }}
          camera={{ fov: 40, position: [30, 90, 110], near: 0.1, far: 1200 }}
        >
          <Suspense fallback={null}>
            <IslandWorld
              islands={ISLANDS}
              outliers={charted}
              focusId={focusId}
              ownedIds={owned}
              selectedLotId={selected?.id ?? null}
              night={night}
              onPickIsland={(id) => focusIsland(id)}
              onPickLot={setSelected}
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
            {island
              ? `${island.letter} section · island ${island.num}`
              : outlier
                ? outlier.subtitle
                : `The ARC · 18 islands${charted.length ? ` + ${charted.length} charted` : ''}`}
          </small>
          <strong>
            {island ? island.name : outlier ? outlier.name : 'The whole archipelago'}
          </strong>
        </div>
        {!outlier && <div className={styles.counts}>
          <span>
            <b>{island && plat ? plat.plots.length : totalLots}</b> lots
          </span>
          <span>
            <b>{island ? openCount : totalOpen}</b> for sale
          </span>
        </div>}
        <div className={styles.topActions}>
          {(island || outlier) && (
            <button onClick={() => focusIsland(null)} className={styles.zoomOut}>
              ⤢ All islands
            </button>
          )}
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
                  className={i.id === focusId ? styles.isleOn : styles.isle}
                  onClick={() => focusIsland(i.id)}
                  title={i.name}
                >
                  {i.num}
                </button>
              ))}
            </div>
          </div>
        ))}

        {charted.length > 0 && (
          <div className={styles.letterRow}>
            <span className={styles.letterMark}>✦</span>
            <div className={styles.letterIslands}>
              {charted.map((o) => (
                <button
                  key={o.id}
                  className={o.id === focusId ? styles.isleOn : styles.charted}
                  onClick={() => focusIsland(o.id)}
                  title={`${o.name} — charted by you`}
                >
                  {o.name.split(' ')[0].slice(0, 4)}
                </button>
              ))}
            </div>
          </div>
        )}
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
            {selected.frontage}×{selected.depth} paces · {island?.name}
          </p>

          {market && (
            <div className={styles.market}>
              <div className={styles.marketTop}>
                <div>
                  <small>Market value</small>
                  <strong>{USD.format(market.value)}</strong>
                </div>
                {market.improvement > 0 && (
                  <span className={styles.gain}>
                    +{USD.format(market.improvement)} built
                  </span>
                )}
              </div>
              <div className={`${styles.street} ${styles[market.street.replace(' ', '')]}`}>
                <b>{market.street}</b>
                <p>{STREET_NOTE[market.street]}</p>
              </div>
            </div>
          )}

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

      {outlier && (
        <div className={styles.overviewHint}>
          <strong>{outlier.name}</strong>
          <span>{outlier.lore}</span>
        </div>
      )}

      {!island && !outlier && (
        <div className={styles.overviewHint}>
          <strong>The ARC from above</strong>
          <span>Click any island to drop in. {totalOpen} lots for sale across all 18.</span>
        </div>
      )}

      <p className={styles.disclaimer}>
        Buildings on sold lots are generated, not other players. Real shared
        builds replace them lot by lot once there is a backend.
      </p>
    </div>
  );
}

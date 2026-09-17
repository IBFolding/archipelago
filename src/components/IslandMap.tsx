'use client';

import { useMemo, useState } from 'react';
import { ISLANDS } from '@/lib/content';
import { USD, forSaleFor, fromPriceFor } from '@/lib/plots';
import styles from './Sections.module.css';

/**
 * Top-down plan of the archipelago, generated from the same coordinates the
 * 3D hero uses — so the map and the world can never drift apart. The five
 * letterform islands spell the ARC "A"; the volcano sits off on its own.
 */
export function IslandMap({ onBook }: { onBook: (islandId: string) => void }) {
  const [activeId, setActiveId] = useState(ISLANDS[4].id);
  const active = ISLANDS.find((i) => i.id === activeId) ?? ISLANDS[0];

  const view = useMemo(() => {
    const pad = 3.5;
    // Keep the frame symmetric about x=0 so the letterform stays centred and
    // the off-letter volcano just occupies the margin instead of skewing it.
    const halfW = Math.max(...ISLANDS.map((i) => Math.abs(i.pos[0]) + i.shape.rx)) + pad;
    const zs = ISLANDS.map((i) => i.pos[1]);
    const minZ = Math.min(...zs) - pad;
    const maxZ = Math.max(...zs) + pad;
    return { minX: -halfW, minZ, w: halfW * 2, h: maxZ - minZ };
  }, []);

  return (
    <section className={styles.section} id="islands">
      <div className="shell">
        <div className="section-head">
          <div>
            <div className="kicker">Six islands. One letter.</div>
            <h2 className="section-title">
              It is shaped like an <em className={styles.em}>A</em>.
              <br />
              For ARC. You can see it from the plane.
            </h2>
          </div>
          <p className="lead">
            Five islands form the letter. The sixth is a volcano that was not invited and
            turned up anyway. Pick one, and that is where you land with nothing.
          </p>
        </div>

        <div className={styles.mapGrid}>
          <div className={styles.mapPane}>
            <svg
              className={styles.map}
              viewBox={`${view.minX} ${view.minZ} ${view.w} ${view.h}`}
              role="group"
              aria-label="Map of the archipelago"
            >
              {ISLANDS.map((i) => {
                const on = i.id === activeId;
                const r = (i.shape.rx + i.shape.rz) / 2;
                return (
                  <g
                    key={i.id}
                    transform={`translate(${i.pos[0]} ${i.pos[1]}) rotate(${
                      (i.shape.rot * 180) / Math.PI
                    })`}
                    className={styles.mapIsland}
                    onClick={() => setActiveId(i.id)}
                    onKeyDown={(e) => e.key === 'Enter' && setActiveId(i.id)}
                    tabIndex={0}
                    role="button"
                    aria-label={i.name}
                    aria-pressed={on}
                  >
                    {/* surf ring */}
                    <ellipse
                      rx={i.shape.rx * 1.22}
                      ry={i.shape.rz * 1.22}
                      fill="#ffffff"
                      opacity={on ? 0.5 : 0.28}
                    />
                    <ellipse rx={i.shape.rx} ry={i.shape.rz} fill="#ffe7a3" />
                    <ellipse
                      rx={i.shape.rx * 0.74}
                      ry={i.shape.rz * 0.74}
                      fill={i.vibe === 'cursed' ? '#5b4a52' : '#2f9d57'}
                    />
                    <text
                      className={styles.mapNum}
                      textAnchor="middle"
                      dominantBaseline="central"
                      transform={`rotate(${(-i.shape.rot * 180) / Math.PI})`}
                      fontSize={r * 0.62}
                    >
                      {i.num}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div className={styles.compass} aria-hidden="true">
              N ↑
            </div>
            <p className={styles.mapNote} aria-hidden="true">
              boats go this-ish way →
            </p>
          </div>

          <aside className={styles.mapCard}>
            <small>
              Island {active.num} · {forSaleFor(active.id).length} lots for sale
            </small>
            <h3>{active.name}</h3>
            <p className={styles.tagline}>{active.tagline}</p>
            <p>{active.blurb}</p>
            <ul className={styles.perks}>
              {active.perks.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <div className={styles.mapCardFoot}>
              <div>
                <small>Lots from</small>
                <strong>{USD.format(fromPriceFor(active.id) || active.fromPrice)}</strong>
              </div>
              <button onClick={() => onBook(active.id)}>See the parcels</button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ISLANDS, LETTERS, LETTER_ORIGIN } from '@/lib/content';
import { USD, forSaleFor, fromPriceFor } from '@/lib/plots';
import { IslandPreview } from '@/world/IslandPreview';
import { useInView } from '@/hooks/useInView';
import { Reveal, SplitHeading } from './Reveal';
import styles from './Sections.module.css';

/**
 * The whole word from the air. Positions come from the same definitions the 3D
 * hero uses, so the map and the world can never drift apart.
 */
export function IslandMap({ onBook }: { onBook: (islandId: string) => void }) {
  const [activeId, setActiveId] = useState(ISLANDS[4].id);
  const active = ISLANDS.find((i) => i.id === activeId) ?? ISLANDS[0];
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: '200px' });

  const view = useMemo(() => {
    const pad = 6;
    const xs = ISLANDS.flatMap((i) => [i.pos[0] - i.shape.rx, i.pos[0] + i.shape.rx]);
    const zs = ISLANDS.flatMap((i) => [i.pos[1] - i.shape.rz, i.pos[1] + i.shape.rz]);
    const minX = Math.min(...xs) - pad;
    const maxX = Math.max(...xs) + pad;
    const minZ = Math.min(...zs) - pad;
    const maxZ = Math.max(...zs) + pad;
    return { minX, minZ, w: maxX - minX, h: maxZ - minZ };
  }, []);

  return (
    <section className={styles.section} id="islands">
      <div className="shell">
        <div className="section-head">
          <div>
            <Reveal>
              <div className="kicker">Eighteen islands. Three letters.</div>
            </Reveal>
            <SplitHeading text={'The archipelago\nspells ARC.'} />
          </div>
          <Reveal delay={120}>
            <p className="lead">
              An A to land on, an R to work on, a C to disappear on. You can see the whole
              word from the plane, which is the single best thing about arriving here.
            </p>
          </Reveal>
        </div>

        <Reveal variant="scale">
          <div className={styles.wordMap}>
            <svg
              viewBox={`${view.minX} ${view.minZ} ${view.w} ${view.h}`}
              role="group"
              aria-label="Map of the ARC archipelago"
              className={styles.wordSvg}
            >
              {LETTERS.map((L) => (
                <text
                  key={L.id}
                  x={LETTER_ORIGIN[L.id] - 1}
                  y={view.minZ + view.h - 3}
                  className={styles.letterGhost}
                  textAnchor="middle"
                >
                  {L.id}
                </text>
              ))}

              {ISLANDS.map((i) => {
                const on = i.id === activeId;
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
                    <ellipse
                      rx={i.shape.rx * 1.3}
                      ry={i.shape.rz * 1.3}
                      fill="#ffffff"
                      opacity={on ? 0.6 : 0.3}
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
                      fontSize={Math.min(i.shape.rx, i.shape.rz) * 0.9}
                    >
                      {i.num}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </Reveal>

        {/* selected island: live 3D on the left, details on the right */}
        <div className={styles.previewGrid} ref={ref}>
          <div className={styles.previewPane}>
            <IslandPreview island={active} active={inView} />
            <span className={styles.previewTag}>Island {active.num} · live</span>
          </div>

          <aside className={styles.mapCard}>
            <small>
              {active.letter} section · {forSaleFor(active.id).length} lots for sale
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
              <div className={styles.cardActions}>
                <Link className={styles.flyOver} href={`/island/?i=${active.id}`}>
                  Fly over it
                </Link>
                <button onClick={() => onBook(active.id)}>See the lots</button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

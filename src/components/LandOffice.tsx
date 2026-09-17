'use client';

import { useEffect, useMemo, useState } from 'react';
import { ISLANDS } from '@/lib/content';
import {
  TIER_BLURB,
  TIER_LABEL,
  availableFor,
  plotPath,
  plotsFor,
  type Plot,
  type PlotTier,
} from '@/lib/plots';
import styles from './LandOffice.module.css';

type Filter = 'all' | 'available';

export function LandOffice({
  onClaim,
  focusIslandId,
}: {
  onClaim: (plot: Plot) => void;
  /** Set when the hero booking bar or the map sends a visitor here. */
  focusIslandId?: string;
}) {
  const [islandId, setIslandId] = useState(ISLANDS[0].id);
  const [filter, setFilter] = useState<Filter>('available');
  const [tier, setTier] = useState<PlotTier | 'any'>('any');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (focusIslandId) {
      setIslandId(focusIslandId);
      setSelectedId(null);
    }
  }, [focusIslandId]);

  const island = ISLANDS.find((i) => i.id === islandId)!;
  const plots = plotsFor(islandId);

  const visible = useMemo(
    () =>
      plots.filter(
        (p) =>
          (filter === 'all' || !p.claimed) && (tier === 'any' || p.tier === tier),
      ),
    [plots, filter, tier],
  );

  const selected =
    plots.find((p) => p.id === selectedId) ?? visible.find((p) => !p.claimed) ?? null;

  const open = availableFor(islandId);
  const { rx, rz } = island.shape;
  const pad = 1.25;

  const pickIsland = (id: string) => {
    setIslandId(id);
    setSelectedId(null);
  };

  return (
    <section className={styles.section} id="land">
      <div className="shell">
        <div className="section-head">
          <div>
            <div className="kicker">The land office</div>
            <h2 className="section-title">
              Pick your actual plot.
              <br />
              These are the parcels.
            </h2>
          </div>
          <p className="lead">
            Every island is surveyed into numbered parcels: beachfront ring, inland ring,
            and headland up top. Grey ones are gone. Pick a number, and that is the dirt
            you wash up on.
          </p>
        </div>

        {/* Island picker */}
        <div className={styles.tabs} role="tablist" aria-label="Islands">
          {ISLANDS.map((i) => {
            const n = availableFor(i.id).length;
            return (
              <button
                key={i.id}
                role="tab"
                aria-selected={i.id === islandId}
                className={i.id === islandId ? styles.tabOn : styles.tab}
                onClick={() => pickIsland(i.id)}
              >
                <small>{i.num}</small>
                <strong>{i.name}</strong>
                <em>{n ? `${n} open` : 'sold out'}</em>
              </button>
            );
          })}
        </div>

        <div className={styles.grid}>
          {/* Parcel plan */}
          <div className={styles.planPane}>
            <div className={styles.planHead}>
              <span>
                {island.name} · parcel plan
              </span>
              <span className={styles.legend}>
                <i className={styles.swBeach} /> beachfront
                <i className={styles.swInland} /> inland
                <i className={styles.swHead} /> headland
                <i className={styles.swTaken} /> taken
              </span>
            </div>

            <svg
              className={styles.plan}
              viewBox={`${-rx * pad} ${-rz * pad} ${rx * pad * 2} ${rz * pad * 2}`}
              role="group"
              aria-label={`Parcel plan for ${island.name}`}
            >
              {/* surf + beach */}
              <ellipse rx={rx * 1.14} ry={rz * 1.14} fill="#ffffff" opacity="0.5" />
              <ellipse rx={rx * 1.03} ry={rz * 1.03} fill="#ffe7a3" />

              {plots.map((p) => {
                const isSel = selected?.id === p.id;
                // Taken parcels stay visible in grey — on a plat map, who is
                // already there is information. Only fade out parcels the tier
                // filter has excluded.
                const dimmed = tier !== 'any' && p.tier !== tier;
                return (
                  <path
                    key={p.id}
                    d={plotPath(p, rx, rz)}
                    className={[
                      styles.parcel,
                      p.claimed ? styles.taken : styles[p.tier],
                      isSel ? styles.selected : '',
                      dimmed ? styles.dimmed : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    tabIndex={p.claimed ? -1 : 0}
                    role="button"
                    aria-label={`Plot ${p.id}, ${TIER_LABEL[p.tier]}, ${
                      p.claimed ? 'taken' : `${p.price} ISLAND`
                    }`}
                    onClick={() => setSelectedId(p.id)}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedId(p.id)}
                  />
                );
              })}
            </svg>

            <p className={styles.planNote}>
              {open.length} of {plots.length} parcels still open on {island.name}.
            </p>
          </div>

          {/* Inventory */}
          <div className={styles.listPane}>
            <div className={styles.filters}>
              <div className={styles.seg} role="group" aria-label="Availability">
                {(['available', 'all'] as Filter[]).map((f) => (
                  <button
                    key={f}
                    className={filter === f ? styles.segOn : undefined}
                    aria-pressed={filter === f}
                    onClick={() => setFilter(f)}
                  >
                    {f === 'available' ? 'Open' : 'Everything'}
                  </button>
                ))}
              </div>
              <div className={styles.seg} role="group" aria-label="Parcel type">
                {(['any', 'beachfront', 'inland', 'headland'] as const).map((t) => (
                  <button
                    key={t}
                    className={tier === t ? styles.segOn : undefined}
                    aria-pressed={tier === t}
                    onClick={() => setTier(t)}
                  >
                    {t === 'any' ? 'All' : TIER_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>

            <ul className={styles.list}>
              {visible.map((p) => (
                <li key={p.id}>
                  <button
                    className={selected?.id === p.id ? styles.rowOn : styles.row}
                    onClick={() => setSelectedId(p.id)}
                    disabled={p.claimed}
                  >
                    <b>{p.id}</b>
                    <span className={styles.rowTier}>{TIER_LABEL[p.tier]}</span>
                    <span className={styles.rowPaces}>{p.paces} paces</span>
                    <span className={styles.rowPrice}>
                      {p.claimed ? 'Taken' : `${p.price.toLocaleString()} $ISLAND`}
                    </span>
                  </button>
                </li>
              ))}
              {!visible.length && (
                <li className={styles.empty}>
                  Nothing open matching that. Try another island, or the volcano.
                </li>
              )}
            </ul>

            {selected && (
              <div className={styles.detail}>
                <small>
                  Plot {selected.id} · {TIER_LABEL[selected.tier]}
                </small>
                <h3>
                  {selected.paces} paces on {island.name}
                </h3>
                <p className={styles.tierBlurb}>{TIER_BLURB[selected.tier]}</p>
                <p className={styles.quirk}>{selected.quirk}</p>
                <div className={styles.detailFoot}>
                  <div>
                    <small>Price</small>
                    <strong>
                      {selected.claimed
                        ? 'Not for sale'
                        : `${selected.price.toLocaleString()} $ISLAND`}
                    </strong>
                  </div>
                  <button
                    onClick={() => onClaim(selected)}
                    disabled={selected.claimed}
                  >
                    {selected.claimed ? 'Already taken' : 'Claim this plot'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

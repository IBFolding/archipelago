'use client';

import { useEffect, useMemo, useState } from 'react';
import { ISLANDS, LETTERS } from '@/lib/content';
import {
  TIER_BLURB,
  TIER_LABEL,
  USD,
  askingPrice,
  availableFor,
  forSaleFor,
  platFor,
  plotsFor,
  resalesFor,
  type Plot,
  type PlotTier,
} from '@/lib/plots';
import styles from './LandOffice.module.css';

type Availability = 'open' | 'resale' | 'all';
type Sort = 'price-asc' | 'price-desc' | 'size';

export function LandOffice({
  onClaim,
  focusIslandId,
}: {
  onClaim: (plot: Plot) => void;
  /** Set when the hero booking bar or the island map sends a visitor here. */
  focusIslandId?: string;
}) {
  const [islandId, setIslandId] = useState(ISLANDS[0].id);
  const [availability, setAvailability] = useState<Availability>('open');
  const [tier, setTier] = useState<PlotTier | 'any'>('any');
  const [sort, setSort] = useState<Sort>('price-asc');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  useEffect(() => {
    if (focusIslandId) {
      setIslandId(focusIslandId);
      setSelectedId(null);
    }
  }, [focusIslandId]);

  const island = ISLANDS.find((i) => i.id === islandId)!;
  const plat = platFor(islandId);
  const plots = plotsFor(islandId);
  const open = availableFor(islandId);
  const resales = resalesFor(islandId);

  const visible = useMemo(() => {
    const list = plots.filter((p) => {
      const matchTier = tier === 'any' || p.tier === tier;
      if (!matchTier) return false;
      if (availability === 'open') return !p.claimed;
      if (availability === 'resale') return p.claimed && !!p.resale;
      return true;
    });
    const sorted = [...list];
    const price = (p: Plot) => askingPrice(p) || p.price;
    if (sort === 'price-asc') sorted.sort((a, b) => price(a) - price(b));
    if (sort === 'price-desc') sorted.sort((a, b) => price(b) - price(a));
    if (sort === 'size')
      sorted.sort((a, b) => b.frontage * b.depth - a.frontage * a.depth);
    return sorted;
  }, [plots, availability, tier, sort]);

  const selected =
    plots.find((p) => p.id === selectedId) ?? visible.find((p) => !p.claimed) ?? null;

  const { rx, rz } = island.shape;
  const pad = 1.16;

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
              Pick your actual lot.
              <br />
              Here is the survey.
            </h2>
          </div>
          <p className="lead">
            The archipelago spells ARC, and each letter is a section you can live on. Every
            island is platted into numbered lots on named streets. Land is bought and sold
            in dollars; $ISLAND is what you spend once you are here.
          </p>
        </div>

        {/* Island picker, grouped by the letter each island belongs to */}
        {LETTERS.map((L) => {
          const group = ISLANDS.filter((i) => i.letter === L.id);
          const groupOpen = group.reduce((n, i) => n + forSaleFor(i.id).length, 0);
          return (
            <div key={L.id} className={styles.letterGroup}>
              <div className={styles.letterHead}>
                <span className={styles.letterMark}>{L.id}</span>
                <div>
                  <strong>{L.name}</strong>
                  <p>{L.blurb}</p>
                </div>
                <em>{groupOpen} for sale</em>
              </div>
              <div className={styles.tabs} role="tablist" aria-label={`Islands on ${L.name}`}>
                {group.map((i) => {
                  const n = forSaleFor(i.id).length;
                  const total = plotsFor(i.id).length;
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
                      <em>{n ? `${n} of ${total} for sale` : 'nothing for sale'}</em>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className={styles.grid}>
          {/* ------------------------------------------------ parcel plan -- */}
          <div className={styles.planPane}>
            <div className={styles.planHead}>
              <span>{island.name} · subdivision plat</span>
              <span className={styles.legend}>
                <i className={styles.swBeach} /> beachfront
                <i className={styles.swInland} /> inland
                <i className={styles.swHead} /> headland
                <i className={styles.swTaken} /> sold
              </span>
            </div>

            <svg
              className={styles.plan}
              viewBox={`${-rx * pad} ${-rz * pad} ${rx * pad * 2} ${rz * pad * 2}`}
              role="group"
              aria-label={`Subdivision plat for ${island.name}`}
            >
              <defs>
                <clipPath id={`isle-${islandId}`}>
                  <ellipse rx={rx} ry={rz} />
                </clipPath>
              </defs>

              {/* surf, beach, vegetation */}
              <ellipse rx={rx * 1.1} ry={rz * 1.1} className={styles.surf} />
              <ellipse rx={rx * 1.02} ry={rz * 1.02} className={styles.sand} />
              <ellipse rx={rx * 0.99} ry={rz * 0.99} className={styles.ground} />

              {/* street grid + names, clipped to the shoreline */}
              <g clipPath={`url(#isle-${islandId})`}>
                {plat.streets.map((s, i) => (
                  <rect
                    key={`${s.kind}-${i}`}
                    x={s.x}
                    y={s.z}
                    width={s.w}
                    height={s.d}
                    className={styles.street}
                  />
                ))}
                {plat.streets
                  .filter((s) => s.kind === 'street')
                  .map((s, i) => (
                    <text
                      key={`name-${i}`}
                      x={0}
                      // Sit the name on the centre line of the road, sized to
                      // the road's own width so it can never spill onto lots.
                      y={s.z + s.d / 2}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className={styles.streetName}
                      style={{ fontSize: s.d * 0.46 }}
                    >
                      {s.name}
                    </text>
                  ))}
              </g>

              {/* coast road */}
              <ellipse
                rx={rx * plat.coastalR}
                ry={rz * plat.coastalR}
                className={styles.coastRoad}
              />

              {/* lots */}
              {plots.map((p) => {
                const isSel = selected?.id === p.id;
                const isHover = hoverId === p.id;
                const dimmed = tier !== 'any' && p.tier !== tier;
                return (
                  <rect
                    key={p.id}
                    x={p.rect.x}
                    y={p.rect.z}
                    width={p.rect.w}
                    height={p.rect.d}
                    rx={0.04}
                    className={[
                      styles.lot,
                      p.claimed ? (p.resale ? styles.resale : styles.sold) : styles[p.tier],
                      isSel ? styles.selected : '',
                      isHover ? styles.hovered : '',
                      dimmed ? styles.dimmed : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    tabIndex={p.claimed && !p.resale ? -1 : 0}
                    role="button"
                    aria-label={`Lot ${p.id}, ${p.address}, ${TIER_LABEL[p.tier]}, ${
                      p.claimed
                        ? p.resale
                          ? `resale ${USD.format(p.resale)}`
                          : 'sold'
                        : USD.format(p.price)
                    }`}
                    onClick={() => setSelectedId(p.id)}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedId(p.id)}
                    onPointerEnter={() => setHoverId(p.id)}
                    onPointerLeave={() => setHoverId(null)}
                  />
                );
              })}
            </svg>

            <p className={styles.planNote}>
              {plots.length} lots surveyed · {open.length} open · {resales.length} on
              resale · {island.name}
            </p>
          </div>

          {/* -------------------------------------------------- inventory -- */}
          <div className={styles.listPane}>
            <div className={styles.filters}>
              <div className={styles.seg} role="group" aria-label="Availability">
                {(
                  [
                    ['open', 'From the land office'],
                    ['resale', `Resale (${resales.length})`],
                    ['all', 'Everything'],
                  ] as [Availability, string][]
                ).map(([f, label]) => (
                  <button
                    key={f}
                    className={availability === f ? styles.segOn : undefined}
                    aria-pressed={availability === f}
                    onClick={() => setAvailability(f)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className={styles.seg} role="group" aria-label="Lot type">
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
              <div className={styles.seg} role="group" aria-label="Sort">
                {(
                  [
                    ['price-asc', 'Cheapest'],
                    ['price-desc', 'Priciest'],
                    ['size', 'Biggest'],
                  ] as [Sort, string][]
                ).map(([v, label]) => (
                  <button
                    key={v}
                    className={sort === v ? styles.segOn : undefined}
                    aria-pressed={sort === v}
                    onClick={() => setSort(v)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <p className={styles.resultCount}>
              Showing {visible.length} {visible.length === 1 ? 'lot' : 'lots'}
            </p>

            <ul className={styles.list}>
              {visible.map((p) => (
                <li key={p.id}>
                  <button
                    className={selected?.id === p.id ? styles.rowOn : styles.row}
                    onClick={() => setSelectedId(p.id)}
                    onPointerEnter={() => setHoverId(p.id)}
                    onPointerLeave={() => setHoverId(null)}
                    disabled={p.claimed && !p.resale}
                  >
                    <span className={styles.rowAddr}>
                      <b>{p.address}</b>
                      <small>
                        Lot {p.id} · {p.frontage}×{p.depth} paces
                      </small>
                    </span>
                    <span
                      className={`${styles.chip} ${styles[`chip_${p.tier}`]}`}
                    >
                      {TIER_LABEL[p.tier]}
                    </span>
                    <span className={styles.rowPrice}>
                      {p.claimed
                        ? p.resale
                          ? USD.format(p.resale)
                          : 'Sold'
                        : USD.format(p.price)}
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
                  Lot {selected.id} · {TIER_LABEL[selected.tier]}
                  {selected.resale ? ' · Owner resale' : ''}
                </small>
                <h3>{selected.address}</h3>
                <p className={styles.tierBlurb}>{TIER_BLURB[selected.tier]}</p>
                <p className={styles.quirk}>{selected.quirk}</p>
                <dl className={styles.specs}>
                  <div>
                    <dt>Frontage</dt>
                    <dd>{selected.frontage} paces</dd>
                  </div>
                  <div>
                    <dt>Depth</dt>
                    <dd>{selected.depth} paces</dd>
                  </div>
                  <div>
                    <dt>Island</dt>
                    <dd>{island.name}</dd>
                  </div>
                </dl>
                <div className={styles.detailFoot}>
                  <div>
                    <small>Price</small>
                    <strong>
                      {askingPrice(selected)
                        ? USD.format(askingPrice(selected))
                        : 'Not for sale'}
                    </strong>
                  </div>
                  <button
                    onClick={() => onClaim(selected)}
                    disabled={!askingPrice(selected)}
                  >
                    {selected.resale
                      ? 'Buy from owner'
                      : selected.claimed
                        ? 'Already sold'
                        : 'Claim this lot'}
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

'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Link from 'next/link';
import { BuildWorld } from '@/world/BuildWorld';
import {
  BRAND_COLORS,
  DEFAULT_BRAND,
  START_BUDGET,
  canPlace,
  gridFor,
  loadLot,
  saveLot,
  spentOf,
  uid,
  type Brand,
  type Placed,
} from '@/lib/build';
import { ALL_PLOTS, TIER_LABEL, type Plot } from '@/lib/plots';
import {
  disturbs,
  loadFound,
  saveFound,
  secretUnder,
  OUTLIER_BY_ID,
  type Secret,
} from '@/lib/secrets';
import {
  EVENT_BY_ID,
  NEW_EVENT_STATE,
  advance,
  exposures,
  profileOf,
  repairCost,
  seasonAt,
  type EventState,
  type FiredEvent,
} from '@/lib/events';
import { ISLANDS } from '@/lib/content';
import {
  BRANDABLE,
  CATEGORY_LABEL,
  KIT,
  KIT_BY_ID,
  LEVEL_NAME,
  upgradeCost,
  type KitCategory,
} from '@/world/buildKit';
import styles from './build.module.css';

const CATEGORIES: KitCategory[] = [
  'structures',
  'leisure',
  'nature',
  'utility',
  'signage',
];

export default function BuildPage() {
  const [lotId, setLotId] = useState('demo');
  const [plot, setPlot] = useState<Plot | null>(null);
  const [items, setItems] = useState<Placed[]>([]);
  const [brush, setBrush] = useState<string | null>(null);
  const [brushRot, setBrushRot] = useState(0);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [hover, setHover] = useState<{ x: number; z: number } | null>(null);
  const [category, setCategory] = useState<KitCategory>('structures');
  const [night, setNight] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [events, setEvents] = useState<EventState>(NEW_EVENT_STATE);
  const [justFired, setJustFired] = useState<FiredEvent[]>([]);
  const [showConditions, setShowConditions] = useState(false);
  const [discovery, setDiscovery] = useState<Secret | null>(null);

  // Load whichever lot the land office sent us to.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('lot');
    const id = q || 'demo';
    setLotId(id);
    // The builder lot is the surveyed lot, so its grid is the real frontage
    // and depth in paces.
    setPlot(ALL_PLOTS.find((p) => p.id === id) ?? null);
    const loaded = loadLot(id);
    setItems(loaded.items);
    setEvents(loaded.events ?? NEW_EVENT_STATE);
    setReady(true);
  }, []);

  const grid = useMemo(() => gridFor(plot), [plot]);
  const profile = useMemo(() => profileOf(items, plot), [items, plot]);
  const risks = useMemo(() => exposures(profile), [profile]);
  const season = seasonAt();

  // Resolve whatever happened while you were away, once, on arrival.
  useEffect(() => {
    if (!ready) return;
    const { state, fired } = advance(lotId, events, profile);
    if (fired.length || state.lastTick !== events.lastTick) {
      setEvents(state);
      if (fired.length) setJustFired(fired);
      saveLot({ lotId, items, events: state });
    }

    // Something that disturbs the ground can turn up whatever the lot has
    // been sitting on. Nothing advertises that there is anything to find.
    if (fired.some((f) => disturbs(f.id))) {
      const secret = secretUnder(lotId);
      const found = loadFound();
      if (secret && !found.secrets.includes(secret.id)) {
        found.secrets.push(secret.id);
        if (secret.charts && !found.charted.includes(secret.charts)) {
          found.charted.push(secret.charts);
        }
        saveFound(found);
        setDiscovery(secret);
      }
    }
    // Only on arrival: this is a catch-up, not a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  const island = plot ? ISLANDS.find((i) => i.id === plot.islandId) : null;
  const spent = useMemo(() => spentOf(items), [items]);
  const budget = START_BUDGET - spent;
  const selected = items.find((i) => i.uid === selectedUid) ?? null;

  const ghost = useMemo(() => {
    if (!brush || !hover) return null;
    const candidate: Placed = { uid: '_ghost', kitId: brush, x: hover.x, z: hover.z, rot: brushRot };
    const affordable = (KIT_BY_ID[brush]?.cost ?? 0) <= budget;
    return { x: hover.x, z: hover.z, ok: canPlace(items, candidate, grid) && affordable };
  }, [brush, hover, brushRot, items, budget, grid]);

  const place = useCallback(
    (x: number, z: number) => {
      if (!brush) return;
      const item = KIT_BY_ID[brush];
      if (!item) return;
      if (item.cost > budget) {
        setStatus('Not enough $ISLAND for that.');
        return;
      }
      const next: Placed = {
        uid: uid(),
        kitId: brush,
        x,
        z,
        rot: brushRot,
        brand: BRANDABLE.has(brush) ? { ...DEFAULT_BRAND } : undefined,
      };
      if (!canPlace(items, next, grid)) {
        setStatus('That does not fit there.');
        return;
      }
      setItems((prev) => [...prev, next]);
      setStatus(null);
    },
    [brush, brushRot, budget, items, grid],
  );

  const rotateSelected = () => {
    if (!selected) return;
    const rotated = { ...selected, rot: (selected.rot + 1) % 4 };
    if (!canPlace(items, rotated, grid)) {
      setStatus('No room to turn that here.');
      return;
    }
    setItems((prev) => prev.map((i) => (i.uid === selected.uid ? rotated : i)));
  };

  const upgradeSelected = () => {
    if (!selected) return;
    const item = KIT_BY_ID[selected.kitId];
    const level = selected.level ?? 1;
    if (!item?.maxLevel || level >= item.maxLevel) return;
    const cost = upgradeCost(selected.kitId, level + 1);
    if (cost > budget) {
      setStatus('Not enough $ISLAND for that storey.');
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.uid === selected.uid ? { ...i, level: level + 1 } : i)),
    );
    setStatus(null);
  };

  const removeSelected = () => {
    if (!selected) return;
    setItems((prev) => prev.filter((i) => i.uid !== selected.uid));
    setSelectedUid(null);
  };

  const updateBrand = (patch: Partial<Brand>) => {
    if (!selected) return;
    setItems((prev) =>
      prev.map((i) =>
        i.uid === selected.uid
          ? { ...i, brand: { ...DEFAULT_BRAND, ...i.brand, ...patch } }
          : i,
      ),
    );
  };

  // Keyboard: R rotates the brush, Escape clears, Delete removes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'r' || e.key === 'R') {
        if (selected) rotateSelected();
        else setBrushRot((r) => (r + 1) % 4);
      }
      if (e.key === 'Escape') {
        setBrush(null);
        setSelectedUid(null);
      }
      if (e.key === 'Backspace' || e.key === 'Delete') removeSelected();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const repair = () => {
    const cost = repairCost(events.condition);
    if (cost > budget) {
      setStatus('Not enough $ISLAND to put it right.');
      return;
    }
    const next = { ...events, condition: 100 };
    setEvents(next);
    saveLot({ lotId, items, events: next });
    setStatus('Repaired. Good as new, more or less.');
  };

  const save = () => {
    const ok = saveLot({ lotId, items, events });
    setStatus(ok ? 'Saved to this browser.' : 'Could not save — storage is blocked here.');
  };

  const clearAll = () => {
    setItems([]);
    setSelectedUid(null);
    setStatus('Lot cleared.');
  };

  return (
    <div className={styles.page}>
      <div className={styles.canvasWrap}>
        <Canvas
          shadows
          dpr={[1, 1.6]}
          gl={{ antialias: true }}
          camera={{ fov: 42, position: [0, 30, 40], near: 0.1, far: 800 }}
          // A camera prop sets position but not orientation, and OrbitControls
          // only re-aims on input, so point it at the lot up front.
          onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
        >
          <Suspense fallback={null}>
            <BuildWorld
              grid={grid}
              items={items}
              selectedUid={selectedUid}
              brush={brush}
              brushRot={brushRot}
              night={night}
              ghost={ghost}
              onCellClick={place}
              onCellHover={(x, z) => setHover({ x, z })}
              onSelect={setSelectedUid}
            />
            <OrbitControls
              makeDefault
              enablePan
              enableDamping
              dampingFactor={0.08}
              maxPolarAngle={1.42}
              minDistance={10}
              maxDistance={90}
              target={[0, 0, 0]}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* ------------------------------------------------------ top bar -- */}
      <header className={styles.topbar}>
        <Link href="/" className={styles.back}>
          ← ARCHipelago
        </Link>
        <div className={styles.lotName}>
          <small>
            {plot && island
              ? `${TIER_LABEL[plot.tier]} · ${island.name}`
              : 'Demo lot'}
          </small>
          <strong>{plot ? plot.address : `${grid.w}×${grid.d} paces`}</strong>
        </div>
        <div className={styles.budget}>
          <small>Balance</small>
          <strong className={budget < 500 ? styles.low : undefined}>
            {budget.toLocaleString()} <span>$ISLAND</span>
          </strong>
        </div>
        <div className={styles.topActions}>
          <button
            onClick={() => setShowConditions((v) => !v)}
            className={events.condition < 70 ? styles.worn : undefined}
          >
            ⚑ Conditions
          </button>
          <button onClick={() => setNight((n) => (n > 0.5 ? 0 : 1))}>
            {night > 0.5 ? '☀ Day' : '☾ Night'}
          </button>
          <button onClick={save}>Save</button>
          <button onClick={clearAll} className={styles.danger}>
            Clear
          </button>
        </div>
      </header>

      {status && (
        <p className={styles.status} role="status">
          {status}
        </p>
      )}

      {/* --------------------------------------------------- palette ----- */}
      <aside className={styles.palette}>
        <div className={styles.cats}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={category === c ? styles.catOn : undefined}
              onClick={() => setCategory(c)}
            >
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>

        <div className={styles.kit}>
          {KIT.filter((k) => k.category === category).map((k) => {
            const on = brush === k.id;
            const tooDear = k.cost > budget;
            return (
              <button
                key={k.id}
                className={`${styles.kitItem} ${on ? styles.kitOn : ''} ${
                  tooDear ? styles.kitDear : ''
                }`}
                onClick={() => {
                  setBrush(on ? null : k.id);
                  setSelectedUid(null);
                }}
              >
                <strong>{k.name}</strong>
                <span>{k.blurb}</span>
                <em>
                  {k.cost.toLocaleString()} $ISLAND · {k.size[0]}×{k.size[1]}
                </em>
              </button>
            );
          })}
        </div>

        <p className={styles.hint}>
          {brush
            ? 'Click the lot to place. R rotates. Escape cancels.'
            : 'Pick something, or click a piece you have already built.'}
        </p>
      </aside>

      {/* ------------------------------------------------ selected piece -- */}
      {selected && (
        <aside className={styles.inspector}>
          <div className={styles.inspHead}>
            <strong>
              {KIT_BY_ID[selected.kitId]?.name}
              {KIT_BY_ID[selected.kitId]?.maxLevel && (
                <em className={styles.level}>
                  {LEVEL_NAME[selected.level ?? 1]} · L{selected.level ?? 1}
                </em>
              )}
            </strong>
            <button onClick={() => setSelectedUid(null)} aria-label="Close">
              ×
            </button>
          </div>

          {(() => {
            const item = KIT_BY_ID[selected.kitId];
            const level = selected.level ?? 1;
            if (!item?.maxLevel) return null;
            if (level >= item.maxLevel) {
              return <p className={styles.maxed}>Fully built out. Nothing left to add.</p>;
            }
            const cost = upgradeCost(selected.kitId, level + 1);
            return (
              <button
                className={styles.upgrade}
                onClick={upgradeSelected}
                disabled={cost > budget}
              >
                Add a storey · {cost.toLocaleString()} $ISLAND
              </button>
            );
          })()}

          <div className={styles.inspActions}>
            <button onClick={rotateSelected}>Rotate</button>
            <button onClick={removeSelected} className={styles.danger}>
              Remove
            </button>
          </div>

          {BRANDABLE.has(selected.kitId) && (
            <div className={styles.brand}>
              <small>Put a name on it</small>
              <label>
                <span>Name</span>
                <input
                  value={selected.brand?.name ?? ''}
                  maxLength={18}
                  onChange={(e) => updateBrand({ name: e.target.value })}
                />
              </label>
              <label>
                <span>Ticker</span>
                <input
                  value={selected.brand?.ticker ?? ''}
                  maxLength={16}
                  onChange={(e) => updateBrand({ ticker: e.target.value })}
                />
              </label>
              <label>
                <span>Logo</span>
                <input
                  value={selected.brand?.emoji ?? ''}
                  maxLength={4}
                  onChange={(e) => updateBrand({ emoji: e.target.value })}
                />
              </label>
              <div className={styles.swatches}>
                {BRAND_COLORS.map((c) => (
                  <button
                    key={c}
                    style={{ background: c }}
                    aria-label={`Colour ${c}`}
                    className={selected.brand?.color === c ? styles.swOn : undefined}
                    onClick={() => updateBrand({ color: c })}
                  />
                ))}
              </div>
            </div>
          )}
        </aside>
      )}

      {/* A find. Deliberately not styled like the weather report. */}
      {discovery && (
        <div className={styles.discovery} role="status">
          <span className={styles.discoveryKicker}>
            {discovery.kind === 'chart'
              ? 'Something was under your lot'
              : discovery.kind === 'grotto'
                ? 'The ground opened'
                : 'You found something'}
          </span>
          <h2>{discovery.title}</h2>
          <p>{discovery.copy}</p>

          {discovery.charts && OUTLIER_BY_ID[discovery.charts] && (
            <div className={styles.charted}>
              <small>Charted</small>
              <strong>{OUTLIER_BY_ID[discovery.charts].name}</strong>
              <p>{OUTLIER_BY_ID[discovery.charts].lore}</p>
            </div>
          )}

          {discovery.islandReward && (
            <div className={styles.charted}>
              <small>In the box</small>
              <strong>{discovery.islandReward.toLocaleString()} $ISLAND</strong>
            </div>
          )}

          <button onClick={() => setDiscovery(null)}>
            {discovery.charts ? 'Put it in the boat' : 'Say nothing to anyone'}
          </button>
        </div>
      )}

      {/* What happened while you were away */}
      {justFired.length > 0 && (
        <div className={styles.report} role="status">
          <div className={styles.reportHead}>
            <strong>While you were gone</strong>
            <button onClick={() => setJustFired([])} aria-label="Dismiss">
              ×
            </button>
          </div>
          {justFired.slice(-4).map((f, i) => {
            const def = EVENT_BY_ID[f.id];
            if (!def) return null;
            return (
              <div key={i} className={`${styles.reportRow} ${styles[def.kind]}`}>
                <span aria-hidden="true">{def.icon}</span>
                <div>
                  <b>{def.name}</b>
                  <p>{def.copy}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Exposure readings: the risk is visible, the timing is not */}
      {showConditions && (
        <aside className={styles.conditions}>
          <div className={styles.condHead}>
            <div>
              <small>{season.name} season</small>
              <strong>Conditions</strong>
            </div>
            <button onClick={() => setShowConditions(false)} aria-label="Close">
              ×
            </button>
          </div>

          <div className={styles.condMeter}>
            <div className={styles.condBar}>
              <span style={{ width: `${events.condition}%` }} />
            </div>
            <div className={styles.condMeterRow}>
              <span>{Math.round(events.condition)}% condition</span>
              {events.condition < 100 && (
                <button onClick={repair}>
                  Repair · {repairCost(events.condition).toLocaleString()}
                </button>
              )}
            </div>
          </div>

          <p className={styles.condNote}>
            What you build decides what comes for you. You can read the risk; you cannot
            read the clock.
          </p>

          <ul className={styles.riskList}>
            {risks.slice(0, 7).map((r) => (
              <li key={r.def.id} className={styles[r.band]}>
                <span aria-hidden="true">{r.def.icon}</span>
                <div>
                  <b>{r.def.name}</b>
                  <p>{r.def.exposure}</p>
                </div>
                <em>{r.band}</em>
              </li>
            ))}
            {!risks.length && <li className={styles.empty}>Nothing has noticed you yet.</li>}
          </ul>
        </aside>
      )}

      {ready && !items.length && (
        <div className={styles.empty}>
          <strong>Bare sand, {grid.w}×{grid.d} paces.</strong>
          <span>Pick something from the kit and put it somewhere.</span>
        </div>
      )}
    </div>
  );
}

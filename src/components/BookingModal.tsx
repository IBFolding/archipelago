'use client';

import { useEffect, useRef, useState } from 'react';
import { ISLANDS } from '@/lib/content';
import styles from './BookingModal.module.css';

export interface BookingState {
  open: boolean;
  islandId?: string;
}

export function BookingModal({
  state,
  onClose,
}: {
  state: BookingState;
  onClose: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [islandId, setIslandId] = useState(state.islandId ?? ISLANDS[4].id);
  const dialogRef = useRef<HTMLDivElement>(null);
  const island = ISLANDS.find((i) => i.id === islandId) ?? ISLANDS[0];

  useEffect(() => {
    if (state.open) {
      setConfirmed(false);
      if (state.islandId) setIslandId(state.islandId);
    }
  }, [state.open, state.islandId]);

  useEffect(() => {
    if (!state.open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [state.open, onClose]);

  if (!state.open) return null;

  return (
    <div className={styles.wrap} role="presentation">
      <div className={styles.backdrop} onClick={onClose} />
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        tabIndex={-1}
        ref={dialogRef}
      >
        <button className={styles.close} onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="kicker">Absolutely not Expedia</div>
        <h2 id="booking-title">Reserve a plot.</h2>
        <p className={styles.blurb}>
          Land is not live yet. Nothing is charged, no wallet is touched, and no plot is
          actually held. This is the queue for when the boats start running.
        </p>

        <div className={styles.form}>
          <label>
            <small>Island</small>
            <select value={islandId} onChange={(e) => setIslandId(e.target.value)}>
              {ISLANDS.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.num} · {i.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <small>Plot size</small>
            <select defaultValue="beach">
              <option value="scrub">Scrub — cheap, inland, has a smell</option>
              <option value="beach">Beachfront — the whole point</option>
              <option value="cliff">Cliffside — dramatic, structurally optimistic</option>
            </select>
          </label>
          <label>
            <small>Primary objective</small>
            <select defaultValue="nothing">
              <option value="nothing">Do nothing professionally</option>
              <option value="tan">Become suspiciously tan</option>
              <option value="flight">Miss my flight</option>
              <option value="empire">Build a bar empire</option>
            </select>
          </label>
          <label>
            <small>Risk tolerance</small>
            <select defaultValue="medium">
              <option value="low">No sharks please</option>
              <option value="medium">Some sharks are fine</option>
              <option value="high">Put me next to the volcano</option>
            </select>
          </label>
        </div>

        <div className={styles.summary}>
          <div>
            <small>{island.name} · plots from</small>
            <strong>{island.fromPrice.toLocaleString()} $ISLAND</strong>
          </div>
          <span>{island.plotsLeft} left</span>
        </div>

        <button className={styles.confirm} onClick={() => setConfirmed(true)}>
          Reserve nothing →
        </button>

        {confirmed && (
          <p className={styles.confirmed} role="status">
            ✓ Beautiful. Nothing has been charged and no plot exists yet. Your vacation
            energy, however, is confirmed.
          </p>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ISLANDS } from '@/lib/content';
import { TIER_LABEL, USD, askingPrice, forSaleFor, type Plot } from '@/lib/plots';
import styles from './BookingModal.module.css';

export interface BookingState {
  open: boolean;
  islandId?: string;
  /** The specific parcel being claimed, when the visitor picked one. */
  plot?: Plot;
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
      const next = state.plot?.islandId ?? state.islandId;
      if (next) setIslandId(next);
    }
  }, [state.open, state.islandId, state.plot]);

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
          Land is not live yet. Nothing is charged, no card or wallet is touched, and no lot
          is actually held. Land sells in dollars when the boats start running; $ISLAND is
          for what you do once you are here.
        </p>

        <div className={styles.form}>
          <label>
            <small>Island</small>
            <select
              value={islandId}
              onChange={(e) => setIslandId(e.target.value)}
              disabled={!!state.plot}
            >
              {ISLANDS.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.num} · {i.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <small>Parcel</small>
            <select value={state.plot?.id ?? 'any'} disabled>
              {state.plot ? (
                <option value={state.plot.id}>
                  {state.plot.address} · {TIER_LABEL[state.plot.tier]}
                </option>
              ) : (
                <option value="any">Whatever is left, honestly</option>
              )}
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
            <small>
              {state.plot ? `${state.plot.address} · ${island.name}` : `${island.name} · lots from`}
            </small>
            <strong>
              {USD.format(state.plot ? askingPrice(state.plot) : island.fromPrice)}
            </strong>
          </div>
          <span>{forSaleFor(islandId).length} for sale</span>
        </div>

        <button className={styles.confirm} onClick={() => setConfirmed(true)}>
          Reserve nothing →
        </button>

        {confirmed && (
          <>
            <p className={styles.confirmed} role="status">
              ✓ Beautiful. Nothing has been charged and the parcel is not held. Your
              vacation energy, however, is confirmed.
            </p>
            <Link
              className={styles.startBuilding}
              href={state.plot ? `/build?lot=${state.plot.id}` : '/build'}
            >
              Start building on it →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

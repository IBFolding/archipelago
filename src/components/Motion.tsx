'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useInView, useReducedMotion } from '@/hooks/useInView';
import styles from './Motion.module.css';

/** Endless scrolling strip of facts. Duplicated once so the loop is seamless. */
export function Ticker({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  const run = [...items, ...items];
  return (
    <div className={styles.ticker} aria-hidden="true">
      <div className={`${styles.track} ${reverse ? styles.reverse : ''}`}>
        {run.map((t, i) => (
          <span key={i}>
            {t}
            <i>✦</i>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Counts up to a value the first time it scrolls into view. */
export function Counter({
  to,
  duration = 1200,
  prefix = '',
  suffix = '',
}: {
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) {
  const { ref, seen } = useInView<HTMLSpanElement>({ once: true });
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!seen) return;
    if (reduced) {
      setValue(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      // Ease out cubic, so it lands rather than stops.
      setValue(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, to, duration, reduced]);

  return (
    <span ref={ref}>
      {prefix}
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}

/** Card that leans toward the pointer. Disabled for touch and reduced motion. */
export function TiltCard({
  children,
  className = '',
  max = 7,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    if (window.matchMedia('(hover: none)').matches) return;

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `perspective(900px) rotateX(${-py * max}deg) rotateY(${
          px * max
        }deg) translateY(-4px)`;
        el.style.setProperty('--gx', `${(px + 0.5) * 100}%`);
        el.style.setProperty('--gy', `${(py + 0.5) * 100}%`);
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      el.style.transform = '';
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, [max, reduced]);

  return (
    <div ref={ref} className={`${styles.tilt} ${className}`}>
      {children}
    </div>
  );
}

/** Horizontal bar that draws itself when it scrolls into view. */
export function GrowBar({
  segments,
}: {
  segments: { pct: number; color: string; label: string }[];
}) {
  const { ref, seen } = useInView<HTMLDivElement>({ once: true });
  return (
    <div className={styles.growBar} ref={ref} role="img" aria-label="Land sale allocation">
      {segments.map((s, i) => (
        <span
          key={s.label}
          style={{
            width: seen ? `${s.pct}%` : '0%',
            background: s.color,
            transitionDelay: `${i * 110}ms`,
          }}
        />
      ))}
    </div>
  );
}

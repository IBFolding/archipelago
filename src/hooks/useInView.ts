'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Fires once when an element scrolls into view, and reports live visibility so
 * expensive WebGL sections can mount and unmount instead of rendering forever.
 */
export function useInView<T extends HTMLElement>(
  { rootMargin = '0px 0px -12% 0px', once = false } = {},
) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      setSeen(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) {
          setSeen(true);
          if (once) io.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, once]);

  return { ref, inView, seen };
}

/** Respects the user's motion preference for every animated flourish. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

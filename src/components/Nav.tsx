'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { asset } from '@/lib/paths';
import styles from './Nav.module.css';

const LINKS = [
  { href: '#islands', label: 'The islands' },
  { href: '#land', label: 'Land' },
  { href: '/build', label: 'Build' },
  { href: '#excursions', label: 'Excursions' },
  { href: '#events', label: 'Events' },
  { href: '#tokenomics', label: 'Tokenomics' },
  { href: '#faq', label: 'FAQ' },
];

export function Nav() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className={`${styles.nav} ${solid ? styles.solid : ''}`}>
      <a className={styles.brand} href="#top">
        <img src={asset("/assets/archipelago-logo.png")} alt="" width={34} height={34} />
        <span className={styles.brandText}>
          <span className={styles.wordmark}>
            <b>ARC</b>HIPELAGO
          </span>
          <small>$ISLAND</small>
        </span>
      </a>

      <nav className={`${styles.links} ${open ? styles.open : ''}`}>
        {LINKS.map((l) =>
          l.href.startsWith('#') ? (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ) : (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ),
        )}
      </nav>

      <div className={styles.right}>
        <a className={styles.cta} href="#tokenomics">
          Get $ISLAND
        </a>
        <button
          className={styles.burger}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Menu"
        >
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}

'use client';

import styles from './Backdrop.module.css';

/**
 * Fixed atmosphere behind the whole page: a warm sun wash, slow-drifting
 * lagoon and sunset colour, palm-frond shadows and a little film grain.
 * Sections sit on top of this, so most of them are deliberately transparent.
 */
export function Backdrop() {
  return (
    <div className={styles.backdrop} aria-hidden="true">
      <div className={styles.sun} />
      <div className={`${styles.blob} ${styles.b1}`} />
      <div className={`${styles.blob} ${styles.b2}`} />
      <div className={`${styles.blob} ${styles.b3}`} />
      <div className={`${styles.blob} ${styles.b4}`} />

      {/* Palm shadows falling across the page, as if from off-screen trees. */}
      <svg className={`${styles.frond} ${styles.frondLeft}`} viewBox="0 0 200 400">
        <g fill="currentColor">
          {Array.from({ length: 9 }, (_, i) => {
            const a = -60 + i * 15;
            return (
              <ellipse
                key={i}
                cx="100"
                cy="60"
                rx="96"
                ry="15"
                transform={`rotate(${a} 14 26)`}
              />
            );
          })}
        </g>
      </svg>
      <svg className={`${styles.frond} ${styles.frondRight}`} viewBox="0 0 200 400">
        <g fill="currentColor">
          {Array.from({ length: 9 }, (_, i) => {
            const a = -60 + i * 15;
            return (
              <ellipse
                key={i}
                cx="100"
                cy="60"
                rx="96"
                ry="15"
                transform={`rotate(${a} 14 26)`}
              />
            );
          })}
        </g>
      </svg>

      <div className={styles.grain} />
    </div>
  );
}

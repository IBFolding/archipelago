'use client';

import type { CSSProperties, ElementType, ReactNode } from 'react';
import { createElement } from 'react';
import { useInView } from '@/hooks/useInView';
import styles from './Reveal.module.css';

type Variant = 'up' | 'fade' | 'scale' | 'left';

/**
 * Scroll-triggered entrance. `stagger` indexes children so a grid animates in
 * as a wave rather than all at once.
 */
export function Reveal({
  children,
  as: Tag = 'div',
  variant = 'up',
  delay = 0,
  className = '',
  style,
}: {
  children: ReactNode;
  as?: ElementType;
  variant?: Variant;
  delay?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const { ref, seen } = useInView<HTMLDivElement>({ once: true });

  // createElement keeps the polymorphic `as` prop typed without fighting JSX.
  return createElement(
    Tag,
    {
      ref,
      className: `${styles.reveal} ${styles[variant]} ${seen ? styles.in : ''} ${className}`,
      style: { ...style, transitionDelay: `${delay}ms` },
    },
    children,
  );
}

/** Wraps a list so each child gets an incremental delay. */
export function RevealGroup({
  children,
  step = 70,
  variant = 'up',
  className = '',
}: {
  children: ReactNode[];
  step?: number;
  variant?: Variant;
  className?: string;
}) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <Reveal key={i} variant={variant} delay={i * step}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}

/** Splits a headline into words that rise in sequence. */
export function SplitHeading({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) {
  const { ref, seen } = useInView<HTMLHeadingElement>({ once: true });
  const lines = text.split('\n');

  return (
    <h2 ref={ref} className={`${styles.split} ${className}`}>
      {lines.map((line, li) => (
        <span className={styles.line} key={li}>
          {line.split(' ').map((word, wi) => (
            <span className={styles.wordMask} key={wi}>
              <span
                className={`${styles.word} ${seen ? styles.wordIn : ''}`}
                style={{ transitionDelay: `${(li * 6 + wi) * 55}ms` }}
              >
                {word}
              </span>
            </span>
          ))}
        </span>
      ))}
    </h2>
  );
}

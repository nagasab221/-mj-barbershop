'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Fades children up once they enter the viewport.
 * Pure CSS transition driven by an IntersectionObserver — no dependencies.
 */
export default function Reveal({
  children,
  delay = 0,
  className = ''
}: {
  children: ReactNode;
  /** Transition delay in ms, for gentle stagger effects. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add('is-visible');
            observer.disconnect();
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}

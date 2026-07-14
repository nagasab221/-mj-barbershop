'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import SectionHeading from '@/components/SectionHeading';
import Reveal from '@/components/Reveal';
import { ArrowIcon, CloseIcon } from '@/components/Icons';
import { t as pick, type GalleryItem, type Locale } from '@/lib/types';

export default function Gallery({ items, locale }: { items: GalleryItem[]; locale: Locale }) {
  const t = useTranslations('gallery');
  const [active, setActive] = useState<number | null>(null);

  const close = useCallback(() => setActive(null), []);
  const step = useCallback(
    (dir: 1 | -1) => setActive((a) => (a === null ? a : (a + dir + items.length) % items.length)),
    [items.length]
  );

  // Keyboard controls for the lightbox.
  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, close, step]);

  return (
    <section id="gallery" className="bg-cream pinstripes-dark py-24 text-ink md:py-32">
      <div className="mx-auto max-w-content px-5 md:px-8">
        <SectionHeading eyebrow={t('eyebrow')} title={t('heading')} subtitle={t('subheading')} tone="light" />

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
          {items.map((item, i) => (
            <Reveal key={item.id} delay={(i % 3) * 90}>
              <button
                type="button"
                onClick={() => setActive(i)}
                className="group relative block w-full overflow-hidden border border-ink/10 bg-ink"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={pick(item.caption, locale)}
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover transition-transform duration-700 ease-elegant group-hover:scale-[1.045]"
                />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end bg-gradient-to-t from-ink/90 via-ink/30 to-transparent p-4 opacity-0 transition-opacity duration-700 group-hover:opacity-100">
                  <span className="text-sm text-cream">{pick(item.caption, locale)}</span>
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {active !== null && items[active] && (
        <div
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-ink/95 p-5"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            aria-label={t('close')}
            className="absolute end-5 top-5 flex h-11 w-11 items-center justify-center border border-cream/20 text-cream transition-colors duration-300 hover:border-brass hover:text-brass"
          >
            <CloseIcon className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
            aria-label={t('prev')}
            className="absolute start-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center border border-cream/20 text-cream transition-colors duration-300 hover:border-brass hover:text-brass sm:flex"
          >
            <ArrowIcon className="h-5 w-5 -scale-x-100 rtl:scale-x-100" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            aria-label={t('next')}
            className="absolute end-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center border border-cream/20 text-cream transition-colors duration-300 hover:border-brass hover:text-brass sm:flex"
          >
            <ArrowIcon className="h-5 w-5" />
          </button>

          <figure className="max-w-4xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={items[active].image}
              alt={pick(items[active].caption, locale)}
              className="max-h-[78vh] w-auto border border-cream/10"
            />
            <figcaption className="mt-4 text-center text-sm tracking-wide text-cream/80">
              {pick(items[active].caption, locale)}
              <span className="ltr-embed ms-3 text-cream/40">
                {active + 1} / {items.length}
              </span>
            </figcaption>
          </figure>
        </div>
      )}
    </section>
  );
}

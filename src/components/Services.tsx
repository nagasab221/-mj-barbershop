'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import SectionHeading from '@/components/SectionHeading';
import Reveal from '@/components/Reveal';
import { ClockIcon, HomeIcon, ScissorsIcon, StoreIcon } from '@/components/Icons';
import { formatPrice } from '@/lib/utils';
import { t as pick, type Locale, type PackageCategory, type Pkg } from '@/lib/types';

const CATEGORY_ORDER: PackageCategory[] = ['hair', 'beard', 'combo', 'kids', 'vip', 'addon'];

/** Smooth-scroll to the booking form with this service preselected. */
function bookService(id: string) {
  window.dispatchEvent(new CustomEvent('mj:select-service', { detail: id }));
  document.getElementById('reservations')?.scrollIntoView({ behavior: 'smooth' });
}

export default function Services({ packages, locale }: { packages: Pkg[]; locale: Locale }) {
  const t = useTranslations('services');
  const [active, setActive] = useState<'all' | PackageCategory>('all');

  const categories = useMemo(
    () => CATEGORY_ORDER.filter((c) => packages.some((p) => p.category === c)),
    [packages]
  );
  const visible = active === 'all' ? packages : packages.filter((p) => p.category === active);

  return (
    <section id="services" className="bg-ink py-24 md:py-32">
      <div className="mx-auto max-w-content px-5 md:px-8">
        <SectionHeading eyebrow={t('eyebrow')} title={t('heading')} subtitle={t('subheading')} tone="dark" />

        {/* Category filter */}
        {categories.length > 1 && (
          <Reveal className="mb-12 flex flex-wrap items-center justify-center gap-2.5">
            {(['all', ...categories] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActive(cat)}
                className={`border px-5 py-2 text-[11px] font-semibold uppercase tracking-luxe transition-all duration-500 ${
                  active === cat
                    ? 'border-brass bg-brass text-ink'
                    : 'border-cream/15 text-cream/70 hover:border-brass/60 hover:text-cream'
                }`}
              >
                {cat === 'all' ? t('all') : t(`categories.${cat}`)}
              </button>
            ))}
          </Reveal>
        )}

        {/* Packages grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((pkg, i) => (
            <Reveal key={pkg.id} delay={(i % 3) * 90}>
              <article
                className={`group relative flex h-full flex-col border p-8 transition-all duration-700 ease-elegant hover:-translate-y-1 ${
                  pkg.popular
                    ? 'border-brass/60 bg-brass/[0.05]'
                    : 'border-cream/10 bg-cream/[0.02] hover:border-brass/40 hover:bg-cream/[0.04]'
                }`}
              >
                {pkg.popular && (
                  <span className="absolute -top-3 start-7 bg-brass px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-ink">
                    {t('popular')}
                  </span>
                )}

                {pkg.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pkg.image}
                    alt={pick(pkg.name, locale)}
                    loading="lazy"
                    className="mb-6 aspect-[4/3] w-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0"
                  />
                )}

                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-display text-2xl leading-snug text-cream">{pick(pkg.name, locale)}</h3>
                  <p className="ltr-embed shrink-0 pt-1 font-display text-lg text-brass">
                    {formatPrice(pkg.price, locale, pkg.startingFrom)}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold uppercase tracking-wider text-cream/50">
                  <span className="flex items-center gap-1.5">
                    <ClockIcon className="h-3.5 w-3.5 text-brass/80" />
                    {t('mins', { count: pkg.duration })}
                  </span>
                  <span className="h-3 w-px bg-cream/15" aria-hidden />
                  <span>{t(`categories.${pkg.category}`)}</span>
                  <span className="h-3 w-px bg-cream/15" aria-hidden />
                  <span className="flex items-center gap-1.5 text-brass/90">
                    {pkg.venue === 'shop' ? (
                      <StoreIcon className="h-3.5 w-3.5" />
                    ) : (
                      <HomeIcon className="h-3.5 w-3.5" />
                    )}
                    {pkg.venue === 'home'
                      ? t('venueHome')
                      : pkg.venue === 'shop'
                        ? t('venueShop')
                        : t('venueBoth')}
                  </span>
                </div>

                <p className="mt-4 flex-1 text-sm leading-relaxed text-smoke-light">
                  {pick(pkg.description, locale)}
                </p>

                <button
                  type="button"
                  onClick={() => bookService(pkg.id)}
                  className="mt-7 flex items-center gap-2 self-start text-[11px] font-semibold uppercase tracking-luxe text-brass transition-colors duration-500 hover:text-cream"
                >
                  <ScissorsIcon className="h-3.5 w-3.5" />
                  <span className="link-lux">{t('book')}</span>
                </button>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

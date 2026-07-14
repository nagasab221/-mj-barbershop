'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Emblem from '@/components/Emblem';
import { CloseIcon } from '@/components/Icons';

const ANCHORS = ['about', 'services', 'reservations', 'location', 'gallery', 'testimonials', 'contact'] as const;

export default function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const otherLocale = locale === 'ar' ? 'en' : 'ar';

  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock page scroll while the mobile menu is open.
  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : '';
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-elegant ${
        scrolled ? 'border-b border-cream/10 bg-ink/90 backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-20 max-w-content items-center gap-4 px-5 md:px-8">
        {/* Brand */}
        <a href="#top" className="flex shrink-0 items-center gap-3 text-cream transition-colors duration-500 hover:text-brass">
          <Emblem className="h-11 w-11 shrink-0" />
          <span className="whitespace-nowrap font-display text-base tracking-[0.14em] xl:text-lg xl:tracking-[0.18em]">
            MJ <span className="text-brass">·</span> <span className="hidden min-[400px]:inline">BARBERSHOP</span>
          </span>
        </a>

        {/* Desktop nav — flex-1 keeps it centered with breathing room on both sides */}
        <nav className="hidden flex-1 items-center justify-center gap-5 lg:flex xl:gap-6" aria-label="Main">
          {ANCHORS.map((a) => (
            <a
              key={a}
              href={`#${a}`}
              className="link-lux whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/80 hover:text-cream"
            >
              {t(a)}
            </a>
          ))}
        </nav>

        <div className="ms-auto flex shrink-0 items-center gap-3 lg:ms-0 md:gap-4">
          {/* Language switcher */}
          <Link
            href="/"
            locale={otherLocale}
            className="border border-cream/25 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-cream transition-all duration-500 hover:border-brass hover:text-brass"
          >
            {t('switchLocale')}
          </Link>

          {/* Hidden on lg (1024–1279px): the full nav needs the width there. */}
          <a href="#reservations" className="btn-brass hidden whitespace-nowrap !px-6 !py-2.5 md:inline-flex lg:hidden xl:inline-flex">
            {t('bookNow')}
          </a>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden"
            aria-label={t('menu')}
          >
            <span className="h-px w-6 bg-cream" />
            <span className="h-px w-6 bg-cream" />
            <span className="h-px w-4 bg-brass" />
          </button>
        </div>
      </div>

      {/* Mobile overlay menu — slides in from the end edge */}
      <div
        className={`fixed inset-0 z-50 flex flex-col bg-ink pinstripes-light transition-[transform,opacity] duration-500 ease-elegant lg:hidden ${
          open
            ? 'translate-x-0 opacity-100'
            : 'pointer-events-none translate-x-full opacity-0 rtl:-translate-x-full'
        }`}
        aria-hidden={!open}
      >
        <div className="flex h-20 items-center justify-between px-5">
          <span className="flex items-center gap-3 text-cream">
            <Emblem className="h-11 w-11" />
            <span className="font-display text-lg tracking-[0.18em]">MJ</span>
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-10 w-10 items-center justify-center text-cream hover:text-brass"
            aria-label={t('close')}
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col items-center justify-center gap-7" aria-label="Mobile">
          {ANCHORS.map((a, i) => (
            <a
              key={a}
              href={`#${a}`}
              onClick={() => setOpen(false)}
              className="font-display text-3xl text-cream transition-colors duration-300 hover:text-brass"
              style={{ transitionDelay: `${i * 20}ms` }}
            >
              {t(a)}
            </a>
          ))}
          <a href="#reservations" onClick={() => setOpen(false)} className="btn-brass mt-4">
            {t('bookNow')}
          </a>
        </nav>
        <div className="pb-10 text-center text-[11px] uppercase tracking-luxe text-cream/40">
          MJ Barbershop · Dubai
        </div>
      </div>
    </header>
  );
}

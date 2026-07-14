'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { WhatsAppIcon } from '@/components/Icons';
import { defaultWhatsappGreeting, whatsappLink } from '@/lib/utils';
import type { Locale } from '@/lib/types';

/**
 * Mobile-only persistent CTA: Book Now + WhatsApp, one thumb-tap away.
 * Appears after scrolling past the hero; hides while the booking section
 * itself is on screen (its own buttons take over there).
 */
export default function FloatingCTA({ whatsapp }: { whatsapp: string }) {
  const t = useTranslations('floating');
  const locale = useLocale() as Locale;

  const [pastHero, setPastHero] = useState(false);
  const [bookingInView, setBookingInView] = useState(false);

  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const target = document.getElementById('reservations');
    let observer: IntersectionObserver | null = null;
    if (target) {
      observer = new IntersectionObserver(
        (entries) => setBookingInView(entries[0]?.isIntersecting ?? false),
        { threshold: 0.05 }
      );
      observer.observe(target);
    }
    return () => {
      window.removeEventListener('scroll', onScroll);
      observer?.disconnect();
    };
  }, []);

  const visible = pastHero && !bookingInView;

  return (
    <div
      className={`fixed bottom-5 end-5 z-40 flex items-center gap-3 transition-all duration-500 ease-elegant md:hidden ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'
      }`}
    >
      <a
        href={whatsappLink(whatsapp, defaultWhatsappGreeting(locale))}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('whatsapp')}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-cream/20 bg-ink text-cream shadow-lg shadow-ink/60 transition-colors duration-300 hover:border-brass hover:text-brass"
      >
        <WhatsAppIcon className="h-5 w-5" />
      </a>
      <a
        href="#reservations"
        className="btn-brass rounded-full !px-6 !py-3.5 shadow-lg shadow-ink/60"
      >
        {t('book')}
      </a>
    </div>
  );
}

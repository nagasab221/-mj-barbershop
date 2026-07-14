import { useTranslations } from 'next-intl';
import Emblem from '@/components/Emblem';
import { ChevronDownIcon, WhatsAppIcon } from '@/components/Icons';
import { whatsappLink, defaultWhatsappGreeting } from '@/lib/utils';
import { t as pick, type Locale, type SiteSettings } from '@/lib/types';

export default function Hero({ site, locale }: { site: SiteSettings; locale: Locale }) {
  const t = useTranslations('hero');

  return (
    <section id="top" className="grain relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-ink pinstripes-light">
      {/* Ambient light + giant watermark emblem */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 45% at 50% 42%, rgba(201,168,106,0.10), transparent 70%), radial-gradient(ellipse 90% 60% at 50% 110%, rgba(0,0,0,0.9), transparent)'
        }}
      />
      <Emblem
        aria-hidden
        className="pointer-events-none absolute -bottom-40 left-1/2 h-[42rem] w-[42rem] -translate-x-1/2 text-cream opacity-[0.035]"
      />
      {/* Fine vintage frame */}
      <div aria-hidden className="pointer-events-none absolute inset-3 border border-cream/10 md:inset-6" />

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 pb-28 pt-36 text-center">
        <Emblem className="h-24 w-24 text-brass md:h-28 md:w-28" />

        <p className="mt-10 text-[11px] font-semibold uppercase tracking-luxe text-cream/60">
          {pick(site.heroEyebrow, locale)}
        </p>

        <h1 className="mt-5 font-display text-5xl leading-[1.08] text-cream md:text-7xl">
          {pick(site.heroTitle, locale)}
        </h1>

        <p className="mt-7 max-w-xl text-base leading-relaxed text-smoke-light md:text-lg">
          {pick(site.heroSubtitle, locale)}
        </p>

        <div className="mt-11 flex flex-col items-center gap-4 sm:flex-row">
          <a href="#reservations" className="btn-brass w-full sm:w-auto">
            {t('bookNow')}
          </a>
          <a
            href={whatsappLink(site.whatsapp, defaultWhatsappGreeting(locale))}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline-cream w-full sm:w-auto"
          >
            <WhatsAppIcon className="h-4 w-4" />
            {t('whatsapp')}
          </a>
        </div>
      </div>

      {/* Scroll cue */}
      <a
        href="#about"
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-cream/50 transition-colors duration-500 hover:text-brass"
      >
        <span className="text-[10px] uppercase tracking-luxe">{t('scroll')}</span>
        <ChevronDownIcon className="h-4 w-4 animate-slow-drift" />
      </a>
    </section>
  );
}

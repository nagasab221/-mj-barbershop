import { useTranslations } from 'next-intl';
import Emblem from '@/components/Emblem';
import { InstagramIcon, TikTokIcon, WhatsAppIcon } from '@/components/Icons';
import { defaultWhatsappGreeting, whatsappLink } from '@/lib/utils';
import { t as pick, type Locale, type SiteContent } from '@/lib/types';

const ANCHORS = ['about', 'services', 'reservations', 'location', 'gallery', 'contact'] as const;

export default function Footer({ content, locale }: { content: SiteContent; locale: Locale }) {
  const t = useTranslations('footer');
  const nav = useTranslations('nav');
  const { site, location } = content;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-cream/10 bg-ink-950 pinstripes-light">
      <div className="mx-auto max-w-content px-5 py-16 md:px-8 md:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 text-cream">
              <Emblem className="h-12 w-12 text-brass" />
              <span className="font-display text-lg tracking-[0.18em]">
                MJ <span className="text-brass">·</span> BARBERSHOP
              </span>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-smoke">{t('blurb')}</p>
            <div className="mt-6 flex gap-3">
              <a
                href={whatsappLink(site.whatsapp, defaultWhatsappGreeting(locale))}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-10 w-10 items-center justify-center border border-cream/15 text-cream/70 transition-all duration-500 hover:border-brass hover:text-brass"
              >
                <WhatsAppIcon className="h-5 w-5" />
              </a>
              <a
                href={site.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center border border-cream/15 text-cream/70 transition-all duration-500 hover:border-brass hover:text-brass"
              >
                <InstagramIcon className="h-5 w-5" />
              </a>
              <a
                href={site.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="flex h-10 w-10 items-center justify-center border border-cream/15 text-cream/70 transition-all duration-500 hover:border-brass hover:text-brass"
              >
                <TikTokIcon className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <nav aria-label={t('links')}>
            <h3 className="text-[11px] font-semibold uppercase tracking-luxe text-brass">{t('links')}</h3>
            <ul className="mt-5 space-y-3">
              {ANCHORS.map((a) => (
                <li key={a}>
                  <a href={`#${a}`} className="link-lux text-sm text-smoke-light hover:text-cream">
                    {nav(a)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Hours */}
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-luxe text-brass">{t('hours')}</h3>
            <p className="mt-5 text-sm leading-loose text-smoke-light">{pick(location.hoursText, locale)}</p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-luxe text-brass">{t('contact')}</h3>
            <address className="mt-5 space-y-3 text-sm not-italic leading-relaxed text-smoke-light">
              <p>{pick(location.address, locale)}</p>
              <p>
                <a href={`tel:${site.phone}`} className="link-lux ltr-embed hover:text-cream">
                  {site.phone}
                </a>
              </p>
              <p>
                <a href={`mailto:${site.email}`} className="link-lux hover:text-cream">
                  {site.email}
                </a>
              </p>
            </address>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center gap-3 border-t border-cream/10 pt-8 text-center text-xs text-smoke sm:flex-row sm:justify-between">
          <p>
            © <span className="ltr-embed">{year}</span> MJ Barbershop. {t('rights')}
          </p>
          <p className="flex items-center gap-2">
            <span className="h-px w-6 bg-brass/50" aria-hidden />
            {t('crafted')}
            <span className="h-px w-6 bg-brass/50" aria-hidden />
          </p>
        </div>
      </div>
    </footer>
  );
}

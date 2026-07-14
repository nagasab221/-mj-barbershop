import { useTranslations } from 'next-intl';
import SectionHeading from '@/components/SectionHeading';
import Reveal from '@/components/Reveal';
import { ArrowIcon, ClockIcon, MapPinIcon, PhoneIcon } from '@/components/Icons';
import { t as pick, type Locale, type LocationInfo, type SiteSettings } from '@/lib/types';

export default function LocationSection({
  location,
  site,
  locale
}: {
  location: LocationInfo;
  site: SiteSettings;
  locale: Locale;
}) {
  const t = useTranslations('location');
  const mapSrc = `https://www.google.com/maps?q=${location.lat},${location.lng}&z=15&hl=${locale}&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;

  const rows = [
    { icon: MapPinIcon, label: t('address'), value: pick(location.address, locale) },
    { icon: ClockIcon, label: t('hours'), value: pick(location.hoursText, locale) },
    { icon: PhoneIcon, label: t('phone'), value: site.phone, ltr: true, href: `tel:${site.phone}` }
  ];

  return (
    <section id="location" className="bg-ink py-24 md:py-32">
      <div className="mx-auto max-w-content px-5 md:px-8">
        <SectionHeading eyebrow={t('eyebrow')} title={t('heading')} subtitle={t('subheading')} tone="dark" />

        <div className="grid gap-10 lg:grid-cols-5">
          {/* Info panel */}
          <Reveal className="lg:col-span-2">
            <div className="flex h-full flex-col border border-cream/10 bg-cream/[0.02] p-8 md:p-10">
              <ul className="space-y-8">
                {rows.map(({ icon: Icon, label, value, ltr, href }) => (
                  <li key={label} className="flex gap-5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-brass/40 text-brass">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-luxe text-cream/50">{label}</p>
                      {href ? (
                        <a
                          href={href}
                          className={`link-lux mt-1.5 block text-sm leading-relaxed text-cream hover:text-brass ${ltr ? 'ltr-embed' : ''}`}
                        >
                          {value}
                        </a>
                      ) : (
                        <p className={`mt-1.5 text-sm leading-relaxed text-cream ${ltr ? 'ltr-embed' : ''}`}>{value}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-brass mt-10 w-full"
              >
                {t('directions')}
                <ArrowIcon className="h-4 w-4" />
              </a>
            </div>
          </Reveal>

          {/* Map */}
          <Reveal delay={150} className="lg:col-span-3">
            <div className="h-full min-h-[380px] overflow-hidden border border-cream/10 bg-ink-800">
              <iframe
                src={mapSrc}
                title={t('mapTitle')}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                className="h-full min-h-[380px] w-full grayscale-[0.9] contrast-[0.92] transition-all duration-700 hover:grayscale-0"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

import { useTranslations } from 'next-intl';
import SectionHeading from '@/components/SectionHeading';
import Reveal from '@/components/Reveal';
import BookingTabs from '@/components/BookingTabs';
import type { ServiceOption } from '@/components/BookingForm';
import { t as pick, type Locale, type SiteContent } from '@/lib/types';

export default function Reservations({ content, locale }: { content: SiteContent; locale: Locale }) {
  const t = useTranslations('booking');
  const { reservation, packages, site } = content;

  // Client components get a lean, serializable list of services.
  const services: ServiceOption[] = packages.map((p) => ({
    id: p.id,
    label: pick(p.name, locale),
    price: p.price,
    startingFrom: Boolean(p.startingFrom),
    duration: p.duration,
    venue: p.venue ?? 'both'
  }));

  return (
    <section id="reservations" className="bg-cream pinstripes-dark py-24 text-ink md:py-32">
      <div className="mx-auto max-w-content px-5 md:px-8">
        <SectionHeading
          eyebrow={t('eyebrow')}
          title={pick(reservation.heading, locale)}
          subtitle={pick(reservation.subheading, locale)}
          tone="light"
        />

        <Reveal>
          <div className="dark-scheme mx-auto max-w-5xl border border-ink/10 bg-ink p-6 shadow-[0_30px_60px_-30px_rgba(10,10,10,0.5)] md:p-10">
            <BookingTabs services={services} settings={reservation} whatsapp={site.whatsapp} locale={locale} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

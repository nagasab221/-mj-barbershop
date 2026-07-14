import { useTranslations } from 'next-intl';
import SectionHeading from '@/components/SectionHeading';
import Reveal from '@/components/Reveal';
import BookingForm from '@/components/BookingForm';
import { t as pick, type Locale, type SiteContent } from '@/lib/types';

export default function Reservations({ content, locale }: { content: SiteContent; locale: Locale }) {
  const t = useTranslations('booking');
  const { reservation, packages, site } = content;

  // Client component gets a lean, serializable list of services.
  const services = packages.map((p) => ({
    id: p.id,
    label: pick(p.name, locale),
    price: p.price
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
          <div className="dark-scheme mx-auto max-w-3xl border border-ink/10 bg-ink p-7 shadow-[0_30px_60px_-30px_rgba(10,10,10,0.5)] md:p-12">
            <BookingForm
              services={services}
              settings={{
                heading: reservation.heading,
                subheading: reservation.subheading,
                workingHours: reservation.workingHours,
                blockedDates: reservation.blockedDates
              }}
              whatsapp={site.whatsapp}
              locale={locale}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

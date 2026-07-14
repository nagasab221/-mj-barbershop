import { useTranslations } from 'next-intl';
import SectionHeading from '@/components/SectionHeading';
import Reveal from '@/components/Reveal';
import { StarIcon } from '@/components/Icons';
import { t as pick, type Locale, type Testimonial } from '@/lib/types';

export default function Testimonials({ items, locale }: { items: Testimonial[]; locale: Locale }) {
  const t = useTranslations('testimonials');

  return (
    <section id="testimonials" className="bg-ink py-24 md:py-32">
      <div className="mx-auto max-w-content px-5 md:px-8">
        <SectionHeading eyebrow={t('eyebrow')} title={t('heading')} subtitle={t('subheading')} tone="dark" />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <Reveal key={item.id} delay={(i % 3) * 90}>
              <figure className="flex h-full flex-col border border-cream/10 bg-cream/[0.02] p-8 transition-colors duration-700 hover:border-brass/40">
                <div
                  className="flex items-center gap-1"
                  role="img"
                  aria-label={t('stars', { count: item.rating })}
                >
                  {Array.from({ length: 5 }, (_, s) => (
                    <StarIcon
                      key={s}
                      filled={s < item.rating}
                      className={`h-3.5 w-3.5 ${s < item.rating ? 'text-brass' : 'text-cream/20'}`}
                    />
                  ))}
                </div>
                <blockquote className="mt-5 flex-1">
                  <p className="font-display text-lg leading-relaxed text-cream/90">
                    “{pick(item.quote, locale)}”
                  </p>
                </blockquote>
                <figcaption className="mt-6 border-t border-cream/10 pt-4 text-[11px] font-semibold uppercase tracking-luxe text-brass">
                  {item.name}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

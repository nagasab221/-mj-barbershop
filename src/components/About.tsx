import { useTranslations } from 'next-intl';
import Reveal from '@/components/Reveal';
import SectionHeading from '@/components/SectionHeading';
import Emblem from '@/components/Emblem';
import { t as pick, type Locale, type SiteSettings } from '@/lib/types';

export default function About({ site, locale }: { site: SiteSettings; locale: Locale }) {
  const t = useTranslations('about');

  return (
    <section id="about" className="bg-cream pinstripes-dark py-24 text-ink md:py-32">
      <div className="mx-auto max-w-content px-5 md:px-8">
        <SectionHeading eyebrow={t('eyebrow')} title={pick(site.aboutHeading, locale)} tone="light" />

        <div className="grid items-start gap-14 lg:grid-cols-5 lg:gap-20">
          {/* Brand story */}
          <Reveal className="space-y-6 lg:col-span-3">
            {site.aboutBody.map((para, i) => (
              <p
                key={i}
                className={`leading-loose ${i === 0 ? 'font-display text-xl text-ink md:text-2xl md:leading-relaxed' : 'text-smoke-dark'}`}
              >
                {pick(para, locale)}
              </p>
            ))}
          </Reveal>

          {/* Founder card */}
          <Reveal delay={150} className="lg:col-span-2">
            <div className="border border-ink/10 bg-ink p-8 text-cream md:p-10">
              <div className="flex items-center gap-5">
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-brass/40">
                  <Emblem className="h-14 w-14 text-brass" />
                </span>
                <div>
                  <p className="font-display text-2xl">{pick(site.founderName, locale)}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-luxe text-brass">
                    {pick(site.founderRole, locale)}
                  </p>
                </div>
              </div>
              <div className="my-6 h-px bg-cream/10" />
              <p className="text-sm leading-relaxed text-smoke-light">{pick(site.founderBio, locale)}</p>
            </div>
          </Reveal>
        </div>

        {/* Stats row */}
        <Reveal delay={100}>
          <dl className="mt-20 grid grid-cols-2 gap-y-10 border-t border-ink/10 pt-12 md:grid-cols-4">
            {site.stats.map((stat) => (
              <div key={stat.value} className="text-center">
                <dd className="font-display text-4xl text-ink md:text-5xl">
                  {stat.value}
                  <span className="text-brass">.</span>
                </dd>
                <dt className="mt-2 text-[11px] font-semibold uppercase tracking-luxe text-smoke-dark">
                  {pick(stat.label, locale)}
                </dt>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}

import Reveal from '@/components/Reveal';
import { ScissorsIcon } from '@/components/Icons';

/**
 * Shared section header: brass eyebrow, serif title, hairline ornament,
 * optional subtitle. `tone` matches the section background.
 */
export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  tone
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  tone: 'dark' | 'light';
}) {
  const titleColor = tone === 'dark' ? 'text-cream' : 'text-ink';
  const subColor = tone === 'dark' ? 'text-smoke-light' : 'text-smoke-dark';
  const lineColor = tone === 'dark' ? 'bg-cream/15' : 'bg-ink/15';

  return (
    <Reveal className="mx-auto mb-14 max-w-2xl text-center md:mb-20">
      <p className="text-[11px] font-semibold uppercase tracking-luxe text-brass">{eyebrow}</p>
      <h2 className={`mt-4 font-display text-4xl leading-tight md:text-5xl ${titleColor}`}>{title}</h2>
      <div className="mt-6 flex items-center justify-center gap-4" aria-hidden>
        <span className={`h-px w-16 ${lineColor}`} />
        <ScissorsIcon className="h-4 w-4 text-brass" />
        <span className={`h-px w-16 ${lineColor}`} />
      </div>
      {subtitle ? <p className={`mt-5 text-base leading-relaxed ${subColor}`}>{subtitle}</p> : null}
    </Reveal>
  );
}

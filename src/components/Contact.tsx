'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import SectionHeading from '@/components/SectionHeading';
import Reveal from '@/components/Reveal';
import {
  InstagramIcon,
  MailIcon,
  PhoneIcon,
  TikTokIcon,
  WhatsAppIcon
} from '@/components/Icons';
import { defaultWhatsappGreeting, whatsappLink } from '@/lib/utils';
import { t as pick, type Locale, type SiteSettings } from '@/lib/types';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function Contact({ site, locale }: { site: SiteSettings; locale: Locale }) {
  const t = useTranslations('contact');

  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [company, setCompany] = useState(''); // honeypot
  const [error, setError] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === 'sending') return;
    if (message.trim().length < 3) {
      setError(t('errMessage'));
      return;
    }
    setError('');
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          contact: contact.trim(),
          message: message.trim(),
          locale,
          company
        })
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean } | null;
      setStatus(res.ok && json?.ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  }

  const channels = [
    { icon: PhoneIcon, label: t('call'), value: site.phone, href: `tel:${site.phone}`, ltr: true },
    {
      icon: WhatsAppIcon,
      label: t('whatsapp'),
      value: `+${site.whatsapp.replace(/\D/g, '')}`,
      href: whatsappLink(site.whatsapp, defaultWhatsappGreeting(locale)),
      ltr: true
    },
    { icon: MailIcon, label: t('email'), value: site.email, href: `mailto:${site.email}`, ltr: true }
  ];

  return (
    <section id="contact" className="bg-cream pinstripes-dark py-24 text-ink md:py-32">
      <div className="mx-auto max-w-content px-5 md:px-8">
        <SectionHeading eyebrow={t('eyebrow')} title={t('heading')} subtitle={t('subheading')} tone="light" />

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Direct channels */}
          <Reveal>
            <ul className="space-y-4">
              {channels.map(({ icon: Icon, label, value, href, ltr }) => (
                <li key={label}>
                  <a
                    href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="group flex items-center gap-5 border border-ink/10 bg-cream p-5 transition-all duration-500 hover:border-brass"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-ink/15 text-ink transition-colors duration-500 group-hover:border-brass group-hover:text-brass">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-[11px] font-semibold uppercase tracking-luxe text-smoke-dark">
                        {label}
                      </span>
                      <span className={`mt-0.5 block text-sm font-medium ${ltr ? 'ltr-embed' : ''}`}>{value}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex items-center gap-4">
              <span className="text-[11px] font-semibold uppercase tracking-luxe text-smoke-dark">
                {t('follow')}
              </span>
              <span className="h-px flex-1 bg-ink/10" aria-hidden />
              <a
                href={site.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-11 w-11 items-center justify-center border border-ink/15 text-ink transition-all duration-500 hover:border-brass hover:text-brass"
              >
                <InstagramIcon className="h-5 w-5" />
              </a>
              <a
                href={site.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="flex h-11 w-11 items-center justify-center border border-ink/15 text-ink transition-all duration-500 hover:border-brass hover:text-brass"
              >
                <TikTokIcon className="h-5 w-5" />
              </a>
            </div>
          </Reveal>

          {/* Message form */}
          <Reveal delay={150}>
            {status === 'sent' ? (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center border border-brass/40 bg-ink p-10 text-center">
                <p className="font-display text-2xl text-cream">{t('sent')}</p>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate className="dark-scheme border border-ink/10 bg-ink p-7 md:p-9">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="ct-name" className="field-label">
                      {t('formName')}
                    </label>
                    <input
                      id="ct-name"
                      type="text"
                      className="field"
                      placeholder={t('formNamePlaceholder')}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={80}
                    />
                  </div>
                  <div>
                    <label htmlFor="ct-contact" className="field-label">
                      {t('formContact')}
                    </label>
                    <input
                      id="ct-contact"
                      type="text"
                      className="field"
                      placeholder={t('formContactPlaceholder')}
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      maxLength={120}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="ct-message" className="field-label">
                      {t('formMessage')}
                    </label>
                    <textarea
                      id="ct-message"
                      rows={4}
                      className="field resize-none"
                      placeholder={t('formMessagePlaceholder')}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={1000}
                    />
                    {error && <p className="mt-1.5 text-xs text-brass">{error}</p>}
                  </div>
                  <div className="sr-only" aria-hidden>
                    <label htmlFor="ct-company">Company</label>
                    <input
                      id="ct-company"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>
                </div>

                {status === 'error' && (
                  <p className="mt-5 border border-brass/40 bg-brass/5 p-3 text-center text-xs text-cream">
                    {t('error')}
                  </p>
                )}

                <button type="submit" disabled={status === 'sending'} className="btn-brass mt-8 w-full disabled:opacity-60">
                  {status === 'sending' ? t('sending') : t('send')}
                </button>
              </form>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

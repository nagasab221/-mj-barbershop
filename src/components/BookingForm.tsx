'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import Calendar from '@/components/Calendar';
import { CheckIcon, ClockIcon, HomeIcon, StoreIcon, WhatsAppIcon } from '@/components/Icons';
import { formatSlot, isBlocked, normalizeUAEPhone, slotsForDate } from '@/lib/booking';
import { formatDate, formatPrice, whatsappLink } from '@/lib/utils';
import type { Locale, ReservationSettings, Venue } from '@/lib/types';

export interface ServiceOption {
  id: string;
  label: string;
  price: number;
  startingFrom: boolean;
  duration: number;
  venue: Venue;
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function BookingForm({
  services,
  settings,
  whatsapp,
  locale
}: {
  services: ServiceOption[];
  settings: ReservationSettings;
  whatsapp: string;
  locale: Locale;
}) {
  const t = useTranslations('booking');
  const ts = useTranslations('services');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [venueChoice, setVenueChoice] = useState<'home' | 'shop'>('home');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [company, setCompany] = useState(''); // honeypot — humans never see it
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [reference, setReference] = useState('');

  const selected = services.find((s) => s.id === serviceId) ?? null;
  /** Effective venue: fixed by the package unless it supports both. */
  const venue: 'home' | 'shop' = !selected
    ? venueChoice
    : selected.venue === 'both'
      ? venueChoice
      : selected.venue;

  const slots = useMemo(() => (date ? slotsForDate(settings, date) : []), [settings, date]);

  // "Book this service" buttons in the pricing grid preselect here.
  useEffect(() => {
    const onSelect = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (services.some((s) => s.id === id)) {
        setServiceId(id);
        setStatus((s) => (s === 'success' ? 'idle' : s));
      }
    };
    window.addEventListener('mj:select-service', onSelect);
    return () => window.removeEventListener('mj:select-service', onSelect);
  }, [services]);

  // Chosen time may become invalid when the date changes.
  useEffect(() => {
    if (time && !slots.includes(time)) setTime('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = t('errName');
    if (!normalizeUAEPhone(phone)) next.phone = t('errPhone');
    if (!serviceId) next.service = t('errService');
    if (venue === 'home' && address.trim().length < 5) next.address = t('errAddress');
    if (!date || isBlocked(settings, date)) next.date = t('errDate');
    if (!time || !slots.includes(time)) next.time = t('errTime');
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === 'submitting') return;
    if (!validate()) return;

    setStatus('submitting');
    try {
      const res = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone,
          serviceId,
          serviceName: selected?.label ?? '',
          servicePrice: selected?.price,
          date,
          time,
          venue,
          address: venue === 'home' ? address.trim() : '',
          notes: notes.trim(),
          locale,
          company
        })
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; ref?: string } | null;
      if (res.ok && json?.ok) {
        setReference(json.ref ?? '');
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  function reset() {
    setName('');
    setPhone('');
    setServiceId('');
    setVenueChoice('home');
    setAddress('');
    setDate('');
    setTime('');
    setNotes('');
    setErrors({});
    setReference('');
    setStatus('idle');
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full border border-brass text-brass">
          <CheckIcon className="h-7 w-7" />
        </span>
        <h3 className="mt-6 font-display text-3xl text-cream">{t('successTitle')}</h3>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-smoke-light">{t('successBody')}</p>
        {reference && (
          <>
            <p className="mt-5 border border-brass/40 bg-brass/5 px-6 py-3 text-base tracking-widest text-brass">
              {t('reference')}: <span className="ltr-embed font-semibold">{reference}</span>
            </p>
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-cream/50">{t('successManageHint')}</p>
          </>
        )}
        <button
          type="button"
          onClick={reset}
          className="link-lux mt-8 text-[11px] font-semibold uppercase tracking-luxe text-cream/70 hover:text-cream"
        >
          {t('bookAnother')}
        </button>
      </div>
    );
  }

  const err = (key: string) =>
    errors[key] ? <p className="mt-1.5 text-xs text-brass">{errors[key]}</p> : null;

  const venueLabel = venue === 'home' ? t('venueHome') : t('venueShop');

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-8 lg:grid-cols-5">
      {/* ── Left: the form ─────────────────────────────────── */}
      <div className="space-y-8 lg:col-span-3">
        {/* Contact */}
        <div className="grid gap-7 sm:grid-cols-2">
          <div>
            <label htmlFor="bk-name" className="field-label">
              {t('name')}
            </label>
            <input
              id="bk-name"
              type="text"
              autoComplete="name"
              className="field"
              placeholder={t('namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
            />
            {err('name')}
          </div>
          <div>
            <label htmlFor="bk-phone" className="field-label">
              {t('phone')}
            </label>
            <div className="ltr-embed flex w-full items-stretch gap-2" dir="ltr">
              <span className="flex items-center border border-cream/20 px-3 text-sm text-cream/60">
                +971
              </span>
              <input
                id="bk-phone"
                type="tel"
                autoComplete="tel-national"
                className="field flex-1"
                placeholder="50 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={20}
              />
            </div>
            {err('phone')}
          </div>
        </div>

        {/* Service cards */}
        <div>
          <span className="field-label">{t('service')}</span>
          <div className="grid gap-3 sm:grid-cols-2">
            {services.map((s) => {
              const active = s.id === serviceId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setServiceId(s.id)}
                  aria-pressed={active}
                  className={`flex flex-col gap-2 border p-4 text-start transition-all duration-300 ${
                    active
                      ? 'border-brass bg-brass/10'
                      : 'border-cream/15 bg-ink-800/40 hover:border-brass/50'
                  }`}
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className={`font-display text-base leading-snug ${active ? 'text-brass' : 'text-cream'}`}>
                      {s.label}
                    </span>
                    <span className="ltr-embed shrink-0 text-sm font-medium text-brass">
                      {formatPrice(s.price, locale, s.startingFrom)}
                    </span>
                  </span>
                  <span className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-cream/45">
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-3 w-3" />
                      {ts('mins', { count: s.duration })}
                    </span>
                    <span className="flex items-center gap-1">
                      {s.venue === 'shop' ? <StoreIcon className="h-3 w-3" /> : <HomeIcon className="h-3 w-3" />}
                      {s.venue === 'home' ? ts('venueHome') : s.venue === 'shop' ? ts('venueShop') : ts('venueBoth')}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          {err('service')}
        </div>

        {/* Venue */}
        <div>
          <span className="field-label">{t('venue')}</span>
          {selected && selected.venue !== 'both' ? (
            <p className="flex items-center gap-2.5 border border-cream/15 bg-ink-800/40 px-4 py-3 text-sm text-cream/85">
              {selected.venue === 'home' ? (
                <HomeIcon className="h-4 w-4 text-brass" />
              ) : (
                <StoreIcon className="h-4 w-4 text-brass" />
              )}
              {selected.venue === 'home' ? `${t('venueHome')} — ${t('venueHomeHint')}` : `${t('venueShop')} — ${t('venueShopHint')}`}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  { v: 'home' as const, icon: HomeIcon, label: t('venueHome'), hint: t('venueHomeHint') },
                  { v: 'shop' as const, icon: StoreIcon, label: t('venueShop'), hint: t('venueShopHint') }
                ]
              ).map(({ v, icon: Icon, label, hint }) => {
                const active = venueChoice === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVenueChoice(v)}
                    aria-pressed={active}
                    className={`flex items-center gap-4 border p-4 text-start transition-all duration-300 ${
                      active ? 'border-brass bg-brass/10' : 'border-cream/15 bg-ink-800/40 hover:border-brass/50'
                    }`}
                  >
                    <Icon className={`h-6 w-6 shrink-0 ${active ? 'text-brass' : 'text-cream/50'}`} />
                    <span>
                      <span className={`block text-sm font-semibold ${active ? 'text-brass' : 'text-cream'}`}>
                        {label}
                      </span>
                      <span className="mt-0.5 block text-xs text-cream/50">{hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {venue === 'home' && (
            <div className="mt-5">
              <label htmlFor="bk-address" className="field-label">
                {t('address')}
              </label>
              <textarea
                id="bk-address"
                rows={2}
                className="field resize-none"
                placeholder={t('addressPlaceholder')}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                maxLength={300}
              />
              {err('address')}
            </div>
          )}
        </div>

        {/* Date & time */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <span className="field-label">{t('date')}</span>
            <Calendar settings={settings} locale={locale} value={date} onChange={setDate} />
            {err('date')}
          </div>
          <div>
            <span className="field-label">{t('time')}</span>
            {!date ? (
              <p className="border border-dashed border-cream/15 px-4 py-8 text-center text-xs text-cream/40">
                {t('pickDay')}
              </p>
            ) : slots.length === 0 ? (
              <p className="border border-dashed border-brass/30 px-4 py-8 text-center text-xs text-brass">
                {t('noTimes')}
              </p>
            ) : (
              <div className="grid max-h-72 grid-cols-3 gap-1.5 overflow-y-auto pe-1">
                {slots.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setTime(s)}
                    aria-pressed={time === s}
                    className={`ltr-embed border py-2 text-xs transition-all duration-300 ${
                      time === s
                        ? 'border-brass bg-brass font-semibold text-ink'
                        : 'border-cream/15 text-cream/80 hover:border-brass/60 hover:text-brass'
                    }`}
                  >
                    {formatSlot(s, locale)}
                  </button>
                ))}
              </div>
            )}
            {err('time')}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="bk-notes" className="field-label">
            {t('notes')}
          </label>
          <textarea
            id="bk-notes"
            rows={2}
            className="field resize-none"
            placeholder={t('notesPlaceholder')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
          />
        </div>

        {/* Honeypot — hidden from humans, bots fill it and get silently dropped. */}
        <div className="sr-only" aria-hidden>
          <label htmlFor="bk-company">Company</label>
          <input
            id="bk-company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>
      </div>

      {/* ── Right: live summary ────────────────────────────── */}
      <aside className="lg:col-span-2">
        <div className="border border-cream/15 bg-ink-800/60 p-6 lg:sticky lg:top-24">
          <h3 className="font-display text-xl text-cream">{t('summaryTitle')}</h3>
          <dl className="mt-5 space-y-3.5 text-sm">
            <div className="flex items-start justify-between gap-4 border-b border-cream/10 pb-3.5">
              <dt className="text-cream/50">{t('sService')}</dt>
              <dd className="text-end font-medium text-cream">{selected ? selected.label : '—'}</dd>
            </div>
            <div className="flex items-start justify-between gap-4 border-b border-cream/10 pb-3.5">
              <dt className="text-cream/50">{t('sDuration')}</dt>
              <dd className="font-medium text-cream">
                {selected ? ts('mins', { count: selected.duration }) : '—'}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4 border-b border-cream/10 pb-3.5">
              <dt className="text-cream/50">{t('sVenue')}</dt>
              <dd className="text-end font-medium text-cream">{selected ? venueLabel : '—'}</dd>
            </div>
            <div className="flex items-start justify-between gap-4 border-b border-cream/10 pb-3.5">
              <dt className="text-cream/50">{t('sWhen')}</dt>
              <dd className="text-end font-medium text-cream">
                {date && time ? (
                  <>
                    {formatDate(date, locale)}
                    <span className="ltr-embed ms-2 text-brass">{formatSlot(time, locale)}</span>
                  </>
                ) : (
                  '—'
                )}
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex items-baseline justify-between">
            <span className="font-display text-lg text-cream">{t('sTotal')}</span>
            <span className="ltr-embed font-display text-xl text-brass">
              {selected ? formatPrice(selected.price, locale, selected.startingFrom) : '—'}
            </span>
          </div>

          <p className="mt-5 border-t border-cream/10 pt-4 text-xs leading-relaxed text-cream/50">
            {t('summaryNote')}
          </p>

          {status === 'error' && (
            <div className="mt-5 border border-brass/40 bg-brass/5 p-4 text-center">
              <p className="text-sm font-semibold text-cream">{t('errorTitle')}</p>
              <p className="mt-1 text-xs text-smoke-light">{t('errorBody')}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="btn-brass mt-6 w-full disabled:opacity-60"
          >
            {status === 'submitting' ? t('submitting') : t('submit')}
          </button>

          <a
            href={whatsappLink(
              whatsapp,
              locale === 'ar'
                ? 'مرحباً! أرغب بحجز موعد في MJ Barbershop.'
                : 'Hello! I would like to book at MJ Barbershop.'
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-cream/50 transition-colors duration-300 hover:text-brass"
          >
            <WhatsAppIcon className="h-3.5 w-3.5" />
            <span className="link-lux">{t('whatsappDirect')}</span>
          </a>
        </div>
      </aside>
    </form>
  );
}

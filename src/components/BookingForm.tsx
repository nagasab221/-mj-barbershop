'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { CheckIcon, WhatsAppIcon } from '@/components/Icons';
import {
  MAX_ADVANCE_DAYS,
  addDaysISO,
  dubaiTodayISO,
  formatSlot,
  isBlocked,
  normalizeUAEPhone,
  slotsForDate
} from '@/lib/booking';
import { whatsappLink } from '@/lib/utils';
import type { Locale, ReservationSettings } from '@/lib/types';

interface ServiceOption {
  id: string;
  label: string;
  price: number;
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

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [company, setCompany] = useState(''); // honeypot — humans never see it
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [reference, setReference] = useState('');

  const today = dubaiTodayISO();
  const maxDate = addDaysISO(today, MAX_ADVANCE_DAYS);

  const slots = useMemo(
    () => (date ? slotsForDate(settings, date) : []),
    [settings, date]
  );

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
    if (!date || isBlocked(settings, date) || date < today || date > maxDate) next.date = t('errDate');
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
      const service = services.find((s) => s.id === serviceId);
      const res = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone,
          serviceId,
          serviceName: service?.label ?? '',
          servicePrice: service?.price,
          date,
          time,
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
          <p className="mt-5 border border-cream/15 px-5 py-2.5 text-sm tracking-widest text-brass">
            {t('reference')}: <span className="ltr-embed font-semibold">{reference}</span>
          </p>
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

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="grid gap-7 md:grid-cols-2">
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
          <input
            id="bk-phone"
            type="tel"
            autoComplete="tel"
            dir="ltr"
            className="field text-start"
            placeholder={t('phonePlaceholder')}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={20}
          />
          {err('phone')}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="bk-service" className="field-label">
            {t('service')}
          </label>
          <select
            id="bk-service"
            className="field"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
          >
            <option value="">{t('servicePlaceholder')}</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} — {s.price} {locale === 'ar' ? 'د.إ' : 'AED'}
              </option>
            ))}
          </select>
          {err('service')}
        </div>

        <div>
          <label htmlFor="bk-date" className="field-label">
            {t('date')}
          </label>
          <input
            id="bk-date"
            type="date"
            className="field"
            min={today}
            max={maxDate}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          {err('date')}
        </div>

        <div>
          <label htmlFor="bk-time" className="field-label">
            {t('time')}
          </label>
          <select
            id="bk-time"
            className="field disabled:cursor-not-allowed disabled:opacity-40"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            disabled={!date || slots.length === 0}
          >
            <option value="">{t('timePlaceholder')}</option>
            {slots.map((s) => (
              <option key={s} value={s}>
                {formatSlot(s, locale)}
              </option>
            ))}
          </select>
          {date && slots.length === 0 ? (
            <p className="mt-1.5 text-xs text-brass">{t('noSlots')}</p>
          ) : (
            err('time')
          )}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="bk-notes" className="field-label">
            {t('notes')}
          </label>
          <textarea
            id="bk-notes"
            rows={3}
            className="field resize-none"
            placeholder={t('notesPlaceholder')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
          />
        </div>

        {/* Honeypot — hidden from humans, bots fill it and get silently dropped.
            sr-only keeps it out of view without creating RTL scroll overflow. */}
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

      {status === 'error' && (
        <div className="mt-8 border border-brass/40 bg-brass/5 p-4 text-center">
          <p className="text-sm font-semibold text-cream">{t('errorTitle')}</p>
          <p className="mt-1 text-xs text-smoke-light">{t('errorBody')}</p>
        </div>
      )}

      <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row">
        <button type="submit" disabled={status === 'submitting'} className="btn-brass w-full disabled:opacity-60 sm:flex-1">
          {status === 'submitting' ? t('submitting') : t('submit')}
        </button>
        <a
          href={whatsappLink(
            whatsapp,
            locale === 'ar' ? 'مرحباً! أرغب بحجز موعد في MJ Barbershop.' : 'Hello! I would like to book at MJ Barbershop.'
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline-cream w-full sm:w-auto"
        >
          <WhatsAppIcon className="h-4 w-4" />
          {t('whatsappAlt')}
        </a>
      </div>
    </form>
  );
}

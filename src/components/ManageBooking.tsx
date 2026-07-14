'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import Calendar from '@/components/Calendar';
import { CheckIcon, HomeIcon, StoreIcon } from '@/components/Icons';
import { formatSlot, slotsForDate } from '@/lib/booking';
import { formatDate } from '@/lib/utils';
import type { Locale, ReservationSettings, ReservationStatus } from '@/lib/types';

interface PublicBooking {
  ref: string;
  name: string;
  serviceName: string;
  date: string;
  time: string;
  venue: 'home' | 'shop';
  address: string;
  status: ReservationStatus;
}

const STATUS_KEY: Record<ReservationStatus, string> = {
  new: 'statusNew',
  confirmed: 'statusConfirmed',
  completed: 'statusCompleted',
  cancelled: 'statusCancelled',
  'no-show': 'statusNoShow'
};

export default function ManageBooking({
  settings,
  locale
}: {
  settings: ReservationSettings;
  locale: Locale;
}) {
  const t = useTranslations('manage');
  const tb = useTranslations('booking');

  const [ref, setRef] = useState('');
  const [phone, setPhone] = useState('');
  const [booking, setBooking] = useState<PublicBooking | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  const slots = useMemo(
    () => (newDate ? slotsForDate(settings, newDate) : []),
    [settings, newDate]
  );

  const changeable = booking && (booking.status === 'new' || booking.status === 'confirmed');

  async function call(action: 'lookup' | 'reschedule' | 'cancel', extra?: Record<string, string>) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/manage-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ref: ref.trim(), phone: phone.trim(), ...extra })
      });
      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; booking?: PublicBooking; error?: string }
        | null;
      setBusy(false);
      if (res.ok && json?.ok && json.booking) return json.booking;
      if (json?.error === 'not_found') setMessage({ kind: 'err', text: t('notFound') });
      else if (json?.error === 'not_changeable') setMessage({ kind: 'err', text: t('notChangeable') });
      else setMessage({ kind: 'err', text: t('error') });
      return null;
    } catch {
      setBusy(false);
      setMessage({ kind: 'err', text: t('error') });
      return null;
    }
  }

  async function onLookup(e: FormEvent) {
    e.preventDefault();
    const found = await call('lookup');
    if (found) {
      setBooking(found);
      setRescheduling(false);
      setNewDate('');
      setNewTime('');
    }
  }

  async function onReschedule() {
    if (!newDate || !newTime || !slots.includes(newTime)) return;
    const updated = await call('reschedule', { date: newDate, time: newTime });
    if (updated) {
      setBooking(updated);
      setRescheduling(false);
      setNewDate('');
      setNewTime('');
      setMessage({ kind: 'ok', text: t('rescheduled') });
    }
  }

  async function onCancel() {
    if (!window.confirm(t('cancelConfirm'))) return;
    const updated = await call('cancel');
    if (updated) {
      setBooking(updated);
      setRescheduling(false);
      setMessage({ kind: 'ok', text: t('cancelled') });
    }
  }

  function resetLookup() {
    setBooking(null);
    setMessage(null);
    setRescheduling(false);
    setRef('');
    setPhone('');
  }

  /* ── Lookup step ─────────────────────────────────────────── */
  if (!booking) {
    return (
      <div className="mx-auto max-w-md">
        <h3 className="text-center font-display text-2xl text-cream">{t('title')}</h3>
        <p className="mt-2 text-center text-sm text-cream/50">{t('intro')}</p>
        <form onSubmit={onLookup} noValidate className="mt-8 space-y-6">
          <div>
            <label htmlFor="mg-ref" className="field-label">
              {t('refLabel')}
            </label>
            <input
              id="mg-ref"
              type="text"
              className="field ltr-embed w-full uppercase tracking-widest"
              dir="ltr"
              placeholder={t('refPlaceholder')}
              value={ref}
              onChange={(e) => setRef(e.target.value.toUpperCase())}
              maxLength={10}
            />
          </div>
          <div>
            <label htmlFor="mg-phone" className="field-label">
              {tb('phone')}
            </label>
            <input
              id="mg-phone"
              type="tel"
              dir="ltr"
              className="field text-start"
              placeholder="05x xxx xxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={20}
            />
          </div>
          {message && (
            <p className={`text-center text-xs ${message.kind === 'err' ? 'text-brass' : 'text-emerald-300'}`}>
              {message.text}
            </p>
          )}
          <button type="submit" disabled={busy || !ref || !phone} className="btn-brass w-full disabled:opacity-50">
            {busy ? t('searching') : t('find')}
          </button>
        </form>
      </div>
    );
  }

  /* ── Details step ────────────────────────────────────────── */
  return (
    <div className="mx-auto max-w-2xl">
      <div className="border border-cream/15 bg-ink-800/60 p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-display text-2xl text-cream">{booking.serviceName}</p>
            <p className="mt-1 text-sm text-cream/60">{booking.name}</p>
          </div>
          <span className="ltr-embed border border-brass/40 px-3 py-1 text-xs tracking-widest text-brass">
            {booking.ref}
          </span>
        </div>

        <dl className="mt-6 space-y-3 border-t border-cream/10 pt-5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-cream/50">{tb('sWhen')}</dt>
            <dd className="text-end font-medium text-cream">
              {formatDate(booking.date, locale)}
              <span className="ltr-embed ms-2 text-brass">{formatSlot(booking.time, locale)}</span>
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-cream/50">{tb('sVenue')}</dt>
            <dd className="flex items-center gap-2 font-medium text-cream">
              {booking.venue === 'home' ? (
                <HomeIcon className="h-4 w-4 text-brass" />
              ) : (
                <StoreIcon className="h-4 w-4 text-brass" />
              )}
              {booking.venue === 'home'
                ? tb('venueHome')
                : tb('venueShop')}
            </dd>
          </div>
          {booking.address && (
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-cream/50">{tb('address')}</dt>
              <dd className="text-end text-cream/85">{booking.address}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-cream/50">{t('statusLabel')}</dt>
            <dd
              className={`font-semibold uppercase tracking-wider ${
                booking.status === 'cancelled' || booking.status === 'no-show'
                  ? 'text-red-300/80'
                  : booking.status === 'confirmed'
                    ? 'text-emerald-300'
                    : 'text-brass'
              }`}
            >
              {t(STATUS_KEY[booking.status])}
            </dd>
          </div>
        </dl>

        {message && (
          <p
            className={`mt-5 border p-3 text-center text-sm ${
              message.kind === 'err' ? 'border-brass/40 text-brass' : 'border-emerald-400/40 text-emerald-300'
            }`}
          >
            {message.kind === 'ok' && <CheckIcon className="me-2 inline h-4 w-4" />}
            {message.text}
          </p>
        )}

        {/* Reschedule picker */}
        {changeable && rescheduling && (
          <div className="mt-6 border-t border-cream/10 pt-6">
            <p className="field-label">{t('newSlot')}</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <Calendar settings={settings} locale={locale} value={newDate} onChange={setNewDate} />
              <div>
                {!newDate ? (
                  <p className="border border-dashed border-cream/15 px-4 py-8 text-center text-xs text-cream/40">
                    {tb('pickDay')}
                  </p>
                ) : slots.length === 0 ? (
                  <p className="border border-dashed border-brass/30 px-4 py-8 text-center text-xs text-brass">
                    {tb('noTimes')}
                  </p>
                ) : (
                  <div className="grid max-h-64 grid-cols-3 gap-1.5 overflow-y-auto pe-1">
                    {slots.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setNewTime(s)}
                        aria-pressed={newTime === s}
                        className={`ltr-embed border py-2 text-xs transition-all duration-300 ${
                          newTime === s
                            ? 'border-brass bg-brass font-semibold text-ink'
                            : 'border-cream/15 text-cream/80 hover:border-brass/60 hover:text-brass'
                        }`}
                      >
                        {formatSlot(s, locale)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onReschedule}
              disabled={busy || !newDate || !newTime}
              className="btn-brass mt-5 w-full disabled:opacity-50"
            >
              {busy ? t('saving') : t('saveSlot')}
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3 border-t border-cream/10 pt-6 sm:flex-row">
          {changeable && !rescheduling && (
            <button type="button" onClick={() => setRescheduling(true)} className="btn-brass flex-1">
              {t('reschedule')}
            </button>
          )}
          {changeable && (
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="btn flex-1 border border-red-400/40 text-red-300/90 hover:border-red-400 hover:text-red-300 disabled:opacity-50"
            >
              {t('cancel')}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={resetLookup}
          className="link-lux mx-auto mt-6 block text-[11px] font-semibold uppercase tracking-luxe text-cream/60 hover:text-cream"
        >
          {t('back')}
        </button>
      </div>
    </div>
  );
}

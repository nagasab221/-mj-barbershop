'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/Icons';
import {
  MAX_ADVANCE_DAYS,
  addDaysISO,
  dayKeyOf,
  dubaiTodayISO,
  hoursFor,
  isBlocked,
  slotsForDate
} from '@/lib/booking';
import type { Locale, ReservationSettings } from '@/lib/types';

/**
 * Themed month calendar for picking a booking day, replaces the generic
 * native date input. Days outside working hours, blocked dates, and days
 * with no remaining slots are disabled.
 */

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function monthOf(iso: string): { y: number; m: number } {
  const [y, m] = iso.split('-').map(Number);
  return { y, m };
}

export default function Calendar({
  settings,
  locale,
  value,
  onChange
}: {
  settings: ReservationSettings;
  locale: Locale;
  value: string;
  onChange: (dateISO: string) => void;
}) {
  const t = useTranslations('booking');
  const today = dubaiTodayISO();
  const maxDate = addDaysISO(today, MAX_ADVANCE_DAYS);

  const [view, setView] = useState(() => monthOf(value || today));

  const intl = locale === 'ar' ? 'ar-AE-u-nu-latn' : 'en-GB';

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(intl, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
        new Date(Date.UTC(view.y, view.m - 1, 1))
      ),
    [intl, view]
  );

  // Week starts on Sunday to match the working-hours model.
  const weekdayNames = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(intl, { weekday: 'narrow', timeZone: 'UTC' });
    // 2023-01-01 was a Sunday.
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(Date.UTC(2023, 0, 1 + i))));
  }, [intl]);

  const canPrev = view.y > Number(today.slice(0, 4)) || view.m > Number(today.slice(5, 7));
  const { y: maxY, m: maxM } = monthOf(maxDate);
  const canNext = view.y < maxY || view.m < maxM;

  function shiftMonth(delta: 1 | -1) {
    setView(({ y, m }) => {
      const next = m + delta;
      if (next < 1) return { y: y - 1, m: 12 };
      if (next > 12) return { y: y + 1, m: 1 };
      return { y, m: next };
    });
  }

  const cells = useMemo(() => {
    const firstDow = new Date(Date.UTC(view.y, view.m - 1, 1)).getUTCDay(); // 0 = Sunday
    const daysInMonth = new Date(Date.UTC(view.y, view.m, 0)).getUTCDate();
    const out: (string | null)[] = Array.from({ length: firstDow }, () => null);
    for (let d = 1; d <= daysInMonth; d++) out.push(`${view.y}-${pad(view.m)}-${pad(d)}`);
    return out;
  }, [view]);

  function isDisabled(iso: string): boolean {
    if (iso < today || iso > maxDate) return true;
    if (isBlocked(settings, iso)) return true;
    const hours = hoursFor(settings, iso);
    if (!hours || hours.closed || !hours.open || !hours.close) return true;
    // Today may already be out of slots (lead time).
    if (iso === today && slotsForDate(settings, iso).length === 0) return true;
    return false;
  }

  return (
    <div className="border border-cream/15 bg-ink-800/60 p-4">
      {/* Month header */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          disabled={!canPrev}
          aria-label={t('calPrev')}
          className="flex h-8 w-8 items-center justify-center border border-cream/15 text-cream/70 transition-colors duration-300 hover:border-brass hover:text-brass disabled:opacity-25"
        >
          <ChevronLeftIcon className="h-4 w-4 rtl:-scale-x-100" />
        </button>
        <p className="font-display text-base text-cream">{monthLabel}</p>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          disabled={!canNext}
          aria-label={t('calNext')}
          className="flex h-8 w-8 items-center justify-center border border-cream/15 text-cream/70 transition-colors duration-300 hover:border-brass hover:text-brass disabled:opacity-25"
        >
          <ChevronRightIcon className="h-4 w-4 rtl:-scale-x-100" />
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 text-center">
        {weekdayNames.map((w, i) => (
          <span key={i} className="pb-2 text-[10px] font-semibold uppercase tracking-wider text-cream/40">
            {w}
          </span>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((iso, i) =>
          iso === null ? (
            <span key={`pad-${i}`} />
          ) : (
            <button
              key={iso}
              type="button"
              disabled={isDisabled(iso)}
              onClick={() => onChange(iso)}
              aria-pressed={value === iso}
              className={`flex h-9 items-center justify-center text-sm transition-all duration-300 ${
                value === iso
                  ? 'bg-brass font-semibold text-ink'
                  : isDisabled(iso)
                    ? 'text-cream/20 line-through decoration-cream/15'
                    : `text-cream/85 hover:bg-cream/10 hover:text-brass ${iso === today ? 'border border-brass/40' : ''}`
              }`}
            >
              {Number(iso.slice(8))}
            </button>
          )
        )}
      </div>
    </div>
  );
}

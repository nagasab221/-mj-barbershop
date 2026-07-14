'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import BookingForm, { type ServiceOption } from '@/components/BookingForm';
import ManageBooking from '@/components/ManageBooking';
import type { Locale, ReservationSettings } from '@/lib/types';

/** Switches between making a new booking and managing an existing one. */
export default function BookingTabs({
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
  const [tab, setTab] = useState<'new' | 'manage'>('new');

  return (
    <div>
      <div className="mb-8 flex justify-center gap-2" role="tablist">
        {(
          [
            { id: 'new' as const, label: t('tabNew') },
            { id: 'manage' as const, label: t('tabManage') }
          ]
        ).map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`border px-6 py-2.5 text-[11px] font-semibold uppercase tracking-luxe transition-all duration-300 ${
              tab === id
                ? 'border-brass bg-brass text-ink'
                : 'border-cream/15 text-cream/60 hover:border-brass/50 hover:text-cream'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'new' ? (
        <BookingForm services={services} settings={settings} whatsapp={whatsapp} locale={locale} />
      ) : (
        <ManageBooking settings={settings} locale={locale} />
      )}
    </div>
  );
}

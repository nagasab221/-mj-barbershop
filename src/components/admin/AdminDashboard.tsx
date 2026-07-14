'use client';

import { useEffect, useMemo, useState } from 'react';
import Emblem from '@/components/Emblem';
import { WhatsAppIcon } from '@/components/Icons';
import {
  GalleryPanel,
  HoursPanel,
  LocationPanel,
  ServicesPanel,
  SiteCopyPanel,
  TestimonialsPanel
} from '@/components/admin/ContentPanels';
import {
  RESERVATION_STATUSES,
  type ReservationStatus,
  type SiteContent,
  type StoredReservation
} from '@/lib/types';

const TABS = [
  { id: 'bookings', label: 'Bookings' },
  { id: 'services', label: 'Services & Pricing' },
  { id: 'hours', label: 'Hours & Dates' },
  { id: 'copy', label: 'Site Copy' },
  { id: 'location', label: 'Location' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'testimonials', label: 'Testimonials' }
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function AdminDashboard({ initialContent }: { initialContent: SiteContent }) {
  const [tab, setTab] = useState<TabId>('bookings');
  const [content, setContent] = useState<SiteContent>(initialContent);
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(initialContent));
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const dirty = useMemo(() => JSON.stringify(content) !== savedSnapshot, [content, savedSnapshot]);

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3500);
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; content?: SiteContent; error?: string }
        | null;
      if (res.ok && json?.ok && json.content) {
        setContent(json.content);
        setSavedSnapshot(JSON.stringify(json.content));
        showToast('Saved — the site is updated.');
      } else if (json?.error === 'no_packages') {
        showToast('Not saved: you need at least one service.');
      } else if (res.status === 401) {
        window.location.reload();
      } else {
        showToast('Save failed — try again.');
      }
    } catch {
      showToast('Save failed — check your connection.');
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => undefined);
    window.location.reload();
  }

  return (
    <div className="min-h-screen pb-28">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-cream/10 bg-ink/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-content items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-3">
            <Emblem className="h-9 w-9 text-brass" />
            <span className="font-display tracking-[0.15em]">
              MJ <span className="text-brass">·</span> ADMIN
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider">
            <a href="/en" target="_blank" rel="noopener noreferrer" className="link-lux text-cream/60 hover:text-cream">
              View site ↗
            </a>
            <button onClick={logout} className="border border-cream/20 px-3 py-1.5 text-cream/70 transition-colors duration-300 hover:border-brass hover:text-brass">
              Sign out
            </button>
          </div>
        </div>
        {/* Tabs */}
        <nav className="mx-auto flex max-w-content gap-1 overflow-x-auto px-5 pb-3" aria-label="Admin sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap border px-4 py-2 text-[11px] font-semibold uppercase tracking-wider transition-colors duration-300 ${
                tab === t.id
                  ? 'border-brass bg-brass text-ink'
                  : 'border-cream/10 text-cream/60 hover:border-brass/50 hover:text-cream'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-content space-y-6 px-5 py-8">
        {tab === 'bookings' && <BookingsPanel />}
        {tab === 'services' && <ServicesPanel content={content} setContent={setContent} />}
        {tab === 'hours' && <HoursPanel content={content} setContent={setContent} />}
        {tab === 'copy' && <SiteCopyPanel content={content} setContent={setContent} />}
        {tab === 'location' && <LocationPanel content={content} setContent={setContent} />}
        {tab === 'gallery' && <GalleryPanel content={content} setContent={setContent} />}
        {tab === 'testimonials' && <TestimonialsPanel content={content} setContent={setContent} />}
      </main>

      {/* Save bar (content tabs only) */}
      {tab !== 'bookings' && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cream/10 bg-ink/95 backdrop-blur">
          <div className="mx-auto flex max-w-content items-center justify-between gap-4 px-5 py-3.5">
            <p className="text-xs text-cream/50">
              {dirty ? 'Unsaved changes' : 'All changes saved'}
            </p>
            <button
              onClick={save}
              disabled={saving || !dirty}
              className="btn-brass !px-8 !py-2.5 disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 border border-brass/50 bg-ink px-5 py-2.5 text-sm text-cream shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

// ── Bookings inbox ───────────────────────────────────────────────────

const STATUS_STYLES: Record<ReservationStatus, string> = {
  new: 'border-brass text-brass',
  confirmed: 'border-emerald-400/60 text-emerald-300',
  completed: 'border-cream/30 text-cream/60',
  cancelled: 'border-red-400/40 text-red-300/80',
  'no-show': 'border-red-400/40 text-red-300/80'
};

function BookingsPanel() {
  const [reservations, setReservations] = useState<StoredReservation[] | null>(null);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try {
      const res = await fetch('/api/admin/reservations');
      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; reservations?: StoredReservation[] }
        | null;
      if (res.ok && json?.ok) setReservations(json.reservations ?? []);
      else setError('Could not load bookings.');
    } catch {
      setError('Could not load bookings.');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function setStatus(id: string, status: ReservationStatus) {
    setReservations((all) => all?.map((r) => (r.id === id ? { ...r, status } : r)) ?? null);
    await fetch('/api/admin/reservations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    }).catch(() => undefined);
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this booking permanently?')) return;
    const res = await fetch(`/api/admin/reservations?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }).catch(() => null);
    if (res?.ok) setReservations((all) => all?.filter((r) => r.id !== id) ?? null);
  }

  if (reservations === null) {
    return <p className="py-16 text-center text-sm text-cream/40">{error || 'Loading bookings…'}</p>;
  }

  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-xl">
          Bookings <span className="text-sm text-cream/40">({reservations.length})</span>
        </h2>
        <button
          onClick={load}
          className="border border-cream/20 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-cream/70 transition-colors duration-300 hover:border-brass hover:text-brass"
        >
          Refresh
        </button>
      </div>

      {reservations.length === 0 ? (
        <p className="border border-dashed border-cream/15 py-16 text-center text-sm text-cream/40">
          No bookings yet. New reservations from the website will appear here.
        </p>
      ) : (
        <ul className="space-y-3">
          {reservations.map((r) => (
            <li key={r.id} className="border border-cream/10 bg-cream/[0.02] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-display text-lg text-cream">
                    {r.name}
                    <span className="ms-3 text-xs tracking-widest text-brass">{r.ref}</span>
                  </p>
                  <p className="mt-1 text-sm text-cream/80">
                    {r.serviceName} — <span className="text-brass">{r.date}</span> at{' '}
                    <span className="text-brass">{r.time}</span>
                  </p>
                  <p className="mt-2 flex flex-wrap items-center gap-4 text-xs text-cream/50">
                    <a href={`tel:${r.phone}`} className="link-lux hover:text-cream">
                      {r.phone}
                    </a>
                    <a
                      href={`https://wa.me/${r.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-cream/60 hover:text-brass"
                    >
                      <WhatsAppIcon className="h-3.5 w-3.5" /> WhatsApp
                    </a>
                    <span>via {r.locale === 'ar' ? 'Arabic site' : 'English site'}</span>
                    <span>received {new Date(r.createdAt).toLocaleString()}</span>
                  </p>
                  {r.notes && <p className="mt-2 text-sm italic text-cream/60">“{r.notes}”</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <select
                    value={r.status}
                    onChange={(e) => void setStatus(r.id, e.target.value as ReservationStatus)}
                    className={`cursor-pointer border bg-ink px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider outline-none ${STATUS_STYLES[r.status]}`}
                  >
                    {RESERVATION_STATUSES.map((s) => (
                      <option key={s} value={s} className="bg-ink text-cream">
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => void remove(r.id)}
                    title="Delete booking"
                    className="flex h-8 w-8 items-center justify-center border border-cream/20 text-cream/60 transition-colors duration-300 hover:border-red-400/70 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

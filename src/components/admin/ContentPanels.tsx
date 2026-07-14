'use client';

/** Content-editing panels for the admin dashboard. Each mutates the shared
 *  SiteContent draft; the dashboard's Save bar persists it. */
import type { Dispatch, SetStateAction } from 'react';
import {
  AddButton,
  FieldGrid,
  ImagePicker,
  ItemCard,
  LocaleInput,
  LocaleTextarea,
  NumField,
  Panel,
  TextField,
  Toggle
} from '@/components/admin/fields';
import type { PackageCategory, SiteContent, Venue } from '@/lib/types';

interface PanelProps {
  content: SiteContent;
  setContent: Dispatch<SetStateAction<SiteContent>>;
}

const CATEGORY_OPTIONS: { value: PackageCategory; label: string }[] = [
  { value: 'hair', label: 'Hair' },
  { value: 'beard', label: 'Beard' },
  { value: 'combo', label: 'Combo' },
  { value: 'kids', label: 'Kids' },
  { value: 'vip', label: 'VIP' },
  { value: 'addon', label: 'Add-on' }
];

const DAY_LABELS: Record<string, string> = {
  saturday: 'Saturday',
  sunday: 'Sunday',
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday'
};

function move<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

// ── Services & Pricing ──────────────────────────────────────────────

export function ServicesPanel({ content, setContent }: PanelProps) {
  const packages = content.packages;
  const update = (i: number, patch: Partial<SiteContent['packages'][number]>) =>
    setContent((c) => ({
      ...c,
      packages: c.packages.map((p, idx) => (idx === i ? { ...p, ...patch } : p))
    }));

  return (
    <Panel
      title="Services & Pricing"
      hint="These cards appear in the pricing grid and the booking form's service list, in this order."
    >
      {packages.map((pkg, i) => (
        <ItemCard
          key={pkg.id}
          title={pkg.name.en || pkg.name.ar}
          onMoveUp={i > 0 ? () => setContent((c) => ({ ...c, packages: move(c.packages, i, i - 1) })) : undefined}
          onMoveDown={
            i < packages.length - 1
              ? () => setContent((c) => ({ ...c, packages: move(c.packages, i, i + 1) }))
              : undefined
          }
          onDelete={() => setContent((c) => ({ ...c, packages: c.packages.filter((_, idx) => idx !== i) }))}
        >
          <LocaleInput label="Name" value={pkg.name} onChange={(name) => update(i, { name })} />
          <FieldGrid cols={3}>
            <NumField label="Price (AED)" value={pkg.price} onChange={(price) => update(i, { price })} />
            <NumField label="Duration (minutes)" value={pkg.duration} onChange={(duration) => update(i, { duration })} />
            <div>
              <label className="field-label">Category</label>
              <select
                className="field"
                value={pkg.category}
                onChange={(e) => update(i, { category: e.target.value as PackageCategory })}
              >
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Where is it offered?</label>
              <select
                className="field"
                value={pkg.venue ?? 'both'}
                onChange={(e) => update(i, { venue: e.target.value as Venue })}
              >
                <option value="both">Home visit or studio</option>
                <option value="home">Home visit only</option>
                <option value="shop">Studio only</option>
              </select>
            </div>
          </FieldGrid>
          <LocaleTextarea
            label="Short description"
            rows={2}
            value={pkg.description}
            onChange={(description) => update(i, { description })}
          />
          <div className="flex flex-wrap items-center gap-8">
            <Toggle label="“Most Popular” badge" checked={Boolean(pkg.popular)} onChange={(popular) => update(i, { popular })} />
            <Toggle
              label="Show as “from” price"
              checked={Boolean(pkg.startingFrom)}
              onChange={(startingFrom) => update(i, { startingFrom })}
            />
          </div>
          <ImagePicker label="Image (optional)" value={pkg.image ?? null} onChange={(image) => update(i, { image })} />
        </ItemCard>
      ))}
      <AddButton
        onClick={() =>
          setContent((c) => ({
            ...c,
            packages: [
              ...c.packages,
              {
                id: newId('pkg'),
                name: { en: 'New Service', ar: '' },
                price: 50,
                startingFrom: false,
                duration: 30,
                description: { en: '', ar: '' },
                category: 'hair',
                popular: false,
                image: null
              }
            ]
          }))
        }
      >
        Add service
      </AddButton>
    </Panel>
  );
}

// ── Hours, blocked dates & booking copy ─────────────────────────────

export function HoursPanel({ content, setContent }: PanelProps) {
  const { reservation } = content;
  const setReservation = (patch: Partial<SiteContent['reservation']>) =>
    setContent((c) => ({ ...c, reservation: { ...c.reservation, ...patch } }));

  return (
    <>
      <Panel title="Booking section copy">
        <LocaleInput
          label="Heading"
          value={reservation.heading}
          onChange={(heading) => setReservation({ heading })}
        />
        <LocaleTextarea
          label="Subheading"
          rows={2}
          value={reservation.subheading}
          onChange={(subheading) => setReservation({ subheading })}
        />
      </Panel>

      <Panel
        title="Venue & travel"
        hint="Control mobile vs studio bookings and the travel fee for home visits outside your base area."
      >
        <Toggle
          label="Studio open for booking (off = mobile only, studio shows “coming soon”)"
          checked={Boolean(reservation.studioOpen)}
          onChange={(studioOpen) => setReservation({ studioOpen })}
        />
        <LocaleInput
          label="Base area (no travel fee), e.g. Al Shamkha"
          value={reservation.areaName}
          onChange={(areaName) => setReservation({ areaName })}
        />
        <FieldGrid>
          <NumField
            label="Travel fee outside base area (AED)"
            value={reservation.travelFee}
            onChange={(travelFee) => setReservation({ travelFee })}
          />
          <div />
        </FieldGrid>
      </Panel>

      <Panel title="Weekly working hours" hint="Times are 24h format. Booking slots are generated every 30 minutes between open and close.">
        <div className="space-y-3">
          {reservation.workingHours.map((h, i) => (
            <div key={h.day} className="flex flex-wrap items-center gap-4 border border-cream/10 px-4 py-3">
              <span className="w-28 text-[11px] font-semibold uppercase tracking-wider text-cream/80">
                {DAY_LABELS[h.day] ?? h.day}
              </span>
              <Toggle
                label="Closed"
                checked={Boolean(h.closed)}
                onChange={(closed) =>
                  setReservation({
                    workingHours: reservation.workingHours.map((x, idx) => (idx === i ? { ...x, closed } : x))
                  })
                }
              />
              {!h.closed && (
                <div className="flex items-center gap-3">
                  <input
                    type="time"
                    className="field !w-32 dark-scheme"
                    value={h.open ?? ''}
                    onChange={(e) =>
                      setReservation({
                        workingHours: reservation.workingHours.map((x, idx) =>
                          idx === i ? { ...x, open: e.target.value } : x
                        )
                      })
                    }
                  />
                  <span className="text-cream/40">–</span>
                  <input
                    type="time"
                    className="field !w-32 dark-scheme"
                    value={h.close ?? ''}
                    onChange={(e) =>
                      setReservation({
                        workingHours: reservation.workingHours.map((x, idx) =>
                          idx === i ? { ...x, close: e.target.value } : x
                        )
                      })
                    }
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Blocked dates" hint="No bookings can be made on these dates (holidays, Eid, maintenance…).">
        <div className="space-y-3">
          {reservation.blockedDates.map((b, i) => (
            <div key={`${b.date}-${i}`} className="flex flex-wrap items-center gap-4 border border-cream/10 px-4 py-3">
              <input
                type="date"
                className="field !w-44 dark-scheme"
                value={b.date}
                onChange={(e) =>
                  setReservation({
                    blockedDates: reservation.blockedDates.map((x, idx) =>
                      idx === i ? { ...x, date: e.target.value } : x
                    )
                  })
                }
              />
              <input
                type="text"
                className="field flex-1"
                placeholder="Reason (optional, internal)"
                value={b.reason ?? ''}
                onChange={(e) =>
                  setReservation({
                    blockedDates: reservation.blockedDates.map((x, idx) =>
                      idx === i ? { ...x, reason: e.target.value } : x
                    )
                  })
                }
              />
              <button
                type="button"
                onClick={() =>
                  setReservation({ blockedDates: reservation.blockedDates.filter((_, idx) => idx !== i) })
                }
                className="flex h-8 w-8 items-center justify-center border border-cream/20 text-cream/60 hover:border-red-400/70 hover:text-red-300"
                aria-label="Remove blocked date"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <AddButton
          onClick={() => setReservation({ blockedDates: [...reservation.blockedDates, { date: '', reason: '' }] })}
        >
          Block a date
        </AddButton>
      </Panel>
    </>
  );
}

// ── Site copy (hero, about, contact) ────────────────────────────────

export function SiteCopyPanel({ content, setContent }: PanelProps) {
  const { site } = content;
  const setSite = (patch: Partial<SiteContent['site']>) =>
    setContent((c) => ({ ...c, site: { ...c.site, ...patch } }));

  return (
    <>
      <Panel title="Hero">
        <LocaleInput label="Eyebrow (small top line)" value={site.heroEyebrow} onChange={(heroEyebrow) => setSite({ heroEyebrow })} />
        <LocaleInput label="Title" value={site.heroTitle} onChange={(heroTitle) => setSite({ heroTitle })} />
        <LocaleTextarea label="Subtitle" rows={2} value={site.heroSubtitle} onChange={(heroSubtitle) => setSite({ heroSubtitle })} />
        <LocaleInput label="Tagline (footer / sharing)" value={site.tagline} onChange={(tagline) => setSite({ tagline })} />
      </Panel>

      <Panel title="About">
        <LocaleInput label="Heading" value={site.aboutHeading} onChange={(aboutHeading) => setSite({ aboutHeading })} />
        {site.aboutBody.map((para, i) => (
          <div key={i} className="border border-cream/10 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-cream/50">
                Paragraph {i + 1}
              </span>
              <button
                type="button"
                onClick={() => setSite({ aboutBody: site.aboutBody.filter((_, idx) => idx !== i) })}
                className="text-[11px] uppercase tracking-wider text-cream/40 hover:text-red-300"
              >
                Remove
              </button>
            </div>
            <LocaleTextarea
              label="Text"
              rows={3}
              value={para}
              onChange={(next) => setSite({ aboutBody: site.aboutBody.map((p, idx) => (idx === i ? next : p)) })}
            />
          </div>
        ))}
        <AddButton onClick={() => setSite({ aboutBody: [...site.aboutBody, { en: '', ar: '' }] })}>
          Add paragraph
        </AddButton>
        <LocaleInput label="Founder name" value={site.founderName} onChange={(founderName) => setSite({ founderName })} />
        <LocaleInput label="Founder role" value={site.founderRole} onChange={(founderRole) => setSite({ founderRole })} />
        <LocaleTextarea label="Founder bio" rows={3} value={site.founderBio} onChange={(founderBio) => setSite({ founderBio })} />
      </Panel>

      <Panel title="Stats row" hint="Short numbers shown under the About section (e.g. 12+, 15,000+).">
        {site.stats.map((stat, i) => (
          <div key={i} className="border border-cream/10 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-cream/50">Stat {i + 1}</span>
              <button
                type="button"
                onClick={() => setSite({ stats: site.stats.filter((_, idx) => idx !== i) })}
                className="text-[11px] uppercase tracking-wider text-cream/40 hover:text-red-300"
              >
                Remove
              </button>
            </div>
            <FieldGrid>
              <TextField
                label="Value"
                value={stat.value}
                onChange={(value) => setSite({ stats: site.stats.map((s, idx) => (idx === i ? { ...s, value } : s)) })}
              />
              <div />
            </FieldGrid>
            <div className="mt-4">
              <LocaleInput
                label="Label"
                value={stat.label}
                onChange={(label) => setSite({ stats: site.stats.map((s, idx) => (idx === i ? { ...s, label } : s)) })}
              />
            </div>
          </div>
        ))}
        <AddButton onClick={() => setSite({ stats: [...site.stats, { value: '', label: { en: '', ar: '' } }] })}>
          Add stat
        </AddButton>
      </Panel>

      <Panel title="Contact & social" hint="Used across the header, contact section and footer.">
        <FieldGrid>
          <TextField label="Phone (e.g. +971501234567)" value={site.phone} onChange={(phone) => setSite({ phone })} dir="ltr" />
          <TextField
            label="WhatsApp number (digits only)"
            value={site.whatsapp}
            onChange={(whatsapp) => setSite({ whatsapp })}
            dir="ltr"
          />
          <TextField label="Email" value={site.email} onChange={(email) => setSite({ email })} dir="ltr" />
          <TextField label="Instagram URL" value={site.instagram} onChange={(instagram) => setSite({ instagram })} dir="ltr" />
          <TextField label="TikTok URL" value={site.tiktok} onChange={(tiktok) => setSite({ tiktok })} dir="ltr" />
        </FieldGrid>
      </Panel>
    </>
  );
}

// ── Location ────────────────────────────────────────────────────────

export function LocationPanel({ content, setContent }: PanelProps) {
  const { location } = content;
  const setLocation = (patch: Partial<SiteContent['location']>) =>
    setContent((c) => ({ ...c, location: { ...c.location, ...patch } }));

  return (
    <Panel
      title="Location"
      hint="Coordinates drive the embedded map and the Get Directions button. Right-click a spot in Google Maps and copy the numbers."
    >
      <LocaleTextarea label="Address" rows={2} value={location.address} onChange={(address) => setLocation({ address })} />
      <LocaleInput
        label="Working hours (display text)"
        value={location.hoursText}
        onChange={(hoursText) => setLocation({ hoursText })}
      />
      <FieldGrid>
        <NumField label="Latitude" value={location.lat} step={0.0001} onChange={(lat) => setLocation({ lat })} />
        <NumField label="Longitude" value={location.lng} step={0.0001} onChange={(lng) => setLocation({ lng })} />
      </FieldGrid>
    </Panel>
  );
}

// ── Gallery ─────────────────────────────────────────────────────────

export function GalleryPanel({ content, setContent }: PanelProps) {
  const gallery = content.gallery;

  return (
    <Panel title="Gallery" hint="Portfolio images shown in the gallery grid, in this order. Upload JPG/PNG/WebP up to 8 MB.">
      {gallery.map((item, i) => (
        <ItemCard
          key={item.id}
          title={item.caption.en || item.caption.ar || item.image.split('/').pop() || 'Image'}
          onMoveUp={i > 0 ? () => setContent((c) => ({ ...c, gallery: move(c.gallery, i, i - 1) })) : undefined}
          onMoveDown={
            i < gallery.length - 1
              ? () => setContent((c) => ({ ...c, gallery: move(c.gallery, i, i + 1) }))
              : undefined
          }
          onDelete={() => setContent((c) => ({ ...c, gallery: c.gallery.filter((_, idx) => idx !== i) }))}
        >
          <ImagePicker
            label="Image"
            value={item.image || null}
            onChange={(image) =>
              setContent((c) => ({
                ...c,
                gallery: c.gallery.map((g, idx) => (idx === i ? { ...g, image: image ?? '' } : g))
              }))
            }
          />
          <LocaleInput
            label="Caption"
            value={item.caption}
            onChange={(caption) =>
              setContent((c) => ({
                ...c,
                gallery: c.gallery.map((g, idx) => (idx === i ? { ...g, caption } : g))
              }))
            }
          />
        </ItemCard>
      ))}
      <AddButton
        onClick={() =>
          setContent((c) => ({
            ...c,
            gallery: [...c.gallery, { id: newId('gal'), caption: { en: '', ar: '' }, image: '' }]
          }))
        }
      >
        Add image
      </AddButton>
      <p className="text-xs text-cream/40">
        Items without an uploaded image are not shown on the site (and are dropped on save).
      </p>
    </Panel>
  );
}

// ── Testimonials ────────────────────────────────────────────────────

export function TestimonialsPanel({ content, setContent }: PanelProps) {
  const testimonials = content.testimonials;

  return (
    <Panel title="Testimonials">
      {testimonials.map((item, i) => (
        <ItemCard
          key={item.id}
          title={item.name}
          onMoveUp={i > 0 ? () => setContent((c) => ({ ...c, testimonials: move(c.testimonials, i, i - 1) })) : undefined}
          onMoveDown={
            i < testimonials.length - 1
              ? () => setContent((c) => ({ ...c, testimonials: move(c.testimonials, i, i + 1) }))
              : undefined
          }
          onDelete={() =>
            setContent((c) => ({ ...c, testimonials: c.testimonials.filter((_, idx) => idx !== i) }))
          }
        >
          <FieldGrid>
            <TextField
              label="Client name"
              value={item.name}
              onChange={(name) =>
                setContent((c) => ({
                  ...c,
                  testimonials: c.testimonials.map((t, idx) => (idx === i ? { ...t, name } : t))
                }))
              }
            />
            <div>
              <label className="field-label">Rating</label>
              <select
                className="field"
                value={item.rating}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    testimonials: c.testimonials.map((t, idx) =>
                      idx === i ? { ...t, rating: Number(e.target.value) } : t
                    )
                  }))
                }
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {'★'.repeat(n)}{'☆'.repeat(5 - n)} ({n}/5)
                  </option>
                ))}
              </select>
            </div>
          </FieldGrid>
          <LocaleTextarea
            label="Quote"
            rows={2}
            value={item.quote}
            onChange={(quote) =>
              setContent((c) => ({
                ...c,
                testimonials: c.testimonials.map((t, idx) => (idx === i ? { ...t, quote } : t))
              }))
            }
          />
        </ItemCard>
      ))}
      <AddButton
        onClick={() =>
          setContent((c) => ({
            ...c,
            testimonials: [
              ...c.testimonials,
              { id: newId('test'), name: '', quote: { en: '', ar: '' }, rating: 5 }
            ]
          }))
        }
      >
        Add testimonial
      </AddButton>
    </Panel>
  );
}

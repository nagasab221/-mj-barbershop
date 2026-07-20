'use client';

/** Small form building blocks shared by the admin panels. */
import { useRef, useState, type ReactNode } from 'react';
import type { L } from '@/lib/types';

export function Panel({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="border border-cream/10 bg-cream/[0.02] p-6 md:p-8">
      <h2 className="font-display text-xl text-cream">{title}</h2>
      {hint && <p className="mt-1 text-xs text-cream/40">{hint}</p>}
      <div className="mt-6 space-y-6">{children}</div>
    </section>
  );
}

export function FieldGrid({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 }) {
  return <div className={`grid gap-5 ${cols === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>{children}</div>;
}

/** English + Arabic inputs for a bilingual string. */
export function LocaleInput({
  label,
  value,
  onChange
}: {
  label: string;
  value: L;
  onChange: (next: L) => void;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div>
        <label className="field-label">{label} (English)</label>
        <input
          type="text"
          className="field"
          value={value.en}
          onChange={(e) => onChange({ ...value, en: e.target.value })}
        />
      </div>
      <div>
        <label className="field-label">{label} (العربية)</label>
        <input
          type="text"
          dir="rtl"
          className="field"
          value={value.ar}
          onChange={(e) => onChange({ ...value, ar: e.target.value })}
        />
      </div>
    </div>
  );
}

export function LocaleTextarea({
  label,
  value,
  onChange,
  rows = 3
}: {
  label: string;
  value: L;
  onChange: (next: L) => void;
  rows?: number;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div>
        <label className="field-label">{label} (English)</label>
        <textarea
          rows={rows}
          className="field resize-none"
          value={value.en}
          onChange={(e) => onChange({ ...value, en: e.target.value })}
        />
      </div>
      <div>
        <label className="field-label">{label} (العربية)</label>
        <textarea
          rows={rows}
          dir="rtl"
          className="field resize-none"
          value={value.ar}
          onChange={(e) => onChange({ ...value, ar: e.target.value })}
        />
      </div>
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  dir
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  dir?: 'ltr' | 'rtl';
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input
        type={type}
        dir={dir}
        className="field"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function NumField({
  label,
  value,
  onChange,
  step = 1
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input
        type="number"
        step={step}
        className="field"
        value={Number.isFinite(value) ? value : ''}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`h-5 w-9 shrink-0 border transition-colors duration-300 ${
          checked ? 'border-brass bg-brass' : 'border-cream/30 bg-transparent'
        }`}
      >
        <span
          className={`block h-full w-1/2 bg-ink transition-transform duration-300 ${checked ? 'translate-x-full' : ''}`}
        />
      </button>
      <span className="text-xs font-semibold uppercase tracking-wider text-cream/70">{label}</span>
    </label>
  );
}

/** Card wrapper for list items (services, gallery, testimonials) with reorder/delete controls. */
export function ItemCard({
  title,
  onMoveUp,
  onMoveDown,
  onDelete,
  children
}: {
  title: string;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border border-cream/10 bg-ink-800/60 p-5">
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-cream/10 pb-3">
        <p className="truncate font-display text-base text-cream/90">{title || 'Untitled'}</p>
        <div className="flex shrink-0 items-center gap-1.5">
          <SmallBtn onClick={onMoveUp} disabled={!onMoveUp} label="Move up">↑</SmallBtn>
          <SmallBtn onClick={onMoveDown} disabled={!onMoveDown} label="Move down">↓</SmallBtn>
          <SmallBtn onClick={onDelete} label="Delete" danger>✕</SmallBtn>
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

export function SmallBtn({
  children,
  onClick,
  disabled,
  label,
  danger
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center border text-sm transition-colors duration-300 disabled:opacity-25 ${
        danger
          ? 'border-cream/20 text-cream/70 hover:border-red-400/70 hover:text-red-300'
          : 'border-cream/20 text-cream/70 hover:border-brass hover:text-brass'
      }`}
    >
      {children}
    </button>
  );
}

export function AddButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full border border-dashed border-cream/25 py-3 text-[11px] font-semibold uppercase tracking-luxe text-cream/60 transition-colors duration-300 hover:border-brass hover:text-brass"
    >
      + {children}
    </button>
  );
}

/** Image upload field: uploads to /api/admin/upload, stores the returned path. */
export function ImagePicker({
  label,
  value,
  onChange
}: {
  label: string;
  value: string | null;
  onChange: (path: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function upload(file: File) {
    setBusy(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; path?: string; error?: string } | null;
      if (res.ok && json?.ok && json.path) {
        onChange(json.path);
      } else {
        setError(
          json?.error === 'unsupported_type'
            ? 'Use a JPG, PNG or WebP image.'
            : json?.error === 'too_large'
              ? 'Image is larger than 8 MB.'
              : json?.error === 'not_configured'
                ? 'Connect Supabase first (see README).'
                : 'Upload failed. Try again.'
        );
      }
    } catch {
      setError('Upload failed. Try again.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <span className="field-label">{label}</span>
      <div className="flex items-center gap-4">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-16 w-16 border border-cream/15 object-cover" />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center border border-dashed border-cream/20 text-[10px] uppercase tracking-wider text-cream/30">
            none
          </span>
        )}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="border border-cream/25 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-cream/80 transition-colors duration-300 hover:border-brass hover:text-brass disabled:opacity-50"
          >
            {busy ? 'Uploading…' : value ? 'Replace image' : 'Upload image'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-start text-[11px] uppercase tracking-wider text-cream/40 hover:text-red-300"
            >
              Remove
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
          }}
        />
      </div>
      {error && <p className="mt-2 text-xs text-brass">{error}</p>}
    </div>
  );
}

'use client';

import { useState, type FormEvent } from 'react';
import Emblem from '@/components/Emblem';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        window.location.reload(); // server re-renders /admin as the dashboard
        return;
      }
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(
        json?.error === 'rate_limited'
          ? 'Too many attempts — try again in a few minutes.'
          : json?.error === 'not_configured'
            ? 'ADMIN_PASSWORD / ADMIN_SESSION_SECRET are not set in .env.local.'
            : 'Wrong password.'
      );
      setBusy(false);
    } catch {
      setError('Something went wrong — try again.');
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 pinstripes-light">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm border border-cream/10 bg-cream/[0.02] p-10 text-center"
      >
        <Emblem className="mx-auto h-16 w-16 text-brass" />
        <h1 className="mt-5 font-display text-2xl">Admin</h1>
        <p className="mt-1 text-xs uppercase tracking-luxe text-cream/40">MJ Barbershop CMS</p>

        <label htmlFor="admin-pw" className="field-label mt-8 text-start">
          Password
        </label>
        <input
          id="admin-pw"
          type="password"
          className="field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          autoComplete="current-password"
        />
        {error && <p className="mt-3 text-xs text-brass">{error}</p>}

        <button type="submit" disabled={busy || !password} className="btn-brass mt-8 w-full disabled:opacity-60">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}

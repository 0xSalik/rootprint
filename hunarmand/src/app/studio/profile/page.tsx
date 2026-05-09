"use client";

import * as React from "react";
import Link from "next/link";

import { useRequireAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { HashiaBorder } from "@/components/motifs";

/* -------------------------------------------------------------------------
 * /studio/profile — edit your own master profile
 *
 * Wired to:
 *   GET /api/v1/masters/me/full   (JWT)
 *   PUT /api/v1/masters/me        (JWT)
 * ----------------------------------------------------------------------- */

interface ProfileForm {
  name: string;
  workshop_location: string;
  lineage_id: string;
  bio: string;
}

export default function StudioProfilePage() {
  const auth = useRequireAuth();
  const [form, setForm] = React.useState<ProfileForm | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const reload = React.useCallback(async () => {
    if (!auth.token) return;
    try {
      const me = await api.masters.meFull(auth.token);
      setForm({
        name: me.name ?? "",
        workshop_location: me.workshop_location ?? "",
        lineage_id: me.lineage_id ?? "",
        bio: me.bio ?? "",
      });
    } catch (err) {
      setMessage({
        tone: "err",
        text: err instanceof Error ? err.message : "Could not load profile.",
      });
    }
  }, [auth.token]);

  React.useEffect(() => {
    if (auth.token) reload();
  }, [auth.token, reload]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!auth.token || !form) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const patch = {
        name: form.name.trim(),
        workshop_location: form.workshop_location.trim(),
        lineage_id: form.lineage_id.trim(),
        bio: form.bio.trim(),
      };
      await api.masters.updateMe(auth.token, patch);
      await auth.refresh();
      setMessage({ tone: "ok", text: "Profile saved." });
    } catch (err) {
      setMessage({
        tone: "err",
        text: err instanceof Error ? err.message : "Save failed.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!auth.hydrated || !auth.token) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center pt-24 text-ink-faded">
        <span className="font-mono text-[12px] uppercase tracking-[0.22em]">Loading…</span>
      </main>
    );
  }

  return (
    <main className="bg-parchment pt-24 pb-24">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <div className="mb-2 flex items-center gap-3 text-ink-faded">
          <Link href="/studio" className="font-mono text-[11px] uppercase tracking-[0.22em] hover:text-brand">
            ← Studio
          </Link>
        </div>
        <h1 className="font-display text-[40px] leading-tight text-ink">Profile</h1>
        <p className="mt-1 font-body text-[14px] text-ink-faded">
          Visible on your public artisan page and on every Sanad QR scan.
        </p>
        <HashiaBorder className="mt-5 h-3 w-full text-gold" />

        {message ? (
          <div
            className={[
              "mt-6 rounded-craft border px-4 py-3 font-body text-[13px]",
              message.tone === "ok"
                ? "border-gold/40 bg-gold-light/30 text-ink"
                : "border-brand/30 bg-brand-subtle text-brand",
            ].join(" ")}
          >
            {message.text}
          </div>
        ) : null}

        {form === null ? (
          <p className="mt-8 font-mono text-[12px] uppercase tracking-[0.2em] text-ink-faded">
            Loading…
          </p>
        ) : (
          <form onSubmit={submit} className="mt-8 grid gap-5 rounded-craft border border-line bg-paper px-6 py-6">
            <Field label="Display name">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-craft border border-line bg-paper px-3.5 py-2.5 font-body text-[14px] text-ink outline-none focus:border-brand"
                placeholder="Mohammad Yusuf"
              />
            </Field>
            <Field label="Workshop location">
              <input
                type="text"
                value={form.workshop_location}
                onChange={(e) => setForm({ ...form, workshop_location: e.target.value })}
                className="w-full rounded-craft border border-line bg-paper px-3.5 py-2.5 font-body text-[14px] text-ink outline-none focus:border-brand"
                placeholder="Kanihama, Budgam, J&K"
              />
            </Field>
            <Field label="Lineage tag">
              <input
                type="text"
                value={form.lineage_id}
                onChange={(e) => setForm({ ...form, lineage_id: e.target.value })}
                className="w-full rounded-craft border border-line bg-paper px-3.5 py-2.5 font-mono text-[13px] text-ink outline-none focus:border-brand"
                placeholder="kanihama-yusuf-4g"
              />
            </Field>
            <Field label="Short bio">
              <textarea
                rows={5}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="w-full rounded-craft border border-line bg-paper px-3.5 py-2.5 font-body text-[14px] text-ink outline-none focus:border-brand"
                placeholder="Fourth-generation Kanihama pashmina master. Trained from age nine by my father Ghulam Mohammad…"
              />
            </Field>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-craft bg-brand px-5 py-2.5 font-ui text-[14px] tracking-wide text-ink-inverse hover:bg-brand-light disabled:opacity-60"
              >
                {submitting ? "Saving…" : "Save profile"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-faded">
        {label}
      </span>
      {children}
    </label>
  );
}

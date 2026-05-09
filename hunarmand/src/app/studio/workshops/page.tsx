"use client";

import * as React from "react";
import Link from "next/link";

import { useRequireAuth } from "@/lib/auth";
import { api, type WorkshopWithMaster } from "@/lib/api";
import { HashiaBorder } from "@/components/motifs";

/* -------------------------------------------------------------------------
 * /studio/workshops — manage your offerings
 *
 * List, create, soft-delete, and update the master's own workshops.
 * Wired to:
 *
 *   GET    /api/v1/workshops?master_id=<self>
 *   POST   /api/v1/workshops          (JWT)
 *   PUT    /api/v1/workshops/{id}     (JWT, owner)
 *   DELETE /api/v1/workshops/{id}     (JWT, owner; soft delete)
 * ----------------------------------------------------------------------- */

interface FormState {
  format: string;
  price: string;
  duration_mins: string;
  description: string;
}

const EMPTY_FORM: FormState = {
  format: "",
  price: "",
  duration_mins: "",
  description: "",
};

const QUICK_PRESETS = [
  { format: "Heritage Walk", price: 2500, duration_mins: 180 },
  { format: "Master Session", price: 5000, duration_mins: 90 },
  { format: "Half-Day Masterclass", price: 6000, duration_mins: 240 },
];

export default function StudioWorkshopsPage() {
  const auth = useRequireAuth();
  const [workshops, setWorkshops] = React.useState<WorkshopWithMaster[] | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const reload = React.useCallback(async () => {
    if (!auth.master) return;
    try {
      const r = await api.workshops.list({ master_id: auth.master.id });
      setWorkshops(r.items);
    } catch (err) {
      setMessage({
        tone: "err",
        text: err instanceof Error ? err.message : "Could not list workshops.",
      });
    }
  }, [auth.master]);

  React.useEffect(() => {
    if (auth.token && auth.master) reload();
  }, [auth.token, auth.master, reload]);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (!auth.token) return;
    setSubmitting(true);
    setMessage(null);
    try {
      await api.workshops.create(auth.token, {
        format: form.format.trim(),
        price: Number(form.price),
        duration_mins: Number(form.duration_mins),
        description: form.description.trim() || undefined,
      });
      setForm(EMPTY_FORM);
      setMessage({ tone: "ok", text: "Workshop added." });
      await reload();
    } catch (err) {
      setMessage({
        tone: "err",
        text: err instanceof Error ? err.message : "Create failed.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(w: WorkshopWithMaster) {
    if (!auth.token) return;
    try {
      await api.workshops.update(auth.token, w.id, { is_active: !w.is_active });
      await reload();
    } catch (err) {
      setMessage({
        tone: "err",
        text: err instanceof Error ? err.message : "Update failed.",
      });
    }
  }

  async function remove(w: WorkshopWithMaster) {
    if (!auth.token) return;
    if (!window.confirm(`Soft-delete "${w.format}"? Existing bookings stay intact.`)) {
      return;
    }
    try {
      await api.workshops.delete(auth.token, w.id);
      await reload();
    } catch (err) {
      setMessage({
        tone: "err",
        text: err instanceof Error ? err.message : "Delete failed.",
      });
    }
  }

  if (!auth.hydrated || !auth.token) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center pt-24 text-ink-faded">
        <span className="font-mono text-[12px] uppercase tracking-[0.22em]">
          Loading…
        </span>
      </main>
    );
  }

  return (
    <main className="bg-parchment pt-24 pb-24">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="mb-2 flex items-center gap-3 text-ink-faded">
          <Link href="/studio" className="font-mono text-[11px] uppercase tracking-[0.22em] hover:text-brand">
            ← Studio
          </Link>
        </div>
        <h1 className="font-display text-[40px] leading-tight text-ink">
          Workshops
        </h1>
        <p className="mt-1 font-body text-[14px] text-ink-faded">
          Add, edit, hide, or remove the experiences guests can book in your
          studio.
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

        {/* Add form */}
        <section className="mt-10 rounded-craft border border-line bg-paper px-6 py-6">
          <h2 className="font-display text-[24px] leading-tight text-ink">
            Add a workshop
          </h2>
          <p className="mt-1 font-body text-[13px] text-ink-faded">
            Quick presets, or type your own.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {QUICK_PRESETS.map((p) => (
              <button
                key={p.format}
                type="button"
                onClick={() =>
                  setForm({
                    format: p.format,
                    price: String(p.price),
                    duration_mins: String(p.duration_mins),
                    description: form.description,
                  })
                }
                className="rounded-craft border border-line bg-parchment px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faded hover:border-brand hover:text-brand"
              >
                {p.format}
              </button>
            ))}
          </div>

          <form onSubmit={create} className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Format">
              <input
                required
                type="text"
                value={form.format}
                onChange={(e) => setForm({ ...form, format: e.target.value })}
                className="w-full rounded-craft border border-line bg-paper px-3.5 py-2.5 font-body text-[14px] text-ink outline-none focus:border-brand"
                placeholder="Heritage Walk"
              />
            </Field>
            <Field label="Price (INR)">
              <input
                required
                type="number"
                inputMode="numeric"
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full rounded-craft border border-line bg-paper px-3.5 py-2.5 font-mono text-[14px] text-ink outline-none focus:border-brand"
                placeholder="2500"
              />
            </Field>
            <Field label="Duration (minutes)">
              <input
                required
                type="number"
                inputMode="numeric"
                min={1}
                max={1440}
                value={form.duration_mins}
                onChange={(e) => setForm({ ...form, duration_mins: e.target.value })}
                className="w-full rounded-craft border border-line bg-paper px-3.5 py-2.5 font-mono text-[14px] text-ink outline-none focus:border-brand"
                placeholder="180"
              />
            </Field>
            <Field label="Description (optional)" full>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-craft border border-line bg-paper px-3.5 py-2.5 font-body text-[14px] text-ink outline-none focus:border-brand"
                placeholder="A three-hour walking tour ending at my workshop for a kani demonstration."
              />
            </Field>
            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-craft bg-brand px-5 py-2.5 font-ui text-[14px] tracking-wide text-ink-inverse hover:bg-brand-light disabled:opacity-60"
              >
                {submitting ? "Saving…" : "Add workshop"}
              </button>
            </div>
          </form>
        </section>

        {/* List */}
        <section className="mt-12">
          <h2 className="font-display text-[24px] leading-tight text-ink">
            Your workshops
          </h2>

          {workshops === null ? (
            <p className="mt-4 font-mono text-[12px] uppercase tracking-[0.2em] text-ink-faded">
              Loading…
            </p>
          ) : workshops.length === 0 ? (
            <p className="mt-4 rounded-craft border border-dashed border-line bg-parchment px-4 py-8 text-center font-body text-[14px] text-ink-faded">
              No workshops yet. Add one above.
            </p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {workshops.map((w) => (
                <li
                  key={w.id}
                  className="grid gap-3 rounded-craft border border-line bg-paper px-5 py-5 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <div className="font-display text-[22px] leading-tight text-ink">
                      {w.format ?? "Workshop"}
                    </div>
                    <div className="mt-0.5 font-body text-[13px] text-ink-faded">
                      {w.duration_mins ? `${Math.round(w.duration_mins / 60)} hr` : "—"}
                      {" · "}
                      {w.price ? `₹${w.price.toLocaleString("en-IN")}` : "—"}
                    </div>
                    {w.description ? (
                      <div className="mt-2 font-body text-[13.5px] text-ink-faded">
                        {w.description}
                      </div>
                    ) : null}
                    <div className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-faded">
                      {w.id.slice(0, 8)}…
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:justify-end">
                    <button
                      type="button"
                      onClick={() => toggleActive(w)}
                      className="rounded-craft border border-line bg-parchment px-3 py-2 font-ui text-[12px] tracking-wide text-ink hover:border-brand"
                    >
                      {w.is_active ? "Hide" : "Make live"}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(w)}
                      className="rounded-craft border border-brand/40 bg-paper px-3 py-2 font-ui text-[12px] tracking-wide text-brand hover:bg-brand-subtle"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={["grid gap-1.5", full ? "sm:col-span-2" : ""].join(" ")}>
      <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-faded">
        {label}
      </span>
      {children}
    </label>
  );
}

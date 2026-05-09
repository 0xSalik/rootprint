/* =========================================================================
 * <LiveAdditions />
 *
 * The /workshops page renders the curated 54 mock workshops with all
 * their gorgeous seasonal theming. Additionally, any workshops that
 * masters add through /studio/workshops (which writes live to the
 * backend) appear here, in a separate "Live additions" strip below
 * the curated grid.
 *
 * Detection: the seed script (`scripts/seed-backend.mts`) writes the
 * mock workshops with `format` strings like "Heritage Walk · Pashmina
 * Weaving" (a craft suffix after " · "). User-created workshops from
 * the /studio/workshops quick-fill presets are plain — "Heritage Walk",
 * "Master Session", "Half-Day Masterclass". Anything without the
 * craft-suffix is treated as a recent live addition.
 *
 * If the backend is unreachable the component renders nothing — the
 * curated grid above is the safety net.
 * ========================================================================= */

import { API_BASE_URL } from "@/lib/env";
import type { Paginated, WorkshopWithMaster } from "@/lib/api";

const SEED_FORMAT_MARKER = " · ";

async function fetchLiveAdditions(): Promise<WorkshopWithMaster[]> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/workshops?is_active=true&limit=100`,
      { next: { revalidate: 30 } },
    );
    if (!res.ok) return [];
    const page = (await res.json()) as Paginated<WorkshopWithMaster>;
    return page.items.filter((w) => {
      const fmt = (w.format ?? "").trim();
      // Curated seed workshops always carry a "<title> · <craft>" format.
      // Anything else is a live addition.
      return fmt.length > 0 && !fmt.includes(SEED_FORMAT_MARKER);
    });
  } catch {
    return [];
  }
}

export async function LiveAdditions() {
  const live = await fetchLiveAdditions();
  if (live.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-5 sm:px-8 pb-16 sm:pb-20">
      <div className="rounded-craft-xl border border-line bg-paper-deep px-5 sm:px-7 py-7 sm:py-8">
        <header className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="meta-mono text-ink-margin">Live additions</p>
            <h2 className="font-display text-2xl sm:text-3xl text-ink leading-tight mt-1">
              Recently added by masters
            </h2>
            <p className="font-serif italic text-ink-faded mt-1 max-w-prose text-[15px]">
              New workshop formats published through the master&rsquo;s studio.
              These appear here the moment they go live.
            </p>
          </div>
          <p className="meta-mono text-ink-margin">
            {live.length} {live.length === 1 ? "workshop" : "workshops"}
          </p>
        </header>

        <ul
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
          role="list"
        >
          {live.map((w) => (
            <li key={w.id} className="contents">
              <LiveWorkshopCard workshop={w} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ─────────────────────── card ─────────────────────── */

function LiveWorkshopCard({ workshop }: { workshop: WorkshopWithMaster }) {
  const price = workshop.price ? `₹${workshop.price.toLocaleString("en-IN")}` : "Price on request";
  const duration = workshop.duration_mins
    ? formatDuration(workshop.duration_mins)
    : "Duration on request";

  return (
    <article className="group relative flex flex-col rounded-craft-lg border border-line bg-paper overflow-hidden">
      <div
        aria-hidden="true"
        className="h-1 w-full"
        style={{
          background: "linear-gradient(90deg, var(--gold) 0%, var(--gold-light) 100%)",
        }}
      />
      <div className="px-5 pt-5 pb-6 flex flex-col grow gap-3">
        <p className="meta-mono text-ink-margin">New · live now</p>
        <h3 className="font-display text-[22px] leading-tight text-ink">
          {workshop.format ?? "Workshop"}
        </h3>
        <p className="font-serif text-[14.5px] text-ink-faded">
          With {workshop.master_name ?? "a Hunarmand master"}
          {workshop.master_workshop_location ? `, ${workshop.master_workshop_location}` : ""}.
        </p>

        {workshop.description ? (
          <p className="font-body text-[13.5px] text-ink-faded leading-relaxed line-clamp-3">
            {workshop.description}
          </p>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-faded">
              {duration}
            </div>
            <div className="font-display text-[22px] leading-none text-ink mt-1">
              {price}
              <span className="font-body text-[12px] text-ink-faded ml-1">/ person</span>
            </div>
          </div>
          <span className="inline-flex items-center rounded-full border border-gold/40 bg-gold-light/30 px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink">
            live
          </span>
        </div>
      </div>
    </article>
  );
}

function formatDuration(mins: number): string {
  if (mins >= 360) return `${Math.round(mins / 60)} hr`;
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
  }
  return `${mins} min`;
}


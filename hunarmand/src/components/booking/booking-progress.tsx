import * as React from "react";

import { HashiaBorder } from "@/components/motifs";

/* -------------------------------------------------------------------------
 * <BookingProgress />
 *
 * The progress indicator across all three booking steps. The brief
 * specifies "a Hashia border filling left-to-right" — so the bar IS
 * the Hashia, drawn as one continuous gold band whose visible portion
 * grows with the current step. Past + current steps are gold, future
 * steps are line.
 *
 * Pure server component. Steps are clickable when the user is on a
 * later step and wants to edit a previous answer; the URL preserves
 * their answers via search params.
 * ----------------------------------------------------------------------- */

export type BookingStep = 1 | 2 | 3 | 4;

interface BookingProgressProps {
  current: BookingStep;
  /** Stepwise hrefs so a user on step 3 can click back to step 1 with
   *  their data still in the URL. Index 0 = step 1, etc. */
  hrefs: [string, string, string];
}

const STEP_LABELS = ["Choose your date", "Your details", "Payment"] as const;

export function BookingProgress({ current, hrefs }: BookingProgressProps) {
  return (
    <div className="space-y-3">
      <ol className="grid grid-cols-3 gap-3">
        {STEP_LABELS.map((label, i) => {
          const stepNum = (i + 1) as 1 | 2 | 3;
          const state =
            current === 4
              ? "done"
              : stepNum < current
              ? "done"
              : stepNum === current
              ? "current"
              : "upcoming";
          return (
            <li key={label}>
              <StepBadge
                stepNum={stepNum}
                label={label}
                href={hrefs[i]}
                state={state}
              />
            </li>
          );
        })}
      </ol>

      {/* The Hashia band — fills with the current step. */}
      <div className="relative h-2 sm:h-3 rounded-full overflow-hidden border border-line bg-paper">
        <div
          className="absolute inset-y-0 left-0 transition-[width] duration-300"
          style={{
            width:
              current === 4
                ? "100%"
                : `${Math.round(((current - 1) / 3) * 100 + 33 / 2)}%`,
            background:
              "linear-gradient(90deg, var(--season-gold), var(--season-deep))",
          }}
        />
      </div>

      {/* Decorative Hashia detail underneath */}
      <HashiaBorder height={5} color="var(--season-gold)" opacity={0.55} />
    </div>
  );
}

/* ------------------------------ Step badge ------------------------------ */

interface StepBadgeProps {
  stepNum: 1 | 2 | 3;
  label: string;
  href: string;
  state: "done" | "current" | "upcoming";
}

function StepBadge({ stepNum, label, href, state }: StepBadgeProps) {
  const Tag = state === "upcoming" ? "div" : "a";
  return (
    <Tag
      href={state === "upcoming" ? undefined : href}
      aria-current={state === "current" ? "step" : undefined}
      className={[
        "flex items-start gap-3 group",
        state === "upcoming" ? "" : "hover:[&_p]:text-ink",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "inline-flex items-center justify-center size-7 rounded-full border font-mono text-xs shrink-0",
          state === "done"
            ? "bg-season-deep border-season-deep text-season-gold"
            : state === "current"
            ? "bg-paper border-season-gold text-season-deep"
            : "bg-paper border-line text-ink-margin",
        ].join(" ")}
      >
        {state === "done" ? "✓" : stepNum}
      </span>
      <div className="min-w-0">
        <p className="meta-mono text-ink-margin">Step {stepNum}</p>
        <p
          className={[
            "font-display text-sm sm:text-base leading-tight",
            state === "current" ? "text-ink" : "text-ink-faded",
          ].join(" ")}
        >
          {label}
        </p>
      </div>
    </Tag>
  );
}

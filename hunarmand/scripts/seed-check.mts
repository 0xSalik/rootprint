#!/usr/bin/env -S node --experimental-strip-types --no-warnings

/* -------------------------------------------------------------------------
 * scripts/seed-check.mts
 *
 * Loads the canonical Mohammad Yusuf seed (`/lib/seed.ts`), runs
 * referential-integrity checks, and prints a human-readable digest.
 *
 * Usage:
 *   npm run seed:check
 *   # or directly (requires Node ≥22.6 with --experimental-strip-types):
 *   node --experimental-strip-types scripts/seed-check.mts
 *
 * Exits with code 0 if the seed validates, code 1 otherwise — so this
 * is also CI-safe as a guardrail.
 * ----------------------------------------------------------------------- */

import { MOHAMMAD_YUSUF, summarizeSeed, validateSeed } from "../lib/seed.ts";

const summary = summarizeSeed(MOHAMMAD_YUSUF);
console.log(summary);

const v = validateSeed(MOHAMMAD_YUSUF);
process.exit(v.ok ? 0 : 1);

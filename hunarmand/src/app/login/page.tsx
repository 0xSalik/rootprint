import * as React from "react";

import { LoginForm } from "./login-form";

/* -------------------------------------------------------------------------
 * /login — phone + OTP sign in, mock OTP system
 *
 * The login form lives in a client component so it can read the
 * `?next=…` query param via useSearchParams. Next.js 16 requires
 * useSearchParams to be wrapped in a Suspense boundary at the page
 * level — that's all this thin wrapper does.
 * ----------------------------------------------------------------------- */

export const metadata = {
  title: "Sign in",
  description: "Hunarmand demo sign in. Mock OTP, two demo accounts.",
};

export default function LoginPage() {
  return (
    <React.Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </React.Suspense>
  );
}

function LoginSkeleton() {
  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-parchment pt-24 pb-16">
      <div className="rounded-craft border border-line bg-paper px-7 py-10 text-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faded">
          Loading sign in…
        </span>
      </div>
    </main>
  );
}

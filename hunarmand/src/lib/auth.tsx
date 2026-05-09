"use client";

/* =========================================================================
 * Auth context.
 *
 *   • JWT lives in localStorage under HUNARMAND_AUTH_KEY.
 *   • The phone we logged in with is also kept (the buyer-side
 *     read endpoints take ?phone=... since the backend doesn't have a
 *     buyer concept).
 *   • Role is inferred from phone: the seeded artisan phone
 *     (`+919999999999`) maps to "artisan", anything else to "buyer".
 *     This is what the demo flow expects.
 *   • The provider hydrates from localStorage on mount, so refreshing
 *     a logged-in page keeps the user signed in.
 * ========================================================================= */

import * as React from "react";
import { useRouter } from "next/navigation";

import { api, type MasterPublic } from "./api";
import { type Role, inferRoleFromPhone } from "./env";

const STORAGE_KEY = "HUNARMAND_AUTH";

interface PersistedAuth {
  token: string;
  phone: string;
  /** A cached snapshot of the master profile. Refreshes every login. */
  master?: MasterPublic | null;
}

interface AuthContextValue {
  /** True until the provider has read localStorage. Avoids a flash of
   *  "logged out" on the first render. */
  hydrated: boolean;
  token: string | null;
  phone: string | null;
  master: MasterPublic | null;
  role: Role | null;

  /** Run the OTP login flow. Throws on failure. */
  login: (phone: string, otp: string) => Promise<{ role: Role }>;
  logout: () => void;
  /** Re-fetch the master profile from the API. */
  refresh: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

function readPersisted(): PersistedAuth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedAuth;
    if (typeof parsed?.token === "string" && typeof parsed?.phone === "string") {
      return parsed;
    }
  } catch {
    // fall through
  }
  return null;
}

function writePersisted(value: PersistedAuth | null) {
  if (typeof window === "undefined") return;
  if (value === null) {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = React.useState(false);
  const [token, setToken] = React.useState<string | null>(null);
  const [phone, setPhone] = React.useState<string | null>(null);
  const [master, setMaster] = React.useState<MasterPublic | null>(null);

  React.useEffect(() => {
    const persisted = readPersisted();
    if (persisted) {
      setToken(persisted.token);
      setPhone(persisted.phone);
      setMaster(persisted.master ?? null);
    }
    setHydrated(true);
  }, []);

  const persist = React.useCallback(
    (next: PersistedAuth | null) => {
      writePersisted(next);
      if (next === null) {
        setToken(null);
        setPhone(null);
        setMaster(null);
      } else {
        setToken(next.token);
        setPhone(next.phone);
        setMaster(next.master ?? null);
      }
    },
    [],
  );

  const login = React.useCallback<AuthContextValue["login"]>(
    async (rawPhone, otp) => {
      const cleanPhone = rawPhone.replace(/\s/g, "");
      // Send OTP first; on the mock backend this just primes the store.
      try {
        await api.auth.sendOtp(cleanPhone);
      } catch {
        // Ignore failures from /send-otp; the verify call will tell us
        // for real if anything is wrong.
      }
      const { access_token } = await api.auth.verifyOtp(cleanPhone, otp);

      let me: MasterPublic | null = null;
      try {
        me = await api.auth.me(access_token);
      } catch {
        // Profile fetch is best-effort; we still consider login successful.
      }

      persist({ token: access_token, phone: cleanPhone, master: me });
      return { role: inferRoleFromPhone(cleanPhone) };
    },
    [persist],
  );

  const logout = React.useCallback(() => {
    persist(null);
  }, [persist]);

  const refresh = React.useCallback(async () => {
    if (!token) return;
    try {
      const me = await api.auth.me(token);
      setMaster(me);
      const persisted = readPersisted();
      if (persisted) writePersisted({ ...persisted, master: me });
    } catch {
      /* ignore */
    }
  }, [token]);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      hydrated,
      token,
      phone,
      master,
      role: phone ? inferRoleFromPhone(phone) : null,
      login,
      logout,
      refresh,
    }),
    [hydrated, token, phone, master, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}

/* Lightweight helper for client components that need to gate on auth.
 * Returns `null` while hydrating, the user value once known. Caller
 * decides what to render in the unauthenticated state.
 */
export function useRequireAuth() {
  const auth = useAuth();
  const router = useRouter();
  React.useEffect(() => {
    if (auth.hydrated && !auth.token) {
      router.replace("/login");
    }
  }, [auth.hydrated, auth.token, router]);
  return auth;
}

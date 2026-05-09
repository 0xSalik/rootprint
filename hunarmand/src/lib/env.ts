/* =========================================================================
 * Environment configuration for the live API integration.
 *
 * The frontend talks only to the backend; the backend talks to the AI
 * core. So a single env var is all we need at the edge.
 * ========================================================================= */

export const API_BASE_URL: string =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_HUNARMAND_API) ||
  "https://hunarmand-backend.onrender.com";

/* Demo accounts. The backend uses a mock OTP system for the hackathon:
 *
 *   POST /api/v1/auth/send-otp   { phone }
 *   POST /api/v1/auth/verify-otp { phone, otp: "123456" }   →  { access_token }
 *
 * Any phone number lets you log in. The seeded artisan account
 * (created by `backend/scripts/reset_demo.py`) is keyed by
 * `+919999999999`; a different phone signs in as a buyer.
 *
 * Phone numbers exposed here so we can render them as one-tap
 * "Try it as …" buttons on the login page. The OTP is the same in
 * either case.
 */
export const DEMO_OTP = "123456";

export const DEMO_ARTISAN = {
  phone: "+919999999999",
  label: "Mohammad Yusuf",
  hint: "4th-generation Kanihama pashmina master",
};

export const DEMO_BUYER = {
  phone: "+918888888888",
  label: "Patron",
  hint: "Buyer / collector",
};

/* Roles. Phone is the only thing the backend gives us. We infer the
 * role from the phone number on login so the UI can route to the
 * right dashboard.
 */
export type Role = "artisan" | "buyer";

export function inferRoleFromPhone(phone: string): Role {
  return phone.replace(/\s/g, "") === DEMO_ARTISAN.phone ? "artisan" : "buyer";
}

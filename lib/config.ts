/**
 * Shared site configuration.
 *
 * Exposes the site URL from NEXT_PUBLIC_SITE_URL or VERCEL_URL,
 * with safe fallback to canonical https://assistant.xaivon.com.
 */

export function getSiteUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "https://assistant.xaivon.com";

  return url.replace(/\/+$/, "");
}

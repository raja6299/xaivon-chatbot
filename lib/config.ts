/**
 * Shared site configuration.
 *
 * Validates and exposes the production site URL from the
 * NEXT_PUBLIC_SITE_URL environment variable. Every metadata
 * consumer (layout, robots, sitemap) imports from here so
 * validation logic is never duplicated.
 */

export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL;

  if (!url) {
    throw new Error(
      "Missing required environment variable NEXT_PUBLIC_SITE_URL. " +
        "Set it in .env.local for development (e.g. http://localhost:3000) " +
        "or in your hosting provider for production (e.g. https://assistant.xaivon.com)."
    );
  }

  // Strip trailing slash for consistent usage
  return url.replace(/\/+$/, "");
}

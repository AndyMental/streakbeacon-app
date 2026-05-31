/**
 * Get the base URL of the site from environment variables or defaults.
 */
export function getBaseUrl(): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL ??
    "http://localhost:3000";

  return configuredUrl.startsWith("http")
    ? configuredUrl
    : `https://${configuredUrl}`;
}

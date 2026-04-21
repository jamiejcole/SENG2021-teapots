/** First client IP from X-Forwarded-For (may be a comma-separated chain). */
export function parseForwardedFor(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string" && value.trim()) {
    return value.split(",")[0].trim();
  }

  if (Array.isArray(value) && value.length > 0) {
    return value[0].split(",")[0].trim();
  }

  return undefined;
}

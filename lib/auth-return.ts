/** Return only a local path that remains local when resolved a second time. */
export function safeReturnPath(value: string | null | undefined): string {
  if (!value?.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020\u007f]/.test(value)) {
    return "/";
  }
  try {
    const base = "https://local.invalid";
    const url = new URL(value, base);
    // Dot-segment normalization can turn /a/..//host into //host.
    if (url.origin !== base || url.pathname.startsWith("//")) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

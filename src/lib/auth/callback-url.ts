const DEFAULT_CALLBACK_URL = "/quotes";

function toInternalPath(value: string): string | null {
  if (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("://") &&
    !value.includes("\\")
  ) {
    return value;
  }

  try {
    const url = new URL(value);
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

export function safeCallbackUrl(value: string | null | undefined): string {
  if (!value) {
    return DEFAULT_CALLBACK_URL;
  }

  const path = toInternalPath(value);

  if (
    !path ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\") ||
    path.startsWith("/login") ||
    path.startsWith("/api/")
  ) {
    return DEFAULT_CALLBACK_URL;
  }

  return path;
}

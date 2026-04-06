const fallbackHost =
  globalThis.window?.location?.hostname === "localhost"
    ? "localhost"
    : "127.0.0.1";

const rawBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  `http://${fallbackHost}:8000/api`;

export const API_BASE_URL = String(rawBaseUrl).replace(/\/$/, "");
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "");

const isAbsoluteUrl = (url) => /^https?:\/\//i.test(String(url || ""));
const isLegacyLocalApiUrl = (url) => /^https?:\/\/(localhost|127\.0\.0\.1):8000\/api(?:\/|$)/i.test(String(url || ""));

export const isApiRequestUrl = (url) => {
  if (!url) return false;
  const value = String(url);
  return value.startsWith("/api") || value.startsWith(API_BASE_URL) || value.startsWith("api/");
};

export const normalizeApiUrl = (url) => {
  if (!url) return url;
  const value = String(url);

  if (isAbsoluteUrl(value)) {
    if (!isLegacyLocalApiUrl(value)) {
      return value;
    }

    try {
      const parsed = new URL(value);
      const suffix = parsed.pathname.replace(/^\/api\/?/, "");
      const path = suffix ? `/${suffix}` : "";
      return `${API_BASE_URL}${path}${parsed.search}${parsed.hash}`;
    } catch {
      return value;
    }
  }

  if (value.startsWith("/api")) return `${API_ORIGIN}${value}`;
  if (value.startsWith("api/")) return `${API_ORIGIN}/${value}`;
  if (value.startsWith("/")) return `${API_BASE_URL}${value}`;

  return `${API_BASE_URL}/${value}`;
};
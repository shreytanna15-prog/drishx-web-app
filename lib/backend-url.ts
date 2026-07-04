export function getBackendUrl(): string {
  const raw = process.env.BACKEND_URL?.trim() ?? "http://127.0.0.1:3000";
  return raw.replace(/\/+$/, "");
}

import { getEnv } from "./env";

export function getBackendUrl(): string {
  return getEnv().BACKEND_URL;
}

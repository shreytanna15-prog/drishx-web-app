/**
 * Clears Next.js `.next/dev` before production build.
 * Kept as a reviewed script so package.json never needs opaque `node -e`.
 */
import { rmSync } from "node:fs";

rmSync(".next/dev", { recursive: true, force: true });

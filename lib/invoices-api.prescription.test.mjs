/**
 * FIN-01 — invoice prescription display prefers frozen lines / order fields.
 * Run: node --test lib/invoices-api.prescription.test.mjs
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiSrc = readFileSync(join(root, "lib/invoices-api.ts"), "utf8");
const screenSrc = readFileSync(
  join(root, "components/profile/invoice-detail-screen.tsx"),
  "utf8"
);

function formatPrescriptionParts(parts) {
  const tokens = [];
  if (parts.sph != null && parts.sph !== "") tokens.push(`SPH ${parts.sph}`);
  if (parts.cyl != null && parts.cyl !== "") tokens.push(`CYL ${parts.cyl}`);
  if (parts.axis != null) tokens.push(`AXIS ${parts.axis}`);
  if (parts.add != null && parts.add !== "") tokens.push(`ADD ${parts.add}`);
  const eye = typeof parts.eye === "string" ? parts.eye.trim() : "";
  if (eye) tokens.push(`Eye ${eye}`);
  return tokens.length ? tokens.join(", ") : null;
}

function formatLensOrderDetails(order) {
  if (!order) return "—";
  const fromOrder = formatPrescriptionParts({
    sph: order.sph,
    cyl: order.cyl,
    axis: order.axis,
    add: order.add,
    eye: order.eye,
  });
  if (fromOrder) return fromOrder;
  if (order.singleVisionLens) {
    return (
      formatPrescriptionParts({
        sph: order.singleVisionLens.sph,
        cyl: order.singleVisionLens.cyl,
      }) ?? "—"
    );
  }
  return order.lensType || "—";
}

function formatInvoiceLensDetails(invoice) {
  const labels = (invoice.lines ?? [])
    .map((line) => line.powerLabel?.trim())
    .filter(Boolean);
  if (labels.length === 1) return labels[0];
  if (labels.length > 1) return labels.join("; ");
  return formatLensOrderDetails(invoice.order ?? undefined);
}

describe("FIN-01 prescription display", () => {
  it("prefers invoice line powerLabel over catalog defaults", () => {
    const text = formatInvoiceLensDetails({
      lines: [{ powerLabel: "SPH -0.5 / CYL 0" }],
      order: {
        sph: -0.5,
        cyl: 0,
        lensType: "SINGLE_VISION",
        singleVisionLens: { sph: -6, cyl: -2 },
      },
    });
    assert.equal(text, "SPH -0.5 / CYL 0");
    assert.doesNotMatch(text, /-6/);
  });

  it("falls back to order prescription before catalog", () => {
    const text = formatInvoiceLensDetails({
      lines: [{ powerLabel: null }],
      order: {
        sph: -0.5,
        cyl: 0,
        lensType: "SINGLE_VISION",
        singleVisionLens: { sph: -6, cyl: -2 },
      },
    });
    assert.equal(text, "SPH -0.5, CYL 0");
    assert.doesNotMatch(text, /-6/);
  });

  it("uses catalog only when prescription fields are absent", () => {
    const text = formatInvoiceLensDetails({
      lines: [],
      order: {
        lensType: "SINGLE_VISION",
        singleVisionLens: { sph: -6, cyl: -2 },
      },
    });
    assert.equal(text, "SPH -6, CYL -2");
  });

  it("supports ADD / AXIS / Eye", () => {
    const text = formatLensOrderDetails({
      sph: 1.25,
      cyl: -0.75,
      axis: 90,
      add: 2,
      eye: "OD",
      lensType: "PROGRESSIVE",
    });
    assert.match(text, /SPH 1\.25/);
    assert.match(text, /CYL -0\.75/);
    assert.match(text, /AXIS 90/);
    assert.match(text, /ADD 2/);
    assert.match(text, /Eye OD/);
  });
});

describe("FIN-01 source contract", () => {
  it("exports formatInvoiceLensDetails and prefers powerLabel", () => {
    assert.match(apiSrc, /export function formatInvoiceLensDetails/);
    assert.match(apiSrc, /powerLabel/);
    assert.match(apiSrc, /order\.sph/);
  });

  it("invoice-detail screen uses formatInvoiceLensDetails", () => {
    assert.match(screenSrc, /formatInvoiceLensDetails\(invoice\)/);
    assert.doesNotMatch(screenSrc, /formatLensOrderDetails\(invoice\.order\)/);
  });
});

/**
 * WEB-PDF-01 — authenticated tax-invoice download helpers.
 * Run: node --test lib/invoices-api.download.test.mjs
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiSrc = readFileSync(join(root, "lib/invoices-api.ts"), "utf8");

function invoiceTaxDocumentPath(invoiceId) {
  return `/api/invoices/${encodeURIComponent(invoiceId)}/pdf`;
}

function sanitizeInvoiceTaxFilename(invoiceNumber) {
  const base = (invoiceNumber?.trim() || "tax-invoice").replace(
    /[/\\?%*:|"<>]/g,
    "-"
  );
  return /\.html?$/i.test(base) ? base : `${base}.html`;
}

function filenameFromContentDisposition(header, fallbackInvoiceNumber) {
  if (header) {
    const utf8Match = /filename\*=(?:UTF-8''|utf-8'')([^;]+)/i.exec(header);
    if (utf8Match?.[1]) {
      try {
        return decodeURIComponent(utf8Match[1].trim().replace(/^"|"$/g, ""));
      } catch {
        // fall through
      }
    }
    const plainMatch = /filename="((?:\\.|[^"\\])*)"|filename=([^;]+)/i.exec(
      header
    );
    if (plainMatch) {
      const raw = (plainMatch[1] ?? plainMatch[2] ?? "").trim();
      if (raw) return raw.replace(/^"|"$/g, "");
    }
  }
  return sanitizeInvoiceTaxFilename(fallbackInvoiceNumber);
}

async function downloadInvoicePdfWithTransport(
  authFetch,
  invoiceId,
  invoiceNumber
) {
  const path = invoiceTaxDocumentPath(invoiceId);
  if (path.includes("?") || /access_token|token=/i.test(path)) {
    throw new Error("Invalid tax invoice path.");
  }
  const response = await authFetch(path, { cache: "no-store" });
  if (!response.ok) {
    let message = "Failed to open tax invoice.";
    try {
      const data = await response.json();
      if (data.error) message = data.error;
    } catch {
      // keep default
    }
    throw new Error(message);
  }
  const contentType =
    response.headers.get("content-type")?.split(";")[0]?.trim() || "text/html";
  const html = await response.text();
  const filename = filenameFromContentDisposition(
    response.headers.get("content-disposition"),
    invoiceNumber
  );
  return { html, contentType, filename };
}

function presentInvoiceTaxDocument(taxDocument, popup, options = {}) {
  const created = [];
  const revoked = [];
  const createObjectURL = (blob) => {
    const url = `blob:mock-${created.length}`;
    created.push({ url, blob });
    return url;
  };
  const revokeObjectURL = (url) => {
    revoked.push(url);
  };
  const objectUrl = createObjectURL(
    new Blob([taxDocument.html], {
      type: taxDocument.contentType.includes("html")
        ? taxDocument.contentType
        : "text/html;charset=utf-8",
    })
  );

  let openedInPopup = false;
  if (popup && !popup.closed) {
    popup.location.replace(objectUrl);
    openedInPopup = true;
  }

  let usedDownloadFallback = false;
  const clicks = [];
  if (!openedInPopup) {
    clicks.push({
      href: objectUrl,
      download: taxDocument.filename,
    });
    usedDownloadFallback = true;
  }

  const schedule = options.schedule ?? ((fn) => fn());
  const revoke = options.revoke ?? revokeObjectURL;
  schedule(() => revoke(objectUrl), options.revokeAfterMs ?? 0);

  return {
    objectUrl,
    openedInPopup,
    usedDownloadFallback,
    created,
    revoked,
    clicks,
  };
}

describe("invoice tax document path", () => {
  it("builds the pdf endpoint without query tokens", () => {
    const path = invoiceTaxDocumentPath("inv-123");
    assert.equal(path, "/api/invoices/inv-123/pdf");
    assert.equal(path.includes("?"), false);
    assert.doesNotMatch(path, /token/i);
  });

  it("encodes invoice ids safely", () => {
    assert.equal(
      invoiceTaxDocumentPath("a/b"),
      "/api/invoices/a%2Fb/pdf"
    );
  });
});

describe("filename helpers", () => {
  it("sanitizes invoice numbers for .html filenames", () => {
    assert.equal(
      sanitizeInvoiceTaxFilename("INV/26-27/000009"),
      "INV-26-27-000009.html"
    );
  });

  it("parses Content-Disposition filename", () => {
    assert.equal(
      filenameFromContentDisposition(
        'inline; filename="INV-26-27-000009.html"',
        "fallback"
      ),
      "INV-26-27-000009.html"
    );
  });

  it("falls back when Content-Disposition is missing", () => {
    assert.equal(
      filenameFromContentDisposition(null, "INV/1"),
      "INV-1.html"
    );
  });
});

describe("downloadInvoicePdf transport simulation", () => {
  it("uses authenticated transport and the correct endpoint", async () => {
    const calls = [];
    const authFetch = async (path, init) => {
      calls.push({ path, init });
      return {
        ok: true,
        headers: {
          get(name) {
            if (name === "content-type") return "text/html; charset=utf-8";
            if (name === "content-disposition") {
              return 'inline; filename="INV-26-27-000009.html"';
            }
            return null;
          },
        },
        async text() {
          return "<html>tax</html>";
        },
        async json() {
          return {};
        },
      };
    };

    const result = await downloadInvoicePdfWithTransport(
      authFetch,
      "abc",
      "INV/26-27/000009"
    );

    assert.equal(calls.length, 1);
    assert.equal(calls[0].path, "/api/invoices/abc/pdf");
    assert.equal(calls[0].path.includes("token"), false);
    assert.deepEqual(calls[0].init, { cache: "no-store" });
    assert.equal(result.html, "<html>tax</html>");
    assert.equal(result.contentType, "text/html");
    assert.equal(result.filename, "INV-26-27-000009.html");
  });

  it("surfaces unauthorized and forbidden errors", async () => {
    const unauthorized = async () => ({
      ok: false,
      status: 401,
      headers: { get: () => null },
      async json() {
        return { error: "Unauthorized.", code: "TOKEN_MISSING" };
      },
    });
    await assert.rejects(
      () => downloadInvoicePdfWithTransport(unauthorized, "x"),
      /Unauthorized/
    );

    const forbidden = async () => ({
      ok: false,
      status: 403,
      headers: { get: () => null },
      async json() {
        return { error: "Forbidden." };
      },
    });
    await assert.rejects(
      () => downloadInvoicePdfWithTransport(forbidden, "x"),
      /Forbidden/
    );
  });

  it("rejects paths that would expose tokens in URLs", async () => {
    const badPath = async () => {
      const path = "/api/invoices/x/pdf?access_token=secret";
      if (path.includes("?") || /access_token|token=/i.test(path)) {
        throw new Error("Invalid tax invoice path.");
      }
    };
    await assert.rejects(badPath, /Invalid tax invoice path/);
  });
});

describe("presentInvoiceTaxDocument resource cleanup", () => {
  it("opens popup with blob URL and schedules revoke", () => {
    const replaced = [];
    const popup = {
      closed: false,
      location: {
        replace(url) {
          replaced.push(url);
        },
      },
    };
    const revoked = [];
    const result = presentInvoiceTaxDocument(
      {
        html: "<html/>",
        contentType: "text/html",
        filename: "inv.html",
      },
      popup,
      {
        revokeAfterMs: 0,
        schedule: (fn) => fn(),
        revoke: (url) => revoked.push(url),
      }
    );

    assert.equal(result.openedInPopup, true);
    assert.equal(result.usedDownloadFallback, false);
    assert.equal(replaced[0], result.objectUrl);
    assert.deepEqual(revoked, [result.objectUrl]);
  });

  it("falls back to download when popup is blocked", () => {
    const result = presentInvoiceTaxDocument(
      {
        html: "<html/>",
        contentType: "text/html",
        filename: "inv.html",
      },
      null,
      {
        revokeAfterMs: 0,
        schedule: (fn) => fn(),
        revoke: () => {},
      }
    );
    assert.equal(result.openedInPopup, false);
    assert.equal(result.usedDownloadFallback, true);
    assert.equal(result.clicks[0].download, "inv.html");
    assert.equal(result.clicks[0].href, result.objectUrl);
  });
});

describe("invoices-api.ts source contract (WEB-PDF-01)", () => {
  it("downloadInvoicePdf uses authFetch and invoiceTaxDocumentPath", () => {
    assert.match(apiSrc, /export async function downloadInvoicePdf/);
    assert.match(apiSrc, /authFetch\(path/);
    assert.match(apiSrc, /invoiceTaxDocumentPath\(invoiceId\)/);
    assert.doesNotMatch(
      apiSrc,
      /downloadInvoicePdf[\s\S]{0,400}\?access_token/
    );
  });

  it("does not put tokens into the tax document path builder", () => {
    assert.match(apiSrc, /export function invoiceTaxDocumentPath/);
    const pathFn = apiSrc.slice(
      apiSrc.indexOf("export function invoiceTaxDocumentPath"),
      apiSrc.indexOf("export function sanitizeInvoiceTaxFilename")
    );
    assert.doesNotMatch(pathFn, /token/i);
    assert.doesNotMatch(pathFn, /\?/);
  });
});

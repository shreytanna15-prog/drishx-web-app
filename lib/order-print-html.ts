import { parseColorHexFromNotesLine } from "@/lib/color-lens-notes";
import { buildOrderProductSections } from "@/lib/order-detail-display";
import {
  formatOrderDateTime,
  type OrderListGroup,
} from "@/lib/order-list-display";
import { formatPairQuantity, pairsFromPieces } from "@/lib/order-quantity";
import { formatOrderStatusLabel } from "@/lib/order-tracking";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatNotesHtml(notes: string): string {
  return notes
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      const trimmed = line.trim();
      const colorHex = parseColorHexFromNotesLine(trimmed);
      if (colorHex) {
        return `<div class="note-line"><span class="color-dot" style="background:${colorHex}"></span>${escapeHtml(trimmed)}</div>`;
      }
      return `<div class="note-line">${escapeHtml(trimmed)}</div>`;
    })
    .join("");
}

export function buildEmployeeOrderPrintHtml(group: OrderListGroup): string {
  const productSections = buildOrderProductSections(group.orders);
  const notes =
    group.orders.find((order) => order.notes?.trim())?.notes?.trim() ?? "";
  const customerEmail =
    group.orders.find((order) => order.user?.email?.trim())?.user?.email?.trim() ??
    "";

  const productBlocks = productSections
    .map((section) => {
      const rows = section.lines
        .map(
          (line) => `
          <tr>
            <td>${escapeHtml(line.sphCylLabel)}</td>
            <td>${escapeHtml(line.addLabel)}</td>
            <td>${escapeHtml(line.axisLabel)}</td>
            <td class="num">${escapeHtml(
              formatPairQuantity(pairsFromPieces(line.ordered))
            )}</td>
            <td class="num picked-empty"></td>
          </tr>`
        )
        .join("");

      return `
        <div class="product-card">
          <div class="product-head">
            <div>
              <div class="product-title">${escapeHtml(section.title)}</div>
              ${
                section.subtitle
                  ? `<div class="product-sub">${escapeHtml(section.subtitle)}</div>`
                  : ""
              }
            </div>
            <div class="product-pairs">${escapeHtml(
              formatPairQuantity(section.totalPairs)
            )} Pair${section.totalPairs === 1 ? "" : "s"}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>SPH / CYL</th>
                <th>ADD</th>
                <th>AXIS</th>
                <th>Ordered</th>
                <th>Picked</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    })
    .join("");

  const photoBlock = group.isPhotoOrder
    ? `<p class="photo-note">Prescription photo order — see attached image in the app.</p>`
    : "";

  const notesBlock = notes
    ? `<div class="notes-card"><div class="section-label">Order notes</div>${formatNotesHtml(notes)}</div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(group.displayOrderId)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #111827;
      margin: 0;
      padding: 24px;
      font-size: 13px;
      line-height: 1.45;
    }
    .header { margin-bottom: 20px; border-bottom: 2px solid #f0a132; padding-bottom: 16px; }
    .order-id { font-size: 24px; font-weight: 800; margin: 0 0 8px; }
    .status {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 8px;
      background: #fef3c7;
      color: #b45309;
      font-weight: 700;
      font-size: 12px;
      margin-bottom: 10px;
    }
    .meta { color: #4b5563; margin: 2px 0; }
    .stats {
      display: flex;
      gap: 0;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
      margin: 18px 0 22px;
    }
    .stat {
      flex: 1;
      text-align: center;
      padding: 14px 8px;
      border-right: 1px solid #e5e7eb;
    }
    .stat:last-child { border-right: none; }
    .stat-value { font-size: 20px; font-weight: 800; }
    .stat-label { color: #6b7280; font-size: 11px; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.4px; }
    .section-label {
      font-size: 12px;
      font-weight: 800;
      color: #f0a132;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 12px;
    }
    .product-card {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 14px;
      margin-bottom: 14px;
      page-break-inside: avoid;
    }
    .product-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
    }
    .product-title { font-size: 16px; font-weight: 800; }
    .product-sub { color: #6b7280; margin-top: 4px; }
    .product-pairs { color: #f0a132; font-weight: 800; white-space: nowrap; }
    table { width: 100%; border-collapse: collapse; }
    th, td {
      border-bottom: 1px solid #e5e7eb;
      padding: 8px 6px;
      text-align: left;
      vertical-align: top;
    }
    th {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #6b7280;
      font-weight: 700;
    }
    td.num { text-align: center; width: 64px; }
    td.picked-empty { min-height: 20px; }
    .notes-card {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 14px;
      margin-top: 8px;
      page-break-inside: avoid;
    }
    .note-line { margin: 4px 0; display: flex; align-items: center; gap: 8px; }
    .color-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 1px solid rgba(0,0,0,0.12);
      flex-shrink: 0;
    }
    .photo-note { color: #6b7280; font-style: italic; }
    .footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
      color: #9ca3af;
      font-size: 11px;
      text-align: center;
    }
    @media print {
      body { padding: 12px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="order-id">${escapeHtml(group.displayOrderId)}</div>
    <div class="status">${escapeHtml(
      group.status.label ||
        formatOrderStatusLabel(group.orders[0]?.status ?? "PENDING")
    )}</div>
    <div class="meta"><strong>${escapeHtml(group.companyName)}</strong></div>
    ${customerEmail ? `<div class="meta">${escapeHtml(customerEmail)}</div>` : ""}
    <div class="meta">${escapeHtml(formatOrderDateTime(group.createdAt))}</div>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-value">${group.productCount}</div>
      <div class="stat-label">Products</div>
    </div>
    <div class="stat">
      <div class="stat-value">${escapeHtml(formatPairQuantity(group.pairCount))}</div>
      <div class="stat-label">Pairs</div>
    </div>
  </div>

  <div class="section-label">Products &amp; power combinations</div>
  ${photoBlock}
  ${productBlocks}

  ${notesBlock}

  <div class="footer">Generated by DrishX · ${escapeHtml(new Date().toLocaleString())}</div>
</body>
</html>`;
}

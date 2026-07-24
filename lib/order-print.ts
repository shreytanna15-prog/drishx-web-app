import type { OrderListGroup } from "@/lib/order-list-display";
import { buildEmployeeOrderPrintHtml } from "@/lib/order-print-html";

function sanitizeFileName(value: string): string {
  return value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").trim() || "order";
}

function writeHtmlToFrame(html: string): {
  frame: HTMLIFrameElement;
  frameWindow: Window;
} {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  frame.style.opacity = "0";
  frame.style.pointerEvents = "none";
  document.body.appendChild(frame);

  const frameWindow = frame.contentWindow;
  const frameDocument = frame.contentDocument ?? frameWindow?.document;
  if (!frameWindow || !frameDocument) {
    frame.remove();
    throw new Error("Could not open print preview.");
  }

  frameDocument.open();
  frameDocument.write(html);
  frameDocument.close();

  return { frame, frameWindow };
}

/** Open the system print dialog for an employee order slip (same as mobile print). */
export async function printEmployeeOrder(group: OrderListGroup): Promise<void> {
  const html = buildEmployeeOrderPrintHtml(group);
  const { frame, frameWindow } = writeHtmlToFrame(html);

  await new Promise<void>((resolve, reject) => {
    window.setTimeout(() => {
      try {
        frameWindow.focus();
        frameWindow.print();
        resolve();
      } catch (error) {
        reject(
          error instanceof Error ? error : new Error("Could not print order.")
        );
      } finally {
        window.setTimeout(() => frame.remove(), 800);
      }
    }, 250);
  });
}

/**
 * Download the order slip.
 * Saves a printable HTML file named like the order id (open it and use
 * Save as PDF from the browser print dialog if you need a PDF).
 */
export async function downloadEmployeeOrderPdf(
  group: OrderListGroup
): Promise<void> {
  const html = buildEmployeeOrderPrintHtml(group);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sanitizeFileName(group.displayOrderId)}-order-details.html`;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

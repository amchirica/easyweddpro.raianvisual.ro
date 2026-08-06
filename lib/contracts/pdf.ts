import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import type { ContractSnapshot } from "@/lib/contracts/content";

export type ContractPdfAcceptance = {
  fullName?: string | null;
  acceptedAt?: string | null;
  documentHash?: string | null;
  kind?: string | null;
};

export type ContractPdfInput = {
  snapshot: ContractSnapshot;
  status: string;
  acceptance?: ContractPdfAcceptance | null;
  logoBytes?: Uint8Array | null;
  /** Optional preloaded fonts (Worker-safe). */
  fonts?: { regular: Uint8Array; bold: Uint8Array } | null;
};

const CHAMPAGNE = rgb(0.776, 0.655, 0.416);
const TEXT = rgb(0.08, 0.08, 0.1);
const MUTED = rgb(0.35, 0.35, 0.4);
const RULE = rgb(0.85, 0.85, 0.88);
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;

/**
 * Load Noto Sans for Romanian diacritics.
 * Prefer explicit bytes; else Node fs; else public URL fetch (Cloudflare-friendly).
 */
export async function loadContractPdfFonts(options?: {
  origin?: string | null;
}): Promise<{ regular: Uint8Array; bold: Uint8Array }> {
  try {
    const { readFile } = await import("fs/promises");
    const path = await import("path");
    const fontsDir = path.join(process.cwd(), "lib", "contracts", "fonts");
    const [regular, bold] = await Promise.all([
      readFile(path.join(fontsDir, "NotoSans-Regular.ttf")),
      readFile(path.join(fontsDir, "NotoSans-Bold.ttf")),
    ]);
    return { regular, bold };
  } catch {
    // fall through
  }

  const origin = options?.origin?.replace(/\/$/, "");
  if (!origin) {
    throw new Error("pdf_fonts_unavailable");
  }

  const [regularRes, boldRes] = await Promise.all([
    fetch(`${origin}/fonts/NotoSans-Regular.ttf`),
    fetch(`${origin}/fonts/NotoSans-Bold.ttf`),
  ]);
  if (!regularRes.ok || !boldRes.ok) {
    throw new Error("pdf_fonts_fetch_failed");
  }
  return {
    regular: new Uint8Array(await regularRes.arrayBuffer()),
    bold: new Uint8Array(await boldRes.arrayBuffer()),
  };
}

async function embedFonts(
  doc: PDFDocument,
  fonts: { regular: Uint8Array; bold: Uint8Array },
): Promise<{ regular: PDFFont; bold: PDFFont }> {
  // fontkit default export is compatible at runtime with pdf-lib's Fontkit type
  doc.registerFontkit(fontkit as Parameters<PDFDocument["registerFontkit"]>[0]);
  const regular = await doc.embedFont(fonts.regular, { subset: true });
  const bold = await doc.embedFont(fonts.bold, { subset: true });
  return { regular, bold };
}

function money(value: number, currency: string): string {
  return `${value.toFixed(2)} ${currency}`;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.replace(/\r\n/g, "\n").split(/(\s+)/);
  const lines: string[] = [];
  let current = "";

  const push = () => {
    if (current.trim()) lines.push(current.trimEnd());
    current = "";
  };

  for (const word of words) {
    if (word === "\n") {
      push();
      continue;
    }
    const next = current + word;
    if (font.widthOfTextAtSize(next, size) > maxWidth && current.trim()) {
      push();
      current = word.trimStart();
    } else {
      current = next;
    }
  }
  push();
  return lines.length ? lines : [""];
}

type DrawCtx = {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  regular: PDFFont;
  bold: PDFFont;
  pages: PDFPage[];
};

function ensureSpace(ctx: DrawCtx, needed: number) {
  if (ctx.y - needed < MARGIN + 40) {
    const page = ctx.doc.addPage([PAGE_W, PAGE_H]);
    ctx.pages.push(page);
    ctx.page = page;
    ctx.y = PAGE_H - MARGIN;
  }
}

function drawText(
  ctx: DrawCtx,
  text: string,
  opts: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; maxWidth?: number } = {},
) {
  const size = opts.size ?? 10;
  const font = opts.bold ? ctx.bold : ctx.regular;
  const color = opts.color ?? TEXT;
  const maxWidth = opts.maxWidth ?? PAGE_W - MARGIN * 2;
  const lines = wrapText(text, font, size, maxWidth);
  for (const line of lines) {
    ensureSpace(ctx, size + 4);
    ctx.page.drawText(line, { x: MARGIN, y: ctx.y, size, font, color });
    ctx.y -= size + 4;
  }
}

function drawRule(ctx: DrawCtx) {
  ensureSpace(ctx, 12);
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: PAGE_W - MARGIN, y: ctx.y },
    thickness: 0.8,
    color: RULE,
  });
  ctx.y -= 14;
}

function drawFooter(page: PDFPage, font: PDFFont, pageIndex: number, total: number, hash: string) {
  const label = `Pagina ${pageIndex + 1} / ${total}  ·  Doc ${hash.slice(0, 12)}`;
  page.drawLine({
    start: { x: MARGIN, y: 36 },
    end: { x: PAGE_W - MARGIN, y: 36 },
    thickness: 0.6,
    color: RULE,
  });
  page.drawText(label, {
    x: MARGIN,
    y: 22,
    size: 8,
    font,
    color: MUTED,
  });
}

/**
 * Pure JS PDF generator (pdf-lib) — no Chromium.
 * Compatible with Node and Cloudflare Workers (nodejs_compat + font bytes/fetch).
 */
export async function generateContractPdf(input: ContractPdfInput): Promise<Uint8Array> {
  const snap = input.snapshot;
  const doc = await PDFDocument.create();
  const fontBytes = input.fonts ?? (await loadContractPdfFonts());
  const { regular, bold } = await embedFonts(doc, fontBytes);
  const first = doc.addPage([PAGE_W, PAGE_H]);
  const ctx: DrawCtx = {
    doc,
    page: first,
    y: PAGE_H - MARGIN,
    regular,
    bold,
    pages: [first],
  };

  if (input.logoBytes?.length) {
    try {
      let logo;
      try {
        logo = await doc.embedPng(input.logoBytes);
      } catch {
        logo = await doc.embedJpg(input.logoBytes);
      }
      const dims = logo.scale(0.35);
      ctx.page.drawImage(logo, {
        x: MARGIN,
        y: ctx.y - dims.height,
        width: dims.width,
        height: dims.height,
      });
      ctx.y -= dims.height + 16;
    } catch {
      // ignore logo failures
    }
  }

  drawText(ctx, snap.provider.name || "Furnizor", { size: 16, bold: true });
  drawText(ctx, "CONTRACT DE PRESTĂRI SERVICII", {
    size: 13,
    bold: true,
    color: CHAMPAGNE,
  });
  ctx.y -= 4;
  drawRule(ctx);

  drawText(ctx, `Număr: ${snap.contract_number ?? "—"}`, { size: 10, bold: true });
  drawText(ctx, `Titlu: ${snap.title}`, { size: 10 });
  drawText(ctx, `Versiune: ${snap.version}  ·  Status: ${input.status}`, { size: 9, color: MUTED });
  if (snap.event_date) {
    drawText(ctx, `Data eveniment: ${snap.event_date}`, { size: 10 });
  }
  if (snap.event_location) {
    drawText(ctx, `Locație: ${snap.event_location}`, { size: 10 });
  }
  ctx.y -= 6;

  drawText(ctx, "Părți", { size: 12, bold: true });
  drawText(ctx, `Furnizor: ${snap.provider.name}`, { size: 10 });
  if (snap.provider.email) drawText(ctx, `Email: ${snap.provider.email}`, { size: 9, color: MUTED });
  if (snap.provider.fiscalCode) {
    drawText(ctx, `CUI/CIF: ${snap.provider.fiscalCode}`, { size: 9, color: MUTED });
  }
  drawText(ctx, `Client: ${snap.client.name}`, { size: 10 });
  if (snap.client.email) drawText(ctx, `Email: ${snap.client.email}`, { size: 9, color: MUTED });
  if (snap.client.phone) drawText(ctx, `Telefon: ${snap.client.phone}`, { size: 9, color: MUTED });
  ctx.y -= 6;

  drawText(ctx, "Servicii", { size: 12, bold: true });
  for (const item of snap.items) {
    const line = `${item.name} — ${item.quantity} × ${money(item.unitPrice, snap.currency)} = ${money(item.lineTotal, snap.currency)}`;
    drawText(ctx, line, { size: 9 });
    if (item.description) drawText(ctx, item.description, { size: 8, color: MUTED });
  }
  ctx.y -= 4;
  drawText(ctx, `Subtotal: ${money(snap.subtotal, snap.currency)}`, { size: 9 });
  if (snap.discount_amount > 0) {
    drawText(ctx, `Discount: -${money(snap.discount_amount, snap.currency)}`, { size: 9 });
  }
  if (snap.tax_amount > 0) {
    drawText(ctx, `Taxe: ${money(snap.tax_amount, snap.currency)}`, { size: 9 });
  }
  drawText(ctx, `Total: ${money(snap.total, snap.currency)}`, { size: 11, bold: true });
  drawText(ctx, `Avans: ${money(snap.deposit_amount, snap.currency)}`, { size: 10 });
  drawText(ctx, `Restant: ${money(snap.remaining_amount, snap.currency)}`, { size: 10 });
  ctx.y -= 8;

  drawText(ctx, "Clauze", { size: 12, bold: true });
  const sectionEntries: Array<[string, string]> = [
    ["Obligațiile furnizorului", snap.sections.provider_obligations],
    ["Obligațiile clientului", snap.sections.client_obligations],
    ["Livrare", snap.sections.delivery],
    ["Anulare", snap.sections.cancellation],
    ["Forță majoră", snap.sections.force_majeure],
    ["Drepturi de autor", snap.sections.copyright],
    ["Protecția datelor", snap.sections.privacy],
    ["Clauze speciale", snap.sections.special_clauses],
  ];
  for (const [label, body] of sectionEntries) {
    if (!body?.trim()) continue;
    drawText(ctx, label, { size: 10, bold: true });
    drawText(ctx, body, { size: 9 });
    ctx.y -= 4;
  }

  if (snap.terms?.trim()) {
    drawText(ctx, "Termeni finali", { size: 12, bold: true });
    drawText(ctx, snap.terms, { size: 9 });
  }

  ctx.y -= 8;
  drawRule(ctx);
  const hash = snap.contract_content_hash ?? "n/a";
  drawText(ctx, `Identificator document: ${hash}`, { size: 8, color: MUTED });

  if (input.acceptance?.acceptedAt || input.status === "accepted") {
    drawText(ctx, "Acceptare digitală", { size: 11, bold: true });
    drawText(ctx, `Nume declarat: ${input.acceptance?.fullName ?? "—"}`, { size: 9 });
    drawText(ctx, `Data acceptării: ${input.acceptance?.acceptedAt ?? "—"}`, { size: 9 });
    drawText(ctx, `Hash acceptat: ${input.acceptance?.documentHash ?? hash}`, {
      size: 8,
      color: MUTED,
    });
    drawText(
      ctx,
      "Acceptarea digitală înregistrează identitatea declarată, data, ora și informațiile tehnice ale sesiunii. Nu reprezintă implicit o semnătură electronică calificată.",
      { size: 8, color: MUTED },
    );
  }

  ctx.pages.forEach((page, index) => {
    drawFooter(page, regular, index, ctx.pages.length, hash);
  });

  return doc.save();
}

/** HTML printable fallback when PDF adapter cannot run. */
export function buildContractPrintHtml(input: ContractPdfInput): string {
  const snap = input.snapshot;
  const escape = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const items = snap.items
    .map(
      (item) =>
        `<tr><td>${escape(item.name)}</td><td>${item.quantity}</td><td>${money(item.unitPrice, snap.currency)}</td><td>${money(item.lineTotal, snap.currency)}</td></tr>`,
    )
    .join("");

  return `<!doctype html><html lang="ro"><head><meta charset="utf-8"/><title>${escape(snap.title)}</title>
<style>
body{font-family:Georgia,serif;color:#141418;background:#fff;margin:32px;line-height:1.5}
h1{font-size:22px;margin:0 0 8px;color:#c6a76a}
table{width:100%;border-collapse:collapse;margin:16px 0}
td,th{border-bottom:1px solid #ddd;padding:8px;text-align:left;font-size:13px}
.muted{color:#666;font-size:12px}
@media print{body{margin:16px}}
</style></head><body>
<h1>${escape(snap.provider.name)}</h1>
<p><strong>${escape(snap.title)}</strong><br/>${escape(snap.contract_number ?? "")} · v${snap.version}</p>
<p>Client: ${escape(snap.client.name)} · Total: ${money(snap.total, snap.currency)}</p>
<table><thead><tr><th>Serviciu</th><th>Cant.</th><th>Preț</th><th>Total</th></tr></thead><tbody>${items}</tbody></table>
<pre style="white-space:pre-wrap;font-family:inherit;font-size:13px">${escape(snap.terms ?? "")}</pre>
<p class="muted">Doc ${escape(snap.contract_content_hash ?? "")}</p>
<p class="muted">Acceptarea digitală nu reprezintă semnătură electronică calificată.</p>
</body></html>`;
}

import { describe, expect, it } from "vitest";

import { DEFAULT_CONTRACT_SECTIONS } from "@/lib/contracts/content";
import { generateContractPdf, loadContractPdfFonts } from "@/lib/contracts/pdf";
import { buildContractSnapshot } from "@/lib/contracts/snapshot";

describe("generateContractPdf", () => {
  it("generates a non-empty PDF buffer with Romanian characters", async () => {
    const fonts = await loadContractPdfFonts();
    const snapshot = buildContractSnapshot({
      content: {
        provider: { name: "Studio Raian Visual", fiscalCode: "RO123" },
        client: { name: "Andreea și Mihai", email: "cuplu@example.com" },
        services: [
          {
            name: "Ședință foto — nuntă",
            description: "Acoperire completă cu diacritice: ăâîșț",
            quantity: 1,
            unitPrice: 8500,
            lineTotal: 8500,
          },
        ],
        sections: {
          ...DEFAULT_CONTRACT_SECTIONS,
          force_majeure: "Forță majoră: pandemie, calamități.",
        },
      },
      money: {
        subtotal: 8500,
        discountAmount: 0,
        taxAmount: 0,
        total: 8500,
        depositAmount: 2550,
        remainingAmount: 5950,
      },
      currency: "RON",
      title: "Contract prestări servicii foto-video",
      terms: "Termeni finali cu ăâîșț.",
      eventDate: "2026-09-12",
      eventLocation: "Brașov",
      contractNumber: "CTR-2026-0042",
      version: 1,
    });

    const bytes = await generateContractPdf({
      snapshot,
      status: "accepted",
      fonts,
      acceptance: {
        fullName: "Andreea Popescu",
        acceptedAt: "2026-08-05T12:00:00.000Z",
        documentHash: snapshot.contract_content_hash,
        kind: "digital_acceptance",
      },
    });

    expect(bytes.byteLength).toBeGreaterThan(1000);
    const header = Buffer.from(bytes.slice(0, 5)).toString("utf8");
    expect(header).toBe("%PDF-");
  }, 30000);
});

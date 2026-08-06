import { NextResponse, type NextRequest } from "next/server";

import { generateContractPdf, loadContractPdfFonts } from "@/lib/contracts/pdf";
import type { ContractSnapshot } from "@/lib/contracts/content";
import { fetchPublicContract } from "@/lib/data/contracts";
import { getEffectiveContractStatus } from "@/lib/contracts/status";
import { createClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { token } = await params;
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json({ error: "Serviciul nu este disponibil." }, { status: 503 });
  }

  let payload;
  try {
    payload = await fetchPublicContract(supabase, token);
  } catch {
    return NextResponse.json({ error: "Contract invalid." }, { status: 404 });
  }

  if (!payload?.snapshot || typeof payload.snapshot !== "object") {
    return NextResponse.json({ error: "Snapshot indisponibil." }, { status: 400 });
  }

  const snapshot = payload.snapshot as ContractSnapshot;
  const effectiveStatus = getEffectiveContractStatus({
    status: payload.status,
    validUntil: payload.valid_until,
    acceptedAt: payload.accepted_at,
  });

  let fonts;
  try {
    fonts = await loadContractPdfFonts({ origin: request.nextUrl.origin });
  } catch {
    return NextResponse.json({ error: "Fonturile PDF nu sunt disponibile." }, { status: 500 });
  }

  const acceptance = payload.acceptance;

  try {
    const pdfBytes = await generateContractPdf({
      snapshot,
      status: effectiveStatus,
      acceptance: acceptance
        ? {
            fullName: acceptance.full_name,
            acceptedAt: acceptance.accepted_at,
            documentHash: acceptance.document_hash ?? payload.contract_content_hash,
          }
        : payload.accepted_at
          ? {
              acceptedAt: payload.accepted_at,
              documentHash: payload.contract_content_hash,
            }
          : null,
      fonts,
    });

    const filename = snapshot.contract_number ?? "contract";
    const body = Uint8Array.from(pdfBytes);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="contract-${filename}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Nu am putut genera PDF-ul." }, { status: 500 });
  }
}

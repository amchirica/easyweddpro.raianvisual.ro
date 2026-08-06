import { NextResponse, type NextRequest } from "next/server";

import { logActivity } from "@/lib/activity/log";
import { generateContractPdf, loadContractPdfFonts } from "@/lib/contracts/pdf";
import { getContractById, snapshotFromRow } from "@/lib/data/contracts";
import { getEffectiveContractStatus } from "@/lib/contracts/status";
import { requireWorkspace } from "@/lib/workspace/session";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const ctx = await requireWorkspace();
    const contract = await getContractById(ctx.supabase, ctx.activeWorkspace.id, id);

    if (!contract) {
      return NextResponse.json({ error: "Contractul nu a fost găsit." }, { status: 404 });
    }

    const snapshot = snapshotFromRow(contract);
    if (!snapshot) {
      return NextResponse.json(
        { error: "Contractul nu are snapshot — publică-l mai întâi." },
        { status: 400 },
      );
    }

    const acceptance =
      contract.acceptance && typeof contract.acceptance === "object"
        ? (contract.acceptance as {
            full_name?: string;
            accepted_at?: string;
            document_hash?: string;
          })
        : null;

    let fonts;
    try {
      fonts = await loadContractPdfFonts({ origin: request.nextUrl.origin });
    } catch {
      return NextResponse.json({ error: "Fonturile PDF nu sunt disponibile." }, { status: 500 });
    }

    const effectiveStatus = getEffectiveContractStatus({
      status: contract.status,
      validUntil: contract.valid_until,
      publicTokenExpiresAt: contract.public_token_expires_at,
      acceptedAt: contract.accepted_at,
    });

    const pdfBytes = await generateContractPdf({
      snapshot,
      status: effectiveStatus,
      acceptance: acceptance
        ? {
            fullName: acceptance.full_name ?? contract.signer_name,
            acceptedAt: acceptance.accepted_at ?? contract.accepted_at,
            documentHash: acceptance.document_hash ?? contract.contract_content_hash,
          }
        : contract.accepted_at
          ? {
              fullName: contract.signer_name,
              acceptedAt: contract.accepted_at,
              documentHash: contract.contract_content_hash,
            }
          : null,
      fonts,
    });

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "contract",
      entityId: contract.id,
      action: "contract.pdf_generated",
      title: "PDF contract generat",
    });

    const filename = snapshot.contract_number ?? contract.id;
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

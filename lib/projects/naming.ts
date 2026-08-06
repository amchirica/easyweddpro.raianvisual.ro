/**
 * Pure naming helper used by createProjectFromContractAction.
 * Kept outside "use server" modules so it can be unit-tested and safely imported.
 */
export function deriveProjectNameFromContract(input: {
  contractTitle?: string | null;
  clientName?: string | null;
}): string {
  const clientName = input.clientName?.trim();
  if (clientName) return `Proiect – ${clientName}`;
  const title = input.contractTitle?.trim();
  return title || "Proiect nou";
}

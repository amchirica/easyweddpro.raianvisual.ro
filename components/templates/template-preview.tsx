"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import { Separator } from "@/components/ui/separator";
import { CONTRACT_TEMPLATE_VARIABLES, resolveTemplateVariables } from "@/lib/contracts/templates";

const SAMPLE_VALUES: Record<string, string> = {
  client_name: "Maria Popescu",
  client_email: "maria@example.com",
  client_phone: "+40 712 345 678",
  company_name: "Studio Foto Exemplu",
  company_email: "contact@studio.ro",
  company_phone: "+40 722 111 222",
  event_date: "12 septembrie 2026",
  event_location: "Sala Regală, București",
  contract_number: "CTR-2026-014",
  proposal_number: "OF-2026-014",
  total: "12.000",
  deposit: "3.000",
  remaining: "9.000",
  currency: "RON",
};

type TemplatePreviewProps = {
  subject?: string;
  body: string;
  description?: string;
  checklist: string[];
  stages: string[];
};

/**
 * Preview renders only allowlisted `{{variable}}` tokens as plain text — never HTML,
 * never evaluated as an expression. Anything outside the allowlist stays literal.
 */
export function TemplatePreview({ subject, body, description, checklist, stages }: TemplatePreviewProps) {
  const { t } = useI18n();
  const resolvedSubject = subject?.trim() ? resolveTemplateVariables(subject, SAMPLE_VALUES) : null;
  const resolvedBody = resolveTemplateVariables(body || "", SAMPLE_VALUES);
  const unresolved = [...new Set([...(resolvedSubject?.unresolved ?? []), ...resolvedBody.unresolved])];

  return (
    <div className="surface-card sticky top-6 space-y-4 p-5">
      <div>
        <h3 className="font-heading text-base font-medium text-foreground">{t("common.preview")}</h3>
        <p className="text-xs text-muted-foreground">
          {t("modules.templates.previewNote")}
        </p>
      </div>
      <Separator />

      {description?.trim() ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}

      {resolvedSubject ? (
        <p className="text-sm font-medium text-foreground">Subiect: {resolvedSubject.text}</p>
      ) : null}

      {checklist.length ? (
        <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
          {checklist.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : null}

      {stages.length ? (
        <ol className="list-decimal space-y-1 pl-4 text-sm text-muted-foreground">
          {stages.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ol>
      ) : null}

      {body?.trim() ? (
        <p className="whitespace-pre-wrap rounded-lg border border-border bg-surface-elevated p-3 text-sm text-foreground">
          {resolvedBody.text}
        </p>
      ) : null}

      {unresolved.length ? (
        <p className="text-xs text-warning">
          {t("modules.templates.unresolvedVars", { vars: unresolved.map((v) => `{{${v}}}`).join(", ") })}
        </p>
      ) : null}

      <div className="space-y-1.5 pt-2">
        <p className="text-xs text-muted-soft">Variabile disponibile</p>
        <div className="flex flex-wrap gap-1.5">
          {CONTRACT_TEMPLATE_VARIABLES.map((variable) => (
            <code
              key={variable}
              className="rounded bg-muted/40 px-1.5 py-0.5 text-[11px] text-muted-foreground"
            >
              {`{{${variable}}}`}
            </code>
          ))}
        </div>
      </div>
    </div>
  );
}

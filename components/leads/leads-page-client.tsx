"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { UserPlus } from "lucide-react";

import { useI18n } from "@/components/providers/i18n-provider";
import { DemoBanner } from "@/components/shared/demo-banner";
import { ModuleShell } from "@/components/shared/module-shell";
import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import { LeadFormDialog } from "@/components/leads/lead-form-dialog";
import { LeadsBoard } from "@/components/leads/leads-board";
import type { LeadViewModel } from "@/lib/crm/mappers";

type LeadsPageClientProps = {
  initialLeads: LeadViewModel[];
  mode: "live" | "demo";
  currency?: string;
  error?: string | null;
};

export function LeadsPageClient({
  initialLeads,
  mode,
  currency = "RON",
  error,
}: LeadsPageClientProps) {
  const { t } = useI18n();
  const [createOpen, setCreateOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  function handleCreateClick() {
    if (mode !== "live") {
      toast("Creează-ți un cont pentru a adăuga leaduri reale.", "info");
      return;
    }
    setCreateOpen(true);
  }

  return (
    <ModuleShell
      title={t("modules.leads.title")}
      description={t("modules.leads.description")}
      actions={
        <Button type="button" onClick={handleCreateClick}>
          <UserPlus data-icon="inline-start" />
          {t("modules.leads.new")}
        </Button>
      }
    >
      <div className="space-y-5">
        {mode === "demo" ? <DemoBanner /> : null}
        <LeadsBoard initialLeads={initialLeads} mode={mode} currency={currency} error={error} />
      </div>

      <LeadFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        currency={currency}
        onSuccess={() => router.refresh()}
      />
    </ModuleShell>
  );
}

"use client";

import { useI18n } from "@/components/providers/i18n-provider";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Copy, Mail, Pencil, Plus, Trash2, Zap } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ModuleShell } from "@/components/shared/module-shell";
import { StatusBadge } from "@/components/shared/status-badge";
import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import {
  deleteAutomationAction,
  duplicateAutomationAction,
  toggleAutomationAction,
} from "@/lib/actions/automations";
import { AUTOMATION_TRIGGER_LABELS, type AutomationTriggerKey } from "@/lib/automations/catalog";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export type AutomationListItem = {
  id: string;
  name: string;
  description: string | null;
  triggerKey: string;
  channel: string;
  enabled: boolean;
  lastRunAt: string | null;
  successCount: number;
  failedCount: number;
};

function AutomationToggle({
  enabled,
  onToggle,
  label,
  disabled,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors disabled:opacity-60",
        enabled ? "border-champagne/40 bg-champagne/80" : "border-border bg-white/5",
      )}
    >
      <span
        className={cn(
          "inline-block h-4.5 w-4.5 translate-x-0.5 rounded-full bg-background transition-transform",
          enabled && "translate-x-[22px] bg-primary-foreground",
        )}
      />
    </button>
  );
}

export function AutomationsListClient({ initialAutomations }: { initialAutomations: AutomationListItem[] }) {
  const { t } = useI18n();
  const [automations, setAutomations] = useState(initialAutomations);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  async function handleToggle(id: string, next: boolean) {
    setPendingId(id);
    setAutomations((current) =>
      current.map((item) => (item.id === id ? { ...item, enabled: next } : item)),
    );
    const result = await toggleAutomationAction(id, next);
    setPendingId(null);
    if (result?.error) {
      toast(result.error, "error");
      setAutomations((current) =>
        current.map((item) => (item.id === id ? { ...item, enabled: !next } : item)),
      );
      return;
    }
    toast(result.success ?? "Actualizat.", "success");
  }

  async function handleDuplicate(id: string) {
    setPendingId(id);
    const result = await duplicateAutomationAction(id);
    setPendingId(null);
    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    toast(result.success ?? t("modules.automations.duplicated"), "success");
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t("modules.automations.deleteConfirm"))) return;
    setPendingId(id);
    const result = await deleteAutomationAction(id);
    setPendingId(null);
    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    setAutomations((current) => current.filter((item) => item.id !== id));
    toast(result.success ?? t("modules.automations.deleted"), "success");
  }

  return (
    <ModuleShell
      title={t("modules.automations.title")}
      description={t("modules.automations.description")}
      actions={
        <Button type="button" render={<Link href="/dashboard/automations/new" />} nativeButton={false}>
          <Plus data-icon="inline-start" />
          {t("modules.automations.new")}
        </Button>
      }
    >
      {automations.length === 0 ? (
        <EmptyState
          icon={Zap}
          title={t("modules.automations.empty")}
          description={t("modules.automations.emptyHint")}
          action={
            <Button type="button" render={<Link href="/dashboard/automations/new" />} nativeButton={false}>
              <Plus data-icon="inline-start" />
              {t("modules.automations.new")}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {automations.map((automation) => (
            <div key={automation.id} className="surface-card space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-background/40 text-champagne">
                    <Zap className="h-4 w-4" aria-hidden />
                  </div>
                  <div>
                    <Link
                      href={`/dashboard/automations/${automation.id}`}
                      className="font-medium text-foreground hover:text-champagne"
                    >
                      {automation.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {t("modules.automations.trigger")}:{" "}
                      {AUTOMATION_TRIGGER_LABELS[automation.triggerKey as AutomationTriggerKey] ??
                        automation.triggerKey}
                    </p>
                  </div>
                </div>
                <AutomationToggle
                  enabled={automation.enabled}
                  onToggle={() => handleToggle(automation.id, !automation.enabled)}
                  label={t("modules.automations.toggleAria", { name: automation.name })}
                  disabled={pendingId === automation.id}
                />
              </div>

              {automation.description ? (
                <p className="text-sm text-muted-foreground">{automation.description}</p>
              ) : null}

              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" aria-hidden />
                  {automation.channel === "email" ? t("modules.automations.channelEmail") : t("modules.automations.channelInternal")}
                </span>
                <StatusBadge
                  label={automation.enabled ? t("modules.automations.enabled") : t("modules.automations.disabled")}
                  tone={automation.enabled ? "success" : "neutral"}
                />
              </div>

              <p className="text-xs text-muted-soft">
                {automation.lastRunAt
                  ? `Ultima rulare: ${formatDate(automation.lastRunAt)}`
                  : t("modules.automations.neverRanShort")}
                {automation.successCount || automation.failedCount
                  ? t("modules.automations.runStats", { success: automation.successCount, failed: automation.failedCount })
                  : ""}
              </p>

              <div className="flex items-center gap-2 border-t border-border pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  render={<Link href={`/dashboard/automations/${automation.id}`} />}
                  nativeButton={false}
                >
                  <Pencil data-icon="inline-start" />
                  {t("common.edit")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDuplicate(automation.id)}
                  disabled={pendingId === automation.id}
                >
                  <Copy data-icon="inline-start" />
                  {t("common.duplicate")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(automation.id)}
                  disabled={pendingId === automation.id}
                >
                  <Trash2 data-icon="inline-start" />
                  {t("common.delete")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </ModuleShell>
  );
}

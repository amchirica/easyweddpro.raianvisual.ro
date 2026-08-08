"use client";

import { useI18n } from "@/components/providers/i18n-provider";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateFeedbackStatusAction } from "@/lib/actions/platform-admin";

const STATUS_OPTIONS = [
  { value: "new", label: "Nou" },
  { value: "triaged", label: "Triage" },
  { value: "resolved", label: "Rezolvat" },
  { value: "dismissed", label: "Respins" },
] as const;

const PRIORITY_OPTIONS = [
  { value: "low", labelKey: "status.priority.low" },
  { value: "normal", labelKey: "status.priority.normal" },
  { value: "high", labelKey: "status.priority.high" },
  { value: "urgent", labelKey: "status.priority.urgent" },
] as const;

export function FeedbackActions({
  feedbackId,
  currentStatus,
  currentPriority,
}: {
  feedbackId: string;
  currentStatus: string;
  currentPriority: string | null;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState(currentStatus);
  const [priority, setPriority] = useState(currentPriority ?? "normal");
  const [notes, setNotes] = useState("");

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="space-y-1">
        <Label htmlFor={`fb-status-${feedbackId}`}>Status</Label>
        <select
          id={`fb-status-${feedbackId}`}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="flex h-8 rounded-lg border border-border bg-background px-2 text-xs"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor={`fb-prio-${feedbackId}`}>Prioritate</Label>
        <select
          id={`fb-prio-${feedbackId}`}
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="flex h-8 rounded-lg border border-border bg-background px-2 text-xs"
        >
          {PRIORITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.labelKey)}
            </option>
          ))}
        </select>
      </div>
      <AdminConfirmDialog
        trigger={
          <Button type="button" size="xs" variant="outline">
            {t("common.update")}
          </Button>
        }
        title={t("admin.updateFeedback")}
        description={t("admin.updateFeedbackDesc")}
        confirmLabel={t("common.save")}
        requireReason={false}
        onConfirm={async () => {
          const result = await updateFeedbackStatusAction({
            feedbackId,
            status,
            priority,
            notes: notes.trim() || undefined,
          });
          if (result?.error) throw new Error(result.error);
          toast(result?.success ?? "Feedback actualizat.", "success");
          router.refresh();
        }}
      />
      <div className="w-full space-y-1">
        <Label htmlFor={`fb-notes-${feedbackId}`}>{t("admin.adminNotesOptional")}</Label>
        <Textarea
          id={`fb-notes-${feedbackId}`}
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Note interne…"
        />
      </div>
    </div>
  );
}

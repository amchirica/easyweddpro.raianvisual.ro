"use client";

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
  { value: "low", label: "Scăzută" },
  { value: "normal", label: "Normală" },
  { value: "high", label: "Ridicată" },
  { value: "urgent", label: "Urgentă" },
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
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <AdminConfirmDialog
        trigger={
          <Button type="button" size="xs" variant="outline">
            Actualizează
          </Button>
        }
        title="Actualizează feedback"
        description="Statusul și prioritatea vor fi salvate în jurnalul de audit."
        confirmLabel="Salvează"
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
        <Label htmlFor={`fb-notes-${feedbackId}`}>Note admin (opțional)</Label>
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

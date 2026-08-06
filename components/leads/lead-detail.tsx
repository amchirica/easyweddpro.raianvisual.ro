"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Activity as ActivityIcon,
  ArrowLeft,
  Calendar,
  FileText,
  MapPin,
  Pencil,
  Tag,
  Trash2,
  UserCheck,
  Wallet,
} from "lucide-react";

import { useToast } from "@/components/shared/toast-provider";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addLeadNoteAction, deleteLeadAction, updateLeadStatusAction } from "@/lib/actions/leads";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/constants";
import type { ActivityViewModel, LeadViewModel } from "@/lib/crm/mappers";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";

import { ConvertLeadDialog } from "@/components/leads/convert-lead-dialog";
import { LeadFormDialog } from "@/components/leads/lead-form-dialog";

const LEAD_STATUS_TONE: Record<LeadStatus, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  new: "accent",
  contacted: "neutral",
  qualified: "accent",
  proposal_sent: "warning",
  negotiation: "warning",
  won: "success",
  lost: "danger",
};

type LeadDetailProps = {
  lead: LeadViewModel;
  activity: ActivityViewModel[];
  mode: "live" | "demo";
  currency?: string;
};

export function LeadDetail({ lead, activity, mode, currency = "RON" }: LeadDetailProps) {
  const [currentLead, setCurrentLead] = useState(lead);
  const [activityItems] = useState(activity);
  const [editOpen, setEditOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [pendingLostStatus, setPendingLostStatus] = useState(false);
  const [lostReasonDraft, setLostReasonDraft] = useState("");
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const leadCurrency = currentLead.currency || currency;

  async function applyStatusChange(status: LeadStatus, lostReason?: string) {
    const previous = currentLead;
    setCurrentLead((current) => ({ ...current, status, lostReason: lostReason ?? current.lostReason }));
    setStatusSaving(true);

    if (mode === "live") {
      const result = await updateLeadStatusAction(currentLead.id, { status, lostReason });
      if (result?.error) {
        setCurrentLead(previous);
        toast(result.error, "error");
        setStatusSaving(false);
        return;
      }
      toast(result?.success ?? "Status actualizat.", "success");
      router.refresh();
    } else {
      toast("Status actualizat (mod demo).", "success");
    }

    setStatusSaving(false);
    setPendingLostStatus(false);
    setLostReasonDraft("");
  }

  function handleStatusSelect(value: LeadStatus) {
    if (statusSaving) return;
    if (value === "lost") {
      setPendingLostStatus(true);
      setLostReasonDraft(currentLead.lostReason ?? "");
      return;
    }
    void applyStatusChange(value);
  }

  async function handleAddNote() {
    if (!noteText.trim() || savingNote) return;
    setSavingNote(true);

    if (mode === "live") {
      const result = await addLeadNoteAction(currentLead.id, { note: noteText });
      if (result?.error) {
        toast(result.error, "error");
        setSavingNote(false);
        return;
      }
      toast(result?.success ?? "Notă adăugată.", "success");
      const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
      setCurrentLead((current) => ({
        ...current,
        notes: [current.notes, `[${stamp}] ${noteText}`].filter(Boolean).join("\n\n"),
      }));
      router.refresh();
    } else {
      const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
      setCurrentLead((current) => ({
        ...current,
        notes: [current.notes, `[${stamp}] ${noteText}`].filter(Boolean).join("\n\n"),
      }));
      toast("Notă adăugată (mod demo).", "success");
    }

    setNoteText("");
    setSavingNote(false);
  }

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);

    if (mode === "live") {
      const result = await deleteLeadAction(currentLead.id);
      if (result?.error) {
        toast(result.error, "error");
        setDeleting(false);
        return;
      }
      toast(result?.success ?? "Lead șters.", "success");
    } else {
      toast("Lead șters (mod demo).", "success");
    }

    router.push("/dashboard/leads");
  }

  function handleEditClick() {
    if (mode !== "live") {
      toast("Editarea leadurilor necesită un cont conectat.", "info");
      return;
    }
    setEditOpen(true);
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/leads"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Înapoi la leaduri
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-medium text-foreground">{currentLead.name}</h1>
            <StatusBadge
              label={LEAD_STATUS_LABELS[currentLead.status]}
              tone={LEAD_STATUS_TONE[currentLead.status]}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {currentLead.eventType || "Eveniment nespecificat"}
            {currentLead.city ? ` · ${currentLead.city}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentLead.clientId ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              render={<Link href={`/dashboard/clients/${currentLead.clientId}`} />} nativeButton={false}
            >
              <UserCheck data-icon="inline-start" />
              Vezi client
            </Button>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={() => setConvertOpen(true)}>
              <UserCheck data-icon="inline-start" />
              Convertește
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            render={<Link href={`/dashboard/proposals/new?leadId=${currentLead.id}`} />} nativeButton={false}
          >
            <FileText data-icon="inline-start" />
            Creează ofertă
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleEditClick}>
            <Pencil data-icon="inline-start" />
            Editează
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 data-icon="inline-start" />
            Șterge
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface-card space-y-3 p-5">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Contact
          </p>
          <p className="text-sm text-foreground">{currentLead.email || "—"}</p>
          <p className="text-sm text-foreground">{currentLead.phone || "—"}</p>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-champagne" aria-hidden />
            {currentLead.city || "—"} {currentLead.venue ? `· ${currentLead.venue}` : ""}
          </p>
        </div>

        <div className="surface-card space-y-3 p-5">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Eveniment
          </p>
          <p className="flex items-center gap-2 text-sm text-foreground">
            <Calendar className="h-3.5 w-3.5 text-champagne" aria-hidden />
            {currentLead.eventDate ? formatDate(currentLead.eventDate) : "Dată nespecificată"}
          </p>
          <p className="text-sm text-muted-foreground">
            Follow-up: {currentLead.followUpDate ? formatDate(currentLead.followUpDate) : "—"}
          </p>
          {currentLead.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {currentLead.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground"
                >
                  <Tag className="h-2.5 w-2.5" aria-hidden />
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="surface-card space-y-3 p-5">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Valoare
          </p>
          <p className="flex items-center gap-2 font-heading text-2xl font-medium text-champagne">
            <Wallet className="h-4 w-4" aria-hidden />
            {formatCurrency(currentLead.estimatedValue, leadCurrency)}
          </p>
          <p className="text-xs text-muted-soft">
            Buget: {formatCurrency(currentLead.budget, leadCurrency)}
          </p>
          <p className="text-xs text-muted-soft">Sursă: {currentLead.source || "—"}</p>
        </div>
      </div>

      <div className="surface-card space-y-4 p-5">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Status
        </p>
        <Select
          value={currentLead.status}
          onValueChange={(value) => handleStatusSelect((value as LeadStatus) ?? currentLead.status)}
        >
          <SelectTrigger className="h-9 w-full sm:w-64" disabled={statusSaving}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LEAD_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {LEAD_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {pendingLostStatus ? (
          <div className="space-y-2 rounded-lg border border-border bg-background/40 p-3">
            <p className="text-sm text-foreground">Motivul pierderii leadului</p>
            <Textarea
              value={lostReasonDraft}
              onChange={(event) => setLostReasonDraft(event.target.value)}
              rows={2}
              placeholder="Ex: buget, a ales alt furnizor…"
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => applyStatusChange("lost", lostReasonDraft)}
                disabled={statusSaving}
              >
                Confirmă pierdut
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setPendingLostStatus(false);
                  setLostReasonDraft("");
                }}
                disabled={statusSaving}
              >
                Anulează
              </Button>
            </div>
          </div>
        ) : currentLead.status === "lost" && currentLead.lostReason ? (
          <p className="text-sm text-muted-foreground">Motiv: {currentLead.lostReason}</p>
        ) : null}
      </div>

      <div className="surface-card space-y-4 p-5">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Notițe
        </p>
        {currentLead.notes ? (
          <pre className="whitespace-pre-wrap rounded-lg border border-border bg-background/40 p-3 font-sans text-sm text-foreground">
            {currentLead.notes}
          </pre>
        ) : (
          <p className="text-sm text-muted-soft">Nicio notă încă.</p>
        )}
        <div className="space-y-2">
          <Textarea
            value={noteText}
            onChange={(event) => setNoteText(event.target.value)}
            rows={3}
            placeholder="Adaugă o notă…"
          />
          <Button type="button" size="sm" onClick={handleAddNote} disabled={savingNote || !noteText.trim()}>
            {savingNote ? "Se salvează…" : "Adaugă notă"}
          </Button>
        </div>
      </div>

      <div className="surface-card space-y-4 p-5">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Activitate
        </p>
        {activityItems.length === 0 ? (
          <EmptyState icon={ActivityIcon} title="Fără activitate" />
        ) : (
          <ul className="divide-y divide-border">
            {activityItems.map((item) => (
              <li key={item.id} className="flex items-start gap-3 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background/40 text-champagne">
                  <ActivityIcon className="h-3.5 w-3.5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{item.title}</p>
                  {item.description ? (
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  ) : null}
                  <p className="mt-0.5 text-xs text-muted-soft">{formatDateTime(item.at)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <LeadFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        initial={currentLead}
        currency={leadCurrency}
        onSuccess={() => router.refresh()}
      />

      <ConvertLeadDialog
        open={convertOpen}
        onOpenChange={setConvertOpen}
        lead={currentLead}
        mode={mode}
      />

      <Dialog open={deleteOpen} onOpenChange={(next) => !deleting && setDeleteOpen(next)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ștergi acest lead?</DialogTitle>
            <DialogDescription>
              Această acțiune nu poate fi anulată. {currentLead.name} va fi eliminat din pipeline.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Anulează
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Se șterge…" : "Șterge lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

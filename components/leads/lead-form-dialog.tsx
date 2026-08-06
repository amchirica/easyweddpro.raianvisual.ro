"use client";

import { useEffect, useState, type FormEvent } from "react";

import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createLeadAction, updateLeadAction } from "@/lib/actions/leads";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/constants";
import type { LeadViewModel } from "@/lib/crm/mappers";
import { EVENT_TYPES } from "@/lib/events/event-types";
import { leadFormSchema } from "@/lib/validations/crm";

type LeadFormState = {
  name: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate: string;
  city: string;
  venue: string;
  budget: string;
  currency: string;
  source: string;
  services: string;
  guestCount: string;
  duration: string;
  notes: string;
  estimatedValue: string;
  followUpDate: string;
  status: LeadStatus;
  tags: string;
  lostReason: string;
};

function emptyForm(currency: string): LeadFormState {
  return {
    name: "",
    email: "",
    phone: "",
    eventType: "",
    eventDate: "",
    city: "",
    venue: "",
    budget: "",
    currency,
    source: "",
    services: "",
    guestCount: "",
    duration: "",
    notes: "",
    estimatedValue: "",
    followUpDate: "",
    status: "new",
    tags: "",
    lostReason: "",
  };
}

function extractMeta(notes: string): { guestCount: string; duration: string; notes: string } {
  const guestMatch = notes.match(/^Invitați:\s*(.+)$/m);
  const durationMatch = notes.match(/^Durată:\s*(.+)$/m);
  const cleaned = notes
    .replace(/^Invitați:\s*.+$/m, "")
    .replace(/^Durată:\s*.+$/m, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return {
    guestCount: guestMatch?.[1]?.trim() ?? "",
    duration: durationMatch?.[1]?.trim() ?? "",
    notes: cleaned,
  };
}

function composeNotes(form: LeadFormState): string {
  const parts: string[] = [];
  if (form.guestCount.trim()) parts.push(`Invitați: ${form.guestCount.trim()}`);
  if (form.duration.trim()) parts.push(`Durată: ${form.duration.trim()}`);
  if (form.notes.trim()) parts.push(form.notes.trim());
  return parts.join("\n");
}

function formFromLead(lead: LeadViewModel): LeadFormState {
  const meta = extractMeta(lead.notes);
  return {
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    eventType: lead.eventType,
    eventDate: lead.eventDate,
    city: lead.city,
    venue: lead.venue,
    budget: lead.budget ? String(lead.budget) : "",
    currency: lead.currency || "RON",
    source: lead.source,
    services: lead.services.join(", "),
    guestCount: meta.guestCount,
    duration: meta.duration,
    notes: meta.notes,
    estimatedValue: lead.estimatedValue ? String(lead.estimatedValue) : "",
    followUpDate: lead.followUpDate ?? "",
    status: lead.status,
    tags: lead.tags.join(", "),
    lostReason: lead.lostReason ?? "",
  };
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

type LeadFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initial?: LeadViewModel;
  currency?: string;
  onSuccess?: () => void;
};

export function LeadFormDialog({
  open,
  onOpenChange,
  mode,
  initial,
  currency = "RON",
  onSuccess,
}: LeadFormDialogProps) {
  const [form, setForm] = useState<LeadFormState>(() =>
    initial ? formFromLead(initial) : emptyForm(currency),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional open-only reset
    setForm(initial ? formFromLead(initial) : emptyForm(currency));
    setFieldErrors({});
    setFormError(null);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps -- intentional open-only reset

  function updateField<K extends keyof LeadFormState>(key: K, value: LeadFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      eventType: form.eventType,
      eventDate: form.eventDate,
      city: form.city,
      venue: form.venue,
      budget: form.budget.trim() === "" ? null : Number(form.budget),
      currency: form.currency || "RON",
      source: form.source,
      services: splitList(form.services),
      notes: composeNotes(form),
      estimatedValue: form.estimatedValue.trim() === "" ? null : Number(form.estimatedValue),
      followUpDate: form.followUpDate,
      status: form.status,
      tags: splitList(form.tags),
      lostReason: form.lostReason,
    };

    const parsed = leadFormSchema.safeParse(payload);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      setFormError("Verifică datele completate.");
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setSubmitting(true);

    const result =
      mode === "create"
        ? await createLeadAction(parsed.data)
        : await updateLeadAction(initial?.id ?? "", parsed.data);

    setSubmitting(false);

    if (result?.error) {
      setFormError(result.error);
      return;
    }

    toast(result?.success ?? (mode === "create" ? "Lead creat." : "Lead actualizat."), "success");
    onOpenChange(false);
    onSuccess?.();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Lead nou" : "Editează lead"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Adaugă un lead nou în pipeline."
              : "Actualizează detaliile acestui lead."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lead-name">Nume</Label>
            <Input
              id="lead-name"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Nume client / contact"
              aria-invalid={Boolean(fieldErrors.name)}
            />
            {fieldErrors.name ? <p className="text-xs text-destructive">{fieldErrors.name}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lead-email">Email</Label>
              <Input
                id="lead-email"
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                aria-invalid={Boolean(fieldErrors.email)}
              />
              {fieldErrors.email ? (
                <p className="text-xs text-destructive">{fieldErrors.email}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-phone">Telefon</Label>
              <Input
                id="lead-phone"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lead-eventType">Tip eveniment</Label>
              <Select
                value={form.eventType || undefined}
                onValueChange={(value) => updateField("eventType", value ?? "")}
              >
                <SelectTrigger id="lead-eventType" className="h-8 w-full">
                  <SelectValue placeholder="Selectează tipul" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((eventType) => (
                    <SelectItem key={eventType.code} value={eventType.label}>
                      {eventType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-eventDate">Data evenimentului</Label>
              <Input
                id="lead-eventDate"
                type="date"
                value={form.eventDate}
                onChange={(event) => updateField("eventDate", event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lead-city">Oraș</Label>
              <Input
                id="lead-city"
                value={form.city}
                onChange={(event) => updateField("city", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-venue">Locație eveniment</Label>
              <Input
                id="lead-venue"
                value={form.venue}
                onChange={(event) => updateField("venue", event.target.value)}
                placeholder="Sală, restaurant, locație"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lead-guestCount">Număr invitați</Label>
              <Input
                id="lead-guestCount"
                value={form.guestCount}
                onChange={(event) => updateField("guestCount", event.target.value)}
                placeholder="Opțional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-duration">Durată</Label>
              <Input
                id="lead-duration"
                value={form.duration}
                onChange={(event) => updateField("duration", event.target.value)}
                placeholder="Ex: 6 ore"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="lead-budget">Buget</Label>
              <Input
                id="lead-budget"
                type="number"
                min={0}
                value={form.budget}
                onChange={(event) => updateField("budget", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-estimatedValue">Valoare estimată</Label>
              <Input
                id="lead-estimatedValue"
                type="number"
                min={0}
                value={form.estimatedValue}
                onChange={(event) => updateField("estimatedValue", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-currency">Monedă</Label>
              <Input
                id="lead-currency"
                value={form.currency}
                maxLength={3}
                onChange={(event) => updateField("currency", event.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lead-source">Sursă</Label>
              <Input
                id="lead-source"
                value={form.source}
                onChange={(event) => updateField("source", event.target.value)}
                placeholder="Instagram"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-followUpDate">Follow-up</Label>
              <Input
                id="lead-followUpDate"
                type="date"
                value={form.followUpDate}
                onChange={(event) => updateField("followUpDate", event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-services">Servicii (separate prin virgulă)</Label>
            <Input
              id="lead-services"
              value={form.services}
              onChange={(event) => updateField("services", event.target.value)}
              placeholder="Servicii, produse, pachete"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-tags">Etichete (separate prin virgulă)</Label>
            <Input
              id="lead-tags"
              value={form.tags}
              onChange={(event) => updateField("tags", event.target.value)}
              placeholder="premium, urgent"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) => updateField("status", (value as LeadStatus) ?? "new")}
            >
              <SelectTrigger id="lead-status" className="h-8 w-full">
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
          </div>

          {form.status === "lost" ? (
            <div className="space-y-2">
              <Label htmlFor="lead-lostReason">Motiv pierdere</Label>
              <Input
                id="lead-lostReason"
                value={form.lostReason}
                onChange={(event) => updateField("lostReason", event.target.value)}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="lead-notes">Notițe</Label>
            <Textarea
              id="lead-notes"
              rows={4}
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
            />
          </div>

          {formError ? (
            <p
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {formError}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Anulează
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Se salvează…"
                : mode === "create"
                  ? "Creează lead"
                  : "Salvează modificările"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

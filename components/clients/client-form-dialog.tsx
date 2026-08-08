"use client";

import { useI18n } from "@/components/providers/i18n-provider";

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
import { createClientAction, updateClientAction } from "@/lib/actions/clients";
import { mapClientRow, type ClientViewModel } from "@/lib/crm/mappers";
import { EVENT_TYPES } from "@/lib/events/event-types";
import { clientFormSchema } from "@/lib/validations/crm";

type ClientStatus = "active" | "past" | "lead_converted";

const STATUS_OPTIONS: { value: ClientStatus; label: string }[] = [
  { value: "active", label: "Activ" },
  { value: "past", label: "Finalizat" },
  { value: "lead_converted", label: "Convertit din lead" },
];

type ClientFormState = {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  country: string;
  eventType: string;
  eventDate: string;
  notes: string;
  tags: string;
  source: string;
  status: ClientStatus;
};

function emptyForm(): ClientFormState {
  return {
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    city: "",
    country: "",
    eventType: "",
    eventDate: "",
    notes: "",
    tags: "",
    source: "",
    status: "active",
  };
}

function formFromClient(client: ClientViewModel): ClientFormState {
  return {
    name: client.name,
    email: client.email,
    phone: client.phone,
    company: client.company,
    address: client.address,
    city: client.city,
    country: client.country,
    eventType: client.eventType,
    eventDate: client.eventDate,
    notes: client.notes,
    tags: client.tags.join(", "),
    source: client.source,
    status: (client.status as ClientStatus) || "active",
  };
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

type ClientFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initial?: ClientViewModel;
  onSuccess?: (client: ClientViewModel) => void;
};

export function ClientFormDialog({
  open,
  onOpenChange,
  mode,
  initial,
  onSuccess,
}: ClientFormDialogProps) {
  const { t } = useI18n();
  const [form, setForm] = useState<ClientFormState>(() => (initial ? formFromClient(initial) : emptyForm()));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional open-only reset
    setForm(initial ? formFromClient(initial) : emptyForm());
    setFieldErrors({});
    setFormError(null);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps -- intentional open-only reset

  function updateField<K extends keyof ClientFormState>(key: K, value: ClientFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      company: form.company,
      address: form.address,
      city: form.city,
      country: form.country,
      eventType: form.eventType,
      eventDate: form.eventDate,
      notes: form.notes,
      tags: splitList(form.tags),
      source: form.source,
      status: form.status,
    };

    const parsed = clientFormSchema.safeParse(payload);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      setFormError(t("common.verifyData"));
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setSubmitting(true);

    const result =
      mode === "create"
        ? await createClientAction(parsed.data)
        : await updateClientAction(initial?.id ?? "", parsed.data);

    setSubmitting(false);

    if (result?.error || !result?.data) {
      setFormError(result?.error ?? "Nu am putut salva clientul.");
      return;
    }

    toast(result.success ?? (mode === "create" ? "Client creat." : "Client actualizat."), "success");
    onOpenChange(false);
    onSuccess?.(mapClientRow(result.data.client));
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? t("modules.clients.new") : t("modules.clients.edit")}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? t("modules.clients.createHint")
              : t("modules.clients.editHint")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-name">Nume</Label>
            <Input
              id="client-name"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Nume client / contact"
              aria-invalid={Boolean(fieldErrors.name)}
            />
            {fieldErrors.name ? (
              <p className="text-xs text-destructive">{fieldErrors.name}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client-email">Email</Label>
              <Input
                id="client-email"
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
              <Label htmlFor="client-phone">Telefon</Label>
              <Input
                id="client-phone"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client-company">Companie</Label>
              <Input
                id="client-company"
                value={form.company}
                onChange={(event) => updateField("company", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-source">{t("common.source")}</Label>
              <Input
                id="client-source"
                value={form.source}
                onChange={(event) => updateField("source", event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-address">{t("common.address")}</Label>
            <Input
              id="client-address"
              value={form.address}
              onChange={(event) => updateField("address", event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client-city">{t("common.city")}</Label>
              <Input
                id="client-city"
                value={form.city}
                onChange={(event) => updateField("city", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-country">{t("modules.clients.country")}</Label>
              <Input
                id="client-country"
                value={form.country}
                onChange={(event) => updateField("country", event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client-eventType">Tip eveniment</Label>
              <Select
                value={form.eventType || undefined}
                onValueChange={(value) => updateField("eventType", value ?? "")}
              >
                <SelectTrigger id="client-eventType" className="h-8 w-full">
                  <SelectValue placeholder={t("modules.clients.selectType")} />
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
              <Label htmlFor="client-eventDate">Data evenimentului</Label>
              <Input
                id="client-eventDate"
                type="date"
                value={form.eventDate}
                onChange={(event) => updateField("eventDate", event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-tags">{t("modules.clients.tagsComma")}</Label>
            <Input
              id="client-tags"
              value={form.tags}
              onChange={(event) => updateField("tags", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) => updateField("status", (value as ClientStatus) ?? "active")}
            >
              <SelectTrigger id="client-status" className="h-8 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-notes">{t("modules.leads.notesLabel")}</Label>
            <Textarea
              id="client-notes"
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
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? t("common.saving")
                : mode === "create"
                  ? t("modules.clients.createClient")
                  : t("common.saveChanges")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

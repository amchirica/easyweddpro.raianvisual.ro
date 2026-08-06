"use client";

import { useEffect, useState, type FormEvent } from "react";

import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { createCalendarEventAction, updateCalendarEventAction } from "@/lib/actions/calendar";
import { mapCalendarEventRow, type CalendarEventItem } from "@/lib/calendar/mappers";
import { CALENDAR_EVENT_STATUSES, type CalendarEventStatus } from "@/lib/constants";
import { calendarEventFormSchema } from "@/lib/validations/calendar";

const STATUS_LABELS: Record<CalendarEventStatus, string> = {
  confirmed: "Confirmat",
  tentative: "Provizoriu",
  cancelled: "Anulat",
};

const EVENT_TYPE_SUGGESTIONS = [
  "eveniment",
  "întâlnire",
  "apel",
  "vizionare locație",
  "termen limită",
  "memento",
];

const COLOR_OPTIONS: { value: string; label: string; swatch: string }[] = [
  { value: "", label: "Fără culoare", swatch: "transparent" },
  { value: "#c6a76a", label: "Auriu", swatch: "#c6a76a" },
  { value: "#62b58c", label: "Verde", swatch: "#62b58c" },
  { value: "#d7a958", label: "Galben", swatch: "#d7a958" },
  { value: "#d56f6f", label: "Roșu", swatch: "#d56f6f" },
  { value: "#8a8f98", label: "Gri", swatch: "#8a8f98" },
];

type CalendarEventFormState = {
  title: string;
  eventType: string;
  allDay: boolean;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  clientId: string;
  status: CalendarEventStatus;
  color: string;
  description: string;
  notes: string;
  reminderDate: string;
  reminderTime: string;
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function splitIso(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { date: "", time: "" };
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

function combineLocal(date: string, time: string): string {
  if (!date) return "";
  const combined = new Date(`${date}T${time || "00:00"}:00`);
  if (Number.isNaN(combined.getTime())) return "";
  return combined.toISOString();
}

function roundToNextHour(date: Date): Date {
  const next = new Date(date);
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  return next;
}

function emptyForm(defaultDate?: string): CalendarEventFormState {
  const start = defaultDate ? new Date(`${defaultDate}T09:00:00`) : roundToNextHour(new Date());
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const startSplit = splitIso(start.toISOString());
  const endSplit = splitIso(end.toISOString());
  return {
    title: "",
    eventType: "eveniment",
    allDay: false,
    startDate: startSplit.date,
    startTime: startSplit.time,
    endDate: endSplit.date,
    endTime: endSplit.time,
    location: "",
    clientId: "",
    status: "confirmed",
    color: "",
    description: "",
    notes: "",
    reminderDate: "",
    reminderTime: "",
  };
}

function formFromEvent(event: CalendarEventItem): CalendarEventFormState {
  const start = splitIso(event.startsAt);
  const end = splitIso(event.endsAt);
  const reminder = splitIso(event.reminderAt);
  return {
    title: event.title,
    eventType: event.eventType || "eveniment",
    allDay: event.allDay,
    startDate: start.date,
    startTime: event.allDay ? "" : start.time,
    endDate: end.date,
    endTime: event.allDay ? "" : end.time,
    location: event.location,
    clientId: event.clientId ?? "",
    status: event.status,
    color: event.color ?? "",
    description: event.description,
    notes: event.notes,
    reminderDate: reminder.date,
    reminderTime: reminder.time,
  };
}

type CalendarEventDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initial?: CalendarEventItem;
  /** Prefills the start/end date when creating from a specific day (e.g. clicking a grid cell). */
  defaultDate?: string;
  clients?: { id: string; name: string }[];
  onSuccess?: (event: CalendarEventItem) => void;
};

export function CalendarEventDialog({
  open,
  onOpenChange,
  mode,
  initial,
  defaultDate,
  clients = [],
  onSuccess,
}: CalendarEventDialogProps) {
  const [form, setForm] = useState<CalendarEventFormState>(() =>
    initial ? formFromEvent(initial) : emptyForm(defaultDate),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    // Reset form when the dialog opens (avoids setState-during-render on prop changes).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional open-only reset
    setForm(initial ? formFromEvent(initial) : emptyForm(defaultDate));
    setFieldErrors({});
    setFormError(null);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps -- reset only when dialog opens

  function updateField<K extends keyof CalendarEventFormState>(
    key: K,
    value: CalendarEventFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleAllDayToggle(checked: boolean) {
    setForm((current) => ({
      ...current,
      allDay: checked,
      startTime: checked ? "" : current.startTime || "09:00",
      endTime: checked ? "" : current.endTime || "10:00",
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    const startsAt = form.allDay
      ? combineLocal(form.startDate, "00:00")
      : combineLocal(form.startDate, form.startTime);
    const endsAt = form.allDay
      ? combineLocal(form.endDate || form.startDate, "23:59")
      : combineLocal(form.endDate, form.endTime);
    const reminderAt = form.reminderDate ? combineLocal(form.reminderDate, form.reminderTime) : "";

    const payload = {
      title: form.title,
      description: form.description,
      eventType: form.eventType || "eveniment",
      startsAt,
      endsAt,
      allDay: form.allDay,
      location: form.location,
      clientId: form.clientId || null,
      status: form.status,
      color: form.color,
      notes: form.notes,
      reminderAt,
    };

    const parsed = calendarEventFormSchema.safeParse(payload);
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
        ? await createCalendarEventAction(parsed.data)
        : await updateCalendarEventAction(initial?.id ?? "", parsed.data);

    setSubmitting(false);

    if (result?.error || !result?.data) {
      setFormError(result?.error ?? "Nu am putut salva evenimentul.");
      return;
    }

    toast(result.success ?? (mode === "create" ? "Eveniment creat." : "Eveniment actualizat."), "success");
    onOpenChange(false);
    onSuccess?.(mapCalendarEventRow(result.data.event));
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Eveniment nou" : "Editează eveniment"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Adaugă un eveniment, o întâlnire sau un termen limită în calendar."
              : "Actualizează detaliile acestui eveniment."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event-title">Titlu</Label>
            <Input
              id="event-title"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Ex: Ședință foto cuplu"
              aria-invalid={Boolean(fieldErrors.title)}
            />
            {fieldErrors.title ? <p className="text-xs text-destructive">{fieldErrors.title}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="event-type">Tip</Label>
              <Input
                id="event-type"
                list="calendar-event-type-suggestions"
                value={form.eventType}
                onChange={(event) => updateField("eventType", event.target.value)}
              />
              <datalist id="calendar-event-type-suggestions">
                {EVENT_TYPE_SUGGESTIONS.map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => updateField("status", (value as CalendarEventStatus) ?? "confirmed")}
              >
                <SelectTrigger id="event-status" className="h-8 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CALENDAR_EVENT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox
              checked={form.allDay}
              onCheckedChange={(checked) => handleAllDayToggle(checked === true)}
            />
            Toată ziua
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="event-start-date">Începe</Label>
              <div className="flex gap-2">
                <Input
                  id="event-start-date"
                  type="date"
                  value={form.startDate}
                  onChange={(event) => updateField("startDate", event.target.value)}
                  aria-invalid={Boolean(fieldErrors.startsAt)}
                />
                {!form.allDay ? (
                  <Input
                    type="time"
                    value={form.startTime}
                    onChange={(event) => updateField("startTime", event.target.value)}
                    className="w-28"
                  />
                ) : null}
              </div>
              {fieldErrors.startsAt ? (
                <p className="text-xs text-destructive">{fieldErrors.startsAt}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-end-date">Se termină</Label>
              <div className="flex gap-2">
                <Input
                  id="event-end-date"
                  type="date"
                  value={form.endDate}
                  onChange={(event) => updateField("endDate", event.target.value)}
                  aria-invalid={Boolean(fieldErrors.endsAt)}
                />
                {!form.allDay ? (
                  <Input
                    type="time"
                    value={form.endTime}
                    onChange={(event) => updateField("endTime", event.target.value)}
                    className="w-28"
                  />
                ) : null}
              </div>
              {fieldErrors.endsAt ? (
                <p className="text-xs text-destructive">{fieldErrors.endsAt}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-location">Locație</Label>
            <Input
              id="event-location"
              value={form.location}
              onChange={(event) => updateField("location", event.target.value)}
              placeholder="Ex: Sala de evenimente, adresă…"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="event-client">Client</Label>
              <Select
                value={form.clientId || "none"}
                onValueChange={(value) => updateField("clientId", value === "none" ? "" : value ?? "")}
              >
                <SelectTrigger id="event-client" className="h-8 w-full">
                  <SelectValue placeholder="Fără client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Fără client</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-color">Culoare</Label>
              <Select value={form.color || "none"} onValueChange={(value) => updateField("color", value === "none" ? "" : value ?? "")}>
                <SelectTrigger id="event-color" className="h-8 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map((option) => (
                    <SelectItem key={option.value || "none"} value={option.value || "none"}>
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full border border-border"
                          style={{ backgroundColor: option.swatch }}
                          aria-hidden
                        />
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="event-reminder-date">Memento (opțional)</Label>
              <div className="flex gap-2">
                <Input
                  id="event-reminder-date"
                  type="date"
                  value={form.reminderDate}
                  onChange={(event) => updateField("reminderDate", event.target.value)}
                />
                <Input
                  type="time"
                  value={form.reminderTime}
                  onChange={(event) => updateField("reminderTime", event.target.value)}
                  className="w-28"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-description">Descriere</Label>
            <Textarea
              id="event-description"
              rows={3}
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-notes">Notițe interne</Label>
            <Textarea
              id="event-notes"
              rows={3}
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
                  ? "Creează eveniment"
                  : "Salvează modificările"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
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
import { createProjectAction, updateProjectAction } from "@/lib/actions/projects";
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/constants";
import { PIPELINE_TEMPLATES, type PipelineTemplateId } from "@/lib/events/project-pipelines";
import { formatCurrency } from "@/lib/format";
import { projectFormSchema } from "@/lib/validations/projects";

export type ProjectFormOption = { id: string; name: string };

export type ProjectFormInitialData = {
  name: string;
  clientId: string | null;
  eventDate: string | null;
  status: ProjectStatus;
  pipelineKey: string;
  deadline: string | null;
  progress: number;
  team: string[];
  location: string | null;
  notes: string | null;
  budget: number;
  cost: number;
  estimatedRevenue: number;
  currency: string;
};

type FormState = {
  name: string;
  clientId: string;
  eventDate: string;
  status: ProjectStatus;
  pipelineKey: string;
  deadline: string;
  progress: string;
  team: string;
  location: string;
  notes: string;
  budget: string;
  cost: string;
  estimatedRevenue: string;
  currency: string;
};

function makeInitialState(input: {
  initial?: ProjectFormInitialData;
  defaultClientId?: string | null;
  currency: string;
}): FormState {
  const { initial, defaultClientId, currency } = input;

  if (initial) {
    return {
      name: initial.name,
      clientId: initial.clientId ?? "",
      eventDate: initial.eventDate ?? "",
      status: initial.status,
      pipelineKey: initial.pipelineKey,
      deadline: initial.deadline ?? "",
      progress: String(initial.progress ?? 0),
      team: (initial.team ?? []).join(", "),
      location: initial.location ?? "",
      notes: initial.notes ?? "",
      budget: String(initial.budget ?? 0),
      cost: String(initial.cost ?? 0),
      estimatedRevenue: String(initial.estimatedRevenue ?? 0),
      currency: initial.currency || currency,
    };
  }

  return {
    name: "",
    clientId: defaultClientId ?? "",
    eventDate: "",
    status: "booked",
    pipelineKey: "generic",
    deadline: "",
    progress: "0",
    team: "",
    location: "",
    notes: "",
    budget: "0",
    cost: "0",
    estimatedRevenue: "0",
    currency,
  };
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

type ProjectFormProps = {
  mode: "create" | "edit";
  projectId?: string;
  initial?: ProjectFormInitialData;
  clients: ProjectFormOption[];
  defaultClientId?: string | null;
  currency?: string;
  canWrite: boolean;
  onCancelEdit?: () => void;
  onSaved?: (projectId: string) => void;
};

export function ProjectForm({
  mode,
  projectId,
  initial,
  clients,
  defaultClientId = null,
  currency = "RON",
  canWrite,
  onCancelEdit,
  onSaved,
}: ProjectFormProps) {
  const [form, setForm] = useState<FormState>(() =>
    makeInitialState({ initial, defaultClientId, currency }),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const pipelineStages = PIPELINE_TEMPLATES[(form.pipelineKey as PipelineTemplateId) || "generic"]?.stages ?? [];

  function buildPayload() {
    return {
      name: form.name,
      clientId: form.clientId || null,
      eventDate: form.eventDate,
      status: form.status,
      pipelineKey: form.pipelineKey,
      deadline: form.deadline,
      progress: form.progress,
      team: splitList(form.team),
      location: form.location,
      notes: form.notes,
      budget: form.budget,
      cost: form.cost,
      estimatedRevenue: form.estimatedRevenue,
      currency: form.currency,
    };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    if (!canWrite) {
      toast("Nu ai permisiunea de a salva proiecte.", "error");
      return;
    }

    const payload = buildPayload();
    const parsed = projectFormSchema.safeParse(payload);
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

    try {
      const result =
        mode === "create"
          ? await createProjectAction(parsed.data)
          : await updateProjectAction(projectId ?? "", parsed.data);

      if (result?.error || !result?.data) {
        const message = result?.error || "Proiectul nu a putut fi salvat. Verifică datele și încearcă din nou.";
        setFormError(message);
        toast(message, "error");
        return;
      }

      toast(result.success ?? (mode === "create" ? "Proiect creat." : "Proiect actualizat."), "success");

      if (mode === "create") {
        router.push(`/dashboard/projects/${result.data.project.id}`);
        return;
      }

      router.refresh();
      onSaved?.(projectId ?? result.data.project.id);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Save project failed", {
          operation: mode === "create" ? "createProject" : "updateProject",
          message: error instanceof Error ? error.message : String(error),
        });
      }
      const message = "Proiectul nu a putut fi salvat. Verifică datele și încearcă din nou.";
      setFormError(message);
      toast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24 lg:pb-0">
      {!canWrite ? (
        <p className="rounded-md border border-champagne/30 bg-champagne/10 px-3 py-2 text-sm text-champagne-soft">
          Nu ai permisiunea de a edita acest proiect. Poți vizualiza datele, dar salvarea este dezactivată.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="project-name">Nume proiect</Label>
            <Input
              id="project-name"
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="Nuntă Ana & Radu"
              aria-invalid={Boolean(fieldErrors.name)}
              disabled={!canWrite}
            />
            {fieldErrors.name ? <p className="text-xs text-destructive">{fieldErrors.name}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-client">Client</Label>
            <Select
              value={form.clientId || undefined}
              onValueChange={(value) => update("clientId", (value as string) ?? "")}
            >
              <SelectTrigger id="project-client" className="h-8 w-full" disabled={!canWrite}>
                <SelectValue placeholder="Selectează clientul" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {clients.length === 0 ? (
              <p className="text-xs text-muted-soft">Niciun client disponibil încă.</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project-eventDate">Data evenimentului</Label>
              <Input
                id="project-eventDate"
                type="date"
                value={form.eventDate}
                onChange={(event) => update("eventDate", event.target.value)}
                disabled={!canWrite}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-deadline">Termen livrare</Label>
              <Input
                id="project-deadline"
                type="date"
                value={form.deadline}
                onChange={(event) => update("deadline", event.target.value)}
                disabled={!canWrite}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => update("status", (value as ProjectStatus) ?? "booked")}
              >
                <SelectTrigger id="project-status" className="h-8 w-full" disabled={!canWrite}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {PROJECT_STATUS_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-pipeline">Pipeline</Label>
              <Select
                value={form.pipelineKey}
                onValueChange={(value) => update("pipelineKey", (value as string) ?? "generic")}
              >
                <SelectTrigger id="project-pipeline" className="h-8 w-full" disabled={!canWrite}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PIPELINE_TEMPLATES).map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {pipelineStages.length ? (
            <p className="text-xs text-muted-soft">
              Etape: {pipelineStages.map((stage) => stage.label).join(" → ")}
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project-location">Locație</Label>
              <Input
                id="project-location"
                value={form.location}
                onChange={(event) => update("location", event.target.value)}
                placeholder="Sala Regia, București"
                disabled={!canWrite}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-progress">Progres (%)</Label>
              <Input
                id="project-progress"
                type="number"
                min={0}
                max={100}
                value={form.progress}
                onChange={(event) => update("progress", event.target.value)}
                disabled={!canWrite}
              />
              {fieldErrors.progress ? (
                <p className="text-xs text-destructive">{fieldErrors.progress}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-team">Echipă (separată prin virgulă)</Label>
            <Input
              id="project-team"
              value={form.team}
              onChange={(event) => update("team", event.target.value)}
              placeholder="Ana (foto), Mihai (video)"
              disabled={!canWrite}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="project-budget">Buget</Label>
              <Input
                id="project-budget"
                type="number"
                min={0}
                value={form.budget}
                onChange={(event) => update("budget", event.target.value)}
                disabled={!canWrite}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-cost">Cost</Label>
              <Input
                id="project-cost"
                type="number"
                min={0}
                value={form.cost}
                onChange={(event) => update("cost", event.target.value)}
                disabled={!canWrite}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-estimatedRevenue">Venit estimat</Label>
              <Input
                id="project-estimatedRevenue"
                type="number"
                min={0}
                value={form.estimatedRevenue}
                onChange={(event) => update("estimatedRevenue", event.target.value)}
                disabled={!canWrite}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-currency">Monedă</Label>
            <Input
              id="project-currency"
              value={form.currency}
              maxLength={3}
              className="max-w-[120px]"
              onChange={(event) => update("currency", event.target.value.toUpperCase())}
              disabled={!canWrite}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-notes">Notițe</Label>
            <Textarea
              id="project-notes"
              rows={4}
              value={form.notes}
              onChange={(event) => update("notes", event.target.value)}
              placeholder="Detalii interne despre proiect…"
              disabled={!canWrite}
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

          <div className="hidden items-center justify-end gap-3 lg:flex">
            {mode === "edit" && onCancelEdit ? (
              <Button type="button" variant="outline" onClick={onCancelEdit} disabled={submitting}>
                Anulează
              </Button>
            ) : null}
            <Button type="submit" disabled={submitting || !canWrite}>
              {submitting ? "Se salvează…" : mode === "create" ? "Creează proiect" : "Salvează modificările"}
            </Button>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="surface-card sticky top-20 space-y-3 p-5">
            <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">Rezumat</p>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Buget</dt>
                <dd className="text-foreground">{formatCurrency(Number(form.budget) || 0, form.currency)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Cost</dt>
                <dd className="text-foreground">{formatCurrency(Number(form.cost) || 0, form.currency)}</dd>
              </div>
            </dl>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm text-muted-foreground">Venit estimat</span>
              <span className="font-heading text-xl font-medium text-champagne">
                {formatCurrency(Number(form.estimatedRevenue) || 0, form.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Venit estimat</p>
          <p className="truncate font-heading text-lg font-medium text-champagne">
            {formatCurrency(Number(form.estimatedRevenue) || 0, form.currency)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {mode === "edit" && onCancelEdit ? (
            <Button type="button" size="sm" variant="outline" onClick={onCancelEdit} disabled={submitting}>
              Anulează
            </Button>
          ) : null}
          <Button type="submit" size="sm" disabled={submitting || !canWrite}>
            {submitting ? "Se salvează…" : mode === "create" ? "Creează" : "Salvează"}
          </Button>
        </div>
      </div>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Archive, ArchiveRestore, Copy, Plus, Save, Star, Trash2, X } from "lucide-react";

import { TemplatePreview } from "@/components/templates/template-preview";
import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { TemplateRow } from "@/lib/data/templates";
import {
  archiveTemplateAction,
  createTemplateAction,
  duplicateTemplateAction,
  setDefaultTemplateAction,
  softDeleteTemplateAction,
  unarchiveTemplateAction,
  updateTemplateAction,
} from "@/lib/actions/templates";
import {
  TEMPLATE_TYPE_LABELS,
  TEMPLATE_TYPES,
  templateFormSchema,
  type TemplateType,
} from "@/lib/validations/templates";

type TemplateFormState = {
  type: TemplateType;
  name: string;
  category: string;
  businessType: string;
  isDefault: boolean;
  subject: string;
  body: string;
  description: string;
  checklist: string[];
  stages: string[];
};

type TemplateContentShape = {
  subject?: string | null;
  body?: string | null;
  description?: string | null;
  checklist?: string[] | null;
  stages?: string[] | null;
};

function emptyForm(): TemplateFormState {
  return {
    type: "proposal",
    name: "",
    category: "general",
    businessType: "",
    isDefault: false,
    subject: "",
    body: "",
    description: "",
    checklist: [],
    stages: [],
  };
}

function formFromTemplate(template: TemplateRow): TemplateFormState {
  const content = (template.content as unknown as TemplateContentShape) ?? {};
  return {
    type: template.type as TemplateType,
    name: template.name,
    category: template.category,
    businessType: template.business_type ?? "",
    isDefault: template.is_default,
    subject: content.subject ?? "",
    body: content.body ?? "",
    description: content.description ?? "",
    checklist: content.checklist ?? [],
    stages: content.stages ?? [],
  };
}

type TemplateFormProps = {
  mode: "create" | "edit";
  initial?: TemplateRow;
};

export function TemplateForm({ mode, initial }: TemplateFormProps) {
  const [form, setForm] = useState<TemplateFormState>(() =>
    initial ? formFromTemplate(initial) : emptyForm(),
  );
  const [listDraft, setListDraft] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [archivedAt, setArchivedAt] = useState<string | null>(initial?.archived_at ?? null);
  const [isDefault, setIsDefault] = useState<boolean>(initial?.is_default ?? false);
  const router = useRouter();
  const { toast } = useToast();

  function updateField<K extends keyof TemplateFormState>(key: K, value: TemplateFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const listKey: "checklist" | "stages" | null =
    form.type === "task" || form.type === "project" ? "checklist" : form.type === "pipeline" ? "stages" : null;

  function addListItem() {
    if (!listKey) return;
    const value = listDraft.trim();
    if (!value) return;
    setForm((current) => ({ ...current, [listKey]: [...current[listKey], value] }));
    setListDraft("");
  }

  function removeListItem(index: number) {
    if (!listKey) return;
    setForm((current) => ({
      ...current,
      [listKey]: current[listKey].filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    const payload = {
      type: form.type,
      name: form.name,
      category: form.category,
      businessType: form.businessType,
      isDefault: form.isDefault,
      content: {
        subject: form.subject,
        body: form.body,
        description: form.description,
        checklist: form.checklist,
        stages: form.stages,
      },
    };

    const parsed = templateFormSchema.safeParse(payload);
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
        ? await createTemplateAction(parsed.data)
        : await updateTemplateAction(initial!.id, parsed.data);

    setSubmitting(false);

    if (result?.error || !result?.data) {
      setFormError(result?.error ?? "Nu am putut salva template-ul.");
      return;
    }

    toast(result.success ?? "Template salvat.", "success");
    setIsDefault(result.data.template.is_default);
    router.push(`/dashboard/templates/${result.data.template.id}`);
    router.refresh();
  }

  async function handleDuplicate() {
    if (!initial) return;
    setBusy(true);
    const result = await duplicateTemplateAction(initial.id);
    setBusy(false);
    if (result?.error || !result?.data) {
      toast(result?.error ?? "Nu am putut duplica template-ul.", "error");
      return;
    }
    toast(result.success ?? "Template duplicat.", "success");
    router.push(`/dashboard/templates/${result.data.template.id}`);
  }

  async function handleSetDefault() {
    if (!initial) return;
    setBusy(true);
    const result = await setDefaultTemplateAction(initial.id);
    setBusy(false);
    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    toast(result.success ?? "Setat implicit.", "success");
    setIsDefault(true);
    router.refresh();
  }

  async function handleArchiveToggle() {
    if (!initial) return;
    setBusy(true);
    const result = archivedAt
      ? await unarchiveTemplateAction(initial.id)
      : await archiveTemplateAction(initial.id);
    setBusy(false);
    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    toast(result.success ?? "Salvat.", "success");
    setArchivedAt(archivedAt ? null : new Date().toISOString());
    if (!archivedAt) setIsDefault(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!initial) return;
    if (!window.confirm(`Ștergi template-ul „${initial.name}”? Această acțiune nu poate fi anulată.`)) return;
    setBusy(true);
    const result = await softDeleteTemplateAction(initial.id);
    setBusy(false);
    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    toast(result.success ?? "Template șters.", "success");
    router.push("/dashboard/templates");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="surface-card space-y-4 p-5">
          <div>
            <h2 className="font-heading text-lg font-medium text-foreground">Detalii template</h2>
            <p className="text-sm text-muted-foreground">
              Alege tipul și denumirea. Tipul nu mai poate fi schimbat după creare.
            </p>
          </div>
          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="template-type">Tip</Label>
              <Select
                value={form.type}
                onValueChange={(value) => updateField("type", (value as TemplateType) ?? "proposal")}
                disabled={mode === "edit"}
              >
                <SelectTrigger id="template-type" className="h-8 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {TEMPLATE_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="template-category">Categorie</Label>
              <Input
                id="template-category"
                value={form.category}
                onChange={(event) => updateField("category", event.target.value)}
                placeholder="general"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="template-name">Nume</Label>
            <Input
              id="template-name"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Ex: Ofertă foto-video full day"
              aria-invalid={Boolean(fieldErrors.name)}
            />
            {fieldErrors.name ? <p className="text-xs text-destructive">{fieldErrors.name}</p> : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="template-business-type">Tip business (opțional)</Label>
            <Input
              id="template-business-type"
              value={form.businessType}
              onChange={(event) => updateField("businessType", event.target.value)}
              placeholder="ex: photo_video, dj_band, venue…"
            />
          </div>

          <label className="flex items-center gap-3 text-sm text-foreground">
            <Checkbox
              checked={form.isDefault || isDefault}
              disabled={isDefault}
              onCheckedChange={(checked) => updateField("isDefault", Boolean(checked))}
            />
            Setează ca implicit pentru tipul {TEMPLATE_TYPE_LABELS[form.type]}
            {isDefault ? " (deja implicit)" : ""}
          </label>
        </section>

        <section className="surface-card space-y-4 p-5">
          <div>
            <h2 className="font-heading text-lg font-medium text-foreground">Conținut</h2>
            <p className="text-sm text-muted-foreground">
              Folosește variabile alocate din lista din dreapta — ex. <code>{"{{client_name}}"}</code>. Textul nu
              este interpretat ca HTML sau cod.
            </p>
          </div>
          <Separator />

          <div className="space-y-1.5">
            <Label htmlFor="template-description">Descriere scurtă (afișată în listă)</Label>
            <Textarea
              id="template-description"
              rows={2}
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
            />
          </div>

          {form.type === "email" ? (
            <div className="space-y-1.5">
              <Label htmlFor="template-subject">Subiect email</Label>
              <Input
                id="template-subject"
                value={form.subject}
                onChange={(event) => updateField("subject", event.target.value)}
                placeholder="Ex: Oferta ta pentru {{event_date}}"
              />
            </div>
          ) : null}

          {listKey ? (
            <div className="space-y-2">
              <Label>{listKey === "checklist" ? "Listă de verificare" : "Etape pipeline"}</Label>
              <div className="flex gap-2">
                <Input
                  value={listDraft}
                  onChange={(event) => setListDraft(event.target.value)}
                  placeholder={listKey === "checklist" ? "Ex: Trimite contract" : "Ex: Rezervare confirmată"}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addListItem();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addListItem}>
                  <Plus data-icon="inline-start" />
                  Adaugă
                </Button>
              </div>
              {form[listKey].length ? (
                <ul className="space-y-1.5">
                  {form[listKey].map((item, index) => (
                    <li
                      key={`${item}-${index}`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground"
                    >
                      <span className="min-w-0 truncate">
                        {listKey === "stages" ? `${index + 1}. ` : ""}
                        {item}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeListItem(index)}
                        aria-label="Elimină"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-soft">Niciun element adăugat încă.</p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="template-body">Conținut</Label>
              <Textarea
                id="template-body"
                rows={12}
                value={form.body}
                onChange={(event) => updateField("body", event.target.value)}
                placeholder="Text cu variabile alocate, ex: Bună {{client_name}}, ..."
              />
            </div>
          )}
        </section>

        {formError ? (
          <p
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {formError}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={submitting}>
            <Save data-icon="inline-start" />
            {submitting ? "Se salvează…" : mode === "create" ? "Creează template" : "Salvează modificările"}
          </Button>
          <Button
            type="button"
            variant="outline"
            render={<Link href="/dashboard/templates" />}
            nativeButton={false}
          >
            Anulează
          </Button>
        </div>

        {mode === "edit" && initial ? (
          <section className="surface-card space-y-3 p-5">
            <h2 className="font-heading text-base font-medium text-foreground">Administrare</h2>
            <div className="flex flex-wrap gap-2">
              {!isDefault && !archivedAt ? (
                <Button type="button" variant="outline" size="sm" disabled={busy} onClick={handleSetDefault}>
                  <Star data-icon="inline-start" />
                  Setează implicit
                </Button>
              ) : null}
              <Button type="button" variant="outline" size="sm" disabled={busy} onClick={handleDuplicate}>
                <Copy data-icon="inline-start" />
                Duplică
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={busy} onClick={handleArchiveToggle}>
                {archivedAt ? (
                  <>
                    <ArchiveRestore data-icon="inline-start" />
                    Restaurează din arhivă
                  </>
                ) : (
                  <>
                    <Archive data-icon="inline-start" />
                    Arhivează
                  </>
                )}
              </Button>
              <Button type="button" variant="destructive" size="sm" disabled={busy} onClick={handleDelete}>
                <Trash2 data-icon="inline-start" />
                Șterge
              </Button>
            </div>
          </section>
        ) : null}
      </form>

      <TemplatePreview
        subject={form.type === "email" ? form.subject : undefined}
        body={listKey ? "" : form.body}
        description={form.description}
        checklist={form.checklist}
        stages={form.stages}
      />
    </div>
  );
}

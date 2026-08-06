"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";

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
import { createAutomationAction, updateAutomationAction } from "@/lib/actions/automations";
import {
  AUTOMATION_ACTION_LABELS,
  AUTOMATION_ACTION_TYPES,
  AUTOMATION_CONDITION_OPERATOR_LABELS,
  AUTOMATION_CONDITION_OPERATORS,
  AUTOMATION_TRIGGER_DESCRIPTIONS,
  AUTOMATION_TRIGGER_LABELS,
  AUTOMATION_TRIGGERS,
  type AutomationAction,
  type AutomationActionType,
  type AutomationCondition,
  type AutomationConditionOperator,
  type AutomationTriggerKey,
  type ChangeStatusEntityType,
} from "@/lib/automations/catalog";
import { LEAD_STATUSES, PROJECT_STATUSES, TASK_PRIORITIES, TASK_PRIORITY_LABELS } from "@/lib/constants";
import { automationFormSchema } from "@/lib/validations/automations";

type ActionFormItem = {
  key: string;
  type: AutomationActionType;
  title: string;
  notes: string;
  dueInDays: string;
  priority: (typeof TASK_PRIORITIES)[number];
  offsetMinutes: string;
  entityType: ChangeStatusEntityType;
  toStatus: string;
  description: string;
  subject: string;
  body: string;
  to: string;
};

type ConditionFormItem = {
  key: string;
  field: string;
  operator: AutomationConditionOperator;
  value: string;
};

function newKey(): string {
  return Math.random().toString(36).slice(2, 10);
}

function emptyActionItem(type: AutomationActionType = "log_activity"): ActionFormItem {
  return {
    key: newKey(),
    type,
    title: "",
    notes: "",
    dueInDays: "",
    priority: "normal",
    offsetMinutes: "",
    entityType: "lead",
    toStatus: "",
    description: "",
    subject: "",
    body: "",
    to: "",
  };
}

function emptyConditionItem(): ConditionFormItem {
  return { key: newKey(), field: "", operator: "eq", value: "" };
}

function actionToFormItem(action: AutomationAction): ActionFormItem {
  const base = emptyActionItem(action.type);
  switch (action.type) {
    case "create_task":
      return {
        ...base,
        title: action.title,
        notes: action.notes ?? "",
        dueInDays: action.dueInDays != null ? String(action.dueInDays) : "",
        priority: action.priority ?? "normal",
      };
    case "create_reminder":
      return {
        ...base,
        title: action.title,
        notes: action.notes ?? "",
        offsetMinutes: action.offsetMinutes != null ? String(action.offsetMinutes) : "",
      };
    case "change_status":
      return { ...base, entityType: action.entityType, toStatus: action.toStatus };
    case "log_activity":
      return { ...base, title: action.title, description: action.description ?? "" };
    case "prepare_email":
      return { ...base, subject: action.subject, body: action.body };
    case "send_email":
      return { ...base, subject: action.subject, body: action.body, to: action.to ?? "" };
    default:
      return base;
  }
}

function conditionToFormItem(condition: AutomationCondition): ConditionFormItem {
  return {
    key: newKey(),
    field: condition.field,
    operator: condition.operator,
    value: condition.value != null ? String(condition.value) : "",
  };
}

function formItemToAction(item: ActionFormItem): AutomationAction | null {
  switch (item.type) {
    case "create_task":
      if (!item.title.trim()) return null;
      return {
        type: "create_task",
        title: item.title.trim(),
        notes: item.notes.trim() || undefined,
        dueInDays: item.dueInDays.trim() ? Number(item.dueInDays) : undefined,
        priority: item.priority,
      };
    case "create_reminder":
      if (!item.title.trim()) return null;
      return {
        type: "create_reminder",
        title: item.title.trim(),
        notes: item.notes.trim() || undefined,
        offsetMinutes: item.offsetMinutes.trim() ? Number(item.offsetMinutes) : undefined,
      };
    case "change_status":
      if (!item.toStatus.trim()) return null;
      return { type: "change_status", entityType: item.entityType, toStatus: item.toStatus.trim() };
    case "log_activity":
      if (!item.title.trim()) return null;
      return {
        type: "log_activity",
        title: item.title.trim(),
        description: item.description.trim() || undefined,
      };
    case "prepare_email":
      if (!item.subject.trim() || !item.body.trim()) return null;
      return { type: "prepare_email", subject: item.subject.trim(), body: item.body.trim() };
    case "send_email":
      if (!item.subject.trim() || !item.body.trim()) return null;
      return {
        type: "send_email",
        subject: item.subject.trim(),
        body: item.body.trim(),
        to: item.to.trim() || undefined,
      };
    default:
      return null;
  }
}

function formItemToCondition(item: ConditionFormItem): AutomationCondition | null {
  if (!item.field.trim()) return null;
  if (item.operator === "exists") {
    return { field: item.field.trim(), operator: item.operator };
  }
  if (!item.value.trim()) return null;
  const numeric = Number(item.value);
  const isNumericOperator = item.operator === "gt" || item.operator === "gte" || item.operator === "lt" || item.operator === "lte";
  return {
    field: item.field.trim(),
    operator: item.operator,
    value: isNumericOperator && !Number.isNaN(numeric) ? numeric : item.value.trim(),
  };
}

export type AutomationFormInitial = {
  id: string;
  name: string;
  description: string;
  triggerKey: AutomationTriggerKey;
  enabled: boolean;
  channel: "email" | "internal";
  conditions: AutomationCondition[];
  actions: AutomationAction[];
};

type AutomationFormProps = {
  mode: "create" | "edit";
  initial?: AutomationFormInitial;
};

export function AutomationForm({ mode, initial }: AutomationFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [triggerKey, setTriggerKey] = useState<AutomationTriggerKey>(
    initial?.triggerKey ?? "lead_created",
  );
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [conditions, setConditions] = useState<ConditionFormItem[]>(
    initial?.conditions.map(conditionToFormItem) ?? [],
  );
  const [actions, setActions] = useState<ActionFormItem[]>(
    initial?.actions.map(actionToFormItem) ?? [emptyActionItem()],
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateAction<K extends keyof ActionFormItem>(key: string, field: K, value: ActionFormItem[K]) {
    setActions((current) =>
      current.map((item) => (item.key === key ? { ...item, [field]: value } : item)),
    );
  }

  function updateCondition<K extends keyof ConditionFormItem>(
    key: string,
    field: K,
    value: ConditionFormItem[K],
  ) {
    setConditions((current) =>
      current.map((item) => (item.key === key ? { ...item, [field]: value } : item)),
    );
  }

  const hasEmailAction = actions.some((item) => item.type === "prepare_email" || item.type === "send_email");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    const parsedActions = actions.map(formItemToAction).filter((a): a is AutomationAction => a !== null);
    const parsedConditions = conditions
      .map(formItemToCondition)
      .filter((c): c is AutomationCondition => c !== null);

    const payload = {
      name,
      description: description || undefined,
      triggerKey,
      enabled,
      channel: hasEmailAction ? ("email" as const) : ("internal" as const),
      conditions: parsedConditions,
      actions: parsedActions,
    };

    const parsed = automationFormSchema.safeParse(payload);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Verifică datele completate.");
      return;
    }
    if (!parsed.data.actions.length) {
      setFormError("Adaugă cel puțin o acțiune validă.");
      return;
    }

    setFormError(null);
    setSubmitting(true);

    const result =
      mode === "create"
        ? await createAutomationAction(parsed.data)
        : await updateAutomationAction(initial?.id ?? "", parsed.data);

    setSubmitting(false);

    if (result?.error || !result?.data) {
      setFormError(result?.error ?? "Nu am putut salva automatizarea.");
      return;
    }

    toast(result.success ?? "Automatizare salvată.", "success");
    router.push("/dashboard/automations");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="surface-card space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="automation-name">Nume</Label>
            <Input
              id="automation-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex: Email după lead nou"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="automation-trigger">Declanșator</Label>
            <Select value={triggerKey} onValueChange={(value) => setTriggerKey(value as AutomationTriggerKey)}>
              <SelectTrigger id="automation-trigger" className="h-8 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUTOMATION_TRIGGERS.map((trigger) => (
                  <SelectItem key={trigger} value={trigger}>
                    {AUTOMATION_TRIGGER_LABELS[trigger]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-soft">{AUTOMATION_TRIGGER_DESCRIPTIONS[triggerKey]}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="automation-description">Descriere (opțional)</Label>
          <Textarea
            id="automation-description"
            rows={2}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Notează scopul acestei automatizări."
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-surface-elevated/60 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Activă</p>
            <p className="text-xs text-muted-soft">
              Automatizările dezactivate nu rulează la niciun declanșator.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="Comută starea automatizării"
            onClick={() => setEnabled((current) => !current)}
            className={
              enabled
                ? "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-champagne/40 bg-champagne/80 transition-colors"
                : "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-border bg-white/5 transition-colors"
            }
          >
            <span
              className={
                enabled
                  ? "inline-block h-4.5 w-4.5 translate-x-[22px] rounded-full bg-primary-foreground transition-transform"
                  : "inline-block h-4.5 w-4.5 translate-x-0.5 rounded-full bg-background transition-transform"
              }
            />
          </button>
        </div>
      </div>

      <div className="surface-card space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-heading text-lg font-medium text-foreground">Condiții (opțional)</p>
            <p className="text-xs text-muted-soft">
              Toate condițiile trebuie să fie adevărate pentru ca automatizarea să ruleze.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setConditions((c) => [...c, emptyConditionItem()])}>
            <Plus data-icon="inline-start" />
            Condiție
          </Button>
        </div>

        {conditions.length === 0 ? (
          <p className="text-xs text-muted-soft">Fără condiții — automatizarea rulează de fiecare dată.</p>
        ) : (
          <div className="space-y-3">
            {conditions.map((condition) => (
              <div key={condition.key} className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <Input
                  placeholder="câmp (ex: source)"
                  value={condition.field}
                  onChange={(event) => updateCondition(condition.key, "field", event.target.value)}
                />
                <Select
                  value={condition.operator}
                  onValueChange={(value) => updateCondition(condition.key, "operator", value as AutomationConditionOperator)}
                >
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUTOMATION_CONDITION_OPERATORS.map((op) => (
                      <SelectItem key={op} value={op}>
                        {AUTOMATION_CONDITION_OPERATOR_LABELS[op]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="valoare"
                  value={condition.value}
                  disabled={condition.operator === "exists"}
                  onChange={(event) => updateCondition(condition.key, "value", event.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConditions((c) => c.filter((item) => item.key !== condition.key))}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="surface-card space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-heading text-lg font-medium text-foreground">Acțiuni</p>
            <p className="text-xs text-muted-soft">Acțiunile rulează în ordine, la fiecare declanșare.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setActions((a) => [...a, emptyActionItem()])}>
            <Plus data-icon="inline-start" />
            Acțiune
          </Button>
        </div>

        <div className="space-y-4">
          {actions.map((action) => (
            <div key={action.key} className="space-y-3 rounded-xl border border-border p-4">
              <div className="flex items-center justify-between gap-3">
                <Select
                  value={action.type}
                  onValueChange={(value) => updateAction(action.key, "type", value as AutomationActionType)}
                >
                  <SelectTrigger className="h-8 w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUTOMATION_ACTION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {AUTOMATION_ACTION_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setActions((a) => a.filter((item) => item.key !== action.key))}
                  disabled={actions.length === 1}
                >
                  <Trash2 />
                </Button>
              </div>

              {(action.type === "create_task" || action.type === "create_reminder" || action.type === "log_activity") ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Titlu</Label>
                    <Input
                      value={action.title}
                      onChange={(event) => updateAction(action.key, "title", event.target.value)}
                      placeholder="Titlu"
                    />
                  </div>
                  {action.type === "create_task" ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Termen (zile)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={action.dueInDays}
                          onChange={(event) => updateAction(action.key, "dueInDays", event.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Prioritate</Label>
                        <Select
                          value={action.priority}
                          onValueChange={(value) => updateAction(action.key, "priority", value as ActionFormItem["priority"])}
                        >
                          <SelectTrigger className="h-8 w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TASK_PRIORITIES.map((priority) => (
                              <SelectItem key={priority} value={priority}>
                                {TASK_PRIORITY_LABELS[priority]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : null}
                  {action.type === "create_reminder" ? (
                    <div className="space-y-1.5">
                      <Label>Peste (minute)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={action.offsetMinutes}
                        onChange={(event) => updateAction(action.key, "offsetMinutes", event.target.value)}
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}

              {(action.type === "create_task" || action.type === "create_reminder") ? (
                <div className="space-y-1.5">
                  <Label>Note (opțional)</Label>
                  <Textarea
                    rows={2}
                    value={action.notes}
                    onChange={(event) => updateAction(action.key, "notes", event.target.value)}
                  />
                </div>
              ) : null}

              {action.type === "log_activity" ? (
                <div className="space-y-1.5">
                  <Label>Descriere (opțional)</Label>
                  <Textarea
                    rows={2}
                    value={action.description}
                    onChange={(event) => updateAction(action.key, "description", event.target.value)}
                  />
                </div>
              ) : null}

              {action.type === "change_status" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Tip entitate</Label>
                    <Select
                      value={action.entityType}
                      onValueChange={(value) => updateAction(action.key, "entityType", value as ChangeStatusEntityType)}
                    >
                      <SelectTrigger className="h-8 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="project">Proiect</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Status nou</Label>
                    <Select
                      value={action.toStatus || undefined}
                      onValueChange={(value) =>
                        updateAction(action.key, "toStatus", value ?? "")
                      }
                    >
                      <SelectTrigger className="h-8 w-full">
                        <SelectValue placeholder="Selectează statusul" />
                      </SelectTrigger>
                      <SelectContent>
                        {(action.entityType === "lead" ? LEAD_STATUSES : PROJECT_STATUSES).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : null}

              {(action.type === "prepare_email" || action.type === "send_email") ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Subiect</Label>
                    <Input
                      value={action.subject}
                      onChange={(event) => updateAction(action.key, "subject", event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Conținut</Label>
                    <Textarea
                      rows={4}
                      value={action.body}
                      onChange={(event) => updateAction(action.key, "body", event.target.value)}
                    />
                  </div>
                  {action.type === "send_email" ? (
                    <div className="space-y-1.5">
                      <Label>Destinatar (opțional — implicit clientul asociat)</Label>
                      <Input
                        type="email"
                        value={action.to}
                        onChange={(event) => updateAction(action.key, "to", event.target.value)}
                        placeholder="client@exemplu.ro"
                      />
                      <p className="text-xs text-muted-soft">
                        Trimiterea reală necesită RESEND_API_KEY configurat. Fără el, emailul este
                        marcat drept omis, nu se pretinde trimiterea.
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {formError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/automations")}
          disabled={submitting}
        >
          Anulează
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Se salvează…" : mode === "create" ? "Creează automatizare" : "Salvează modificările"}
        </Button>
      </div>
    </form>
  );
}

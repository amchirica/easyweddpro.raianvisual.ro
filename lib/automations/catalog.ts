/**
 * Automations catalog — trigger keys and action types.
 * Shared between the engine (execution), actions (CRUD/validation) and the
 * dashboard UI (pickers). Keep in sync with `automations.trigger_key` values
 * fired from `runAutomationsForTrigger` call sites.
 */

export const AUTOMATION_TRIGGERS = [
  "lead_created",
  "proposal_published",
  "proposal_accepted",
  "contract_published",
  "contract_accepted",
  "payment_due",
  "payment_overdue",
  "event_upcoming",
  "task_overdue",
  "project_stage_changed",
] as const;

export type AutomationTriggerKey = (typeof AUTOMATION_TRIGGERS)[number];

export const AUTOMATION_TRIGGER_LABELS: Record<AutomationTriggerKey, string> = {
  lead_created: "Lead nou creat",
  proposal_published: "Ofertă publicată",
  proposal_accepted: "Ofertă acceptată",
  contract_published: "Contract publicat",
  contract_accepted: "Contract acceptat",
  payment_due: "Plată scadentă",
  payment_overdue: "Plată restantă",
  event_upcoming: "Eveniment în curând",
  task_overdue: "Task întârziat",
  project_stage_changed: "Etapă proiect schimbată",
};

export const AUTOMATION_TRIGGER_DESCRIPTIONS: Record<AutomationTriggerKey, string> = {
  lead_created: "Se declanșează imediat după înregistrarea unui lead nou.",
  proposal_published: "Se declanșează când o ofertă este trimisă clientului.",
  proposal_accepted: "Se declanșează când clientul acceptă digital oferta.",
  contract_published: "Se declanșează când un contract este publicat (link generat).",
  contract_accepted: "Se declanșează când clientul acceptă digital contractul.",
  payment_due: "Se declanșează pentru plățile care devin scadente.",
  payment_overdue: "Se declanșează pentru plățile restante.",
  event_upcoming: "Se declanșează cu un anumit număr de zile înainte de eveniment.",
  task_overdue: "Se declanșează pentru task-urile care au trecut de termen.",
  project_stage_changed: "Se declanșează când un proiect trece într-o nouă etapă.",
};

/** Entity type the trigger's `entityId` refers to — used by `change_status` and links. */
export const AUTOMATION_TRIGGER_ENTITY: Record<
  AutomationTriggerKey,
  "lead" | "proposal" | "contract" | "payment" | "calendar_event" | "task" | "project"
> = {
  lead_created: "lead",
  proposal_published: "proposal",
  proposal_accepted: "proposal",
  contract_published: "contract",
  contract_accepted: "contract",
  payment_due: "payment",
  payment_overdue: "payment",
  event_upcoming: "calendar_event",
  task_overdue: "task",
  project_stage_changed: "project",
};

export const AUTOMATION_ACTION_TYPES = [
  "create_task",
  "create_reminder",
  "change_status",
  "log_activity",
  "prepare_email",
  "send_email",
] as const;

export type AutomationActionType = (typeof AUTOMATION_ACTION_TYPES)[number];

export const AUTOMATION_ACTION_LABELS: Record<AutomationActionType, string> = {
  create_task: "Creează task",
  create_reminder: "Creează reminder în calendar",
  change_status: "Schimbă status (limitat)",
  log_activity: "Înregistrează activitate",
  prepare_email: "Pregătește email (fără trimitere)",
  send_email: "Trimite email (necesită Resend)",
};

export const AUTOMATION_ACTION_DESCRIPTIONS: Record<AutomationActionType, string> = {
  create_task: "Adaugă un task nou în workspace, opțional cu termen și responsabil.",
  create_reminder: "Adaugă un eveniment de tip reminder în calendar.",
  change_status:
    "Schimbă statusul unui lead sau proiect — permis doar către statusuri valide din catalog.",
  log_activity: "Adaugă o intrare în jurnalul de activitate al workspace-ului.",
  prepare_email:
    "Pregătește conținutul unui email și îl loghează, fără să îl trimită efectiv.",
  send_email: "Trimite un email real prin Resend. Necesită RESEND_API_KEY configurat.",
};

export type ChangeStatusEntityType = "lead" | "project";

export type AutomationAction =
  | {
      type: "create_task";
      title: string;
      notes?: string;
      dueInDays?: number;
      assigneeId?: string | null;
      priority?: "low" | "normal" | "high" | "urgent";
    }
  | {
      type: "create_reminder";
      title: string;
      notes?: string;
      offsetMinutes?: number;
    }
  | {
      type: "change_status";
      entityType: ChangeStatusEntityType;
      toStatus: string;
    }
  | {
      type: "log_activity";
      title: string;
      description?: string;
    }
  | {
      type: "prepare_email";
      subject: string;
      body: string;
    }
  | {
      type: "send_email";
      subject: string;
      body: string;
      to?: string;
    };

export type AutomationConditionOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "exists";

export type AutomationCondition = {
  field: string;
  operator: AutomationConditionOperator;
  value?: string | number | boolean | null;
};

export const AUTOMATION_CONDITION_OPERATORS: AutomationConditionOperator[] = [
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "contains",
  "exists",
];

export const AUTOMATION_CONDITION_OPERATOR_LABELS: Record<AutomationConditionOperator, string> = {
  eq: "este egal cu",
  neq: "este diferit de",
  gt: "mai mare decât",
  gte: "mai mare sau egal cu",
  lt: "mai mic decât",
  lte: "mai mic sau egal cu",
  contains: "conține",
  exists: "există",
};

/**
 * Evaluate a flat list of AND-combined conditions against a metadata bag.
 * `field` is looked up as a direct key on `metadata` (no nested paths in MVP).
 * Unknown/malformed conditions are treated as non-matching (fail closed).
 */
export function evaluateConditions(
  conditions: AutomationCondition[],
  metadata: Record<string, unknown>,
): boolean {
  if (!conditions.length) return true;

  return conditions.every((condition) => {
    if (!condition || typeof condition.field !== "string") return false;
    const actual = metadata[condition.field];

    switch (condition.operator) {
      case "exists":
        return actual !== undefined && actual !== null && actual !== "";
      case "eq":
        return actual === condition.value;
      case "neq":
        return actual !== condition.value;
      case "gt":
        return typeof actual === "number" && typeof condition.value === "number" && actual > condition.value;
      case "gte":
        return typeof actual === "number" && typeof condition.value === "number" && actual >= condition.value;
      case "lt":
        return typeof actual === "number" && typeof condition.value === "number" && actual < condition.value;
      case "lte":
        return typeof actual === "number" && typeof condition.value === "number" && actual <= condition.value;
      case "contains":
        return (
          typeof actual === "string" &&
          typeof condition.value === "string" &&
          actual.toLowerCase().includes(condition.value.toLowerCase())
        );
      default:
        return false;
    }
  });
}

export function isAutomationTriggerKey(value: string): value is AutomationTriggerKey {
  return (AUTOMATION_TRIGGERS as readonly string[]).includes(value);
}

export function isAutomationActionType(value: string): value is AutomationActionType {
  return (AUTOMATION_ACTION_TYPES as readonly string[]).includes(value);
}

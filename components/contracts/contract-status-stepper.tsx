"use client";

import { Check } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { CONTRACT_STATUS_LABELS, type ContractStatus } from "@/lib/constants";
import { CONTRACT_STATUS_STEPS } from "@/lib/contracts/status";

const TERMINAL_STATUSES = ["cancelled", "expired", "superseded"] as const;
type TerminalStatus = (typeof TERMINAL_STATUSES)[number];

const TERMINAL_TONE: Record<TerminalStatus, "neutral" | "accent" | "warning" | "success" | "danger"> = {
  cancelled: "danger",
  expired: "neutral",
  superseded: "neutral",
};

function isTerminal(status: ContractStatus): status is TerminalStatus {
  return (TERMINAL_STATUSES as readonly string[]).includes(status);
}

type ContractStatusStepperProps = {
  effectiveStatus: ContractStatus;
};

function stepIndex(status: ContractStatus): number {
  const idx = CONTRACT_STATUS_STEPS.indexOf(status);
  return idx >= 0 ? idx : -1;
}

export function ContractStatusStepper({ effectiveStatus }: ContractStatusStepperProps) {
  if (isTerminal(effectiveStatus)) {
    return (
      <div className="flex items-center gap-2">
        <StatusBadge
          label={CONTRACT_STATUS_LABELS[effectiveStatus]}
          tone={TERMINAL_TONE[effectiveStatus]}
        />
        <span className="text-xs text-muted-soft">Status final — fluxul s-a oprit.</span>
      </div>
    );
  }

  const currentIdx = stepIndex(effectiveStatus);

  return (
    <ol className="flex flex-wrap items-center gap-2 sm:gap-0">
      {CONTRACT_STATUS_STEPS.map((step: ContractStatus, index: number) => {
        const isComplete = currentIdx > index;
        const isCurrent = currentIdx === index;
        const isUpcoming = currentIdx < index;

        return (
          <li key={step} className="flex items-center">
            {index > 0 ? (
              <span
                className={`mx-2 hidden h-px w-6 sm:block md:w-10 ${
                  isComplete || isCurrent ? "bg-champagne/50" : "bg-border"
                }`}
                aria-hidden
              />
            ) : null}
            <div
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                isCurrent
                  ? "border-champagne/40 bg-champagne/10 text-champagne-soft"
                  : isComplete
                    ? "border-champagne/20 bg-champagne/5 text-foreground"
                    : isUpcoming
                      ? "border-border bg-surface-elevated/40 text-muted-soft"
                      : "border-border text-muted-foreground"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium ${
                  isComplete
                    ? "bg-champagne text-background"
                    : isCurrent
                      ? "border border-champagne/50 text-champagne"
                      : "border border-border text-muted-soft"
                }`}
              >
                {isComplete ? <Check className="h-3 w-3" aria-hidden /> : index + 1}
              </span>
              <span className="font-medium">{CONTRACT_STATUS_LABELS[step]}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

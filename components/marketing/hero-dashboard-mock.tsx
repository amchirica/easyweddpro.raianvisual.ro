"use client";

import type { ReactNode } from "react";

import { useI18n } from "@/components/providers/i18n-provider";

/**
 * Lightweight DOM mock for the hero — illustrative UI only, not social proof.
 */
export function HeroDashboardMock() {
  const { t } = useI18n();

  return (
    <div
      aria-hidden="true"
      className="surface-card glow-accent relative mx-auto w-full max-w-3xl overflow-hidden p-4 sm:p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
        </div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground">
          {t("marketing.mock.workspace")}
        </p>
        <span className="rounded-full border border-champagne/30 bg-champagne/10 px-2.5 py-0.5 text-[0.65rem] font-medium text-champagne-soft">
          {t("marketing.mock.demoUi")}
        </span>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-3">
        <MockPanel title={t("marketing.mock.pipelineTitle")}>
          {[
            [t("marketing.mock.pipelineNew"), "8"],
            [t("marketing.mock.pipelineProposal"), "5"],
            [t("marketing.mock.pipelineNegotiation"), "3"],
            [t("marketing.mock.pipelineWon"), "2"],
          ].map(([label, count]) => (
            <div key={label} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium text-champagne">{count}</span>
            </div>
          ))}
        </MockPanel>

        <MockPanel title={t("marketing.mock.eventsTitle")}>
          {[
            ["12 AUG", t("marketing.mock.eventWedding")],
            ["20 AUG", t("marketing.mock.eventCorporate")],
            ["29 AUG", t("marketing.mock.eventVenue")],
          ].map(([when, title]) => (
            <div key={title} className="flex items-start gap-2 text-xs">
              <span className="shrink-0 font-medium text-champagne">{when}</span>
              <span className="truncate text-muted-foreground">{title}</span>
            </div>
          ))}
        </MockPanel>

        <MockPanel title={t("marketing.mock.contractTitle")}>
          <p className="text-xs font-medium text-foreground">{t("marketing.mock.contractPackage")}</p>
          <p className="text-[0.65rem] text-muted-soft">{t("marketing.mock.contractMeta")}</p>
          <span className="mt-2 inline-flex rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[0.6rem] text-success">
            {t("marketing.mock.contractSent")}
          </span>
        </MockPanel>

        <MockPanel title={t("marketing.mock.paymentsTitle")}>
          {[
            [t("marketing.mock.paymentDeposit"), t("marketing.mock.statusConfirmed")],
            [t("marketing.mock.paymentInstallment"), t("marketing.mock.statusDue")],
            [t("marketing.mock.paymentFinal"), t("marketing.mock.statusScheduled")],
          ].map(([label, status]) => (
            <div key={label} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{label}</span>
              <span className="text-champagne-soft">{status}</span>
            </div>
          ))}
        </MockPanel>

        <MockPanel title={t("marketing.mock.tasksTitle")}>
          {[
            t("marketing.mock.taskLogistics"),
            t("marketing.mock.taskFollowUp"),
            t("marketing.mock.taskChecklist"),
          ].map((task) => (
            <div key={task} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-champagne/70" />
              <span className="truncate">{task}</span>
            </div>
          ))}
        </MockPanel>

        <MockPanel title={t("marketing.mock.analyticsTitle")}>
          <div className="flex items-end gap-1.5 pt-1">
            {[40, 55, 48, 70, 62, 85, 78].map((h, i) => (
              <span
                key={i}
                className="w-full rounded-sm bg-champagne/40"
                style={{ height: `${h * 0.35}px` }}
              />
            ))}
          </div>
          <p className="mt-2 text-[0.65rem] text-muted-soft">{t("marketing.mock.analyticsMeta")}</p>
        </MockPanel>
      </div>
    </div>
  );
}

function MockPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface-elevated/60 p-3">
      <p className="mb-2 text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

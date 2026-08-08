"use client";

import { useI18n } from "@/components/providers/i18n-provider";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Check, ExternalLink, Pencil, RotateCcw, ScrollText, Trash2 } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
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
import {
  archiveProjectAction,
  restoreProjectAction,
  softDeleteProjectAction,
} from "@/lib/actions/projects";
import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/constants";
import { getPipelineTemplate } from "@/lib/events/project-pipelines";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";

export type ProjectDetailData = {
  id: string;
  name: string;
  status: ProjectStatus;
  pipelineKey: string;
  eventDate: string | null;
  deadline: string | null;
  progress: number;
  team: string[];
  location: string | null;
  notes: string | null;
  budget: number;
  cost: number;
  estimatedRevenue: number;
  currency: string;
  clientId: string | null;
  clientName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  contractId: string | null;
  contractNumber: string | null;
  contractTitle: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ProjectDetailProps = {
  project: ProjectDetailData;
  mode: "live" | "demo";
  canWrite: boolean;
  canDelete: boolean;
};

function PipelineStepper({ status, pipelineKey }: { status: ProjectStatus; pipelineKey: string }) {
  const template = getPipelineTemplate(pipelineKey);
  const currentIdx = template.stages.findIndex((stage) => stage.status === status);

  return (
    <ol className="flex flex-wrap items-center gap-2 sm:gap-0">
      {template.stages.map((stage, index) => {
        const isComplete = currentIdx > index;
        const isCurrent = currentIdx === index;
        const isUpcoming = currentIdx < index;

        return (
          <li key={`${stage.status}-${index}`} className="flex items-center">
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
              <span className="font-medium">{stage.label}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

const STATUS_TONE: Record<ProjectStatus, "neutral" | "accent" | "warning" | "success" | "danger"> = {
  booked: "accent",
  prep: "accent",
  logistics: "accent",
  event_done: "warning",
  follow_up: "warning",
  backup: "neutral",
  selection: "neutral",
  photo_edit: "neutral",
  video_edit: "neutral",
  album: "neutral",
  review: "warning",
  delivery: "warning",
  completed: "success",
};

export function ProjectDetail({ project, mode, canWrite, canDelete }: ProjectDetailProps) {
  const { t } = useI18n();
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  function requireLive(message: string): boolean {
    if (mode !== "live") {
      toast(message, "info");
      return false;
    }
    return true;
  }

  async function handleArchive() {
    if (!requireLive(t("modules.projects.needAccountArchive"))) {
      setArchiveOpen(false);
      return;
    }
    setArchiving(true);
    const result = await archiveProjectAction(project.id);
    setArchiving(false);
    setArchiveOpen(false);

    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    toast(result?.success ?? "Proiect arhivat.", "success");
    router.refresh();
  }

  async function handleRestore() {
    if (!requireLive(t("modules.projects.needAccountRestore"))) return;
    setRestoring(true);
    const result = await restoreProjectAction(project.id);
    setRestoring(false);

    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    toast(result?.success ?? "Proiect restaurat.", "success");
    router.refresh();
  }

  async function handleDelete() {
    if (!requireLive(t("modules.projects.needAccountDelete"))) {
      setDeleteOpen(false);
      return;
    }
    setDeleting(true);
    const result = await softDeleteProjectAction(project.id);
    setDeleting(false);
    setDeleteOpen(false);

    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    toast(result?.success ?? "Proiect șters.", "success");
    router.push("/dashboard/projects");
  }

  const margin = project.estimatedRevenue - project.cost;

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        {t("modules.projects.backToList")}
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-medium text-foreground">{project.name}</h1>
            <StatusBadge
              label={PROJECT_STATUS_LABELS[project.status]}
              tone={STATUS_TONE[project.status] ?? "neutral"}
            />
            {project.archivedAt ? <StatusBadge label="Arhivat" tone="neutral" /> : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {project.clientId ? (
              <Link
                href={`/dashboard/clients/${project.clientId}`}
                className="text-champagne hover:text-champagne-soft"
              >
                {project.clientName ?? "Client"}
              </Link>
            ) : (
              project.clientName ?? t("common.noClient")
            )}
            {project.location ? ` · ${project.location}` : ""}
          </p>
          <PipelineStepper status={project.status} pipelineKey={project.pipelineKey} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canWrite ? (
            <Button
              type="button"
              size="sm"
              render={<Link href={`/dashboard/projects/${project.id}/edit`} />}
              nativeButton={false}
            >
              <Pencil data-icon="inline-start" />
              {t("common.edit")}
            </Button>
          ) : null}
          {canWrite && !project.archivedAt ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setArchiveOpen(true)}>
              {t("common.archive")}
            </Button>
          ) : null}
          {canWrite && project.archivedAt ? (
            <Button type="button" variant="outline" size="sm" onClick={handleRestore} disabled={restoring}>
              <RotateCcw data-icon="inline-start" />
              {restoring ? t("modules.projects.restoring") : t("common.restore")}
            </Button>
          ) : null}
          {canDelete ? (
            <Button type="button" variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 data-icon="inline-start" />
              {t("common.delete")}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="surface-card space-y-2 p-5">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">Buget</p>
          <p className="font-heading text-xl font-medium text-foreground">
            {formatCurrency(project.budget, project.currency)}
          </p>
        </div>
        <div className="surface-card space-y-2 p-5">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">Cost</p>
          <p className="font-heading text-xl font-medium text-foreground">
            {formatCurrency(project.cost, project.currency)}
          </p>
        </div>
        <div className="surface-card space-y-2 p-5">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">Venit estimat</p>
          <p className="font-heading text-xl font-medium text-champagne">
            {formatCurrency(project.estimatedRevenue, project.currency)}
          </p>
        </div>
        <div className="surface-card space-y-2 p-5">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{t("modules.projects.margin")}</p>
          <p className={`font-heading text-xl font-medium ${margin >= 0 ? "text-foreground" : "text-destructive"}`}>
            {formatCurrency(margin, project.currency)}
          </p>
        </div>
      </div>

      <div className="surface-card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">Progres</p>
          <p className="text-xs text-muted-soft">{project.progress}%</p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-champagne"
            style={{ width: `${Math.min(100, Math.max(0, project.progress))}%` }}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card space-y-2 p-5">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">Eveniment</p>
          <p className="text-sm text-foreground">
            {project.eventDate ? formatDate(project.eventDate) : t("modules.projects.noDateSet")}
          </p>
          <p className="text-xs text-muted-soft">
            Termen livrare: {project.deadline ? formatDate(project.deadline) : "—"}
          </p>
        </div>
        <div className="surface-card space-y-2 p-5">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{t("modules.projects.team")}</p>
          {project.team.length ? (
            <div className="flex flex-wrap gap-1.5">
              {project.team.map((member) => (
                <StatusBadge key={member} label={member} tone="neutral" />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-soft">{t("modules.projects.noAssignees")}</p>
          )}
        </div>
      </div>

      {project.contractId ? (
        <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ScrollText className="h-4 w-4 shrink-0" aria-hidden />
            Generat din contract {project.contractNumber ?? project.contractTitle ?? ""}
          </div>
          <Link
            href={`/dashboard/contracts/${project.contractId}`}
            className="inline-flex items-center gap-1.5 text-sm text-champagne hover:text-champagne-soft"
          >
            Vezi contractul
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      ) : null}

      {project.notes ? (
        <div className="surface-card space-y-2 p-5">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{t("modules.leads.notesLabel")}</p>
          <p className="text-sm whitespace-pre-wrap text-foreground">{project.notes}</p>
        </div>
      ) : null}

      <div className="surface-card grid gap-3 p-5 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-soft">Creat</p>
          <p className="text-foreground">{formatDateTime(project.createdAt)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-soft">Ultima actualizare</p>
          <p className="text-foreground">{formatDateTime(project.updatedAt)}</p>
        </div>
      </div>

      <Dialog open={archiveOpen} onOpenChange={(next) => !archiving && setArchiveOpen(next)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Arhivezi acest proiect?</DialogTitle>
            <DialogDescription>
              {t("modules.projects.archiveConfirm")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setArchiveOpen(false)} disabled={archiving}>
              {t("common.dismiss")}
            </Button>
            <Button type="button" onClick={handleArchive} disabled={archiving}>
              {archiving ? t("modules.projects.archiving") : t("modules.projects.archiveProject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={(next) => !deleting && setDeleteOpen(next)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("modules.projects.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("modules.projects.deleteConfirm")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              {t("common.dismiss")}
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? t("modules.projects.deleting") : t("modules.projects.deleteProject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

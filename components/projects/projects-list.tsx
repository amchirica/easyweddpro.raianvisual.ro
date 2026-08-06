"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FolderKanban, Lock, Plus, Search } from "lucide-react";

import { DemoBanner } from "@/components/shared/demo-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { ModuleShell } from "@/components/shared/module-shell";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/constants";
import { getPipelineTemplate } from "@/lib/events/project-pipelines";
import { formatCurrency, formatDate } from "@/lib/format";

export type ProjectListItem = {
  id: string;
  name: string;
  clientName: string | null;
  eventDate: string | null;
  status: ProjectStatus;
  pipelineKey: string;
  budget: number;
  estimatedRevenue: number;
  currency: string;
  progress: number;
  archivedAt: string | null;
};

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

type ProjectsListProps = {
  initialProjects: ProjectListItem[];
  mode: "live" | "demo";
  canWrite: boolean;
  error?: string | null;
};

export function ProjectsList({ initialProjects, mode, canWrite, error }: ProjectsListProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "all">("all");
  const canCreate = mode === "demo" || canWrite;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return initialProjects.filter((project) => {
      if (status !== "all" && project.status !== status) return false;
      if (!query) return true;
      const haystack = `${project.name} ${project.clientName ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [initialProjects, search, status]);

  return (
    <ModuleShell
      title="Proiecte"
      description="Pipeline configurabil — de la rezervare la închiderea proiectului."
      actions={
        canCreate ? (
          <Button type="button" render={<Link href="/dashboard/projects/new" />} nativeButton={false}>
            <Plus data-icon="inline-start" />
            Proiect nou
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-5">
        {mode === "demo" ? <DemoBanner /> : null}

        {error ? (
          <p
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {!canWrite && mode === "live" ? (
          <div className="flex items-center gap-2 rounded-md border border-border bg-surface-elevated/40 px-3 py-2 text-sm text-muted-foreground">
            <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Ai acces doar de vizualizare la proiecte în acest workspace.
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block max-w-sm flex-1">
            <span className="sr-only">Căutare proiecte</span>
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Caută după nume proiect sau client…"
              className="h-9 pl-9"
            />
          </label>

          <Select value={status} onValueChange={(value) => setStatus((value as ProjectStatus | "all") ?? "all")}>
            <SelectTrigger className="h-9 w-full sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate statusurile</SelectItem>
              {PROJECT_STATUSES.map((item) => (
                <SelectItem key={item} value={item}>
                  {PROJECT_STATUS_LABELS[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title={initialProjects.length === 0 ? "Niciun proiect" : "Niciun proiect găsit"}
            description={
              initialProjects.length === 0
                ? "Proiectele apar automat după acceptarea unui contract sau pot fi create manual."
                : "Încearcă alți termeni de căutare sau alt filtru de status."
            }
            action={
              initialProjects.length === 0 && canCreate ? (
                <Button type="button" render={<Link href="/dashboard/projects/new" />} nativeButton={false}>
                  <Plus data-icon="inline-start" />
                  Proiect nou
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="surface-card group flex flex-col gap-4 p-5 transition-colors hover:border-champagne/25"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-heading text-lg font-medium text-foreground">
                      {project.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{project.clientName ?? "Fără client"}</p>
                  </div>
                  <StatusBadge
                    label={PROJECT_STATUS_LABELS[project.status]}
                    tone={STATUS_TONE[project.status] ?? "neutral"}
                  />
                </div>

                <p className="text-xs text-muted-soft">{getPipelineTemplate(project.pipelineKey).label}</p>

                <div className="space-y-1.5">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-champagne"
                      style={{ width: `${Math.min(100, Math.max(0, project.progress))}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-soft">{project.progress}% finalizat</p>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                  <div>
                    <p className="text-xs text-muted-soft">
                      {project.eventDate ? formatDate(project.eventDate) : "Fără dată eveniment"}
                    </p>
                    <p className="font-heading text-lg font-medium text-champagne">
                      {formatCurrency(project.estimatedRevenue || project.budget, project.currency)}
                    </p>
                  </div>
                  {project.archivedAt ? (
                    <StatusBadge label="Arhivat" tone="neutral" />
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </ModuleShell>
  );
}

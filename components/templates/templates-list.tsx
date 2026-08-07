"use client";

import { useI18n } from "@/components/providers/i18n-provider";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Copy,
  FileStack,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ModuleShell } from "@/components/shared/module-shell";
import { StatusBadge } from "@/components/shared/status-badge";
import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  archiveTemplateAction,
  duplicateTemplateAction,
  setDefaultTemplateAction,
  softDeleteTemplateAction,
  unarchiveTemplateAction,
} from "@/lib/actions/templates";
import { formatDate } from "@/lib/format";
import {
  TEMPLATE_TYPE_LABELS,
  TEMPLATE_TYPES,
  type TemplateType,
} from "@/lib/validations/templates";

export type TemplateListItem = {
  id: string;
  type: TemplateType;
  name: string;
  category: string;
  isDefault: boolean;
  archivedAt: string | null;
  updatedAt: string;
  variableCount: number;
};

type TemplatesListProps = {
  initialTemplates: TemplateListItem[];
  canWrite: boolean;
  error?: string | null;
};

export function TemplatesList({ initialTemplates, canWrite, error }: TemplatesListProps) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TemplateType | "all">("all");
  const [showArchived, setShowArchived] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return initialTemplates.filter((template) => {
      if (typeFilter !== "all" && template.type !== typeFilter) return false;
      if (showArchived ? !template.archivedAt : Boolean(template.archivedAt)) return false;
      if (!query) return true;
      return `${template.name} ${template.category}`.toLowerCase().includes(query);
    });
  }, [initialTemplates, search, typeFilter, showArchived]);

  async function runAction(
    id: string,
    action: () => Promise<{ error?: string; success?: string }>,
  ) {
    setBusyId(id);
    const result = await action();
    setBusyId(null);
    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    toast(result?.success ?? "Salvat.", "success");
    router.refresh();
  }

  async function handleDuplicate(template: TemplateListItem) {
    setBusyId(template.id);
    const result = await duplicateTemplateAction(template.id);
    setBusyId(null);
    if (result?.error || !result?.data) {
      toast(result?.error ?? "Nu am putut duplica template-ul.", "error");
      return;
    }
    toast(result.success ?? "Template duplicat.", "success");
    router.push(`/dashboard/templates/${result.data.template.id}`);
  }

  function handleDelete(template: TemplateListItem) {
    if (!window.confirm(t("modules.templates.deleteConfirm", { name: template.name }))) return;
    void runAction(template.id, () => softDeleteTemplateAction(template.id));
  }

  return (
    <ModuleShell
      title={t("modules.templates.title")}
      description={t("modules.templates.description")}
      actions={
        canWrite ? (
          <Button type="button" render={<Link href="/dashboard/templates/new" />} nativeButton={false}>
            <Plus data-icon="inline-start" />
            Template nou
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-5">
        {error ? (
          <p
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <label className="relative block max-w-sm flex-1">
            <span className="sr-only">{t("modules.templates.searchSr")}</span>
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("modules.templates.searchPlaceholder")}
              className="h-9 pl-9"
            />
          </label>
          <Select
            value={typeFilter}
            onValueChange={(value) => setTypeFilter((value as TemplateType | "all") ?? "all")}
          >
            <SelectTrigger className="h-9 w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate tipurile</SelectItem>
              {TEMPLATE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {TEMPLATE_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant={showArchived ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowArchived((current) => !current)}
          >
            <Archive data-icon="inline-start" />
            {showArchived ? t("modules.templates.hidingArchived") : t("modules.templates.showArchived")}
          </Button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={FileStack}
            title={showArchived ? t("modules.templates.emptyArchive") : t("modules.templates.empty")}
            description={
              showArchived
                ? "Template-urile arhivate apar aici."
                : t("modules.templates.emptyHint")
            }
            action={
              !showArchived && canWrite ? (
                <Button type="button" render={<Link href="/dashboard/templates/new" />} nativeButton={false}>
                  <Plus data-icon="inline-start" />
                  Template nou
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((template) => (
              <div key={template.id} className="surface-card flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/dashboard/templates/${template.id}`}
                        className="truncate font-heading text-lg font-medium text-foreground hover:text-champagne"
                      >
                        {template.name}
                      </Link>
                      {template.isDefault ? (
                        <Star
                          className="h-3.5 w-3.5 shrink-0 fill-champagne text-champagne"
                          aria-label="Implicit"
                        />
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">{template.category}</p>
                  </div>
                  <StatusBadge label={TEMPLATE_TYPE_LABELS[template.type]} tone="accent" />
                </div>

                <p className="text-xs text-muted-soft">
                  {template.variableCount} variabile · Actualizat {formatDate(template.updatedAt)}
                </p>

                <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    render={<Link href={`/dashboard/templates/${template.id}`} />}
                    nativeButton={false}
                  >
                    <Pencil data-icon="inline-start" />
                    Editează
                  </Button>
                  {canWrite ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            disabled={busyId === template.id}
                          />
                        }
                      >
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!template.isDefault && !template.archivedAt ? (
                          <DropdownMenuItem
                            onClick={() =>
                              runAction(template.id, () => setDefaultTemplateAction(template.id))
                            }
                          >
                            <Star data-icon="inline-start" />
                            {t("modules.templates.setDefault")}
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                          <Copy data-icon="inline-start" />
                          Duplică
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {template.archivedAt ? (
                          <DropdownMenuItem
                            onClick={() =>
                              runAction(template.id, () => unarchiveTemplateAction(template.id))
                            }
                          >
                            <ArchiveRestore data-icon="inline-start" />
                            {t("modules.templates.restoreArchive")}
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() =>
                              runAction(template.id, () => archiveTemplateAction(template.id))
                            }
                          >
                            <Archive data-icon="inline-start" />
                            Arhivează
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem variant="destructive" onClick={() => handleDelete(template)}>
                          <Trash2 data-icon="inline-start" />
                          Șterge
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ModuleShell>
  );
}

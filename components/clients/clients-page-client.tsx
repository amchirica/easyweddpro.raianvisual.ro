"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Contact, Mail, MapPin, Phone, Search, UserPlus } from "lucide-react";

import { useI18n } from "@/components/providers/i18n-provider";
import { DemoBanner } from "@/components/shared/demo-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { ModuleShell } from "@/components/shared/module-shell";
import { StatusBadge } from "@/components/shared/status-badge";
import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import type { ClientViewModel } from "@/lib/crm/mappers";
import { formatCurrency, formatDate } from "@/lib/format";

const STATUS_LABELS: Record<string, string> = {
  active: "Activ",
  past: "Finalizat",
  lead_converted: "Convertit din lead",
};

const STATUS_TONE: Record<string, "success" | "neutral" | "accent"> = {
  active: "success",
  past: "neutral",
  lead_converted: "accent",
};

type ClientsPageClientProps = {
  initialClients: ClientViewModel[];
  mode: "live" | "demo";
  error?: string | null;
};

export function ClientsPageClient({ initialClients, mode, error }: ClientsPageClientProps) {
  const { t } = useI18n();
  const [clients, setClients] = useState<ClientViewModel[]>(initialClients);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const { toast } = useToast();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return clients;
    return clients.filter((client) =>
      `${client.name} ${client.email} ${client.phone} ${client.city}`
        .toLowerCase()
        .includes(query),
    );
  }, [clients, search]);

  function handleCreateClick() {
    if (mode !== "live") {
      toast(t("common.needAccountAction"), "info");
      return;
    }
    setCreateOpen(true);
  }

  return (
    <ModuleShell
      title={t("modules.clients.title")}
      description={t("modules.clients.description")}
      actions={
        <Button type="button" onClick={handleCreateClick}>
          <UserPlus data-icon="inline-start" />
          {t("modules.clients.new")}
        </Button>
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

        <label className="relative block max-w-sm">
          <span className="sr-only">{t("modules.clients.searchSr")}</span>
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("modules.clients.searchPlaceholder")}
            className="h-9 pl-9"
          />
        </label>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Contact}
            title={t("modules.clients.empty")}
            description={t("modules.clients.emptyHint")}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((client) => (
              <Link
                key={client.id}
                href={`/dashboard/clients/${client.id}`}
                className="surface-card group flex flex-col gap-4 p-5 transition-colors hover:border-champagne/25"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-heading text-lg font-medium text-foreground">
                      {client.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{client.eventType || "—"}</p>
                  </div>
                  <StatusBadge
                    label={STATUS_LABELS[client.status] ?? client.status}
                    tone={STATUS_TONE[client.status] ?? "neutral"}
                  />
                </div>

                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2 truncate">
                    <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {client.email || "—"}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {client.phone || "—"}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {client.city || "—"}
                  </p>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                  <div>
                    <p className="text-xs text-muted-soft">
                      {client.eventDate ? formatDate(client.eventDate) : "—"}
                    </p>
                    <p className="font-heading text-lg font-medium text-champagne">
                      {formatCurrency(client.totalValue)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground group-hover:text-champagne"
                    aria-hidden
                    tabIndex={-1}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <ClientFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        onSuccess={(client) => {
          setClients((current) => [client, ...current]);
        }}
      />
    </ModuleShell>
  );
}

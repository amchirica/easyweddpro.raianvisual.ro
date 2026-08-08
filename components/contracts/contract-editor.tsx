"use client";

import { useI18n } from "@/components/providers/i18n-provider";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateContractDraftAction } from "@/lib/actions/contracts";
import {
  CONTRACT_SECTION_KEYS,
  DEFAULT_CONTRACT_SECTIONS,
  REQUIRED_CONTRACT_SECTION_KEYS,
  type ContractParty,
  type ContractSections,
  type ContractServiceItem,
  type CustomContractSection,
} from "@/lib/contracts/content";
import { computeContractMoney } from "@/lib/contracts/money";
import { formatCurrency } from "@/lib/format";

export type ContractEditorInitialData = {
  title: string;
  currency: string;
  eventDate: string | null;
  eventLocation: string | null;
  validUntil: string | null;
  terms: string | null;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  depositAmount: number;
  provider: ContractParty;
  client: ContractParty;
  services: ContractServiceItem[];
  sections: ContractSections;
  customSections?: CustomContractSection[];
};

type ServiceDraft = {
  key: string;
  name: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
};

/* section labels via t(`modules.contracts.sections.*`) */

const REQUIRED_SECTION_SET = new Set<string>(REQUIRED_CONTRACT_SECTION_KEYS);

function createEmptyService(): ServiceDraft {
  return {
    key: crypto.randomUUID(),
    name: "",
    quantity: "1",
    unitPrice: "0",
    lineTotal: "0",
  };
}

function serviceFromItem(item: ContractServiceItem): ServiceDraft {
  return {
    key: crypto.randomUUID(),
    name: item.name,
    quantity: String(item.quantity),
    unitPrice: String(item.unitPrice),
    lineTotal: String(item.lineTotal),
  };
}

function createCustomSection(sortOrder: number): CustomContractSection {
  return {
    id: crypto.randomUUID(),
    title: "", // set via t when adding
    content: "",
    sortOrder,
  };
}

type ContractEditorProps = {
  contractId: string;
  initial: ContractEditorInitialData;
  canWrite: boolean;
  onSaved?: () => void;
};

export function ContractEditor({ contractId, initial, canWrite, onSaved }: ContractEditorProps) {
  const { t } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(initial.title);
  const [eventDate, setEventDate] = useState(initial.eventDate ?? "");
  const [eventLocation, setEventLocation] = useState(initial.eventLocation ?? "");
  const [validUntil, setValidUntil] = useState(initial.validUntil ?? "");
  const [terms, setTerms] = useState(initial.terms ?? "");
  const [depositAmount, setDepositAmount] = useState(String(initial.depositAmount));
  const [provider, setProvider] = useState<ContractParty>({ ...initial.provider });
  const [client, setClient] = useState<ContractParty>({ ...initial.client });
  const [services, setServices] = useState<ServiceDraft[]>(
    initial.services.length ? initial.services.map(serviceFromItem) : [createEmptyService()],
  );
  const [sections, setSections] = useState<ContractSections>({
    ...DEFAULT_CONTRACT_SECTIONS,
    ...initial.sections,
  });
  const [customSections, setCustomSections] = useState<CustomContractSection[]>(
    [...(initial.customSections ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
  );

  const disabled = !canWrite;

  const moneyPreview = useMemo(() => {
    try {
      const parsedServices = services.map((item) => ({
        name: item.name.trim(),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal),
      }));
      const subtotal = parsedServices.reduce((sum, item) => sum + item.lineTotal, 0);
      return computeContractMoney({
        subtotal,
        discountAmount: initial.discountAmount,
        taxAmount: initial.taxAmount,
        total: subtotal - initial.discountAmount + initial.taxAmount,
        depositAmount: Number(depositAmount || 0),
      });
    } catch {
      return null;
    }
  }, [services, depositAmount, initial.discountAmount, initial.taxAmount]);

  function updateProvider(patch: Partial<ContractParty>) {
    setProvider((prev) => ({ ...prev, ...patch }));
  }

  function updateClient(patch: Partial<ContractParty>) {
    setClient((prev) => ({ ...prev, ...patch }));
  }

  function updateService(index: number, patch: Partial<ServiceDraft>) {
    setServices((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const next = { ...item, ...patch };
        if ("quantity" in patch || "unitPrice" in patch) {
          const qty = Number(next.quantity);
          const unit = Number(next.unitPrice);
          if (!Number.isNaN(qty) && !Number.isNaN(unit)) {
            next.lineTotal = String(Math.max(qty * unit, 0));
          }
        }
        return next;
      }),
    );
  }

  function moveCustomSection(index: number, direction: -1 | 1) {
    setCustomSections((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(nextIndex, 0, item!);
      return copy.map((section, sortOrder) => ({ ...section, sortOrder }));
    });
  }

  function removeCustomSection(index: number) {
    const target = customSections[index];
    if (target?.isRequired) {
      toast("Această secțiune este obligatorie și nu poate fi ștearsă.", "error");
      return;
    }
    setCustomSections((prev) =>
      prev.filter((_, i) => i !== index).map((section, sortOrder) => ({ ...section, sortOrder })),
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (disabled || saving) return;

    const parsedServices: ContractServiceItem[] = services
      .filter((item) => item.name.trim())
      .map((item) => ({
        name: item.name.trim(),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal),
        discount: 0,
      }));

    if (!parsedServices.length) {
      toast("Adaugă cel puțin un serviciu.", "error");
      return;
    }

    let money;
    try {
      const subtotal = parsedServices.reduce((sum, item) => sum + item.lineTotal, 0);
      money = computeContractMoney({
        subtotal,
        discountAmount: initial.discountAmount,
        taxAmount: initial.taxAmount,
        total: subtotal - initial.discountAmount + initial.taxAmount,
        depositAmount: Number(depositAmount),
      });
    } catch {
      toast("Valorile financiare sunt invalide.", "error");
      return;
    }

    setSaving(true);
    try {
      const result = await updateContractDraftAction({
        contractId,
        title: title.trim(),
        currency: initial.currency,
        eventDate: eventDate || null,
        eventLocation: eventLocation.trim() || null,
        validUntil: validUntil || null,
        terms: terms.trim() || null,
        subtotal: money.subtotal,
        discountAmount: money.discountAmount,
        taxAmount: money.taxAmount,
        total: money.total,
        depositAmount: money.depositAmount,
        provider: {
          name: provider.name.trim(),
          email: provider.email?.trim() || null,
          phone: provider.phone?.trim() || null,
          address: provider.address?.trim() || null,
          fiscalCode: provider.fiscalCode?.trim() || null,
          regCom: provider.regCom?.trim() || null,
        },
        client: {
          name: client.name.trim(),
          email: client.email?.trim() || null,
          phone: client.phone?.trim() || null,
          address: client.address?.trim() || null,
          fiscalCode: client.fiscalCode?.trim() || null,
          regCom: client.regCom?.trim() || null,
        },
        services: parsedServices,
        sections,
        customSections: customSections.map((section, index) => ({
          ...section,
          title: section.title.trim() || t("modules.contracts.sectionN", { n: index + 1 }),
          sortOrder: index,
        })),
        installments: [],
      });

      if (result?.error) {
        toast(result.error, "error");
        return;
      }

      toast(result?.success ?? "Contract salvat.", "success");
      onSaved?.();
      router.refresh();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Update contract draft failed", {
          operation: "updateContractDraft",
          message: error instanceof Error ? error.message : String(error),
        });
      }
      toast("Contractul nu a putut fi salvat. Verifică datele și încearcă din nou.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="surface-card space-y-4 p-5">
        <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Detalii contract
        </p>
        <div className="space-y-2">
          <Label htmlFor="contract-title">Titlu</Label>
          <Input
            id="contract-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={disabled}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="contract-event-date">Data eveniment</Label>
            <Input
              id="contract-event-date"
              type="date"
              value={eventDate}
              onChange={(event) => setEventDate(event.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contract-event-location">{t("modules.contracts.eventLocation")}</Label>
            <Input
              id="contract-event-location"
              value={eventLocation}
              onChange={(event) => setEventLocation(event.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contract-valid-until">{t("modules.contracts.acceptUntil")}</Label>
            <Input
              id="contract-valid-until"
              type="date"
              value={validUntil}
              onChange={(event) => setValidUntil(event.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PartyFields
          title="Furnizor"
          party={provider}
          onChange={updateProvider}
          disabled={disabled}
          prefix="provider"
        />
        <PartyFields
          title="Client"
          party={client}
          onChange={updateClient}
          disabled={disabled}
          prefix="client"
        />
      </div>

      <div className="surface-card space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Servicii / produse
          </p>
          {!disabled ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setServices((s) => [...s, createEmptyService()])}
            >
              <Plus data-icon="inline-start" />
              Linie
            </Button>
          ) : null}
        </div>
        <div className="space-y-3">
          {services.map((item, index) => (
            <div
              key={item.key}
              className="grid gap-3 rounded-xl border border-border bg-surface-elevated/40 p-4 sm:grid-cols-[1fr_80px_100px_100px_auto]"
            >
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-soft">{t("modules.proposals.itemName")}</Label>
                <Input
                  value={item.name}
                  onChange={(event) => updateService(index, { name: event.target.value })}
                  disabled={disabled}
                  placeholder="Serviciu sau produs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-soft">Cant.</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.quantity}
                  onChange={(event) => updateService(index, { quantity: event.target.value })}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-soft">{t("modules.contracts.unitPrice")}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(event) => updateService(index, { unitPrice: event.target.value })}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-soft">{t("modules.proposals.lineTotal")}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.lineTotal}
                  onChange={(event) => updateService(index, { lineTotal: event.target.value })}
                  disabled={disabled}
                />
              </div>
              {!disabled && services.length > 1 ? (
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setServices((s) => s.filter((_, i) => i !== index))}
                    aria-label={t("modules.contracts.deleteLine")}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contract-deposit">Avans</Label>
            <Input
              id="contract-deposit"
              type="number"
              min="0"
              step="0.01"
              value={depositAmount}
              onChange={(event) => setDepositAmount(event.target.value)}
              disabled={disabled}
            />
          </div>
          {moneyPreview ? (
            <div className="space-y-1 text-sm sm:text-right">
              <p className="text-muted-foreground">
                Total:{" "}
                <span className="font-medium text-champagne">
                  {formatCurrency(moneyPreview.total, initial.currency)}
                </span>
              </p>
              <p className="text-muted-soft">
                {t("modules.contracts.remainingPayment", { amount: formatCurrency(moneyPreview.remainingAmount, initial.currency) })}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="surface-card space-y-2 p-5">
        <Label htmlFor="contract-terms">{t("modules.contracts.generalTerms")}</Label>
        <Textarea
          id="contract-terms"
          value={terms}
          onChange={(event) => setTerms(event.target.value)}
          disabled={disabled}
          rows={4}
        />
      </div>

      <div className="space-y-4">
        <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          {t("modules.contracts.clauses")}
        </p>
        {CONTRACT_SECTION_KEYS.map((key) => (
          <div key={key} className="surface-card space-y-2 p-5">
            <Label htmlFor={`section-${key}`}>
              {t(`modules.contracts.sections.${key === "privacy" ? "privacy_gdpr" : key}`)}
              {REQUIRED_SECTION_SET.has(key) ? (
                <span className="ml-2 text-[0.65rem] uppercase tracking-wide text-muted-soft">
                  recomandat
                </span>
              ) : null}
            </Label>
            <Textarea
              id={`section-${key}`}
              value={sections[key] ?? ""}
              onChange={(event) =>
                setSections((prev) => ({
                  ...prev,
                  [key]: event.target.value,
                }))
              }
              disabled={disabled}
              rows={key === "notes" || key === "special_clauses" ? 3 : 4}
            />
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            {t("modules.contracts.customSections")}
          </p>
          {!disabled ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setCustomSections((prev) => [...prev, { ...createCustomSection(prev.length), title: t("modules.contracts.customSection") }])
              }
            >
              <Plus data-icon="inline-start" />
              {t("modules.contracts.addSection")}
            </Button>
          ) : null}
        </div>

        {customSections.length === 0 ? (
          <p className="text-sm text-muted-soft">{t("modules.contracts.noCustomSections")}</p>
        ) : (
          customSections.map((section, index) => (
            <div key={section.id} className="surface-card space-y-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor={`custom-title-${section.id}`}>{t("modules.contracts.sectionTitle")}</Label>
                {!disabled ? (
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => moveCustomSection(index, -1)}
                      disabled={index === 0}
                      aria-label={t("modules.contracts.moveUp")}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => moveCustomSection(index, 1)}
                      disabled={index === customSections.length - 1}
                      aria-label={t("modules.contracts.moveDown")}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeCustomSection(index)}
                      aria-label={t("modules.contracts.deleteSection")}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ) : null}
              </div>
              <Input
                id={`custom-title-${section.id}`}
                value={section.title}
                onChange={(event) =>
                  setCustomSections((prev) =>
                    prev.map((item, i) =>
                      i === index ? { ...item, title: event.target.value } : item,
                    ),
                  )
                }
                disabled={disabled}
              />
              <Textarea
                value={section.content}
                onChange={(event) =>
                  setCustomSections((prev) =>
                    prev.map((item, i) =>
                      i === index ? { ...item, content: event.target.value } : item,
                    ),
                  )
                }
                disabled={disabled}
                rows={4}
              />
            </div>
          ))
        )}
      </div>

      {!disabled ? (
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/dashboard/contracts/${contractId}`)}
          >
            {t("common.preview")}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? t("common.saving") : t("modules.contracts.saveDraft")}
          </Button>
        </div>
      ) : null}
    </form>
  );
}

type PartyFieldsProps = {
  title: string;
  party: ContractParty;
  onChange: (patch: Partial<ContractParty>) => void;
  disabled: boolean;
  prefix: string;
};

function PartyFields({ title, party, onChange, disabled, prefix }: PartyFieldsProps) {
  const { t } = useI18n();
  return (
    <div className="surface-card space-y-3 p-5">
      <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{title}</p>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-name`}>{t("modules.contracts.partyName")}</Label>
        <Input
          id={`${prefix}-name`}
          value={party.name}
          onChange={(event) => onChange({ name: event.target.value })}
          disabled={disabled}
          required
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-email`}>{t("common.email")}</Label>
          <Input
            id={`${prefix}-email`}
            type="email"
            value={party.email ?? ""}
            onChange={(event) => onChange({ email: event.target.value })}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-phone`}>{t("common.phone")}</Label>
          <Input
            id={`${prefix}-phone`}
            value={party.phone ?? ""}
            onChange={(event) => onChange({ phone: event.target.value })}
            disabled={disabled}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-address`}>{t("common.address")}</Label>
        <Input
          id={`${prefix}-address`}
          value={party.address ?? ""}
          onChange={(event) => onChange({ address: event.target.value })}
          disabled={disabled}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-fiscal`}>CUI / CIF</Label>
          <Input
            id={`${prefix}-fiscal`}
            value={party.fiscalCode ?? ""}
            onChange={(event) => onChange({ fiscalCode: event.target.value })}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-regcom`}>Reg. Com.</Label>
          <Input
            id={`${prefix}-regcom`}
            value={party.regCom ?? ""}
            onChange={(event) => onChange({ regCom: event.target.value })}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}

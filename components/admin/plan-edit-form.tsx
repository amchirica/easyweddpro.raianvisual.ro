"use client";

import { useI18n } from "@/components/providers/i18n-provider";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updatePlanAction } from "@/lib/actions/platform-admin";

export function PlanEditForm({
  planId,
  initial,
}: {
  planId: string;
  initial: {
    name: string;
    description: string;
    priceMonthly: number;
    visible: boolean;
    active: boolean;
    highlighted: boolean;
  };
}) {
  const { t } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [priceMonthly, setPriceMonthly] = useState(String(initial.priceMonthly));
  const [visible, setVisible] = useState(initial.visible);
  const [active, setActive] = useState(initial.active);
  const [highlighted, setHighlighted] = useState(initial.highlighted);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="plan-name">Nume</Label>
          <Input id="plan-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="plan-price">{t("admin.monthlyPrice")}</Label>
          <Input
            id="plan-price"
            type="number"
            min={0}
            value={priceMonthly}
            onChange={(e) => setPriceMonthly(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="plan-description">Descriere</Label>
        <Textarea
          id="plan-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
          Vizibil
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Activ
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={highlighted}
            onChange={(e) => setHighlighted(e.target.checked)}
          />
          {t("admin.highlighted")}
        </label>
      </div>

      <AdminConfirmDialog
        trigger={
          <Button type="button" size="sm">
            {t("admin.savePlan")}
          </Button>
        }
        title={t("admin.confirmPlanUpdate")}
        description={t("admin.planUpdateDesc")}
        confirmLabel={t("common.save")}
        onConfirm={async (reason) => {
          const price = Number.parseInt(priceMonthly, 10);
          if (!Number.isFinite(price) || price < 0) {
            throw new Error(t("admin.invalidPrice"));
          }
          const result = await updatePlanAction({
            planId,
            name,
            description,
            priceMonthly: price,
            visible,
            active,
            highlighted,
            reason,
          });
          if (result?.error) throw new Error(result.error);
          toast(result?.success ?? "Plan actualizat.", "success");
          router.refresh();
        }}
      />
    </div>
  );
}

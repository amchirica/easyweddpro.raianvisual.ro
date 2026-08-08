"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import { useRouter } from "next/navigation";

import { endInspectSessionAction } from "@/lib/actions/platform-admin";
import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";

export function InspectBanner({
  workspaceName,
  reason,
  adminEmail,
}: {
  workspaceName: string;
  reason: string;
  adminEmail?: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const { toast } = useToast();

  async function endSession() {
    const result = await endInspectSessionAction();
    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    toast(result.success ?? t("admin.sessionClosed"), "success");
    router.push("/admin/workspaces");
    router.refresh();
  }

  return (
    <div className="border-b border-amber-400/40 bg-amber-500/15 px-4 py-3 text-sm text-amber-50">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3">
        <p>
          <span className="font-medium">
            {t("admin.inspectingAs", { email: adminEmail ?? "admin" })}
          </span>
          {" · "}
          {workspaceName}
          {" · "}
          <span className="text-amber-100/80">
            {t("admin.reasonLabel", { reason })}
          </span>
        </p>
        <Button type="button" size="sm" variant="outline" onClick={() => void endSession()}>
          {t("admin.closeInspect")}
        </Button>
      </div>
    </div>
  );
}

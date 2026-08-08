"use client";

import { useI18n } from "@/components/providers/i18n-provider";

import { useEffect, useState, type FormEvent } from "react";
import { Check, Copy, UserPlus } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviteMemberAction } from "@/lib/actions/team";
import { WORKSPACE_ROLE_LABELS, type WorkspaceRole } from "@/lib/constants";
import { inviteMemberSchema } from "@/lib/validations/team";

const INVITABLE_ROLES: WorkspaceRole[] = [
  "admin",
  "manager",
  "sales",
  "editor",
  "collaborator",
  "viewer",
];

type InviteMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvited?: () => void;
};

export function InviteMemberDialog({ open, onOpenChange, onInvited }: InviteMemberDialogProps) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("collaborator");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [invitePath, setInvitePath] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional open-only reset
    setEmail("");
    setRole("collaborator");
    setFieldError(null);
    setFormError(null);
    setInvitePath(null);
  }, [open]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    const parsed = inviteMemberSchema.safeParse({ email, role });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Date invalide");
      return;
    }

    setFieldError(null);
    setFormError(null);
    setSubmitting(true);
    const result = await inviteMemberAction(parsed.data);
    setSubmitting(false);

    if (result?.error || !result?.data) {
      setFormError(result?.error ?? t("modules.team.inviteFailed"));
      return;
    }

    toast(result.success ?? "Invitație creată.", "success");
    setInvitePath(result.data.invitePath);
    onInvited?.();
  }

  async function handleCopyLink() {
    if (!invitePath) return;
    const url = `${window.location.origin}${invitePath}`;
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copiat în clipboard.", "success");
    } catch {
      toast("Nu am putut copia linkul.", "error");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("modules.team.inviteTitle")}</DialogTitle>
          <DialogDescription>
            {t("modules.team.inviteHint")}
          </DialogDescription>
        </DialogHeader>

        {invitePath ? (
          <div className="space-y-4">
            <p className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
              {t("modules.team.inviteCreated", { email })}
              disponibil ulterior.
            </p>
            <div className="flex items-center gap-2">
              <Input readOnly value={`${typeof window !== "undefined" ? window.location.origin : ""}${invitePath}`} />
              <Button type="button" variant="outline" size="icon-sm" onClick={handleCopyLink}>
                <Copy />
              </Button>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => onOpenChange(false)}>
                <Check data-icon="inline-start" />
                Am copiat linkul
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="coleg@exemplu.ro"
                aria-invalid={Boolean(fieldError)}
              />
              {fieldError ? <p className="text-xs text-destructive">{fieldError}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-role">Rol</Label>
              <Select value={role} onValueChange={(value) => setRole((value as WorkspaceRole) ?? "collaborator")}>
                <SelectTrigger id="invite-role" className="h-8 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVITABLE_ROLES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {WORKSPACE_ROLE_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formError ? (
              <p
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {formError}
              </p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={submitting}>
                <UserPlus data-icon="inline-start" />
                {submitting ? t("modules.team.sending") : t("modules.team.sendInvite")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

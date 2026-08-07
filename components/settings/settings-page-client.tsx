"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, CreditCard, Trash2, Upload, UserCog } from "lucide-react";

import { useI18n } from "@/components/providers/i18n-provider";
import { ModuleShell } from "@/components/shared/module-shell";
import { useToast } from "@/components/shared/toast-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  confirmWorkspaceLogoAction,
  createWorkspaceLogoUploadAction,
  deleteWorkspaceAction,
  removeWorkspaceLogoAction,
  requestOwnershipTransferAction,
  updateProfileAction,
  updateWorkspaceAction,
} from "@/lib/actions/settings";
import type { WorkspaceRole } from "@/lib/constants";
import { PIPELINE_TEMPLATES } from "@/lib/events/project-pipelines";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import {
  profileFormSchema,
  workspaceFormSchema,
} from "@/lib/validations/settings";

const CURRENCIES = ["RON", "EUR", "USD"];
const LANGUAGES: { value: "ro" | "en"; label: string }[] = [
  { value: "ro", label: "Română" },
  { value: "en", label: "Engleză" },
];
const TIMEZONES = ["Europe/Bucharest", "Europe/London", "Europe/Berlin", "UTC"];

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U"
  );
}

export type WorkspaceFormValues = {
  name: string;
  city: string;
  country: string;
  currency: string;
  timezone: string;
  language: "ro" | "en";
  brandPrimary: string;
  brandAccent: string;
  fiscalCui: string;
  fiscalAddress: string;
  defaultProjectPipeline: string;
  notifications: {
    emailNotifications: boolean;
    weeklyDigest: boolean;
    productUpdates: boolean;
  };
};

export type TransferTargetOption = {
  membershipId: string;
  userId: string;
  fullName: string | null;
  role: WorkspaceRole;
};

type SettingsPageClientProps = {
  workspaceId: string;
  workspaceName: string;
  logoUrl: string | null;
  initialWorkspace: WorkspaceFormValues;
  initialFullName: string;
  email: string;
  canManageWorkspace: boolean;
  isOwner: boolean;
  transferTargets: TransferTargetOption[];
};

export function SettingsPageClient({
  workspaceName,
  logoUrl,
  initialWorkspace,
  initialFullName,
  email,
  canManageWorkspace,
  isOwner,
  transferTargets,
}: SettingsPageClientProps) {
  const { t } = useI18n();
  const [workspaceForm, setWorkspaceForm] = useState<WorkspaceFormValues>(initialWorkspace);
  const [fullName, setFullName] = useState(initialFullName);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(logoUrl);
  const [currentWorkspaceName, setCurrentWorkspaceName] = useState(workspaceName);

  const [workspaceSubmitting, setWorkspaceSubmitting] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState(transferTargets[0]?.membershipId ?? "");
  const [transferConfirmation, setTransferConfirmation] = useState("");
  const [transferSubmitting, setTransferSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  function updateWorkspaceField<K extends keyof WorkspaceFormValues>(
    key: K,
    value: WorkspaceFormValues[K],
  ) {
    setWorkspaceForm((current) => ({ ...current, [key]: value }));
  }

  function updateNotification(key: keyof WorkspaceFormValues["notifications"], value: boolean) {
    setWorkspaceForm((current) => ({
      ...current,
      notifications: { ...current.notifications, [key]: value },
    }));
  }

  async function handleWorkspaceSubmit(event: FormEvent) {
    event.preventDefault();
    if (workspaceSubmitting) return;

    const parsed = workspaceFormSchema.safeParse(workspaceForm);
    if (!parsed.success) {
      setWorkspaceError(parsed.error.issues[0]?.message ?? "Verifică datele completate.");
      return;
    }

    setWorkspaceError(null);
    setWorkspaceSubmitting(true);
    const result = await updateWorkspaceAction(parsed.data);
    setWorkspaceSubmitting(false);

    if (result?.error || !result?.data) {
      setWorkspaceError(result?.error ?? "Nu am putut salva setările.");
      return;
    }

    toast(result.success ?? "Setări actualizate.", "success");
    setCurrentWorkspaceName(result.data.workspace.name);
    router.refresh();
  }

  async function handleProfileSubmit(event: FormEvent) {
    event.preventDefault();
    if (profileSubmitting) return;

    const parsed = profileFormSchema.safeParse({ fullName });
    if (!parsed.success) {
      setProfileError(parsed.error.issues[0]?.message ?? "Verifică datele completate.");
      return;
    }

    setProfileError(null);
    setProfileSubmitting(true);
    const result = await updateProfileAction(parsed.data);
    setProfileSubmitting(false);

    if (result?.error || !result?.data) {
      setProfileError(result?.error ?? "Nu am putut salva profilul.");
      return;
    }

    toast(result.success ?? "Profil actualizat.", "success");
    router.refresh();
  }

  async function handleLogoSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setLogoUploading(true);
    try {
      const prepared = await createWorkspaceLogoUploadAction({
        contentType: file.type,
        fileSize: file.size,
      });
      if (prepared?.error || !prepared?.data) {
        toast(prepared?.error ?? "Nu am putut pregăti încărcarea logo-ului.", "error");
        return;
      }

      const supabase = createBrowserSupabase();
      const { error: uploadError } = await supabase.storage
        .from("workspace-assets")
        .uploadToSignedUrl(prepared.data.path, prepared.data.token, file, {
          contentType: prepared.data.contentType,
        });
      if (uploadError) {
        toast("Nu am putut încărca logo-ul.", "error");
        return;
      }

      const result = await confirmWorkspaceLogoAction({ path: prepared.data.path });
      if (result?.error || !result?.data) {
        toast(result?.error ?? "Nu am putut confirma logo-ul.", "error");
        return;
      }

      toast(result.success ?? "Logo actualizat.", "success");
      setCurrentLogoUrl(result.data.logoUrl);
      router.refresh();
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleRemoveLogo() {
    setLogoUploading(true);
    const result = await removeWorkspaceLogoAction();
    setLogoUploading(false);
    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    toast(result.success ?? "Logo eliminat.", "success");
    setCurrentLogoUrl(null);
    router.refresh();
  }

  async function handleDeleteWorkspace(event: FormEvent) {
    event.preventDefault();
    if (deleteSubmitting) return;
    setDeleteSubmitting(true);
    const result = await deleteWorkspaceAction({ confirmation: deleteConfirmation });
    setDeleteSubmitting(false);

    if (result?.error) {
      toast(result.error, "error");
      return;
    }

    toast(result.success ?? "Workspace șters.", "success");
    router.push("/onboarding");
  }

  async function handleTransferOwnership(event: FormEvent) {
    event.preventDefault();
    if (transferSubmitting || !transferTargetId) return;
    setTransferSubmitting(true);
    const result = await requestOwnershipTransferAction({
      targetMembershipId: transferTargetId,
      confirmation: transferConfirmation,
    });
    setTransferSubmitting(false);

    if (result?.error) {
      toast(result.error, "error");
      return;
    }

    toast(result.success ?? "Proprietate transferată.", "success");
    setTransferConfirmation("");
    router.refresh();
  }

  return (
    <ModuleShell
      title={t("modules.settings.title")}
      description={t("modules.settings.description")}
      actions={
        <Button
          type="button"
          variant="outline"
          render={<Link href="/dashboard/settings/billing" />}
          nativeButton={false}
        >
          <CreditCard data-icon="inline-start" />
          {t("modules.billing.title")}
        </Button>
      }
    >
      <div className="space-y-6">
        <form onSubmit={handleWorkspaceSubmit} className="space-y-6">
          <section className="surface-card space-y-5 p-5">
            <div>
              <h2 className="font-heading text-lg font-medium text-foreground">Workspace</h2>
              <p className="text-sm text-muted-foreground">
                Informații generale despre businessul tău din industria evenimentelor.
              </p>
            </div>
            <Separator />

            <div className="flex items-center gap-4">
              <Avatar size="lg">
                {currentLogoUrl ? <AvatarImage src={currentLogoUrl} alt={currentWorkspaceName} /> : null}
                <AvatarFallback className="bg-champagne/15 text-champagne">
                  {getInitials(currentWorkspaceName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleLogoSelected}
                  disabled={!canManageWorkspace || logoUploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canManageWorkspace || logoUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload data-icon="inline-start" />
                  {logoUploading ? "Se încarcă…" : "Încarcă logo"}
                </Button>
                {currentLogoUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={!canManageWorkspace || logoUploading}
                    onClick={handleRemoveLogo}
                  >
                    <Trash2 data-icon="inline-start" />
                    Elimină
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="workspace-name">Nume workspace</Label>
                <Input
                  id="workspace-name"
                  value={workspaceForm.name}
                  disabled={!canManageWorkspace}
                  onChange={(event) => updateWorkspaceField("name", event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="workspace-currency">Monedă</Label>
                <Select
                  value={workspaceForm.currency}
                  onValueChange={(value) => updateWorkspaceField("currency", value ?? "RON")}
                  disabled={!canManageWorkspace}
                >
                  <SelectTrigger id="workspace-currency" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="workspace-city">Oraș</Label>
                <Input
                  id="workspace-city"
                  value={workspaceForm.city}
                  disabled={!canManageWorkspace}
                  onChange={(event) => updateWorkspaceField("city", event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="workspace-country">Țară</Label>
                <Input
                  id="workspace-country"
                  value={workspaceForm.country}
                  disabled={!canManageWorkspace}
                  onChange={(event) => updateWorkspaceField("country", event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="workspace-timezone">Fus orar</Label>
                <Select
                  value={workspaceForm.timezone}
                  onValueChange={(value) => updateWorkspaceField("timezone", value ?? "Europe/Bucharest")}
                  disabled={!canManageWorkspace}
                >
                  <SelectTrigger id="workspace-timezone" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="workspace-language">Limbă</Label>
                <Select
                  value={workspaceForm.language}
                  onValueChange={(value) => updateWorkspaceField("language", (value as "ro" | "en") ?? "ro")}
                  disabled={!canManageWorkspace}
                >
                  <SelectTrigger id="workspace-language" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="surface-card space-y-5 p-5">
            <div>
              <h2 className="font-heading text-lg font-medium text-foreground">Branding și pipeline</h2>
              <p className="text-sm text-muted-foreground">
                Culorile brandului și pipeline-ul implicit pentru proiectele noi.
              </p>
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="brand-primary">Culoare principală (hex)</Label>
                <Input
                  id="brand-primary"
                  value={workspaceForm.brandPrimary}
                  disabled={!canManageWorkspace}
                  placeholder="#1a1a1a"
                  onChange={(event) => updateWorkspaceField("brandPrimary", event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="brand-accent">Culoare accent (hex)</Label>
                <Input
                  id="brand-accent"
                  value={workspaceForm.brandAccent}
                  disabled={!canManageWorkspace}
                  placeholder="#d4af7a"
                  onChange={(event) => updateWorkspaceField("brandAccent", event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="default-pipeline">Pipeline implicit pentru proiecte</Label>
              <Select
                value={workspaceForm.defaultProjectPipeline || "generic"}
                onValueChange={(value) => updateWorkspaceField("defaultProjectPipeline", value ?? "generic")}
                disabled={!canManageWorkspace}
              >
                <SelectTrigger id="default-pipeline" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PIPELINE_TEMPLATES).map((pipeline) => (
                    <SelectItem key={pipeline.id} value={pipeline.id}>
                      {pipeline.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          <section className="surface-card space-y-5 p-5">
            <div>
              <h2 className="font-heading text-lg font-medium text-foreground">Date fiscale</h2>
              <p className="text-sm text-muted-foreground">Apar pe contracte și facturi.</p>
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fiscal-cui">CUI / CIF</Label>
                <Input
                  id="fiscal-cui"
                  value={workspaceForm.fiscalCui}
                  disabled={!canManageWorkspace}
                  onChange={(event) => updateWorkspaceField("fiscalCui", event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fiscal-address">Adresă fiscală</Label>
                <Input
                  id="fiscal-address"
                  value={workspaceForm.fiscalAddress}
                  disabled={!canManageWorkspace}
                  onChange={(event) => updateWorkspaceField("fiscalAddress", event.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="surface-card space-y-4 p-5">
            <div>
              <h2 className="font-heading text-lg font-medium text-foreground">Notificări workspace</h2>
              <p className="text-sm text-muted-foreground">
                Preferințe implicite de notificare pentru echipă.
              </p>
            </div>
            <Separator />
            <label className="flex items-center gap-3 text-sm text-foreground">
              <Checkbox
                checked={workspaceForm.notifications.emailNotifications}
                disabled={!canManageWorkspace}
                onCheckedChange={(checked) => updateNotification("emailNotifications", Boolean(checked))}
              />
              Notificări email pentru leaduri și plăți noi
            </label>
            <label className="flex items-center gap-3 text-sm text-foreground">
              <Checkbox
                checked={workspaceForm.notifications.weeklyDigest}
                disabled={!canManageWorkspace}
                onCheckedChange={(checked) => updateNotification("weeklyDigest", Boolean(checked))}
              />
              Rezumat săptămânal al activității
            </label>
            <label className="flex items-center gap-3 text-sm text-foreground">
              <Checkbox
                checked={workspaceForm.notifications.productUpdates}
                disabled={!canManageWorkspace}
                onCheckedChange={(checked) => updateNotification("productUpdates", Boolean(checked))}
              />
              Noutăți despre funcționalități EasyWedd Pro
            </label>
          </section>

          {workspaceError ? (
            <p
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {workspaceError}
            </p>
          ) : null}

          {canManageWorkspace ? (
            <Button type="submit" disabled={workspaceSubmitting}>
              <Check data-icon="inline-start" />
              {workspaceSubmitting ? "Se salvează…" : "Salvează setările workspace-ului"}
            </Button>
          ) : null}
        </form>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <section className="surface-card space-y-5 p-5">
            <div>
              <h2 className="font-heading text-lg font-medium text-foreground">Profilul tău</h2>
              <p className="text-sm text-muted-foreground">
                Aceste informații apar în platformă și în comunicările cu clienții.
              </p>
            </div>
            <Separator />
            <div className="flex items-center gap-4">
              <Avatar size="lg">
                <AvatarFallback className="bg-champagne/15 text-champagne">
                  {getInitials(fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="user-name">Nume complet</Label>
                  <Input
                    id="user-name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="user-email">Email</Label>
                  <Input id="user-email" type="email" value={email} disabled readOnly />
                </div>
              </div>
            </div>
            {profileError ? (
              <p
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {profileError}
              </p>
            ) : null}
            <Button type="submit" disabled={profileSubmitting}>
              <UserCog data-icon="inline-start" />
              {profileSubmitting ? "Se salvează…" : "Salvează profilul"}
            </Button>
          </section>
        </form>

        {isOwner ? (
          <section className="surface-card space-y-4 border-destructive/20 p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden />
              <h2 className="font-heading text-lg font-medium text-foreground">Zonă periculoasă</h2>
            </div>

            {transferTargets.length > 0 ? (
              <form onSubmit={handleTransferOwnership} className="space-y-3 border-b border-border pb-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Transferă proprietatea</p>
                  <p className="text-sm text-muted-foreground">
                    Rolul tău va deveni admin. Scrie exact numele workspace-ului{" "}
                    <strong>„{currentWorkspaceName}”</strong> pentru confirmare.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select value={transferTargetId} onValueChange={(value) => setTransferTargetId(value ?? "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {transferTargets.map((target) => (
                        <SelectItem key={target.membershipId} value={target.membershipId}>
                          {target.fullName ?? "Membru fără profil"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={transferConfirmation}
                    onChange={(event) => setTransferConfirmation(event.target.value)}
                    placeholder={currentWorkspaceName}
                  />
                </div>
                <Button type="submit" variant="outline" disabled={transferSubmitting}>
                  {transferSubmitting ? "Se transferă…" : "Transferă proprietatea"}
                </Button>
              </form>
            ) : null}

            <form onSubmit={handleDeleteWorkspace} className="space-y-3 pt-2">
              <div>
                <p className="text-sm font-medium text-foreground">Șterge workspace-ul</p>
                <p className="text-sm text-muted-foreground">
                  Elimină permanent toate leadurile, clienții și documentele asociate. Scrie exact{" "}
                  <strong>„{currentWorkspaceName}”</strong> pentru confirmare.
                </p>
              </div>
              <Input
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                placeholder={currentWorkspaceName}
              />
              <Button
                type="submit"
                variant="destructive"
                disabled={deleteSubmitting || deleteConfirmation.trim() !== currentWorkspaceName}
              >
                <Trash2 data-icon="inline-start" />
                {deleteSubmitting ? "Se șterge…" : "Șterge workspace-ul"}
              </Button>
            </form>
          </section>
        ) : null}
      </div>
    </ModuleShell>
  );
}

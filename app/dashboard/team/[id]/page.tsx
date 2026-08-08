import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MemberDetail } from "@/components/team/member-detail";
import { ModuleShell } from "@/components/shared/module-shell";
import {
  getMemberByMembershipId,
  getMemberWorkload,
  listMemberProjects,
  listMemberTasks,
} from "@/lib/data/team";
import type { WorkspaceRole } from "@/lib/constants";
import { permissionsForRole } from "@/lib/workspace/permissions";
import { getWorkspaceOrDemo } from "@/lib/workspace/session";
import { getTranslator } from "@/lib/i18n/t";

type TeamMemberPageParams = { id: string };

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return { title: `${t("modules.team.memberTitle")} · EasyWedd Pro` };
}

export default async function TeamMemberPage({
  params,
}: {
  params: Promise<TeamMemberPageParams>;
}) {
  const { t } = await getTranslator();
  const { id } = await params;
  const ctx = await getWorkspaceOrDemo();

  const member = await getMemberByMembershipId(ctx.supabase, ctx.workspace.id, id).catch(() => null);
  if (!member) notFound();

  const [workload, tasks, projects] = await Promise.all([
    getMemberWorkload(ctx.supabase, ctx.workspace.id, member.userId),
    listMemberTasks(ctx.supabase, ctx.workspace.id, member.userId),
    listMemberProjects(ctx.supabase, ctx.workspace.id, member.userId),
  ]);

  const permissions = permissionsForRole(ctx.role);

  return (
    <ModuleShell
      title={member.fullName ?? t("modules.team.memberFallback")}
      description={t("modules.team.descriptionMember")}
    >
      <MemberDetail
        member={{
          membershipId: member.membershipId,
          userId: member.userId,
          role: member.role as WorkspaceRole,
          disabledAt: member.disabledAt,
          memberSince: member.memberSince,
          fullName: member.fullName,
        }}
        workload={workload}
        tasks={tasks}
        projects={projects}
        canManage={permissions.canManageMembers}
        isSelf={member.userId === ctx.user.id}
      />
    </ModuleShell>
  );
}

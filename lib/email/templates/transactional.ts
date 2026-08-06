import "server-only";

import { getSiteUrl } from "@/lib/url";
import { renderBaseEmail } from "@/lib/email/templates/base";

export type TransactionalTemplate =
  | "invitation"
  | "proposal_sent"
  | "contract_published"
  | "task_assigned";

export type RenderedEmail = { subject: string; html: string };

export type InvitationEmailInput = {
  workspaceName: string;
  inviterName: string;
  role: string;
  invitePath: string;
};

export function renderInvitationEmail(input: InvitationEmailInput): RenderedEmail {
  const url = `${getSiteUrl()}${input.invitePath}`;
  return {
    subject: `${input.inviterName} te invită în ${input.workspaceName} pe EasyWedd Pro`,
    html: renderBaseEmail({
      preheader: `Invitație în echipa ${input.workspaceName}`,
      heading: "Ai fost invitat într-un workspace",
      bodyHtml: `
        <p><strong>${input.inviterName}</strong> te invită să te alături echipei <strong>${input.workspaceName}</strong> pe EasyWedd Pro, cu rolul de <strong>${input.role}</strong>.</p>
        <p>Apasă butonul de mai jos pentru a accepta invitația.</p>
      `,
      ctaLabel: "Acceptă invitația",
      ctaUrl: url,
      footerNote: "Dacă nu te așteptai la această invitație, poți ignora acest email.",
    }),
  };
}

export type ProposalSentEmailInput = {
  clientName: string;
  workspaceName: string;
  proposalTitle: string;
  portalUrl: string;
};

export function renderProposalSentEmail(input: ProposalSentEmailInput): RenderedEmail {
  return {
    subject: `Ai o ofertă nouă de la ${input.workspaceName}`,
    html: renderBaseEmail({
      preheader: `Oferta „${input.proposalTitle}” este pregătită`,
      heading: "Ai o ofertă nouă",
      bodyHtml: `
        <p>Bună, ${input.clientName},</p>
        <p><strong>${input.workspaceName}</strong> ți-a trimis oferta <strong>${input.proposalTitle}</strong>. O poți vizualiza și accepta direct online.</p>
      `,
      ctaLabel: "Vezi oferta",
      ctaUrl: input.portalUrl,
    }),
  };
}

export type ContractPublishedEmailInput = {
  clientName: string;
  workspaceName: string;
  contractTitle: string;
  portalUrl: string;
};

export function renderContractPublishedEmail(input: ContractPublishedEmailInput): RenderedEmail {
  return {
    subject: `Contractul tău de la ${input.workspaceName} este pregătit pentru semnare`,
    html: renderBaseEmail({
      preheader: `Contractul „${input.contractTitle}” te așteaptă`,
      heading: "Contract pregătit pentru semnare",
      bodyHtml: `
        <p>Bună, ${input.clientName},</p>
        <p><strong>${input.workspaceName}</strong> a publicat contractul <strong>${input.contractTitle}</strong>. Îl poți citi și semna online.</p>
      `,
      ctaLabel: "Vezi contractul",
      ctaUrl: input.portalUrl,
    }),
  };
}

export type TaskAssignedEmailInput = {
  assigneeName: string;
  taskTitle: string;
  dueDate?: string | null;
  taskUrl: string;
};

export function renderTaskAssignedEmail(input: TaskAssignedEmailInput): RenderedEmail {
  return {
    subject: `Task nou: ${input.taskTitle}`,
    html: renderBaseEmail({
      preheader: "Ți-a fost asignat un task nou",
      heading: "Task nou asignat",
      bodyHtml: `
        <p>Bună, ${input.assigneeName},</p>
        <p>Ți-a fost asignat task-ul <strong>${input.taskTitle}</strong>${input.dueDate ? ` cu termen <strong>${input.dueDate}</strong>` : ""}.</p>
      `,
      ctaLabel: "Vezi task-ul",
      ctaUrl: input.taskUrl,
    }),
  };
}

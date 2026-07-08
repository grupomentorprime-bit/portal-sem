import "server-only";

import { ROLE_CODES } from "@/core/identity/roles/codes";
import { rolesIncludeCode } from "@/core/identity/roles/helpers";
import { getConvocatoriaByFormId, formatConvocatoriaDate } from "@/lib/admin/forms-center";
import { getSiteConfig } from "@/lib/cms/config";
import {
  formatGenerationCode,
  formatGenerationDisplay,
  normalizeGenerationValue,
} from "@/lib/experience/forms/generations";
import { getExperienceFormById } from "@/lib/experience/forms/repository";
import { listFormSubmissions } from "@/lib/experience/forms/repository";
import { getConvocatoriaRoster } from "@/lib/experience/forms/roster";
import { writeAudit } from "@/lib/identity/audit";
import { listMembershipsByTenant } from "@/lib/identity/memberships";
import { createNotifications } from "@/lib/identity/notifications";
import { findRolesByIds, getRoleCode } from "@/lib/identity/roles";
import { listUsersByIds } from "@/lib/identity/users";
import {
  buildStudentAffairsPanelUrl,
  sendHandoffValidationEmail,
  type HandoffGenerationGroup,
} from "@/lib/notifications/handoff-validation-email";
import { buildHandoffNominations } from "@/lib/student-affairs/build-handoff-nominations";
import type { HandoffNominee, HandoffNominations, StudentAffairsHandoffReport } from "@/types/student-affairs-operations";
import type { StudentAffairsScope } from "@/types/identity";

interface DispatchHandoffValidationInput {
  tenantId: string;
  formId: string;
  validatorUserId: string;
  validatorName: string;
  report: StudentAffairsHandoffReport;
}

interface EncargadaRecipient {
  membershipId: string;
  userId: string;
  email: string;
  displayName: string;
  scope: StudentAffairsScope;
}

function nomineeGenerationCode(nominee: HandoffNominee): string {
  return normalizeGenerationValue(nominee.generation ?? "");
}

function nomineeMatchesGenerations(nominee: HandoffNominee, generationCodes: string[]): boolean {
  const code = nomineeGenerationCode(nominee);
  if (!code) return false;
  return generationCodes.some((scopeCode) => normalizeGenerationValue(scopeCode) === code);
}

function groupNomineesByGeneration(
  toRequest: HandoffNominee[],
  toReview: HandoffNominee[],
  noShow: HandoffNominee[],
  generationCodes: string[]
): HandoffGenerationGroup[] {
  const codes = [...new Set(generationCodes.map((code) => normalizeGenerationValue(code)).filter(Boolean))];

  return codes
    .map((code) => {
      const label = formatGenerationDisplay(code);
      const filter = (items: HandoffNominee[]) =>
        items.filter((item) => nomineeMatchesGenerations(item, [code]));

      return {
        code: formatGenerationCode(code),
        label: label !== "—" ? label : code,
        toRequest: filter(toRequest),
        toReview: filter(toReview),
        noShow: filter(noShow),
      };
    })
    .filter((group) => group.toRequest.length + group.toReview.length + group.noShow.length > 0);
}

async function resolveNominations(
  tenantId: string,
  formId: string,
  report: StudentAffairsHandoffReport
): Promise<HandoffNominations> {
  const stored = report.nominations;
  if (
    stored?.withJustification &&
    stored?.withoutJustification &&
    (stored.withJustification.length > 0 ||
      stored.withoutJustification.length > 0 ||
      (stored.noAttendance?.length ?? 0) > 0)
  ) {
    return {
      noAttendance: stored.noAttendance ?? [],
      withJustification: stored.withJustification ?? [],
      withoutJustification: stored.withoutJustification ?? stored.unjustified ?? [],
    };
  }

  const convocatoria = getConvocatoriaByFormId(formId);
  const { submissions } = await listFormSubmissions(tenantId, { formId, limit: 2000 });
  const roster = convocatoria ? await getConvocatoriaRoster(tenantId, convocatoria.slug) : null;
  const rosterStudents = roster?.students ?? [];

  return buildHandoffNominations({ submissions, rosterStudents });
}

async function listEncargadasForForm(tenantId: string, formId: string): Promise<EncargadaRecipient[]> {
  const memberships = await listMembershipsByTenant(tenantId);
  const active = memberships.filter((membership) => membership.status === "active");
  const roleIds = [...new Set(active.flatMap((membership) => membership.roleIds))];
  const roles = await findRolesByIds(tenantId, roleIds);
  const roleMap = new Map(roles.map((role) => [role._id, role]));

  const recipients: EncargadaRecipient[] = [];
  for (const membership of active) {
    const memberRoles = membership.roleIds
      .map((roleId) => roleMap.get(roleId))
      .filter((role): role is NonNullable<typeof role> => Boolean(role))
      .map((role) => ({ code: getRoleCode(role), name: role.name }));

    if (!rolesIncludeCode(memberRoles, ROLE_CODES.STUDENT_AFFAIRS)) continue;

    const scope = membership.studentAffairsScope;
    if (!scope?.formIds.includes(formId) || !scope.generationCodes.length) continue;

    recipients.push({
      membershipId: membership._id,
      userId: membership.userId,
      email: "",
      displayName: "",
      scope,
    });
  }

  const users = await listUsersByIds(recipients.map((recipient) => recipient.userId));
  const userMap = new Map(users.map((user) => [user._id, user]));

  return recipients
    .map((recipient) => {
      const user = userMap.get(recipient.userId);
      return {
        ...recipient,
        email: user?.email?.trim() ?? "",
        displayName: user?.displayName?.trim() || user?.email || "Encargada",
      };
    })
    .filter((recipient) => recipient.email);
}

function buildQualityNotificationBody(
  nominee: HandoffNominee,
  actionLabel: string,
  generationLabel: string,
  encargadaName: string
): string {
  const contact = [nominee.email, nominee.phone].filter(Boolean).join(" · ");
  return [
    `Participante: ${nominee.fullName}`,
    nominee.rut ? `RUT: ${nominee.rut}` : null,
    `Generación: ${generationLabel}`,
    `Gestión: ${actionLabel}`,
    nominee.note ? `Estado: ${nominee.note}` : null,
    contact ? `Contacto: ${contact}` : null,
    `Asignado a: ${encargadaName}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function dispatchHandoffValidationNotifications(
  input: DispatchHandoffValidationInput
): Promise<{
  emailsSent: number;
  encargadaNotifications: number;
  qualityNotifications: number;
  errors: string[];
}> {
  const { tenantId, formId, validatorUserId, validatorName, report } = input;
  const errors: string[] = [];
  let emailsSent = 0;
  let encargadaNotifications = 0;
  let qualityNotifications = 0;

  const [config, form, nominations, encargadas] = await Promise.all([
    getSiteConfig(),
    getExperienceFormById(tenantId, formId),
    resolveNominations(tenantId, formId, report),
    listEncargadasForForm(tenantId, formId),
  ]);

  const convocatoria = getConvocatoriaByFormId(formId);
  const formName =
    form?.name ?? convocatoria?.landing?.headline ?? convocatoria?.title ?? formId;
  const institutionName = config?.institution.name ?? "Seminario Eclesiástico Mayor";
  const eventDateLabel = convocatoria ? formatConvocatoriaDate(convocatoria.date) : undefined;
  const panelUrl = buildStudentAffairsPanelUrl(formId);

  const toRequest = nominations.withoutJustification ?? nominations.unjustified ?? [];
  const toReview = nominations.withJustification ?? [];
  const noShow = nominations.noAttendance ?? [];

  const qualityNotificationsInput: Parameters<typeof createNotifications>[0] = [];

  for (const encargada of encargadas) {
    const groups = groupNomineesByGeneration(
      toRequest,
      toReview,
      noShow,
      encargada.scope.generationCodes
    );
    const total = groups.reduce(
      (sum, group) => sum + group.toRequest.length + group.toReview.length + group.noShow.length,
      0
    );
    if (total === 0) continue;

    const emailResult = await sendHandoffValidationEmail({
      to: encargada.email,
      encargadaName: encargada.displayName,
      formName,
      eventDateLabel,
      eventLocation: convocatoria?.location,
      validatedByName: validatorName,
      groups,
      panelUrl,
      institutionName,
    });

    if (emailResult.ok) {
      emailsSent += 1;
    } else {
      errors.push(`${encargada.displayName}: ${emailResult.error}`);
    }

    const requestCount = groups.reduce((sum, group) => sum + group.toRequest.length, 0);
    const reviewCount = groups.reduce((sum, group) => sum + group.toReview.length, 0);

    await createNotifications([
      {
        tenantId,
        userId: encargada.userId,
        category: "student_affairs.handoff.assignment",
        title: "Seguimiento de inasistencias habilitado",
        body: [
          `Jornada: ${formName}`,
          `${requestCount} por solicitar justificación · ${reviewCount} excusas por revisar`,
          "Revisa el correo institucional con el detalle por generación.",
        ].join("\n"),
        href: panelUrl,
        entity: "form",
        entityId: formId,
        metadata: {
          formId,
          membershipId: encargada.membershipId,
          requestCount,
          reviewCount,
          validatedByName: validatorName,
        },
      },
    ]);
    encargadaNotifications += 1;

    for (const group of groups) {
      for (const nominee of group.toRequest) {
        qualityNotificationsInput.push({
          tenantId,
          userId: validatorUserId,
          category: "student_affairs.handoff.review",
          title: `Informado a ${encargada.displayName}: solicitar justificación`,
          body: buildQualityNotificationBody(
            nominee,
            "Solicitar justificación",
            group.label,
            encargada.displayName
          ),
          href: panelUrl,
          entity: "form",
          entityId: formId,
          metadata: {
            formId,
            nomineeName: nominee.fullName,
            generation: group.code,
            encargadaUserId: encargada.userId,
            action: "request",
          },
        });
      }
      for (const nominee of group.toReview) {
        qualityNotificationsInput.push({
          tenantId,
          userId: validatorUserId,
          category: "student_affairs.handoff.review",
          title: `Informado a ${encargada.displayName}: revisar excusa`,
          body: buildQualityNotificationBody(
            nominee,
            "Revisar excusa presentada",
            group.label,
            encargada.displayName
          ),
          href: panelUrl,
          entity: "form",
          entityId: formId,
          metadata: {
            formId,
            nomineeName: nominee.fullName,
            generation: group.code,
            encargadaUserId: encargada.userId,
            action: "review",
          },
        });
      }
      for (const nominee of group.noShow) {
        qualityNotificationsInput.push({
          tenantId,
          userId: validatorUserId,
          category: "student_affairs.handoff.review",
          title: `Informado a ${encargada.displayName}: verificar sin check-in`,
          body: buildQualityNotificationBody(
            nominee,
            "Verificar sin check-in",
            group.label,
            encargada.displayName
          ),
          href: panelUrl,
          entity: "form",
          entityId: formId,
          metadata: {
            formId,
            nomineeName: nominee.fullName,
            generation: group.code,
            encargadaUserId: encargada.userId,
            action: "no-show",
          },
        });
      }
    }
  }

  if (qualityNotificationsInput.length > 0) {
    await createNotifications(qualityNotificationsInput);
    qualityNotifications = qualityNotificationsInput.length;
  }

  await writeAudit({
    tenantId,
    userId: validatorUserId,
    action: "student_affairs.handoff.validated",
    entity: "form",
    entityId: formId,
    metadata: {
      formName,
      validatedByName: validatorName,
      emailsSent,
      encargadasNotified: encargadaNotifications,
      qualityNotifications,
      errors: errors.length ? errors : undefined,
    },
  });

  return { emailsSent, encargadaNotifications, qualityNotifications, errors };
}

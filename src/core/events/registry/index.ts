/** Catálogo oficial de Domain Events */

export const DOMAIN_EVENT_TYPES = [
  // Workflow
  "WorkflowStarted",
  "WorkflowTransitioned",
  "WorkflowCompleted",
  "WorkflowCancelled",
  // CMS
  "PageCreated",
  "PagePublished",
  "PageArchived",
  "NewsPublished",
  "ProgramPublished",
  // Media
  "MediaUploaded",
  "MediaDeleted",
  "MediaUpdated",
  // Identity
  "UserRegistered",
  "UserLoggedIn",
  "InvitationCreated",
  "InvitationAccepted",
  // Futuro
  "EnrollmentCreated",
  "PaymentReceived",
  "CertificateIssued",
] as const;

export type DomainEventType = (typeof DOMAIN_EVENT_TYPES)[number];

const registry = new Set<string>(DOMAIN_EVENT_TYPES);

export function registerEventType(type: string): void {
  registry.add(type);
}

export function isKnownEventType(type: string): boolean {
  return registry.has(type);
}

export function listEventTypes(): string[] {
  return [...registry].sort();
}

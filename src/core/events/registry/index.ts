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
  // Portal analytics
  "PageViewed",
  "BlockRendered",
  "CTAViewed",
  // Growth Core (ADR-010 §4.4 / OT-GROWTH-CORE-004)
  "GrowthPersonaUpserted",
  "GrowthOpportunityOpened",
  "GrowthOpportunityTransitioned",
  "GrowthActivityRecorded",
  "GrowthNextActionSet",
  "GrowthHandoffRecorded",
  // Messaging base (OT-GROWTH-MESSAGING-001 / 003)
  "GrowthMessageReceived",
  "GrowthMessageSent",
  // Automatizaciones — reanudación tras WAIT (OT-GROWTH-AUTOMATION-005)
  "GrowthAutomationResume",
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

/** Notificaciones in-app del centro de administración. */

export type PlatformNotificationCategory =
  | "student_affairs.handoff.assignment"
  | "student_affairs.handoff.review"
  | "general";

export interface PlatformNotification {
  _id: string;
  tenantId: string;
  /** Usuario destinatario. */
  userId: string;
  category: PlatformNotificationCategory | string;
  title: string;
  body: string;
  /** Enlace interno para resolver la notificación. */
  href?: string;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
  readAt?: string;
}

export interface PlatformNotificationInput {
  tenantId: string;
  userId: string;
  category: PlatformNotificationCategory | string;
  title: string;
  body: string;
  href?: string;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

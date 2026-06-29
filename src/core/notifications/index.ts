export type NotificationChannel = "email" | "push" | "in_app";

export interface NotificationPayload {
  tenantId: string;
  channel: NotificationChannel;
  recipient: string;
  subject: string;
  body: string;
}

export interface NotificationService {
  send(payload: NotificationPayload): Promise<void>;
}

export interface AnalyticsEvent {
  tenantId: string;
  name: string;
  payload?: Record<string, unknown>;
}

export interface AnalyticsService {
  track(event: AnalyticsEvent): Promise<void>;
}

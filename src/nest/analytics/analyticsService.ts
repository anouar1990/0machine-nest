/**
 * Product Analytics Event Bus (In-Memory Queue + Logger)
 */

export type AnalyticsEvent = 
  | 'project_created'
  | 'project_loaded'
  | 'svg_uploaded'
  | 'nest_started'
  | 'nest_completed'
  | 'nest_cancelled'
  | 'export_svg'
  | 'achievement_unlocked'
  | 'personal_record'
  | 'material_preset_created';

export interface AnalyticsPayload {
  eventName: AnalyticsEvent;
  timestamp: string;
  properties?: Record<string, unknown>;
}

class AnalyticsService {
  private eventLog: AnalyticsPayload[] = [];

  public trackEvent(eventName: AnalyticsEvent, properties?: Record<string, unknown>): void {
    const payload: AnalyticsPayload = {
      eventName,
      timestamp: new Date().toISOString(),
      properties,
    };
    this.eventLog.push(payload);
    
    if (process.env.NODE_ENV === 'development') {
      // Internal debug logging
      console.log(`[ANALYTICS] ${eventName}`, properties || '');
    }
  }

  public getEventHistory(): AnalyticsPayload[] {
    return [...this.eventLog];
  }

  public clearHistory(): void {
    this.eventLog = [];
  }
}

export const analyticsService = new AnalyticsService();

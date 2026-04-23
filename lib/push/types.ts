export type NotificationType =
  | "visit_assigned"
  | "visit_tomorrow"
  | "visit_upcoming";

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data: {
    url: string;
    type: NotificationType;
    entityId?: string;
  };
}

export interface PushSubscriptionRecord {
  id: string;
  tenant_id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

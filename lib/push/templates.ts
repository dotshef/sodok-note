import type { PushPayload } from "./types";

const ICON = "/icons/icon-192x192.png";
const BADGE = "/icons/icon-192x192.png";

export function visitAssignedPayload(args: {
  visitId: string;
  clientName: string;
  scheduledDate: string;
}): PushPayload {
  return {
    title: "새 방문 배정",
    body: `${args.clientName} — ${args.scheduledDate}`,
    icon: ICON,
    badge: BADGE,
    tag: `visit-assigned-${args.visitId}`,
    data: {
      url: `/visits/${args.visitId}`,
      type: "visit_assigned",
      entityId: args.visitId,
    },
  };
}

export function visitTomorrowPayload(args: {
  count: number;
  firstClientName: string;
}): PushPayload {
  const body =
    args.count > 1
      ? `${args.firstClientName} 외 ${args.count - 1}곳`
      : args.firstClientName;
  return {
    title: `내일 방문 ${args.count}건`,
    body,
    icon: ICON,
    badge: BADGE,
    tag: "visit-tomorrow",
    data: {
      url: "/calendar",
      type: "visit_tomorrow",
    },
  };
}

export function visitUpcomingPayload(args: {
  visitId: string;
  clientName: string;
  address: string | null;
}): PushPayload {
  return {
    title: "1시간 후 방문",
    body: args.address ? `${args.clientName} — ${args.address}` : args.clientName,
    icon: ICON,
    badge: BADGE,
    tag: `visit-upcoming-${args.visitId}`,
    data: {
      url: `/visits/${args.visitId}`,
      type: "visit_upcoming",
      entityId: args.visitId,
    },
  };
}

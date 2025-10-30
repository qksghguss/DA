import { formatKoreanDate, formatKoreanTime } from "./formatters.js";

export function serializeVisitor(visitor) {
  return {
    ...visitor,
    createdAt: visitor.createdAt instanceof Date ? visitor.createdAt.toISOString() : visitor.createdAt,
  };
}

export function deserializeVisitor(visitor) {
  return {
    ...visitor,
    createdAt: visitor.createdAt ? new Date(visitor.createdAt) : new Date(),
    visitDateFormatted: visitor.visitDateFormatted ?? formatKoreanDate(visitor.visitDateRaw),
    visitTimeFormatted: visitor.visitTimeFormatted ?? formatKoreanTime(visitor.visitTimeRaw),
    exitTimeFormatted: visitor.exitTimeFormatted ?? formatKoreanTime(visitor.exitTimeRaw),
  };
}

export function serializeLog(log) {
  return {
    ...log,
    timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : log.timestamp,
  };
}

export function deserializeLog(log) {
  return {
    ...log,
    timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
  };
}

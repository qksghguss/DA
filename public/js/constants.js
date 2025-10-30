export const STORAGE_KEY = "visitor-app-state-v1";
export const MAX_LOG_ENTRIES = 300;

export const VISIT_STATUSES = [
  { value: "planned", label: "방문 예정" },
  { value: "cancelled", label: "방문 취소" },
  { value: "checked_in", label: "방문 완료" },
  { value: "checked_out", label: "퇴장 완료" },
];

export const CARD_STATUSES = [
  { value: "not_requested", label: "미신청" },
  { value: "pending", label: "지급 예정" },
  { value: "issued", label: "지급 완료" },
  { value: "returned", label: "반납 완료" },
  { value: "missing", label: "미반납" },
];

export const DEFAULT_USERS = [
  {
    id: "admin",
    name: "총괄 관리자",
    password: "admin123",
    role: "admin",
    process: "안전관리",
  },
  {
    id: "guest",
    name: "일반 담당자",
    password: "guest123",
    role: "user",
    process: "공정 A",
  },
];

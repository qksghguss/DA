import { CARD_STATUSES, DEFAULT_USERS, MAX_LOG_ENTRIES, VISIT_STATUSES } from "../constants.js";
import { formatKoreanTime } from "../utils/formatters.js";
import { loadPersistedState, persistState } from "./persistence.js";

export const state = {
  users: DEFAULT_USERS.map((user) => ({ ...user })),
  currentUser: null,
  activeTab: "dashboard",
  visitors: [],
  logs: [],
};

export const uiState = {
  statusFilter: "all",
  cardFilter: "all",
  searchTerm: "",
};

export function hydrateState() {
  const persisted = loadPersistedState();
  if (!persisted) {
    return;
  }

  if (Array.isArray(persisted.users)) {
    const merged = new Map(DEFAULT_USERS.map((user) => [user.id, { ...user }]));
    persisted.users.forEach((user) => {
      if (user?.id) {
        merged.set(user.id, { ...user });
      }
    });
    state.users = Array.from(merged.values());
  }

  if (Array.isArray(persisted.visitors)) {
    state.visitors = persisted.visitors.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  if (Array.isArray(persisted.logs)) {
    state.logs = persisted.logs;
  }
}

export function persistAppState() {
  persistState({ users: state.users, visitors: state.visitors, logs: state.logs });
}

export function addLog(action, detail) {
  const timestamp = new Date();
  const entry = { action, detail, user: state.currentUser?.name ?? "시스템", timestamp };
  state.logs = [entry, ...state.logs].slice(0, MAX_LOG_ENTRIES);
  persistAppState();
}

export function registerVisitor(visitor) {
  state.visitors = [visitor, ...state.visitors];
  persistAppState();
}

export function removeVisitor(id) {
  state.visitors = state.visitors.filter((visitor) => visitor.id !== id);
  persistAppState();
}

export function updateVisitor(id, updater) {
  state.visitors = state.visitors.map((visitor) => {
    if (visitor.id !== id) {
      return visitor;
    }
    const next = updater({ ...visitor });
    return {
      ...next,
      exitTimeFormatted: formatKoreanTime(next.exitTimeRaw),
    };
  });
  persistAppState();
}

export function setActiveTab(tab) {
  const available = getAvailableTabs();
  state.activeTab = available.includes(tab) ? tab : available[0];
}

export function getAvailableTabs() {
  if (!state.currentUser) {
    return ["dashboard"]; // fallback
  }
  if (state.currentUser.role === "admin") {
    return ["dashboard", "register", "status", "logs", "settings"];
  }
  return ["dashboard", "register", "status"];
}

export function resetSession() {
  state.currentUser = null;
  state.activeTab = "dashboard";
}

export function toVisitLabel(value) {
  return VISIT_STATUSES.find((status) => status.value === value)?.label ?? value;
}

export function toCardLabel(value) {
  return CARD_STATUSES.find((status) => status.value === value)?.label ?? value;
}

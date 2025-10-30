import { STORAGE_KEY } from "../constants.js";
import { serializeVisitor, serializeLog, deserializeVisitor, deserializeLog } from "../utils/serialization.js";

const storageAvailable = (() => {
  try {
    if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
      return false;
    }
    const testKey = "__visitor_app_test__";
    window.localStorage.setItem(testKey, "ok");
    window.localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    console.warn("로컬 스토리지에 접근할 수 없습니다.", error);
    return false;
  }
})();

export function persistState({ users, visitors, logs }) {
  if (!storageAvailable) {
    return;
  }

  const payload = {
    users: users.map((user) => ({ ...user })),
    visitors: visitors.map(serializeVisitor),
    logs: logs.map(serializeLog),
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("상태를 저장하지 못했습니다.", error);
  }
}

export function loadPersistedState() {
  if (!storageAvailable) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      visitors: Array.isArray(parsed.visitors) ? parsed.visitors.map(deserializeVisitor) : [],
      logs: Array.isArray(parsed.logs) ? parsed.logs.map(deserializeLog) : [],
    };
  } catch (error) {
    console.warn("저장된 상태를 불러오지 못했습니다.", error);
    return null;
  }
}

export function clearPersistedState() {
  if (!storageAvailable) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("저장된 상태를 초기화하지 못했습니다.", error);
  }
}

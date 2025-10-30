import { loadTemplate, instantiateTemplate } from "../../js/utils/templates.js";

export const styles = ["tabs/logs/logs.css"];

export async function renderLogs({ logs, uiState }) {
  const html = await loadTemplate(new URL("./template.html", import.meta.url));
  const view = instantiateTemplate(html);
  const listRegion = view.querySelector('[data-region="list"]');
  const actionFilter = view.querySelector("#log-action-filter");
  const searchInput = view.querySelector("#log-search");

  const formatter = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  populateActionOptions({ select: actionFilter, logs, selected: uiState.logActionFilter });
  searchInput.value = uiState.logSearchTerm;

  if (logs.length === 0) {
    const empty = document.createElement("div");
    empty.className = "logs__empty";
    empty.textContent = "아직 로그가 없습니다. 시스템 사용 시 로그가 기록됩니다.";
    listRegion.replaceChildren(empty);
    return view;
  }

  const keyword = uiState.logSearchTerm.trim().toLowerCase();
  const filtered = logs.filter((log) => {
    const matchAction = uiState.logActionFilter === "all" || log.action === uiState.logActionFilter;
    const searchable = [log.detail, log.user].filter(Boolean).map((value) => value.toLowerCase());
    const matchKeyword = !keyword || searchable.some((value) => value.includes(keyword));
    return matchAction && matchKeyword;
  });

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "logs__empty";
    empty.textContent = "조건에 맞는 로그가 없습니다.";
    listRegion.replaceChildren(empty);
    return view;
  }

  listRegion.replaceChildren(
    ...filtered.map((log) => {
      const entry = document.createElement("article");
      entry.className = "log-entry";
      entry.innerHTML = `
        <strong>${log.action}</strong>
        <span>${log.detail}</span>
        <div class="meta">
          <span>${log.user}</span>
          <span>${formatter.format(new Date(log.timestamp))}</span>
        </div>
      `;
      return entry;
    })
  );

  return view;
}

function populateActionOptions({ select, logs, selected }) {
  const actions = Array.from(new Set(logs.map((log) => log.action))).sort();
  select.innerHTML = `
    <option value="all">전체</option>
    ${actions.map((action) => `<option value="${action}" ${action === selected ? "selected" : ""}>${action}</option>`).join("")}
  `;
  if (!actions.includes(selected)) {
    select.value = "all";
  }
}

export function wireLogs({ root, onActionFilterChange, onSearchChange }) {
  const actionFilter = root.querySelector("#log-action-filter");
  const searchInput = root.querySelector("#log-search");

  actionFilter?.addEventListener("change", (event) => {
    onActionFilterChange(event.target.value);
  });

  searchInput?.addEventListener("input", (event) => {
    onSearchChange(event.target.value);
  });
}

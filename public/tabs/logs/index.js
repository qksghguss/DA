import { loadTemplate, instantiateTemplate } from "../../js/utils/templates.js";

export const styles = ["tabs/logs/logs.css"];

export async function renderLogs({ logs }) {
  const html = await loadTemplate(new URL("./template.html", import.meta.url));
  const view = instantiateTemplate(html);
  const listRegion = view.querySelector('[data-region="list"]');

  if (logs.length === 0) {
    const empty = document.createElement("div");
    empty.className = "logs__empty";
    empty.textContent = "아직 로그가 없습니다. 시스템 사용 시 로그가 기록됩니다.";
    listRegion.replaceChildren(empty);
    return view;
  }

  const formatter = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  listRegion.replaceChildren(
    ...logs.map((log) => {
      const entry = document.createElement("article");
      entry.className = "log-entry";
      entry.innerHTML = `
        <strong>${log.action}</strong>
        <span>${log.detail}</span>
        <div class="meta">
          <span>${log.user}</span>
          <span>${formatter.format(log.timestamp)}</span>
        </div>
      `;
      return entry;
    })
  );

  return view;
}

export function wireLogs() {
  // no interactive elements
}

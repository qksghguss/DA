export function renderLogs({ logs }) {
  if (logs.length === 0) {
    return `<div class="section"><div class="empty-state">아직 로그가 없습니다. 시스템 사용 시 로그가 기록됩니다.</div></div>`;
  }

  return `
    <section class="section">
      <div class="section-header">
        <h3 class="section-title">최근 활동 로그</h3>
        <span class="helper-text">최신 순으로 정렬됩니다.</span>
      </div>
      <div class="log-list">
        ${logs
          .map(
            (log) => `
              <div class="log-entry">
                <strong>${log.action}</strong>
                <span>${log.detail}</span>
                <div class="meta">
                  <span>${log.user}</span>
                  <span>${new Intl.DateTimeFormat("ko-KR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(log.timestamp)}</span>
                </div>
              </div>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

import { formatKoreanDate, formatKoreanTime } from "../utils/formatters.js";

export function renderDashboard({ visitors }) {
  const total = visitors.length;
  const planned = visitors.filter((visitor) => visitor.visitStatus === "planned").length;
  const checkedIn = visitors.filter((visitor) => visitor.visitStatus === "checked_in").length;
  const checkedOut = visitors.filter((visitor) => visitor.visitStatus === "checked_out").length;
  const pendingCards = visitors.filter((visitor) => ["pending", "issued", "missing"].includes(visitor.cardStatus)).length;

  const upcoming = visitors.filter((visitor) => visitor.visitStatus === "planned").slice(0, 5);

  return `
    <section class="section">
      <div class="section-header">
        <h3 class="section-title">오늘의 내방객 현황</h3>
        <button class="button" id="quick-register">바로 등록</button>
      </div>
      <div class="card-grid">
        ${[
          { label: "전체 등록", value: total, trend: "총 누적 방문" },
          { label: "방문 예정", value: planned, trend: "확정 대기" },
          { label: "방문 완료", value: checkedIn, trend: "현장 체류" },
          { label: "퇴장 완료", value: checkedOut, trend: "업무 종료", tone: "down" },
          { label: "카드 처리 중", value: pendingCards, trend: "지급/회수 필요" },
        ]
          .map(
            (card) => `
              <div class="card">
                <span class="subtitle">${card.label}</span>
                <span class="value">${card.value}</span>
                <span class="trend ${card.tone === "down" ? "down" : "up"}">${card.trend}</span>
              </div>
            `
          )
          .join("")}
      </div>
    </section>
    <section class="section">
      <div class="section-header">
        <h3 class="section-title">방문 예정 리스트</h3>
        <span class="helper-text">최근 5건</span>
      </div>
      ${
        upcoming.length === 0
          ? `<div class="empty-state">등록된 방문 예정 내역이 없습니다.</div>`
          : `
              <table class="table">
                <thead>
                  <tr>
                    <th>방문일자</th>
                    <th>방문업체 / 인솔자</th>
                    <th>방문 목적</th>
                    <th>등록자</th>
                  </tr>
                </thead>
                <tbody>
                  ${upcoming
                    .map(
                      (item) => `
                        <tr>
                          <td>${formatKoreanDate(item.visitDateRaw)}<br /><span class="helper-text">${formatKoreanTime(
                        item.visitTimeRaw
                      )}</span></td>
                          <td><strong>${item.companyName}</strong><br /><span class="helper-text">${item.escort}</span></td>
                          <td>${item.purpose}</td>
                          <td>${item.createdBy.name}</td>
                        </tr>
                      `
                    )
                    .join("")}
                </tbody>
              </table>
            `
      }
    </section>
  `;
}

export function wireDashboard({ onQuickRegister }) {
  const quickButton = document.getElementById("quick-register");
  quickButton?.addEventListener("click", () => {
    onQuickRegister();
  });
}

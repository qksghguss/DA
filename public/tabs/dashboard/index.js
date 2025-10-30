import { formatKoreanDate, formatKoreanTime } from "../../js/utils/formatters.js";
import { loadTemplate, instantiateTemplate } from "../../js/utils/templates.js";

export const styles = ["tabs/dashboard/dashboard.css"];

export async function renderDashboard({ visitors }) {
  const html = await loadTemplate(new URL("./template.html", import.meta.url));
  const view = instantiateTemplate(html);

  const total = visitors.length;
  const planned = visitors.filter((visitor) => visitor.visitStatus === "planned").length;
  const checkedIn = visitors.filter((visitor) => visitor.visitStatus === "checked_in").length;
  const checkedOut = visitors.filter((visitor) => visitor.visitStatus === "checked_out").length;
  const pendingCards = visitors.filter((visitor) => ["pending", "issued", "missing"].includes(visitor.cardStatus)).length;

  const statsRegion = view.querySelector('[data-region="stats"]');
  const statCards = [
    { label: "전체 등록", value: total, trend: "총 누적 방문" },
    { label: "방문 예정", value: planned, trend: "확정 대기" },
    { label: "방문 완료", value: checkedIn, trend: "현장 체류" },
    { label: "퇴장 완료", value: checkedOut, trend: "업무 종료" },
    { label: "카드 처리 중", value: pendingCards, trend: "지급/회수 필요" },
  ];

  statsRegion.replaceChildren(
    ...statCards.map((card) => {
      const el = document.createElement("article");
      el.className = "dashboard__stat-card";
      el.innerHTML = `
        <h4>${card.label}</h4>
        <div class="dashboard__stat-value">${card.value}</div>
        <span class="dashboard__trend">${card.trend}</span>
      `;
      return el;
    })
  );

  const upcomingRegion = view.querySelector('[data-region="upcoming"]');
  const upcoming = visitors
    .filter((visitor) => visitor.visitStatus === "planned")
    .sort((a, b) => a.visitDateRaw.localeCompare(b.visitDateRaw))
    .slice(0, 5);

  if (upcoming.length === 0) {
    const empty = document.createElement("div");
    empty.className = "dashboard__empty";
    empty.textContent = "등록된 방문 예정 내역이 없습니다.";
    upcomingRegion.replaceChildren(empty);
  } else {
    upcomingRegion.replaceChildren(
      ...upcoming.map((item) => {
        const card = document.createElement("article");
        card.className = "dashboard__upcoming-card";
        card.innerHTML = `
          <div>
            <span class="field__label">방문일자</span>
            <strong>${formatKoreanDate(item.visitDateRaw)}</strong>
            <span class="helper-text">${formatKoreanTime(item.visitTimeRaw)}</span>
          </div>
          <div>
            <span class="field__label">방문 업체 / 인솔자</span>
            <strong>${item.companyName}</strong>
            <span class="helper-text">${item.escort}</span>
          </div>
          <div>
            <span class="field__label">방문 목적</span>
            <strong>${item.purpose}</strong>
          </div>
          <div>
            <span class="field__label">등록자</span>
            <strong>${item.createdBy.name}</strong>
          </div>
        `;
        return card;
      })
    );
  }

  return view;
}

export function wireDashboard({ root, onQuickRegister }) {
  root
    .querySelector('[data-action="quick-register"]')
    ?.addEventListener("click", () => {
      onQuickRegister();
    });
}

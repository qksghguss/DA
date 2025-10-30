import { CARD_STATUSES, VISIT_STATUSES } from "../../js/constants.js";
import { toCardLabel, toVisitLabel } from "../../js/state/store.js";
import { formatDateTime, formatKoreanDate, formatKoreanTime } from "../../js/utils/formatters.js";
import { loadTemplate, instantiateTemplate } from "../../js/utils/templates.js";

export const styles = ["tabs/status/status.css"];

export async function renderStatus({ visitors, uiState, currentUser }) {
  const html = await loadTemplate(new URL("./template.html", import.meta.url));
  const view = instantiateTemplate(html);

  const summaryRegion = view.querySelector('[data-region="summary"]');
  const listRegion = view.querySelector('[data-region="list"]');
  const searchInput = view.querySelector("#status-search");
  const statusFilter = view.querySelector("#status-filter");
  const cardFilter = view.querySelector("#card-filter");

  searchInput.value = uiState.searchTerm;
  populateOptions(statusFilter, VISIT_STATUSES, uiState.statusFilter, "전체");
  populateOptions(cardFilter, CARD_STATUSES, uiState.cardFilter, "전체");

  const { statusCounts, cardCounts } = buildStatusSummary({ visitors });
  summaryRegion.replaceChildren(
    createSummaryCard("방문 상태", statusCounts),
    createSummaryCard("카드 상태", cardCounts)
  );

  const keyword = uiState.searchTerm.trim().toLowerCase();
  const filteredVisitors = visitors.filter((item) => {
    const matchesStatus = uiState.statusFilter === "all" || item.visitStatus === uiState.statusFilter;
    const matchesCard = uiState.cardFilter === "all" || item.cardStatus === uiState.cardFilter;
    const searchable = [
      item.companyName,
      item.visitors?.join(" "),
      item.escort,
      item.purpose,
      item.cardRepresentative,
      item.cardContact,
    ]
      .filter(Boolean)
      .map((value) => value.toString().toLowerCase());
    const matchesKeyword = !keyword || searchable.some((value) => value.includes(keyword));
    return matchesStatus && matchesCard && matchesKeyword;
  });

  if (filteredVisitors.length === 0) {
    const empty = document.createElement("div");
    empty.className = "status-board__empty";
    empty.textContent = "검색 조건에 맞는 내방객 내역이 없습니다.";
    listRegion.replaceChildren(empty);
  } else {
    listRegion.replaceChildren(
      ...filteredVisitors.map((item) => createVisitorCard(item, currentUser))
    );
  }

  return view;
}

function populateOptions(select, items, selectedValue, labelAll) {
  select.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = labelAll;
  select.appendChild(allOption);

  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = item.label;
    if (item.value === selectedValue) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  if (selectedValue === "all") {
    select.value = "all";
  }
}

function createSummaryCard(title, items) {
  const card = document.createElement("article");
  card.className = "summary-card";
  card.innerHTML = `
    <span>${title}</span>
    <strong>${items.reduce((acc, item) => acc + item.value, 0)} 건</strong>
  `;
  const list = document.createElement("ul");
  items.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${item.label}</span><span>${item.value}</span>`;
    list.appendChild(li);
  });
  card.appendChild(list);
  return card;
}

function createVisitorCard(item, currentUser) {
  const canEdit = currentUser.role === "admin" || item.createdBy.id === currentUser.id;
  const canManageCard = currentUser.role === "admin";
  const canDelete = currentUser.role === "admin" || item.createdBy.id === currentUser.id;
  const prettyDate = formatKoreanDate(item.visitDateRaw) || formatDateTime(item.visitDateRaw, item.visitTimeRaw);
  const prettyTime = formatKoreanTime(item.visitTimeRaw) || formatDateTime(item.visitDateRaw, item.visitTimeRaw);

  const article = document.createElement("article");
  article.className = "status-ticket";
  article.dataset.id = item.id;
  article.innerHTML = `
    <header class="status-ticket__header">
      <div class="status-ticket__title">
        <div class="status-ticket__schedule">
          <span class="field__label">방문 일정</span>
          <strong>${prettyDate}</strong>
          <span>${prettyTime}</span>
        </div>
        <h4>${item.companyName}</h4>
        <span class="status-ticket__meta">${item.escort} · 사내 담당</span>
      </div>
      <div class="status-ticket__badges">
        ${renderStatusTag(item.visitStatus)}
        ${renderCardTag(item.cardStatus)}
      </div>
    </header>
    <div class="status-ticket__body">
      <dl class="status-ticket__details">
        <div>
          <dt>방문자 명단</dt>
          <dd>${item.visitors.join(", ")}</dd>
        </div>
        <div>
          <dt>방문 위치</dt>
          <dd>${item.location}</dd>
        </div>
        <div>
          <dt>점검 설비</dt>
          <dd>${item.equipment || "-"}</dd>
        </div>
        ${
          item.cardRequested
            ? `<div><dt>카드 대표자</dt><dd>${item.cardRepresentative ?? "-"} · ${item.cardContact ?? "연락처 미입력"}</dd></div>`
            : ""
        }
      </dl>
      <section class="status-ticket__purpose">
        <h5>방문 목적</h5>
        <p>${item.purpose}</p>
      </section>
    </div>
    <section class="status-ticket__controls">
      <div class="status-ticket__control-grid">
        <label class="field">
          <span class="field__label">방문 상태</span>
          <select name="visitStatus" ${canEdit ? "" : "disabled"}>
            ${VISIT_STATUSES.map(
              (status) => `<option value="${status.value}" ${status.value === item.visitStatus ? "selected" : ""}>${status.label}</option>`
            ).join("")}
          </select>
        </label>
        <label class="field">
          <span class="field__label">퇴장 일시</span>
          <input name="exitTime" value="${item.exitTimeRaw ?? ""}" ${canEdit ? "" : "disabled"} placeholder="예: 2100" />
        </label>
        <label class="field">
          <span class="field__label">카드 상태</span>
          <select name="cardStatus" ${canManageCard ? "" : "disabled"}>
            ${CARD_STATUSES.map(
              (status) => `<option value="${status.value}" ${status.value === item.cardStatus ? "selected" : ""}>${status.label}</option>`
            ).join("")}
          </select>
        </label>
        <label class="field">
          <span class="field__label">카드 번호 (뒤 4자리)</span>
          <input name="cardNumber" value="${item.cardNumber ?? ""}" ${canManageCard ? "" : "disabled"} placeholder="예: 1234" />
        </label>
      </div>
      <div class="status-ticket__buttons">
        <button class="button" data-action="save" ${canEdit ? "" : "disabled"}>저장</button>
        <button class="button secondary" data-action="delete" ${canDelete ? "" : "disabled"}>삭제</button>
      </div>
      <div class="status-ticket__footnote">
        <span>등록자 ${item.createdBy.name}</span>
        <span>최근 퇴장 입력 ${item.exitTimeFormatted || "-"}</span>
      </div>
    </section>
  `;

  return article;
}

function renderStatusTag(value) {
  switch (value) {
    case "planned":
      return '<span class="badge badge--planned">방문 예정</span>';
    case "cancelled":
      return '<span class="badge badge--cancelled">방문 취소</span>';
    case "checked_in":
      return '<span class="badge badge--progress">방문 완료</span>';
    case "checked_out":
      return '<span class="badge badge--done">퇴장 완료</span>';
    default:
      return "";
  }
}

function renderCardTag(value) {
  switch (value) {
    case "not_requested":
      return '<span class="badge">미신청</span>';
    case "pending":
      return '<span class="badge badge--pending">지급 예정</span>';
    case "issued":
      return '<span class="badge badge--issued">지급 완료</span>';
    case "returned":
      return '<span class="badge badge--returned">반납 완료</span>';
    case "missing":
      return '<span class="badge badge--alert">미반납</span>';
    default:
      return "";
  }
}

export function wireStatus({ root, onSearchChange, onStatusFilterChange, onCardFilterChange, onSave, onDelete }) {
  const searchInput = root.querySelector("#status-search");
  const statusFilter = root.querySelector("#status-filter");
  const cardFilter = root.querySelector("#card-filter");

  searchInput?.addEventListener("input", (event) => {
    onSearchChange(event.target.value);
  });

  statusFilter?.addEventListener("change", (event) => {
    onStatusFilterChange(event.target.value);
  });

  cardFilter?.addEventListener("change", (event) => {
    onCardFilterChange(event.target.value);
  });

  root.querySelectorAll(".status-ticket").forEach((card) => {
    const id = card.dataset.id;
    const saveBtn = card.querySelector('[data-action="save"]');
    const deleteBtn = card.querySelector('[data-action="delete"]');

    saveBtn?.addEventListener("click", () => {
      const visitStatus = card.querySelector('select[name="visitStatus"]').value;
      const exitTimeRaw = card.querySelector('input[name="exitTime"]').value.trim();
      const cardStatus = card.querySelector('select[name="cardStatus"]').value;
      const cardNumber = card.querySelector('input[name="cardNumber"]').value.trim();
      onSave({ id, visitStatus, exitTimeRaw, cardStatus, cardNumber });
    });

    deleteBtn?.addEventListener("click", () => {
      onDelete(id);
    });
  });
}

export function buildStatusSummary({ visitors }) {
  const statusCounts = VISIT_STATUSES.map((status) => ({
    label: status.label,
    value: visitors.filter((visitor) => visitor.visitStatus === status.value).length,
  }));
  const cardCounts = CARD_STATUSES.map((status) => ({
    label: status.label,
    value: visitors.filter((visitor) => visitor.cardStatus === status.value).length,
  }));

  return {
    statusCounts,
    cardCounts,
  };
}

export function describeChange({
  previousVisitStatus,
  nextVisitStatus,
  previousCardStatus,
  nextCardStatus,
  previousExitTime,
  nextExitTime,
  previousCardNumber,
  nextCardNumber,
}) {
  const changes = [];
  if (previousVisitStatus !== nextVisitStatus) {
    changes.push(`방문 상태를 ${toVisitLabel(previousVisitStatus)} → ${toVisitLabel(nextVisitStatus)}`);
  }
  if (previousCardStatus !== nextCardStatus) {
    changes.push(`카드 상태를 ${toCardLabel(previousCardStatus)} → ${toCardLabel(nextCardStatus)}`);
  }
  if (previousExitTime !== nextExitTime) {
    const before = previousExitTime ? formatKoreanTime(previousExitTime) : "미입력";
    const after = nextExitTime ? formatKoreanTime(nextExitTime) : "미입력";
    changes.push(`퇴장 일시를 ${before} → ${after}`);
  }
  if (previousCardNumber !== nextCardNumber) {
    const before = previousCardNumber ? `****${previousCardNumber}` : "미입력";
    const after = nextCardNumber ? `****${nextCardNumber}` : "미입력";
    changes.push(`카드 번호를 ${before} → ${after}`);
  }
  return changes.join(", ");
}

import { CARD_STATUSES, VISIT_STATUSES } from "../constants.js";
import { formatDateTime } from "../utils/formatters.js";
import { toCardLabel, toVisitLabel } from "../state/store.js";

function renderStatusTag(value) {
  switch (value) {
    case "planned":
      return '<span class="chip chip--planned">방문 예정</span>';
    case "cancelled":
      return '<span class="chip chip--cancelled">방문 취소</span>';
    case "checked_in":
      return '<span class="chip chip--progress">방문 완료</span>';
    case "checked_out":
      return '<span class="chip chip--done">퇴장 완료</span>';
    default:
      return "";
  }
}

function renderCardTag(value) {
  switch (value) {
    case "not_requested":
      return '<span class="chip">미신청</span>';
    case "pending":
      return '<span class="chip chip--pending">지급 예정</span>';
    case "issued":
      return '<span class="chip chip--issued">지급 완료</span>';
    case "returned":
      return '<span class="chip chip--returned">반납 완료</span>';
    case "missing":
      return '<span class="chip chip--alert">미반납</span>';
    default:
      return "";
  }
}

export function renderStatus({ visitors, uiState, currentUser }) {
  if (visitors.length === 0) {
    return `<div class="section"><div class="empty-state">등록된 내방객 정보가 없습니다. 먼저 내방객을 등록하세요.</div></div>`;
  }

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

  const cards = filteredVisitors
    .map((item) => {
      const canEdit = currentUser.role === "admin" || item.createdBy.id === currentUser.id;
      const canManageCard = currentUser.role === "admin";
      const canDelete = currentUser.role === "admin" || item.createdBy.id === currentUser.id;
      return `
        <article class="visitor-card" data-id="${item.id}">
          <header class="visitor-card__header">
            <div>
              <h4>${item.companyName}</h4>
              <p class="helper-text">${item.visitors.join(", ")} · ${formatDateTime(item.visitDateRaw, item.visitTimeRaw)}</p>
            </div>
            <div class="visitor-card__tags">
              ${renderStatusTag(item.visitStatus)}
              ${renderCardTag(item.cardStatus)}
            </div>
          </header>
          <div class="visitor-card__grid">
            <label class="field">
              <span class="field__label">방문 상태</span>
              <select name="visitStatus" ${canEdit ? "" : "disabled"}>
                ${VISIT_STATUSES.map(
                  (status) => `
                    <option value="${status.value}" ${status.value === item.visitStatus ? "selected" : ""}>${status.label}</option>
                  `
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
                  (status) => `
                    <option value="${status.value}" ${status.value === item.cardStatus ? "selected" : ""}>${status.label}</option>
                  `
                ).join("")}
              </select>
            </label>
            <label class="field">
              <span class="field__label">카드 번호 (뒤 4자리)</span>
              <input name="cardNumber" value="${item.cardNumber ?? ""}" ${canManageCard ? "" : "disabled"} placeholder="예: 1234" />
            </label>
          </div>
          <dl class="visitor-card__details">
            <div>
              <dt>인솔자</dt>
              <dd>${item.escort}</dd>
            </div>
            <div>
              <dt>방문 목적</dt>
              <dd>${item.purpose}</dd>
            </div>
            <div>
              <dt>점검 설비</dt>
              <dd>${item.equipment || "-"}</dd>
            </div>
            <div>
              <dt>방문 위치</dt>
              <dd>${item.location}</dd>
            </div>
            ${
              item.cardRequested
                ? `<div class="visitor-card__card-meta"><dt>카드 대표자</dt><dd>${item.cardRepresentative ?? "-"} · ${
                    item.cardContact ?? "연락처 미입력"
                  }</dd></div>`
                : ""
            }
          </dl>
          <footer class="visitor-card__footer">
            <div class="visitor-card__log">
              <span>등록자 ${item.createdBy.name}</span>
              <span>최근 퇴장 입력 ${item.exitTimeFormatted || "-"}</span>
            </div>
            <div class="visitor-card__actions">
              <button class="button" data-action="save" ${canEdit ? "" : "disabled"}>저장</button>
              <button class="button secondary" data-action="delete" ${canDelete ? "" : "disabled"}>삭제</button>
            </div>
          </footer>
        </article>
      `;
    })
    .join("");

  return `
    <section class="section section--status">
      <div class="status-toolbar">
        <div class="status-search">
          <label for="status-search" class="field__label">검색</label>
          <input id="status-search" type="search" placeholder="업체명, 방문자, 목적 등" value="${uiState.searchTerm}" />
        </div>
        <div class="status-filters">
          <label class="field">
            <span class="field__label">방문 상태</span>
            <select id="status-filter" value="${uiState.statusFilter}">
              <option value="all">전체</option>
              ${VISIT_STATUSES.map(
                (status) => `<option value="${status.value}" ${status.value === uiState.statusFilter ? "selected" : ""}>${
                  status.label
                }</option>`
              ).join("")}
            </select>
          </label>
          <label class="field">
            <span class="field__label">카드 상태</span>
            <select id="card-filter" value="${uiState.cardFilter}">
              <option value="all">전체</option>
              ${CARD_STATUSES.map(
                (status) => `<option value="${status.value}" ${status.value === uiState.cardFilter ? "selected" : ""}>${
                  status.label
                }</option>`
              ).join("")}
            </select>
          </label>
        </div>
      </div>
      ${
        filteredVisitors.length === 0
          ? `<div class="empty-state">검색 조건에 맞는 내방객 내역이 없습니다.</div>`
          : `<div class="status-grid">${cards}</div>`
      }
    </section>
  `;
}

export function wireStatus({ onSearchChange, onStatusFilterChange, onCardFilterChange, onSave, onDelete }) {
  const searchInput = document.getElementById("status-search");
  const statusFilter = document.getElementById("status-filter");
  const cardFilter = document.getElementById("card-filter");

  searchInput?.addEventListener("input", (event) => {
    onSearchChange(event.target.value);
  });

  statusFilter?.addEventListener("change", (event) => {
    onStatusFilterChange(event.target.value);
  });

  cardFilter?.addEventListener("change", (event) => {
    onCardFilterChange(event.target.value);
  });

  document.querySelectorAll(".visitor-card").forEach((card) => {
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

export function describeChange({ previousVisitStatus, nextVisitStatus, previousCardStatus, nextCardStatus }) {
  const changes = [];
  if (previousVisitStatus !== nextVisitStatus) {
    changes.push(`방문 상태를 ${toVisitLabel(previousVisitStatus)} → ${toVisitLabel(nextVisitStatus)}`);
  }
  if (previousCardStatus !== nextCardStatus) {
    changes.push(`카드 상태를 ${toCardLabel(previousCardStatus)} → ${toCardLabel(nextCardStatus)}`);
  }
  return changes.join(", ");
}

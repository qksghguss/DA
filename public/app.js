const VISIT_STATUSES = [
  { value: "planned", label: "방문 예정" },
  { value: "cancelled", label: "방문 취소" },
  { value: "checked_in", label: "방문 완료" },
  { value: "checked_out", label: "퇴장 완료" },
];

const CARD_STATUSES = [
  { value: "not_requested", label: "미신청" },
  { value: "pending", label: "지급 예정" },
  { value: "issued", label: "지급 완료" },
  { value: "returned", label: "반납 완료" },
  { value: "missing", label: "미반납" },
];

const state = {
  users: [
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
  ],
  currentUser: null,
  activeTab: "dashboard",
  visitors: [],
  logs: [],
};

function addLog(action, detail) {
  const timestamp = new Date();
  state.logs.unshift({ action, detail, user: state.currentUser?.name ?? "시스템", timestamp });
}

function formatKoreanDate(raw) {
  if (!raw) return "";
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.length !== 8) return raw;
  const year = digits.slice(0, 4);
  const month = digits.slice(4, 6);
  const day = digits.slice(6, 8);
  return `${year}년 ${month}월 ${day}일`;
}

function formatDisplayDate(raw) {
  if (!raw) return "";
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.length !== 8) return raw;
  const year = digits.slice(0, 4);
  const month = digits.slice(4, 6);
  const day = digits.slice(6, 8);
  return `${year}-${month}-${day}`;
}

function formatKoreanTime(raw) {
  if (!raw) return "";
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.length < 3 || digits.length > 4) return raw;
  const padded = digits.padStart(4, "0");
  const hour = padded.slice(0, 2);
  const minute = padded.slice(2, 4);
  const hourNumber = Number(hour);
  const suffix = hourNumber >= 12 ? "오후" : "오전";
  const displayHour = hourNumber % 12 === 0 ? 12 : hourNumber % 12;
  return `${suffix} ${displayHour}시 ${minute}분`;
}

function formatTime(raw) {
  if (!raw) return "";
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.length < 3 || digits.length > 4) return raw;
  const padded = digits.padStart(4, "0");
  const hour = padded.slice(0, 2);
  const minute = padded.slice(2, 4);
  return `${hour}:${minute}`;
}

function formatDateTime(dateRaw, timeRaw) {
  const date = formatDisplayDate(dateRaw);
  const time = formatTime(timeRaw);
  if (!date && !time) return "-";
  return `${date} ${time}`.trim();
}

function renderApp() {
  const root = document.getElementById("app");
  if (!state.currentUser) {
    root.innerHTML = renderLogin();
    wireLogin();
    return;
  }
  root.innerHTML = renderShell();
  wireShell();
  renderActiveTab();
}

function renderLogin() {
  return `
    <div class="login-screen">
      <div class="login-card">
        <h1>내방객 관리 시스템</h1>
        <p class="helper-text">등록된 사용자 ID와 비밀번호로 로그인하세요.</p>
        <form id="login-form" class="form-grid">
          <div class="form-group">
            <label for="login-id">사용자 ID</label>
            <input id="login-id" name="id" required placeholder="예: admin" />
          </div>
          <div class="form-group">
            <label for="login-password">비밀번호</label>
            <input id="login-password" name="password" type="password" required placeholder="비밀번호" />
          </div>
          <button class="button" type="submit">로그인</button>
        </form>
      </div>
    </div>
  `;
}

function wireLogin() {
  const form = document.getElementById("login-form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const id = formData.get("id").trim();
    const password = formData.get("password");
    const user = state.users.find((u) => u.id === id && u.password === password);
    if (!user) {
      alert("ID 또는 비밀번호가 올바르지 않습니다.");
      return;
    }
    state.currentUser = user;
    state.activeTab = "dashboard";
    addLog("로그인", `${user.name} 님이 로그인했습니다.`);
    renderApp();
  });
}

function renderShell() {
  const tabBadges = {
    dashboard: state.visitors.length,
    register: "등록",
    status: state.visitors.length,
    logs: state.logs.length,
    settings: state.users.length,
  };

  const tabs = [
    { key: "dashboard", label: "대시보드", icon: "📊" },
    { key: "register", label: "내방객 등록", icon: "📝" },
    { key: "status", label: "내방객 현황", icon: "📋" },
    { key: "logs", label: "로그", icon: "🗂" },
  ];

  if (state.currentUser.role === "admin") {
    tabs.push({ key: "settings", label: "설정", icon: "⚙️" });
  }

  return `
    <div class="app-shell">
      <aside class="sidebar">
        <div>
          <h1>VISITOR HUB</h1>
          <p class="helper-text">${state.currentUser.process} · ${state.currentUser.role === "admin" ? "관리자" : "일반"}</p>
        </div>
        <nav class="nav">
          ${tabs
            .map(
              (tab) => `
                <div class="nav-item ${state.activeTab === tab.key ? "active" : ""}" data-tab="${tab.key}">
                  <span>${tab.icon}</span>
                  <span>${tab.label}</span>
                  <span class="badge">${tabBadges[tab.key] ?? ""}</span>
                </div>
              `
            )
            .join("")}
        </nav>
        <button class="button secondary" id="logout">로그아웃</button>
      </aside>
      <main>
        <div class="top-bar">
          <h2>${
            {
              dashboard: "대시보드",
              register: "내방객 등록",
              status: "내방객 현황",
              logs: "로그",
              settings: "설정",
            }[state.activeTab]
          }</h2>
          <div class="user-chip">
            <span>👤</span>
            <span>${state.currentUser.name}</span>
            <span class="badge">${state.currentUser.role === "admin" ? "관리자" : "일반"}</span>
          </div>
        </div>
        <div id="tab-root"></div>
      </main>
    </div>
  `;
}

function wireShell() {
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      const tab = item.dataset.tab;
      state.activeTab = tab;
      renderApp();
    });
  });

  document.getElementById("logout").addEventListener("click", () => {
    addLog("로그아웃", `${state.currentUser.name} 님이 로그아웃했습니다.`);
    state.currentUser = null;
    state.activeTab = "dashboard";
    renderApp();
  });
}

function renderActiveTab() {
  const root = document.getElementById("tab-root");
  switch (state.activeTab) {
    case "dashboard":
      root.innerHTML = renderDashboard();
      wireDashboard();
      break;
    case "register":
      root.innerHTML = renderRegister();
      wireRegister();
      break;
    case "status":
      root.innerHTML = renderStatus();
      wireStatus();
      break;
    case "logs":
      root.innerHTML = renderLogs();
      break;
    case "settings":
      root.innerHTML = renderSettings();
      wireSettings();
      break;
  }
}

function renderDashboard() {
  const total = state.visitors.length;
  const planned = state.visitors.filter((v) => v.visitStatus === "planned").length;
  const checkedIn = state.visitors.filter((v) => v.visitStatus === "checked_in").length;
  const checkedOut = state.visitors.filter((v) => v.visitStatus === "checked_out").length;
  const pendingCards = state.visitors.filter((v) => ["pending", "issued", "missing"].includes(v.cardStatus)).length;

  const upcoming = state.visitors
    .filter((v) => v.visitStatus === "planned")
    .slice(0, 5);

  return `
    <section class="section">
      <div class="section-header">
        <h3 class="section-title">오늘의 내방객 현황</h3>
        <button class="button" id="quick-register">바로 등록</button>
      </div>
      <div class="card-grid">
        <div class="card">
          <span class="subtitle">전체 등록</span>
          <span class="value">${total}</span>
          <span class="trend up">총 누적 방문</span>
        </div>
        <div class="card">
          <span class="subtitle">방문 예정</span>
          <span class="value">${planned}</span>
          <span class="trend up">확정 대기</span>
        </div>
        <div class="card">
          <span class="subtitle">방문 완료</span>
          <span class="value">${checkedIn}</span>
          <span class="trend up">현장 체류</span>
        </div>
        <div class="card">
          <span class="subtitle">퇴장 완료</span>
          <span class="value">${checkedOut}</span>
          <span class="trend down">업무 종료</span>
        </div>
        <div class="card">
          <span class="subtitle">카드 처리 중</span>
          <span class="value">${pendingCards}</span>
          <span class="trend up">지급/회수 필요</span>
        </div>
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
                        <td>${formatKoreanDate(item.visitDateRaw)}<br /><span class="helper-text">${formatKoreanTime(item.visitTimeRaw)}</span></td>
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

function wireDashboard() {
  const quick = document.getElementById("quick-register");
  quick.addEventListener("click", () => {
    state.activeTab = "register";
    renderApp();
  });
}

function renderRegister() {
  return `
    <form id="visitor-form" class="section">
      <div class="section-header">
        <h3 class="section-title">내방객 기본 정보</h3>
        <span class="helper-text">모든 필드를 정확히 입력하세요.</span>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>방문 업체명</label>
          <input name="company" required placeholder="예: OO엔지니어링" />
        </div>
        <div class="form-group">
          <label>방문 일자</label>
          <input name="date" required placeholder="예: 20250404" />
          <span class="helper-text">8자리 숫자 입력 시 자동으로 변환됩니다.</span>
        </div>
        <div class="form-group">
          <label>방문 일시</label>
          <input name="time" required placeholder="예: 1750" />
          <span class="helper-text">24시간제를 숫자만 입력하세요.</span>
        </div>
        <div class="form-group">
          <label>방문 장소</label>
          <input name="location" required placeholder="예: 본관 3층 회의실" />
        </div>
        <div class="form-group">
          <label>점검 설비 & 세부 위치</label>
          <input name="equipment" placeholder="예: 공조 설비 - 기계실 A" />
        </div>
        <div class="form-group">
          <label>인솔자</label>
          <input name="escort" required placeholder="예: 홍길동 차장" />
        </div>
      </div>
      <div class="form-group">
        <label>방문자 명단</label>
        <textarea name="visitors" required placeholder="한 줄에 한 명씩 입력"></textarea>
      </div>
      <div class="form-group">
        <label>방문 목적</label>
        <textarea name="purpose" required placeholder="예: 정기 점검 및 기술 회의"></textarea>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>퇴장 일시</label>
          <input name="exitTime" placeholder="예: 2100" />
          <span class="helper-text">퇴장 시점에 입력 가능 (선택)</span>
        </div>
        <div class="form-group">
          <label class="helper-text">출입카드 신청</label>
          <div style="display:flex;align-items:center;gap:8px;">
            <input type="checkbox" name="cardRequested" id="cardRequested" />
            <label for="cardRequested" style="font-weight:500;">출입카드 필요</label>
          </div>
        </div>
      </div>
      <div id="card-extra" style="display:none;" class="form-grid">
        <div class="form-group">
          <label>대표자 선택</label>
          <select name="cardRepresentative"></select>
        </div>
        <div class="form-group">
          <label>대표자 연락처</label>
          <input name="cardContact" placeholder="예: 010-1234-5678" />
        </div>
      </div>
      <div>
        <button type="submit" class="button">등록 완료</button>
      </div>
    </form>
  `;
}

function wireRegister() {
  const form = document.getElementById("visitor-form");
  const cardToggle = form.querySelector("input[name=cardRequested]");
  const cardExtra = document.getElementById("card-extra");
  const cardSelect = form.querySelector("select[name=cardRepresentative]");

  cardToggle.addEventListener("change", () => {
    cardExtra.style.display = cardToggle.checked ? "grid" : "none";
    if (cardToggle.checked) {
      populateRepresentativeOptions();
    }
  });

  form.visitors.addEventListener("input", () => {
    if (cardToggle.checked) {
      populateRepresentativeOptions();
    }
  });

  function populateRepresentativeOptions() {
    const names = form.visitors.value
      .split(/\n|,/) 
      .map((name) => name.trim())
      .filter(Boolean);
    cardSelect.innerHTML = names
      .map((name) => `<option value="${name}">${name}</option>`)
      .join("");
    if (names.length === 0) {
      cardSelect.innerHTML = "";
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const visitor = {
      id: generateId(),
      companyName: data.get("company").trim(),
      visitDateRaw: data.get("date").trim(),
      visitTimeRaw: data.get("time").trim(),
      visitDateFormatted: formatKoreanDate(data.get("date").trim()),
      visitTimeFormatted: formatKoreanTime(data.get("time").trim()),
      visitors: data
        .get("visitors")
        .split(/\n|,/)
        .map((name) => name.trim())
        .filter(Boolean),
      location: data.get("location").trim(),
      equipment: data.get("equipment").trim(),
      escort: data.get("escort").trim(),
      purpose: data.get("purpose").trim(),
      exitTimeRaw: data.get("exitTime").trim(),
      exitTimeFormatted: formatKoreanTime(data.get("exitTime").trim()),
      cardRequested: data.get("cardRequested") === "on",
      cardRepresentative: data.get("cardRepresentative") || null,
      cardContact: data.get("cardContact")?.trim() || null,
      cardStatus: data.get("cardRequested") === "on" ? "pending" : "not_requested",
      cardNumber: "",
      visitStatus: "planned",
      createdAt: new Date(),
      createdBy: { id: state.currentUser.id, name: state.currentUser.name },
    };

    state.visitors.unshift(visitor);
    addLog("등록", `${visitor.companyName} 방문 (${visitor.visitors.length}명)를 등록했습니다.`);
    alert("내방객이 등록되었습니다.");
    form.reset();
    cardExtra.style.display = "none";
    renderApp();
  });
}

function renderStatus() {
  if (state.visitors.length === 0) {
    return `<div class="section"><div class="empty-state">등록된 내방객 정보가 없습니다. 먼저 내방객을 등록하세요.</div></div>`;
  }

  return `
    <section class="section">
      <div class="section-header">
        <h3 class="section-title">등록된 방문 내역</h3>
        <span class="helper-text">상태 변경 시 로그가 자동으로 남습니다.</span>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>방문 정보</th>
            <th>상태</th>
            <th>카드</th>
            <th>인솔 / 목적</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          ${state.visitors
            .map((item) => renderStatusRow(item))
            .join("")}
        </tbody>
      </table>
    </section>
  `;
}

function renderStatusRow(item) {
  const canEdit = state.currentUser.role === "admin" || item.createdBy.id === state.currentUser.id;
  const statusTag = statusToTag(item.visitStatus);
  const cardTag = cardStatusToTag(item.cardStatus);

  return `
    <tr data-id="${item.id}">
      <td>
        <strong>${item.companyName}</strong><br />
        <span class="helper-text">${item.visitors.join(", ")}</span><br />
        <span class="helper-text">${formatDateTime(item.visitDateRaw, item.visitTimeRaw)}</span>
      </td>
      <td>
        <div class="form-group">
          <select name="visitStatus" ${canEdit ? "" : "disabled"}>
            ${VISIT_STATUSES.map(
              (status) => `<option value="${status.value}" ${status.value === item.visitStatus ? "selected" : ""}>${status.label}</option>`
            ).join("")}
          </select>
          ${statusTag}
        </div>
        <div class="form-group">
          <label>퇴장 일시</label>
          <input name="exitTime" value="${item.exitTimeRaw ?? ""}" ${canEdit ? "" : "disabled"} placeholder="예: 2100" />
        </div>
      </td>
      <td>
        <div class="form-group">
          <select name="cardStatus" ${state.currentUser.role === "admin" ? "" : "disabled"}>
            ${CARD_STATUSES.map(
              (status) => `<option value="${status.value}" ${status.value === item.cardStatus ? "selected" : ""}>${status.label}</option>`
            ).join("")}
          </select>
          ${cardTag}
        </div>
        <div class="form-group">
          <label>카드 번호 (뒤 4자리)</label>
          <input name="cardNumber" value="${item.cardNumber ?? ""}" ${state.currentUser.role === "admin" ? "" : "disabled"} placeholder="예: 1234" />
        </div>
        ${
          item.cardRequested
            ? `<span class="helper-text">대표자 ${item.cardRepresentative ?? "-"} / 연락처 ${item.cardContact ?? "미입력"}</span>`
            : ""
        }
      </td>
      <td>
        <span class="helper-text">인솔자: ${item.escort}</span><br />
        <span class="helper-text">목적: ${item.purpose}</span>
      </td>
      <td>
        <div class="table-actions">
          <button class="button" data-action="save" ${canEdit ? "" : "disabled"}>저장</button>
          <button class="button secondary" data-action="delete" ${state.currentUser.role === "admin" || item.createdBy.id === state.currentUser.id ? "" : "disabled"}>삭제</button>
        </div>
      </td>
    </tr>
  `;
}

function statusToTag(status) {
  switch (status) {
    case "planned":
      return '<span class="tag status-planned">방문 예정</span>';
    case "cancelled":
      return '<span class="tag status-cancelled">방문 취소</span>';
    case "checked_in":
      return '<span class="tag status-in-progress">방문 완료</span>';
    case "checked_out":
      return '<span class="tag status-completed">퇴장 완료</span>';
    default:
      return "";
  }
}

function cardStatusToTag(status) {
  switch (status) {
    case "not_requested":
      return '<span class="tag">미신청</span>';
    case "pending":
      return '<span class="tag card-requested">지급 예정</span>';
    case "issued":
      return '<span class="tag card-issued">지급 완료</span>';
    case "returned":
      return '<span class="tag card-returned">반납 완료</span>';
    case "missing":
      return '<span class="tag card-missing">미반납</span>';
    default:
      return "";
  }
}

function wireStatus() {
  document.querySelectorAll("table tbody tr").forEach((row) => {
    const id = row.dataset.id;
    const visitor = state.visitors.find((v) => v.id === id);
    const saveBtn = row.querySelector('button[data-action="save"]');
    const deleteBtn = row.querySelector('button[data-action="delete"]');

    saveBtn?.addEventListener("click", () => {
      const visitStatus = row.querySelector('select[name="visitStatus"]').value;
      const exitTimeRaw = row.querySelector('input[name="exitTime"]').value.trim();
      const cardStatusSelect = row.querySelector('select[name="cardStatus"]');
      const cardNumberInput = row.querySelector('input[name="cardNumber"]');
      const cardStatus = cardStatusSelect?.value;
      const cardNumber = cardNumberInput?.value.trim();
      const previousVisitStatus = visitor.visitStatus;
      const previousCardStatus = visitor.cardStatus;

      if (state.currentUser.role !== "admin" && visitor.createdBy.id !== state.currentUser.id) {
        alert("본인이 등록한 내역만 수정할 수 있습니다.");
        return;
      }

      if (state.currentUser.role !== "admin" && cardStatus !== previousCardStatus) {
        alert("카드 상태 변경은 관리자만 가능합니다.");
        return;
      }

      if (state.currentUser.role === "admin" && cardStatus !== previousCardStatus) {
        const cardDigits = (cardNumber || "").replace(/[^0-9]/g, "");
        if (cardDigits.length !== 4) {
          alert("카드 상태 변경 시 카드 번호 뒤 4자리를 입력해야 합니다.");
          return;
        }
        visitor.cardNumber = cardDigits;
      }

      visitor.visitStatus = visitStatus;
      visitor.exitTimeRaw = exitTimeRaw;
      visitor.exitTimeFormatted = formatKoreanTime(exitTimeRaw);

      if (state.currentUser.role === "admin") {
        if (cardStatus) {
          visitor.cardStatus = cardStatus;
        }
        if (cardNumber) {
          const digits = cardNumber.replace(/[^0-9]/g, "");
          if (digits.length !== 4) {
            alert("카드 번호는 뒤 4자리 숫자로 입력하세요.");
            return;
          }
          visitor.cardNumber = digits;
        }
      }

      if (previousVisitStatus !== visitStatus) {
        addLog(
          "상태 변경",
          `${visitor.companyName} 방문 상태가 ${VISIT_STATUSES.find((s) => s.value === visitStatus)?.label}로 변경되었습니다.`
        );
      }
      if (state.currentUser.role === "admin" && previousCardStatus !== cardStatus) {
        addLog(
          "카드 상태",
          `${visitor.companyName} 카드 상태가 ${CARD_STATUSES.find((s) => s.value === cardStatus)?.label}로 변경되었습니다.`
        );
      }
      alert("저장되었습니다.");
      renderApp();
    });

    deleteBtn?.addEventListener("click", () => {
      if (state.currentUser.role !== "admin" && visitor.createdBy.id !== state.currentUser.id) {
        alert("본인이 등록한 내역만 삭제할 수 있습니다.");
        return;
      }
      if (!confirm("정말 삭제하시겠습니까?")) return;
      state.visitors = state.visitors.filter((v) => v.id !== id);
      addLog("삭제", `${visitor.companyName} 방문 등록이 삭제되었습니다.`);
      renderApp();
    });
  });
}

function renderLogs() {
  if (state.logs.length === 0) {
    return `<div class="section"><div class="empty-state">아직 로그가 없습니다. 시스템 사용 시 로그가 기록됩니다.</div></div>`;
  }

  return `
    <section class="section">
      <div class="section-header">
        <h3 class="section-title">최근 활동 로그</h3>
        <span class="helper-text">최신 순으로 정렬됩니다.</span>
      </div>
      <div class="log-list">
        ${state.logs
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

function renderSettings() {
  const userRows = state.users
    .map(
      (user) => `
        <tr>
          <td>${user.name}</td>
          <td>${user.id}</td>
          <td>${user.process}</td>
          <td>${user.role === "admin" ? "관리자" : "일반"}</td>
        </tr>
      `
    )
    .join("");

  return `
    <section class="section">
      <div class="section-header">
        <h3 class="section-title">사용자 목록</h3>
        <span class="helper-text">등록된 사용자 계정</span>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>이름</th>
            <th>ID</th>
            <th>공정</th>
            <th>권한</th>
          </tr>
        </thead>
        <tbody>${userRows}</tbody>
      </table>
    </section>
    <section class="section">
      <div class="section-header">
        <h3 class="section-title">새 사용자 등록</h3>
        <span class="helper-text">이름, ID, 비밀번호, 공정을 입력하세요.</span>
      </div>
      <form id="user-form" class="form-grid">
        <div class="form-group">
          <label>이름</label>
          <input name="name" required placeholder="예: 김현수" />
        </div>
        <div class="form-group">
          <label>사용자 ID</label>
          <input name="id" required placeholder="예: hyunsoo" />
        </div>
        <div class="form-group">
          <label>비밀번호</label>
          <input name="password" required placeholder="임시 비밀번호" />
        </div>
        <div class="form-group">
          <label>공정</label>
          <input name="process" required placeholder="예: 공정 B" />
        </div>
        <div class="form-group">
          <label>권한</label>
          <select name="role">
            <option value="user" selected>일반</option>
            <option value="admin">관리자</option>
          </select>
        </div>
        <div class="form-group" style="align-self:end;">
          <button type="submit" class="button">사용자 등록</button>
        </div>
      </form>
    </section>
  `;
}

function wireSettings() {
  const form = document.getElementById("user-form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const id = data.get("id").trim();
    if (state.users.some((user) => user.id === id)) {
      alert("이미 존재하는 ID입니다.");
      return;
    }
    const user = {
      id,
      name: data.get("name").trim(),
      password: data.get("password"),
      process: data.get("process").trim(),
      role: data.get("role"),
    };
    state.users.push(user);
    addLog("사용자 등록", `${user.name} (${user.role === "admin" ? "관리자" : "일반"}) 계정을 생성했습니다.`);
    alert("사용자가 등록되었습니다.");
    form.reset();
    renderApp();
  });
}

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `visitor-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

renderApp();

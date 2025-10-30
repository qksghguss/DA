import { hydrateState, state, uiState, addLog, registerVisitor, removeVisitor, updateVisitor, setActiveTab, getAvailableTabs, resetSession, persistAppState } from "./state/store.js";
import { renderLogin, wireLogin } from "./views/login.js";
import { renderShell, wireShell } from "./views/shell.js";
import { renderDashboard, wireDashboard } from "./views/dashboard.js";
import { renderRegister, wireRegister } from "./views/register.js";
import { renderStatus, wireStatus, describeChange } from "./views/status.js";
import { renderLogs } from "./views/logs.js";
import { renderSettings, wireSettings } from "./views/settings.js";
import { formatKoreanTime } from "./utils/formatters.js";

hydrateState();
renderApp();

function renderApp() {
  const root = document.getElementById("app");
  if (!state.currentUser) {
    root.innerHTML = renderLogin();
    wireLogin({
      findUser: (id, password) => state.users.find((user) => user.id === id && user.password === password),
      onLogin: (user) => {
        state.currentUser = user;
        setActiveTab("dashboard");
        addLog("로그인", `${user.name} 님이 로그인했습니다.`);
        renderApp();
      },
    });
    return;
  }

  const availableTabs = getAvailableTabs();
  if (!availableTabs.includes(state.activeTab)) {
    setActiveTab(availableTabs[0]);
  }

  const tabDefinitions = [
    { key: "dashboard", label: "대시보드", icon: "📊" },
    { key: "register", label: "내방객 등록", icon: "📝" },
    { key: "status", label: "내방객 현황", icon: "📋" },
  ];

  if (state.currentUser.role === "admin") {
    tabDefinitions.push({ key: "logs", label: "로그", icon: "🗂" });
    tabDefinitions.push({ key: "settings", label: "설정", icon: "⚙️" });
  }

  const tabBadges = {
    dashboard: state.visitors.length,
    register: "등록",
    status: state.visitors.length,
    logs: state.logs.length,
    settings: state.users.length,
  };

  root.innerHTML = renderShell({
    currentUser: state.currentUser,
    activeTab: state.activeTab,
    tabs: tabDefinitions,
    badges: tabBadges,
  });

  wireShell({
    onTabChange: (tab) => {
      setActiveTab(tab);
      renderApp();
    },
    onLogout: () => {
      addLog("로그아웃", `${state.currentUser.name} 님이 로그아웃했습니다.`);
      resetSession();
      renderApp();
    },
  });

  renderActiveTab();
}

function renderActiveTab() {
  const root = document.getElementById("tab-root");

  switch (state.activeTab) {
    case "dashboard":
      root.innerHTML = renderDashboard({ visitors: state.visitors });
      wireDashboard({
        onQuickRegister: () => {
          setActiveTab("register");
          renderApp();
        },
      });
      break;
    case "register":
      root.innerHTML = renderRegister();
      wireRegister({
        currentUser: state.currentUser,
        onSubmit: (visitor) => {
          registerVisitor(visitor);
          addLog("등록", `${visitor.companyName} 방문 (${visitor.visitors.length}명)를 등록했습니다.`);
          alert("내방객이 등록되었습니다.");
          renderApp();
        },
      });
      break;
    case "status":
      root.innerHTML = renderStatus({ visitors: state.visitors, uiState, currentUser: state.currentUser });
      wireStatus({
        onSearchChange: (term) => {
          uiState.searchTerm = term;
          renderApp();
        },
        onStatusFilterChange: (value) => {
          uiState.statusFilter = value;
          renderApp();
        },
        onCardFilterChange: (value) => {
          uiState.cardFilter = value;
          renderApp();
        },
        onSave: handleVisitorUpdate,
        onDelete: handleVisitorDelete,
      });
      break;
    case "logs":
      if (state.currentUser.role !== "admin") {
        setActiveTab("dashboard");
        renderApp();
        return;
      }
      root.innerHTML = renderLogs({ logs: state.logs });
      break;
    case "settings":
      if (state.currentUser.role !== "admin") {
        setActiveTab("dashboard");
        renderApp();
        return;
      }
      root.innerHTML = renderSettings({ users: state.users });
      wireSettings({
        onSubmit: (user) => {
          if (!user.id || !user.name || !user.password || !user.process) {
            alert("모든 필드를 입력해주세요.");
            return;
          }
          if (state.users.some((existing) => existing.id === user.id)) {
            alert("이미 존재하는 ID입니다.");
            return;
          }
          state.users.push(user);
          persistAppState();
          addLog("사용자 등록", `${user.name} (${user.role === "admin" ? "관리자" : "일반"}) 계정을 생성했습니다.`);
          alert("사용자가 등록되었습니다.");
          renderApp();
        },
      });
      break;
  }
}

function handleVisitorUpdate({ id, visitStatus, exitTimeRaw, cardStatus, cardNumber }) {
  const visitor = state.visitors.find((item) => item.id === id);
  if (!visitor) {
    return;
  }

  const isOwner = visitor.createdBy.id === state.currentUser.id;
  const isAdmin = state.currentUser.role === "admin";

  if (!isAdmin && !isOwner) {
    alert("본인이 등록한 내역만 수정할 수 있습니다.");
    return;
  }

  if (!isAdmin && visitor.cardStatus !== cardStatus) {
    alert("카드 상태 변경은 관리자만 가능합니다.");
    return;
  }

  const previousVisitStatus = visitor.visitStatus;
  const previousCardStatus = visitor.cardStatus;

  let normalizedCardNumber = cardNumber;

  if (isAdmin && previousCardStatus !== cardStatus) {
    const digits = (cardNumber || "").replace(/[^0-9]/g, "");
    if (digits.length !== 4) {
      alert("카드 상태 변경 시 카드 번호 뒤 4자리를 입력해야 합니다.");
      return;
    }
    normalizedCardNumber = digits;
  }

  if (isAdmin && cardNumber) {
    const digits = cardNumber.replace(/[^0-9]/g, "");
    if (digits.length !== 4) {
      alert("카드 번호는 뒤 4자리 숫자로 입력하세요.");
      return;
    }
    normalizedCardNumber = digits;
  }

  updateVisitor(id, (current) => {
    const next = { ...current };
    next.visitStatus = visitStatus;
    next.exitTimeRaw = exitTimeRaw;
    next.exitTimeFormatted = formatKoreanTime(exitTimeRaw);
    if (isAdmin) {
      next.cardStatus = cardStatus;
      if (normalizedCardNumber) {
        next.cardNumber = normalizedCardNumber;
      }
    }
    return next;
  });

  const changes = describeChange({
    previousVisitStatus,
    nextVisitStatus: visitStatus,
    previousCardStatus,
    nextCardStatus: isAdmin ? cardStatus : previousCardStatus,
  });

  if (changes) {
    addLog("상태 변경", `${visitor.companyName} ${changes}`);
  }

  alert("저장되었습니다.");
  renderApp();
}

function handleVisitorDelete(id) {
  const visitor = state.visitors.find((item) => item.id === id);
  if (!visitor) {
    return;
  }

  const isOwner = visitor.createdBy.id === state.currentUser.id;
  const isAdmin = state.currentUser.role === "admin";

  if (!isAdmin && !isOwner) {
    alert("본인이 등록한 내역만 삭제할 수 있습니다.");
    return;
  }

  if (!confirm("정말 삭제하시겠습니까?")) {
    return;
  }

  removeVisitor(id);
  addLog("삭제", `${visitor.companyName} 방문 등록이 삭제되었습니다.`);
  renderApp();
}

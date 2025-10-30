export function renderShell({ currentUser, activeTab, tabs, badges }) {
  const formatter = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const activeLabel = tabs.find((tab) => tab.key === activeTab)?.label ?? "";
  const now = formatter.format(new Date());

  return `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar__brand">
          <h1>VISITOR HUB</h1>
          <p class="helper-text">${currentUser.process} · ${currentUser.role === "admin" ? "관리자" : "일반"}</p>
        </div>
        <nav class="nav">
          ${tabs
            .map(
              (tab) => `
                <div class="nav-item ${activeTab === tab.key ? "active" : ""}" data-tab="${tab.key}">
                  <span>${tab.icon}</span>
                  <span>${tab.label}</span>
                  <span class="badge">${badges[tab.key] ?? ""}</span>
                </div>
              `
            )
            .join("")}
        </nav>
        <div class="sidebar__footer">
          <div class="user-chip">
            <span>👤</span>
            <div>
              <strong>${currentUser.name}</strong>
              <p>${currentUser.role === "admin" ? "관리자" : "일반"}</p>
            </div>
          </div>
          <button class="button secondary" id="logout">로그아웃</button>
        </div>
      </aside>
      <main>
        <div class="top-bar">
          <div>
            <p class="top-bar__eyebrow">${currentUser.process}</p>
            <h2>${activeLabel}</h2>
          </div>
          <span class="top-bar__timestamp">${now}</span>
        </div>
        <div id="tab-root"></div>
      </main>
    </div>
  `;
}

export function wireShell({ onTabChange, onLogout }) {
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      const tab = item.dataset.tab;
      onTabChange(tab);
    });
  });

  const logoutButton = document.getElementById("logout");
  logoutButton?.addEventListener("click", () => {
    onLogout();
  });
}

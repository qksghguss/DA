export function renderShell({ currentUser, activeTab, tabs, badges }) {
  return `
    <div class="app-shell">
      <aside class="sidebar">
        <div>
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
        <button class="button secondary" id="logout">로그아웃</button>
      </aside>
      <main>
        <div class="top-bar">
          <h2>${tabs.find((tab) => tab.key === activeTab)?.label ?? ""}</h2>
          <div class="user-chip">
            <span>👤</span>
            <span>${currentUser.name}</span>
            <span class="badge">${currentUser.role === "admin" ? "관리자" : "일반"}</span>
          </div>
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

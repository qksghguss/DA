export function renderLogin() {
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

export function wireLogin({ findUser, onLogin }) {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const id = formData.get("id").trim();
    const password = formData.get("password");
    const user = findUser(id, password);
    if (!user) {
      alert("ID 또는 비밀번호가 올바르지 않습니다.");
      return;
    }
    onLogin(user);
  });
}

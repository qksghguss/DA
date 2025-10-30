export function renderSettings({ users }) {
  const userRows = users
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

export function wireSettings({ onSubmit }) {
  const form = document.getElementById("user-form");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    onSubmit({
      id: data.get("id").trim(),
      name: data.get("name").trim(),
      password: data.get("password"),
      process: data.get("process").trim(),
      role: data.get("role"),
    });
    form.reset();
  });
}

import { loadTemplate, instantiateTemplate } from "../../js/utils/templates.js";

export const styles = ["tabs/settings/settings.css"];

export async function renderSettings({ users }) {
  const html = await loadTemplate(new URL("./template.html", import.meta.url));
  const view = instantiateTemplate(html);

  const listRegion = view.querySelector('[data-region="list"]');
  const form = view.querySelector("#user-form");

  listRegion.replaceChildren(createUserTable(users));
  form.replaceChildren(...createFormFields());

  return view;
}

function createUserTable(users) {
  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        <th>이름</th>
        <th>ID</th>
        <th>공정</th>
        <th>권한</th>
      </tr>
    </thead>
    <tbody>
      ${users
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
        .join("")}
    </tbody>
  `;
  return table;
}

function createFormFields() {
  const fields = [
    { name: "name", label: "이름", placeholder: "예: 김현수" },
    { name: "id", label: "사용자 ID", placeholder: "예: hyunsoo" },
    { name: "password", label: "비밀번호", placeholder: "임시 비밀번호" },
    { name: "process", label: "공정", placeholder: "예: 공정 B" },
  ];

  const elements = fields.map((field) => {
    const label = document.createElement("label");
    label.className = "field";
    label.innerHTML = `
      <span class="field__label">${field.label}</span>
      <input name="${field.name}" required placeholder="${field.placeholder}" />
    `;
    return label;
  });

  const roleField = document.createElement("label");
  roleField.className = "field";
  roleField.innerHTML = `
    <span class="field__label">권한</span>
    <select name="role">
      <option value="user" selected>일반</option>
      <option value="admin">관리자</option>
    </select>
  `;

  const submitRow = document.createElement("div");
  submitRow.style.display = "flex";
  submitRow.style.justifyContent = "flex-end";
  const button = document.createElement("button");
  button.type = "submit";
  button.className = "button";
  button.textContent = "사용자 등록";
  submitRow.appendChild(button);

  return [...elements, roleField, submitRow];
}

export function wireSettings({ root, onSubmit }) {
  const form = root.querySelector("#user-form");
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

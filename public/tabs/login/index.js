import { loadTemplate, instantiateTemplate } from "../../js/utils/templates.js";

export const styles = ["tabs/login/login.css"];

export async function renderLogin() {
  const html = await loadTemplate(new URL("./template.html", import.meta.url));
  return instantiateTemplate(html);
}

export function wireLogin({ root, findUser, onLogin }) {
  const form = root.querySelector("#login-form");
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

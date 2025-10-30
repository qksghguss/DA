import { formatKoreanDate, formatKoreanTime } from "../../js/utils/formatters.js";
import { generateId } from "../../js/utils/id.js";
import { loadTemplate, instantiateTemplate } from "../../js/utils/templates.js";

export const styles = ["tabs/register/register.css"];

export async function renderRegister() {
  const html = await loadTemplate(new URL("./template.html", import.meta.url));
  const view = instantiateTemplate(html);

  const basicRegion = view.querySelector('[data-section="basic"]');
  const detailRegion = view.querySelector('[data-section="details"]');
  const cardRegion = view.querySelector('[data-section="card"]');

  const basicFields = [
    { name: "company", label: "방문 업체명", placeholder: "예: OO엔지니어링", required: true },
    { name: "date", label: "방문 일자", placeholder: "예: 20250404", helper: "8자리 숫자 입력 시 자동 변환", required: true },
    { name: "time", label: "방문 일시", placeholder: "예: 1750", helper: "24시간제로 숫자만 입력", required: true },
    { name: "location", label: "방문 장소", placeholder: "예: 본관 3층 회의실", required: true },
  ];

  const detailFields = [
    { name: "equipment", label: "점검 설비 & 세부 위치", placeholder: "예: 공조 설비 - 기계실 A" },
    { name: "escort", label: "인솔자", placeholder: "예: 홍길동 차장", required: true },
    { name: "visitors", label: "방문자 명단", placeholder: "한 줄에 한 명씩 입력", type: "textarea", required: true },
    { name: "purpose", label: "방문 목적", placeholder: "예: 정기 점검 및 기술 회의", type: "textarea", required: true },
    { name: "exitTime", label: "퇴장 일시", placeholder: "예: 2100", helper: "퇴장 시점에 입력 가능 (선택)" },
  ];

  basicRegion.replaceChildren(...basicFields.map(createField));
  detailRegion.replaceChildren(...detailFields.map(createField));
  cardRegion.replaceChildren(createCardSection());

  return view;
}

function createField(field) {
  const wrapper = document.createElement("label");
  wrapper.className = "field";
  wrapper.innerHTML = `
    <span class="field__label">${field.label}</span>
    ${field.type === "textarea"
      ? `<textarea name="${field.name}" ${field.required ? "required" : ""} placeholder="${field.placeholder ?? ""}"></textarea>`
      : `<input name="${field.name}" ${field.required ? "required" : ""} placeholder="${field.placeholder ?? ""}" />`}
    ${field.helper ? `<span class="helper-text">${field.helper}</span>` : ""}
  `;
  return wrapper;
}

function createCardSection() {
  const container = document.createElement("div");
  container.className = "register__card-inner";
  container.innerHTML = `
    <label class="inline-check">
      <input type="checkbox" name="cardRequested" id="cardRequested" />
      <span>출입카드 신청</span>
    </label>
    <p class="helper-text">체크 시 대표자와 연락처를 입력하세요. 미반납 시 연락에 사용됩니다.</p>
    <div class="register__grid" id="card-extra" hidden>
      <label class="field">
        <span class="field__label">대표자 선택</span>
        <select name="cardRepresentative"></select>
      </label>
      <label class="field">
        <span class="field__label">대표자 연락처</span>
        <input name="cardContact" placeholder="예: 010-1234-5678" />
      </label>
    </div>
  `;
  return container;
}

export function wireRegister({ root, currentUser, onSubmit }) {
  const form = root.querySelector("#visitor-form");
  if (!form) return;

  const cardToggle = form.querySelector("input[name=cardRequested]");
  const cardExtra = form.querySelector("#card-extra");
  const cardSelect = form.querySelector("select[name=cardRepresentative]");

  const populateRepresentativeOptions = () => {
    const names = form.visitors.value
      .split(/\n|,/)
      .map((name) => name.trim())
      .filter(Boolean);
    cardSelect.innerHTML = names.map((name) => `<option value="${name}">${name}</option>`).join("");
  };

  cardToggle.addEventListener("change", () => {
    cardExtra.hidden = !cardToggle.checked;
    if (cardToggle.checked) {
      populateRepresentativeOptions();
    }
  });

  form.visitors.addEventListener("input", () => {
    if (cardToggle.checked) {
      populateRepresentativeOptions();
    }
  });

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
      createdBy: { id: currentUser.id, name: currentUser.name },
    };

    onSubmit(visitor);
    form.reset();
    cardExtra.hidden = true;
    cardSelect.innerHTML = "";
  });
}

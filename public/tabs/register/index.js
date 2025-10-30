import { formatKoreanDate, formatKoreanTime } from "../../js/utils/formatters.js";
import { generateId } from "../../js/utils/id.js";
import { loadTemplate, instantiateTemplate } from "../../js/utils/templates.js";

export const styles = ["tabs/register/register.css"];

export async function renderRegister() {
  const html = await loadTemplate(new URL("./template.html", import.meta.url));
  const view = instantiateTemplate(html);

  const scheduleRegion = view.querySelector('[data-section="schedule"] .register__grid');
  const onsiteRegion = view.querySelector('[data-section="onsite"] .register__grid');
  const visitorsRegion = view.querySelector('[data-section="visitors"]');
  const cardRegion = view.querySelector('[data-section="card"]');

  const scheduleFields = [
    { name: "company", label: "방문 업체명", placeholder: "예: OO엔지니어링", required: true },
    { name: "date", label: "방문 일자", placeholder: "예: 20250404", helper: "8자리 숫자 입력 시 자동 변환", required: true },
    { name: "time", label: "방문 시간", placeholder: "예: 1750", helper: "24시간제로 숫자만 입력", required: true },
    { name: "location", label: "방문 장소", placeholder: "예: 본관 3층 회의실", required: true },
  ];

  const onsiteFields = [
    { name: "escort", label: "사내 인솔자", placeholder: "예: 홍길동 차장", helper: "현장 담당자 이름", required: true },
    { name: "equipment", label: "점검 설비 & 세부 위치", placeholder: "예: 공조 설비 - 기계실 A" },
    { name: "purpose", label: "방문 목적", placeholder: "예: 정기 점검 및 기술 회의", type: "textarea", rows: 4, required: true },
    { name: "exitTime", label: "예상 퇴장 시간", placeholder: "예: 2100", helper: "퇴장 시점에 입력 가능 (선택)" },
  ];

  scheduleRegion.replaceChildren(...scheduleFields.map(createField));
  onsiteRegion.replaceChildren(...onsiteFields.map(createField));
  visitorsRegion.replaceChildren(createVisitorsSection());
  cardRegion.replaceChildren(createCardSection());

  return view;
}

function createField(field) {
  const wrapper = document.createElement("label");
  wrapper.className = "field";
  wrapper.innerHTML = `
    <span class="field__label">${field.label}</span>
    ${field.type === "textarea"
      ? `<textarea name="${field.name}" ${field.required ? "required" : ""} placeholder="${field.placeholder ?? ""}" ${field.rows ? `rows="${field.rows}"` : ""}></textarea>`
      : `<input name="${field.name}" ${field.required ? "required" : ""} placeholder="${field.placeholder ?? ""}" />`}
    ${field.helper ? `<span class="helper-text">${field.helper}</span>` : ""}
  `;
  return wrapper;
}

function createVisitorsSection() {
  const container = document.createElement("div");
  container.innerHTML = `
    <h3>방문자 명단</h3>
    <p class="helper-text">이름을 입력하고 추가 버튼을 눌러 명단을 완성하세요.</p>
    <div class="register__list-controls">
      <input name="visitorName" placeholder="예: 김내방" />
      <button type="button" class="button tertiary" data-action="add-visitor">추가</button>
    </div>
    <div class="register__visitor-list" data-role="visitor-list">
      <div class="register__list-empty">등록된 방문자가 없습니다.</div>
    </div>
  `;
  return container;
}

function createCardSection() {
  const container = document.createElement("div");
  container.innerHTML = `
    <h3>출입카드 신청</h3>
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
  const visitorInput = form.querySelector("input[name=visitorName]");
  const addVisitorBtn = form.querySelector('[data-action="add-visitor"]');
  const visitorList = form.querySelector('[data-role="visitor-list"]');

  let visitorNames = [];

  const renderVisitorList = () => {
    visitorList.innerHTML = "";
    if (visitorNames.length === 0) {
      const empty = document.createElement("div");
      empty.className = "register__list-empty";
      empty.textContent = "등록된 방문자가 없습니다.";
      visitorList.appendChild(empty);
      return;
    }

    visitorNames.forEach((name, index) => {
      const pill = document.createElement("span");
      pill.className = "register__pill";
      pill.innerHTML = `
        ${name}
        <button type="button" aria-label="${name} 삭제" data-index="${index}">×</button>
      `;
      pill.querySelector("button")?.addEventListener("click", () => {
        visitorNames = visitorNames.filter((_, i) => i !== index);
        renderVisitorList();
        populateRepresentativeOptions();
      });
      visitorList.appendChild(pill);
    });
  };

  const populateRepresentativeOptions = () => {
    if (!visitorNames.length) {
      cardSelect.innerHTML = "<option value=\"\">등록된 방문자가 없습니다</option>";
      cardSelect.value = "";
      return;
    }
    cardSelect.innerHTML = [
      '<option value="">대표자를 선택하세요</option>',
      ...visitorNames.map((name) => `<option value="${name}">${name}</option>`),
    ].join("");
  };

  const addVisitor = () => {
    const value = visitorInput.value.trim();
    if (!value) return;
    if (visitorNames.includes(value)) {
      alert("이미 추가된 방문자입니다.");
      return;
    }
    visitorNames = [...visitorNames, value];
    visitorInput.value = "";
    renderVisitorList();
    populateRepresentativeOptions();
  };

  cardToggle.addEventListener("change", () => {
    cardExtra.hidden = !cardToggle.checked;
    if (cardToggle.checked) {
      populateRepresentativeOptions();
    }
  });

  addVisitorBtn.addEventListener("click", addVisitor);
  visitorInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addVisitor();
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);

    if (visitorNames.length === 0) {
      alert("방문자 명단을 한 명 이상 추가해주세요.");
      return;
    }

    const visitor = {
      id: generateId(),
      companyName: data.get("company").trim(),
      visitDateRaw: data.get("date").trim(),
      visitTimeRaw: data.get("time").trim(),
      visitDateFormatted: formatKoreanDate(data.get("date").trim()),
      visitTimeFormatted: formatKoreanTime(data.get("time").trim()),
      visitors: visitorNames,
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
    visitorNames = [];
    renderVisitorList();
    populateRepresentativeOptions();
  });

  renderVisitorList();
}

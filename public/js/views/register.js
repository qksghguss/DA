import { formatKoreanDate, formatKoreanTime } from "../utils/formatters.js";
import { generateId } from "../utils/id.js";

export function renderRegister() {
  return `
    <form id="visitor-form" class="section section--form">
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
          <span class="helper-text">8자리 숫자 입력 시 자동 변환됩니다.</span>
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
          <div class="inline">
            <input type="checkbox" name="cardRequested" id="cardRequested" />
            <label for="cardRequested" class="inline__label">출입카드 필요</label>
          </div>
        </div>
      </div>
      <div id="card-extra" class="form-grid card-extra" hidden>
        <div class="form-group">
          <label>대표자 선택</label>
          <select name="cardRepresentative"></select>
        </div>
        <div class="form-group">
          <label>대표자 연락처</label>
          <input name="cardContact" placeholder="예: 010-1234-5678" />
        </div>
      </div>
      <div class="form-actions">
        <button type="submit" class="button">등록 완료</button>
      </div>
    </form>
  `;
}

export function wireRegister({ currentUser, onSubmit }) {
  const form = document.getElementById("visitor-form");
  if (!form) return;

  const cardToggle = form.querySelector("input[name=cardRequested]");
  const cardExtra = document.getElementById("card-extra");
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
  });
}

export function formatKoreanDate(raw) {
  if (!raw) return "";
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.length !== 8) return raw;
  const year = digits.slice(0, 4);
  const month = digits.slice(4, 6);
  const day = digits.slice(6, 8);
  return `${year}년 ${month}월 ${day}일`;
}

export function formatDisplayDate(raw) {
  if (!raw) return "";
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.length !== 8) return raw;
  const year = digits.slice(0, 4);
  const month = digits.slice(4, 6);
  const day = digits.slice(6, 8);
  return `${year}-${month}-${day}`;
}

export function formatKoreanTime(raw) {
  if (!raw) return "";
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.length < 3 || digits.length > 4) return raw;
  const padded = digits.padStart(4, "0");
  const hour = padded.slice(0, 2);
  const minute = padded.slice(2, 4);
  const hourNumber = Number(hour);
  const suffix = hourNumber >= 12 ? "오후" : "오전";
  const displayHour = hourNumber % 12 === 0 ? 12 : hourNumber % 12;
  return `${suffix} ${displayHour}시 ${minute}분`;
}

export function formatTime(raw) {
  if (!raw) return "";
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.length < 3 || digits.length > 4) return raw;
  const padded = digits.padStart(4, "0");
  const hour = padded.slice(0, 2);
  const minute = padded.slice(2, 4);
  return `${hour}:${minute}`;
}

export function formatDateTime(dateRaw, timeRaw) {
  const date = formatDisplayDate(dateRaw);
  const time = formatTime(timeRaw);
  if (!date && !time) return "-";
  return `${date} ${time}`.trim();
}

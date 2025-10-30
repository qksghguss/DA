const templateCache = new Map();

export async function loadTemplate(url) {
  const key = url.toString();
  if (templateCache.has(key)) {
    return templateCache.get(key);
  }
  const response = await fetch(key);
  const text = await response.text();
  templateCache.set(key, text);
  return text;
}

export function instantiateTemplate(html) {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.firstElementChild.cloneNode(true);
}

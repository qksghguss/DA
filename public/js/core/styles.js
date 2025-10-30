const loaded = new Set();

export function ensureStylesheets(urls = []) {
  urls.forEach((url) => {
    if (!url || loaded.has(url)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    link.dataset.dynamic = "true";
    document.head.appendChild(link);
    loaded.add(url);
  });
}

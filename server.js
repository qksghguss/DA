const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function serveFile(res, filePath, contentType) {
  const stream = fs.createReadStream(filePath);
  stream.on("open", () => {
    res.writeHead(200, { "Content-Type": contentType });
  });
  stream.on("error", (error) => {
    console.error("파일 스트림 오류", error);
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("서버 내부 오류가 발생했습니다.");
  });
  stream.pipe(res);
}

function handleRequest(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    let pathname = url.pathname;

    if (pathname === "/") {
      pathname = "/index.html";
    }

    const decodedPath = decodeURIComponent(pathname);
    let filePath = path.join(PUBLIC_DIR, decodedPath);

    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("접근이 허용되지 않습니다.");
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        const fallback = path.join(PUBLIC_DIR, "index.html");
        if (fs.existsSync(fallback)) {
          serveFile(res, fallback, MIME_TYPES[".html"]);
        } else {
          res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("요청한 파일을 찾을 수 없습니다.");
        }
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";
      serveFile(res, filePath, contentType);
    });
  } catch (error) {
    console.error("요청 처리 오류", error);
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("요청을 처리하는 중 오류가 발생했습니다.");
  }
}

const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`🚀 내방객 관리 웹앱 테스트 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});

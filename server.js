#!/usr/bin/env node
/**
 * REALTOR SHAMRAIZ — local development server.
 * ---------------------------------------------------------------------------
 *   Run it:   node server.js            (then open http://localhost:5273)
 *   Port it:  node server.js 8080
 *
 * WHY THIS FILE EXISTS
 * This is a static multi-page site whose routes are folders: /properties is
 * properties/index.html, /buy is buy/index.html, and so on. Two things have to
 * be true for that to work in a browser, and not every way of "opening the
 * site" provides them:
 *
 *   1. A DIRECTORY URL MUST SERVE ITS index.html.
 *      Double-clicking index.html (file://) gives you no server at all, so
 *      /properties resolves against your DRIVE ROOT — which is what produces
 *      Windows' "File not found. It may have been moved, edited, or deleted."
 *
 *   2. AN EXTENSIONLESS DIRECTORY URL MUST REDIRECT TO ADD A TRAILING SLASH.
 *      Served at "/properties" (no slash), the browser resolves the page's own
 *      relative "../css/style.css" against the PARENT directory and every
 *      asset 404s. Served at "/properties/" it is correct. Mainstream static
 *      hosts (Netlify, Vercel, Cloudflare Pages, GitHub Pages, nginx, Apache)
 *      all issue this redirect; some local dev servers do not.
 *
 * This server does both, with zero dependencies — no npm install, no network.
 * It is a DEV server only: no caching, no compression, no security hardening.
 * Do not put it in front of anything public.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const ROOT = __dirname;
const PORT = Number(process.argv[2]) || 5273;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4", ".webm": "video/webm",
  ".woff": "font/woff", ".woff2": "font/woff2",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
};

/** Blocks path traversal — a request can never escape the project folder. */
function safeJoin(root, urlPath) {
  const resolved = path.resolve(root, "." + path.posix.normalize(urlPath));
  return resolved.startsWith(root) ? resolved : null;
}

function send(res, status, body, headers) {
  res.writeHead(status, Object.assign({ "Cache-Control": "no-store" }, headers || {}));
  res.end(body);
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url);
  let pathname;
  try {
    pathname = decodeURIComponent(parsed.pathname || "/");
  } catch (e) {
    return send(res, 400, "Bad request", { "Content-Type": "text/plain" });
  }

  const filePath = safeJoin(ROOT, pathname);
  if (!filePath) return send(res, 403, "Forbidden", { "Content-Type": "text/plain" });

  let stat = null;
  try { stat = fs.statSync(filePath); } catch (e) { /* falls through to 404 */ }

  // Rule 2: a real directory reached without a trailing slash gets redirected,
  // preserving the query string. This is what keeps the page's own relative
  // asset paths resolving against the right directory.
  if (stat && stat.isDirectory() && !pathname.endsWith("/")) {
    const location = pathname + "/" + (parsed.search || "");
    return send(res, 301, "", { Location: location });
  }

  // Rule 1: a directory serves its index.html.
  let target = filePath;
  if (stat && stat.isDirectory()) {
    target = path.join(filePath, "index.html");
    try { stat = fs.statSync(target); } catch (e) { stat = null; }
  }

  if (!stat || !stat.isFile()) {
    const notFound = path.join(ROOT, "404", "index.html");
    if (fs.existsSync(notFound)) {
      return send(res, 404, fs.readFileSync(notFound), { "Content-Type": MIME[".html"] });
    }
    return send(res, 404, "404 Not Found: " + pathname, { "Content-Type": "text/plain; charset=utf-8" });
  }

  const type = MIME[path.extname(target).toLowerCase()] || "application/octet-stream";

  // Range support so <video> can seek instead of downloading the whole file.
  const range = req.headers.range;
  if (range && /^bytes=/.test(range)) {
    const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
    const start = parseInt(startStr, 10) || 0;
    const end = endStr ? parseInt(endStr, 10) : stat.size - 1;
    if (start >= stat.size || end >= stat.size) {
      return send(res, 416, "", { "Content-Range": `bytes */${stat.size}` });
    }
    res.writeHead(206, {
      "Content-Type": type,
      "Content-Range": `bytes ${start}-${end}/${stat.size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": end - start + 1,
      "Cache-Control": "no-store",
    });
    return fs.createReadStream(target, { start, end }).pipe(res);
  }

  res.writeHead(200, {
    "Content-Type": type,
    "Content-Length": stat.size,
    "Accept-Ranges": "bytes",
    "Cache-Control": "no-store",
  });
  fs.createReadStream(target).pipe(res);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n  Port ${PORT} is already in use.`);
    console.error(`  Either stop whatever is using it, or pick another:  node server.js 8080\n`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, () => {
  console.log("");
  console.log("  Realtor Shamraiz — development server");
  console.log("  ─────────────────────────────────────");
  console.log(`  Serving : ${ROOT}`);
  console.log(`  Open    : http://localhost:${PORT}`);
  console.log(`  Admin   : http://localhost:${PORT}/admin/   (local only — never deploy as-is)`);
  console.log("");
  console.log("  Stop with Ctrl+C.");
  console.log("");
});

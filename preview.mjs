import { createServer } from "node:http";
import { readFile, realpath, stat } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { brotliCompressSync, constants as zlibConstants, gzipSync } from "node:zlib";

const root = new URL("./", import.meta.url);
const types = {
  html: "text/html; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8",
  png: "image/png",
  jpg: "image/jpeg",
  woff: "font/woff",
  woff2: "font/woff2",
  txt: "text/plain; charset=utf-8",
  xml: "application/xml; charset=utf-8"
};
const missing = await readFile(new URL("404.html", root), "utf8");
const args = process.argv.slice(2);
const hosted = args.includes("--student-hosted");
const pilotEnabled = hosted || args.includes("--student-pilot");
const port = Number(args.find((argument) => !argument.startsWith("--")) ?? (hosted ? process.env.PORT ?? 8080 : 4173));
if (!Number.isInteger(port) || port < 0 || port > 65535 || (hosted && port === 0)) {
  throw new Error("Choose a valid listening port.");
}
const railwayDomain = hosted && process.env.RAILWAY_PUBLIC_DOMAIN;
const publicOrigin = pilotEnabled
  ? process.env.PROSNOPATH_STUDENT_ORIGIN || (railwayDomain ? "https://" + railwayDomain : undefined)
  : undefined;
const localDb = fileURLToPath(new URL(".student-data/pilot.sqlite", root));
let dbPath = process.env.PROSNOPATH_STUDENT_DB;
if (hosted) {
  if (!publicOrigin) throw new Error("Set the public HTTPS origin before starting the hosted student service.");
  const volume = process.env.PROSNOPATH_DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH;
  if (!volume || !isAbsolute(volume)) {
    throw new Error("Mount a persistent data directory before starting the hosted student service.");
  }
  const volumeInfo = await stat(volume).catch((error) => {
    if (error.code !== "ENOENT") throw error;
    return null;
  });
  if (!volumeInfo?.isDirectory()) throw new Error("The persistent data directory does not exist.");
  const mountedDirectory = await realpath(volume);
  const appPath = await realpath(fileURLToPath(root));
  const withinApp = relative(appPath, mountedDirectory);
  if (!isAbsolute(withinApp) && withinApp !== ".." && !withinApp.startsWith(".." + sep)) {
    throw new Error("Keep hosted student data outside the application directory.");
  }
  dbPath = join(mountedDirectory, "students.sqlite");
}
if (publicOrigin && (!dbPath || resolve(dbPath).toLowerCase() === resolve(localDb).toLowerCase())) {
  throw new Error("The hosted pilot needs a database separate from the local preview.");
}
const studentPilot = pilotEnabled ? await (await import("./student-pilot/server.mjs")).openStudentPilot({
  contentRoot: root,
  dbPath: dbPath || localDb,
  publicOrigin,
  inviteCode: process.env.PROSNOPATH_PILOT_INVITE,
  adminPassword: process.env.PROSNOPATH_ADMIN_PASSWORD
}) : null;

// ফাইল একবার পড়ে মেমোরিতে রাখা হয়: সংকুচিত (br/gzip) সংস্করণ, ETag, আর পাতায় সংস্করণ-চিহ্নিত লিংক।
// কনটেইনারে ফাইল বদলায় না; স্থানীয় প্রিভিউতে বদলালে mtime দেখে আবার পড়া হয়।
const fileCache = new Map();
const compressible = new Set(["html", "js", "css", "txt", "xml"]);
const hashOf = (buffer) => createHash("sha256").update(buffer).digest("base64url").slice(0, 12);
async function cached(file, extension) {
  const fullPath = fileURLToPath(new URL(file, root));
  const mtime = file === "404.html" ? 0 : (await stat(fullPath)).mtimeMs;
  const hit = fileCache.get(file);
  if (hit && hit.mtime === mtime && (hosted || extension !== "html")) return hit;
  let raw = file === "404.html" ? Buffer.from(missing) : await readFile(fullPath);
  if (extension === "html") {
    let html = raw.toString("utf8");
    if (studentPilot) {
      const current = file === "student.html" ? ' aria-current="page"' : "";
      html = html.replace(/<!-- proshnopath-account -->(?:[\s\S]*?<!-- \/proshnopath-account -->)?/,
        '<a class="nav-account" id="studentNavLink" href="/student.html" data-quizzes="' + studentPilot.quizIds.join(",") + '"'
        + ' data-quiz-counts="' + studentPilot.quizCounts.join(",") + '"' + current + '>আমার অগ্রগতি</a>');
    }
    // স্থানীয় js/css/ছবির লিংকে ?v=<হ্যাশ> যোগ: ব্রাউজার এক বছর জমিয়ে রাখবে, ফাইল বদলালে হ্যাশও বদলাবে
    const refs = [...new Set([...html.matchAll(/(?:src|href)="((?:assets\/)?[a-z\d-]+\.(?:js|css|png|jpg))"/g)].map((m) => m[1]))];
    for (const ref of refs) {
      const asset = await cached(ref, ref.split(".").at(-1)).catch(() => null);
      if (asset) html = html.replaceAll('"' + ref + '"', '"' + ref + "?v=" + asset.version + '"');
    }
    raw = Buffer.from(html);
  }
  const version = hashOf(raw);
  const entry = { mtime, raw, version, etag: '"' + version + '"' };
  if (compressible.has(extension) && raw.length > 1024) {
    entry.br = brotliCompressSync(raw, { params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 10, [zlibConstants.BROTLI_PARAM_SIZE_HINT]: raw.length } });
    entry.gzip = gzipSync(raw, { level: 9 });
  }
  fileCache.set(file, entry);
  return entry;
}

const server = createServer(hosted ? { headersTimeout: 10_000, requestTimeout: 20_000 } : {}, async (request, response) => {
  const path = request.url.split("?")[0];
  if (hosted && path === "/healthz" && (request.method === "GET" || request.method === "HEAD")) {
    response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" })
      .end(request.method === "HEAD" ? undefined : "ok\n");
    return;
  }
  if (publicOrigin) {
    response.setHeader("Referrer-Policy", "no-referrer");
    if (request.headers["x-forwarded-proto"] === "http") {
      response.writeHead(303, { Location: publicOrigin + "/student.html", "Cache-Control": "no-store" }).end();
      return;
    }
  }
  if (studentPilot && path.startsWith("/api/student/")) {
    await studentPilot.serve(request, response, path.slice("/api/student".length));
    return;
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }

  const file = path === "/" ? "index.html" : path.slice(1);
  const extension = file.split(".").at(-1);
  const pilotPage = file === "student.html" || file === "student-model.html" || file === "parent-view.html" || file === "admin.html" || file === "teacher-hub.html";
  if ((studentPilot || !pilotPage) && (/^(?:assets\/)?[a-z\d-]+\.(?:html|js|css|png|jpg)$/.test(file) || /^assets\/fonts\/[a-z\d-]+\.woff2?$/.test(file)) || file === "robots.txt" || file === "sitemap.xml") {
    try {
      const entry = await cached(file, extension);
      const versioned = extension !== "html" && new URL(request.url, "http://x").searchParams.get("v") === entry.version;
      const headers = {
        "Content-Type": types[extension],
        "Cache-Control": pilotPage ? "no-store" : versioned ? "public, max-age=31536000, immutable" : "no-cache",
        "ETag": entry.etag,
        "Vary": "Accept-Encoding",
        "X-Content-Type-Options": "nosniff"
      };
      if (!pilotPage && request.headers["if-none-match"] === entry.etag) {
        response.writeHead(304, headers).end();
        return;
      }
      const accepts = String(request.headers["accept-encoding"] ?? "");
      let body = entry.raw;
      if (entry.br && /\bbr\b/.test(accepts)) { body = entry.br; headers["Content-Encoding"] = "br"; }
      else if (entry.gzip && /\bgzip\b/.test(accepts)) { body = entry.gzip; headers["Content-Encoding"] = "gzip"; }
      headers["Content-Length"] = body.length;
      response.writeHead(200, headers).end(request.method === "HEAD" ? undefined : body);
      return;
    } catch (error) {
      if (error.code !== "ENOENT") {
        response.writeHead(500).end();
        return;
      }
    }
  }
  response.writeHead(404, { "Content-Type": types.html })
    .end(request.method === "HEAD" ? undefined : missing);
});

server.listen(port, hosted ? "0.0.0.0" : "127.0.0.1", () => {
  const localOrigin = "http://127.0.0.1:" + server.address().port;
  if (!hosted) console.log("Local URL: " + localOrigin + "/");
  if (studentPilot) console.log("Student service: " + (publicOrigin || localOrigin) + "/student.html");
});
if (studentPilot) server.on("close", () => studentPilot.close());
if (hosted) {
  for (const signal of ["SIGTERM", "SIGINT"]) {
    process.once(signal, () => server.close());
  }
}

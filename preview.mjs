import { createServer } from "node:http";
import { readFile, realpath, stat } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = new URL("./", import.meta.url);
const types = {
  html: "text/html; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8",
  png: "image/png",
  jpg: "image/jpeg",
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
  const pilotPage = file === "student.html" || file === "student-model.html" || file === "parent-view.html" || file === "admin.html";
  if ((studentPilot || !pilotPage) && /^(?:assets\/)?[a-z\d-]+\.(?:html|js|css|png|jpg)$/.test(file) || file === "robots.txt" || file === "sitemap.xml") {
    try {
      let data = file === "404.html" ? missing : await readFile(fileURLToPath(new URL(file, root)));
      if (studentPilot && extension === "html") {
        const current = file === "student.html" ? ' aria-current="page"' : "";
        const quizzes = studentPilot.quizIds.join(",");
        const counts = studentPilot.quizCounts.join(",");
        data = data.toString("utf8").replace(/<!-- proshnopath-account -->(?:[\s\S]*?<!-- \/proshnopath-account -->)?/,
          '<a class="nav-account" id="studentNavLink" href="/student.html" data-quizzes="' + quizzes + '"'
          + ' data-quiz-counts="' + counts + '"' + current + '>আমার অগ্রগতি</a>');
      }
      response.writeHead(200, {
        "Content-Type": types[extension],
        "Cache-Control": pilotPage ? "no-store" : "no-cache",
        "X-Content-Type-Options": "nosniff"
      }).end(request.method === "HEAD" ? undefined : data);
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

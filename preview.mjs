import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("./", import.meta.url);
const types = {
  html: "text/html; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8",
  png: "image/png",
  jpg: "image/jpeg"
};
const missing = (await readFile(new URL("404.html", root), "utf8"))
  .replaceAll('"/www.prosnopath.bd/', '"/');
const port = Number(process.argv[2] || 4173);

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }

  const path = request.url.split("?")[0];
  const file = path === "/" ? "index.html" : path.slice(1);
  const extension = file.split(".").at(-1);
  if (/^(?:assets\/)?[a-z\d-]+\.(?:html|js|css|png|jpg)$/.test(file)) {
    try {
      const data = file === "404.html" ? missing : await readFile(fileURLToPath(new URL(file, root)));
      response.writeHead(200, {
        "Content-Type": types[extension],
        "Cache-Control": "no-cache",
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

server.listen(port, "127.0.0.1", () => {
  console.log("Local URL: http://127.0.0.1:" + server.address().port + "/");
});

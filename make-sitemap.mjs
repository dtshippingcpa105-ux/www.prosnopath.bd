// ব্যবহার: node make-sitemap.mjs https://www.example.com
// প্রকাশ্য HTML পেজগুলোর sitemap.xml বানায় এবং robots.txt-এ Sitemap লাইন বসায়।
import { readdir, readFile, writeFile, stat } from "node:fs/promises";

const origin = (process.argv[2] || "").replace(/\/+$/, "");
if (!/^https:\/\/[^/]+(\/.*)?$/.test(origin)) {
  console.error("HTTPS ঠিকানা দিন, যেমন: node make-sitemap.mjs https://www.example.com");
  process.exit(1);
}
const skip = new Set(["404.html", "student.html", "student-model.html", "parent-view.html", "search.html"]);
const pages = (await readdir(".")).filter((f) => f.endsWith(".html") && !skip.has(f)).sort();
const rows = [];
for (const page of pages) {
  const html = await readFile(page, "utf8");
  if (/name="robots" content="noindex"/.test(html)) continue;
  const date = (await stat(page)).mtime.toISOString().slice(0, 10);
  const loc = page === "index.html" ? origin + "/" : origin + "/" + page;
  rows.push(`  <url><loc>${loc}</loc><lastmod>${date}</lastmod><priority>${page === "index.html" ? "1.0" : "0.7"}</priority></url>`);
}
await writeFile("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join("\n")}\n</urlset>\n`);
const robots = (await readFile("robots.txt", "utf8")).replace(/\nSitemap: .*\n?/g, "\n").trimEnd();
await writeFile("robots.txt", robots + `\nSitemap: ${origin}/sitemap.xml\n`);
console.log(`sitemap.xml-এ ${rows.length}টি পেজ লেখা হয়েছে।`);

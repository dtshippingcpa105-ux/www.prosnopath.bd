// প্রতিটি HTML পাতায় স্থানীয় CSS/JS/ছবির লিংকে ?v=<হ্যাশ> বসায়, যাতে ফাইল বদলালে ব্রাউজার পুরনো কপি না দেখায়।
// preview.mjs একই হ্যাশ পদ্ধতি ব্যবহার করে, তাই Railway-তে এক বছরের ক্যাশও ঠিক থাকে। প্রতিটি প্রকাশের আগে চালান: node stamp-assets.mjs
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
const hashOf = (buffer) => createHash("sha256").update(buffer).digest("base64url").slice(0, 12);
const cache = new Map();
const version = (file) => {
  if (!cache.has(file)) cache.set(file, existsSync(file) ? hashOf(readFileSync(file)) : null);
  return cache.get(file);
};
let changed = 0;
for (const page of readdirSync(".").filter((name) => name.endsWith(".html"))) {
  const before = readFileSync(page, "utf8");
  const after = before.replace(/(src|href)="((?:assets\/)?[a-z\d-]+\.(?:js|css|png|jpg))(?:\?v=[\w-]+)?"/g, (match, attr, file) => {
    const v = version(file);
    return v ? attr + '="' + file + "?v=" + v + '"' : match;
  });
  if (after !== before) { writeFileSync(page, after); changed++; }
}
console.log("stamped pages:", changed);

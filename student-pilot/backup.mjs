import { chmod, link, mkdtemp, readdir, rmdir, unlink } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { backup, DatabaseSync } from "node:sqlite";

const [source, destination] = process.argv.slice(2);
if (!source || !destination) throw new Error("Usage: node student-pilot/backup.mjs <source.sqlite> <new-backup.sqlite>");

const target = resolve(destination);
const db = new DatabaseSync(resolve(source), { readOnly: true });
let work;
try {
  const hasStudentTables = db.prepare("SELECT count(*) AS total FROM sqlite_schema WHERE type='table' AND name IN ('students', 'quiz_attempts')").get();
  if (hasStudentTables.total !== 2) throw new Error("The source is not a প্রশ্নপাঠ student database.");

  work = await mkdtemp(join(dirname(target), ".student-backup-"));
  const temporary = join(work, "students.sqlite");
  await backup(db, temporary);
  const snapshot = new DatabaseSync(temporary);
  try {
    snapshot.exec("PRAGMA journal_mode = DELETE; DELETE FROM sessions;");
    if (!snapshot.prepare("PRAGMA quick_check").all().every((result) => result.quick_check === "ok")) {
      throw new Error("The backup failed SQLite's integrity check.");
    }
  } finally {
    snapshot.close();
  }
  await chmod(temporary, 0o600);
  // Do not replace an existing backup, including if another process created it while copying.
  await link(temporary, target);
  console.log("Verified SQLite backup created.");
} finally {
  db.close();
  if (work) {
    for (const file of await readdir(work)) await unlink(join(work, file));
    await rmdir(work);
  }
}

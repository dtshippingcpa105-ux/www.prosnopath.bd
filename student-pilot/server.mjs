import { createHash, randomBytes, randomInt, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { promisify } from "node:util";
import { runInNewContext } from "node:vm";
import { setupTeacherHub } from "./teacher.mjs";

const deriveKey = promisify(scrypt);
const firstQuizId = "plant-reproduction";
const chapterQuizIds = [firstQuizId, "math8-profit", "atomic-structure-c8", "math8-patterns", "math8-measurement"];
const modelId = "class8-model-1";
const modelTitle = "বিজ্ঞান ও গণিত · মডেল টেস্ট ১";
const modelMinutes = 10;
const modelChapters = [
  "growth-heredity", "plant-reproduction", "atomic-structure-c8",
  "math8-patterns", "math8-profit", "math8-measurement"
];
const localCookie = "prosnopath_student";
const sessionSeconds = 7 * 24 * 60 * 60;
const maxBodyBytes = 16384;
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function json(response, status, body, headers = {}) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...headers
  }).end(JSON.stringify(body));
}

async function readBody(request) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers["content-type"] || "")) {
    throw new RequestError(415, "অনুরোধের ধরনটি গ্রহণযোগ্য নয়।");
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > maxBodyBytes) {
      request.resume();
      throw new RequestError(413, "অনুরোধটি অনেক বড়।");
    }
    chunks.push(chunk);
  }
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (body && typeof body === "object" && !Array.isArray(body)) return body;
  } catch {
    // Show the same message for malformed JSON and a non-object body.
  }
  throw new RequestError(400, "অনুরোধটি পড়া যায়নি।");
}

function sha256(value) {
  return createHash("sha256").update(value).digest();
}

function publicStudent(row) {
  return { id: row.id, username: row.username, classId: "c8" };
}

function summary(row) {
  return {
    id: row.id, quizId: row.quiz_id, chapter: row.chapter, completedAt: row.completed_at, total: row.total,
    correct: row.correct, wrong: row.total - row.correct - row.skipped, skipped: row.skipped
  };
}

function modelBreakdown(questions) {
  const subjects = new Map();
  const chapters = new Map();
  function count(groups, entry, question) {
    if (!groups.has(entry.id)) groups.set(entry.id, { ...entry, total: 0, correct: 0, wrong: 0, skipped: 0 });
    const group = groups.get(entry.id);
    group.total++;
    if (question.choice === null) group.skipped++;
    else if (question.choice === question.answer) group.correct++;
    else group.wrong++;
  }
  for (const question of questions) {
    const { subjectId, subjectName, chapterId, chapterName } = question;
    if (subjectId) count(subjects, { id: subjectId, name: subjectName }, question);
    if (chapterId) count(chapters, { id: chapterId, name: chapterName, subjectName }, question);
  }
  return { subjects: [...subjects.values()], chapters: [...chapters.values()] };
}

// সহজে পড়া ও বলা যায় এমন অক্ষর (0/O, 1/I বাদ)
const codeAlphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
function makeCode(groups, size = 4) {
  return Array.from({ length: groups }, () =>
    Array.from({ length: size }, () => codeAlphabet[randomInt(codeAlphabet.length)]).join("")).join("-");
}
const normalizeCode = (value) => typeof value === "string" ? value.toUpperCase().replace(/[^0-9A-Z]/g, "") : "";
const codeHash = (value) => createHash("sha256").update(normalizeCode(value)).digest("hex");
const sameHex = (a, b) => typeof a === "string" && typeof b === "string" && a.length === b.length
  && timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));

export async function openStudentPilot({ contentRoot, dbPath, publicOrigin, inviteCode, adminPassword }) {
  const hosted = publicOrigin ? new URL(publicOrigin) : null;
  if (hosted && (hosted.protocol !== "https:" || hosted.origin !== publicOrigin
    || !/^[A-Za-z0-9-]{16,64}$/.test(inviteCode || ""))) {
    throw new Error("The hosted pilot needs an exact HTTPS origin and a 16–64-character invite code.");
  }
  const inviteHash = hosted ? sha256(inviteCode) : null;
  const adminHash = typeof adminPassword === "string" && adminPassword.length >= 12 ? sha256(adminPassword) : null;
  const adminCookieName = hosted ? "__Host-prosnopath_admin" : "prosnopath_admin";
  const adminSessions = new Map();
  const adminSeconds = 12 * 60 * 60;
  const cookieName = hosted ? "__Host-" + localCookie : localCookie;

  function sessionHash(request) {
    const entry = request.headers.cookie?.split(";").map((part) => part.trim())
      .find((part) => part.startsWith(cookieName + "="));
    const token = entry?.slice(cookieName.length + 1);
    return /^[a-f0-9]{64}$/.test(token || "") ? sha256(token).toString("hex") : "";
  }

  function sessionCookie(token, seconds) {
    return cookieName + "=" + token + "; Path=/; HttpOnly; SameSite=Strict; Max-Age=" + seconds
      + (hosted ? "; Secure" : "");
  }

  const sources = await Promise.all(["data.js", "science-eight-data.js", "math-eight-data.js"]
    .map((file) => readFile(new URL(file, contentRoot), "utf8")));
  const { chapters, subjects, subjectsByClass } = runInNewContext(sources.join("\n") + `
    ({ chapters: [...CLASS_EIGHT_SCIENCE, ...CLASS_EIGHT_MATH], subjects: SUBJECTS, subjectsByClass: SUBJECTS_BY_CLASS });
  `, {}, { filename: "student-pilot-content.js" });
  const findChapter = (id) => chapters.find((item) => item.id === id && item.classId === "c8");
  const chapterQuestions = (chapter) => chapter.mcq.map((item) =>
    item.useFigure ? { ...item, figure: chapter.figure } : item);
  const quizzes = new Map(chapterQuizIds.map((id) => {
    const chapter = findChapter(id);
    if (!chapter?.mcq.length) throw new Error("Student pilot quiz content is missing: " + id);
    return [id, { ...chapter, mcq: chapterQuestions(chapter), subjectName: subjects[chapter.subjectId].name }];
  }));
  const modelQuestions = modelChapters.flatMap((id) => {
    const chapter = findChapter(id);
    if (!chapter || chapter.mcq.length < 2) throw new Error("Missing model test questions: " + id);
    return chapterQuestions(chapter).slice(0, 2).map((item) => ({
      ...item, subjectId: chapter.subjectId, subjectName: subjects[chapter.subjectId].name,
      chapterId: chapter.id, chapterName: chapter.chapter
    }));
  });
  const model = { title: modelTitle, minutes: modelMinutes, total: modelQuestions.length };

  function review(row) {
    const answers = JSON.parse(row.answers_json);
    const questions = JSON.parse(row.questions_json).map((item, index) => {
      const question = { ...item, choice: answers[index] };
      if (row.quiz_id !== modelId || item.chapterId) return question;
      // Older saved attempts have the question and options but no chapter IDs.
      const match = modelQuestions.find((candidate) => candidate.subjectName === item.subjectName
        && candidate.q === item.q && candidate.options.join("\0") === item.options.join("\0"));
      if (!match) return question;
      const { subjectId, chapterId, chapterName } = match;
      return { ...question, subjectId, chapterId, chapterName };
    });
    return {
      ...summary(row), questions,
      ...(row.quiz_id === modelId ? { breakdown: modelBreakdown(questions) } : {})
    };
  }
  await mkdir(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath, { timeout: 5000 });
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      salt TEXT NOT NULL,
      password_hash TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      quiz_id TEXT NOT NULL,
      chapter TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      total INTEGER NOT NULL,
      correct INTEGER,
      skipped INTEGER,
      questions_json TEXT NOT NULL,
      answers_json TEXT
    ) STRICT;
    CREATE INDEX IF NOT EXISTS quiz_history ON quiz_attempts(student_id, completed_at DESC);
    CREATE INDEX IF NOT EXISTS quiz_subject_history ON quiz_attempts(student_id, quiz_id, completed_at DESC);
    CREATE TABLE IF NOT EXISTS active_model_tests (
      student_id TEXT PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
      attempt_id TEXT NOT NULL UNIQUE REFERENCES quiz_attempts(id) ON DELETE CASCADE,
      deadline INTEGER NOT NULL,
      choices_json TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS reset_codes (
      student_id TEXT PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
      code_hash TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS parent_links (
      student_id TEXT PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL,
      last_viewed INTEGER
    ) STRICT;
    CREATE TABLE IF NOT EXISTS mistake_resolutions (
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      source TEXT NOT NULL,
      q TEXT NOT NULL,
      resolved_at INTEGER NOT NULL,
      PRIMARY KEY (student_id, source, q)
    ) STRICT;
  `);
  const teacherHub = setupTeacherHub({
    db, json, readBody, RequestError, sha256, deriveKey, randomBytes, randomUUID, timingSafeEqual, hosted,
    checkAuthRate: () => checkAuthRate(),
    subjectsByClass: JSON.parse(JSON.stringify(subjectsByClass)),
    siteOrigins: ["https://dtshippingcpa105-ux.github.io", ...(process.env.PROSNOPATH_SITE_ORIGIN ? [process.env.PROSNOPATH_SITE_ORIGIN] : [])]
  });
  const studentColumns = new Set(db.prepare("PRAGMA table_info(students)").all().map((c) => c.name));
  if (!studentColumns.has("recovery_hash")) db.exec("ALTER TABLE students ADD COLUMN recovery_hash TEXT");
  if (!studentColumns.has("created_at")) db.exec("ALTER TABLE students ADD COLUMN created_at INTEGER");
  const sql = {
    findStudent: db.prepare("SELECT * FROM students WHERE username = ?"),
    addStudent: db.prepare("INSERT INTO students(id, username, salt, password_hash, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(username) DO NOTHING"),
    findStudentById: db.prepare("SELECT * FROM students WHERE id = ?"),
    setRecovery: db.prepare("UPDATE students SET recovery_hash = ? WHERE id = ?"),
    setPassword: db.prepare("UPDATE students SET salt = ?, password_hash = ? WHERE id = ?"),
    endAllSessions: db.prepare("DELETE FROM sessions WHERE student_id = ?"),
    endOtherSessions: db.prepare("DELETE FROM sessions WHERE student_id = ? AND token_hash != ?"),
    resetCode: db.prepare("SELECT code_hash, expires_at FROM reset_codes WHERE student_id = ?"),
    setResetCode: db.prepare("INSERT INTO reset_codes VALUES (?, ?, ?) ON CONFLICT(student_id) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at"),
    deleteResetCode: db.prepare("DELETE FROM reset_codes WHERE student_id = ?"),
    deleteStudent: db.prepare("DELETE FROM students WHERE id = ?"),
    adminStudents: db.prepare(`SELECT s.username, s.created_at,
      (SELECT count(*) FROM quiz_attempts q WHERE q.student_id = s.id AND q.completed_at IS NOT NULL) AS quizzes,
      (SELECT max(completed_at) FROM quiz_attempts q WHERE q.student_id = s.id) AS last_active,
      s.recovery_hash IS NOT NULL AS has_recovery,
      EXISTS (SELECT 1 FROM parent_links p WHERE p.student_id = s.id) AS parent_link,
      (SELECT expires_at FROM reset_codes r WHERE r.student_id = s.id) AS reset_expires
      FROM students s ORDER BY coalesce(last_active, s.created_at, 0) DESC LIMIT 500`),
    adminTotals: db.prepare(`SELECT (SELECT count(*) FROM students) AS students,
      (SELECT count(DISTINCT student_id) FROM quiz_attempts WHERE completed_at >= ?) AS active7,
      (SELECT count(*) FROM quiz_attempts WHERE completed_at IS NOT NULL) AS quizzes,
      (SELECT count(*) FROM quiz_attempts WHERE completed_at >= ?) AS quizzes7,
      (SELECT count(*) FROM parent_links) AS parent_links`),
    findSession: db.prepare("SELECT students.id, username FROM students JOIN sessions ON students.id = sessions.student_id WHERE token_hash = ? AND expires_at > ?"),
    addSession: db.prepare("INSERT INTO sessions VALUES (?, ?, ?)"),
    endSession: db.prepare("DELETE FROM sessions WHERE token_hash = ?"),
    clearExpiredSessions: db.prepare("DELETE FROM sessions WHERE expires_at <= ?"),
    addAttempt: db.prepare("INSERT INTO quiz_attempts(id, student_id, quiz_id, chapter, started_at, total, questions_json) VALUES (?, ?, ?, ?, ?, ?, ?)"),
    findAttempt: db.prepare("SELECT * FROM quiz_attempts WHERE id = ? AND student_id = ?"),
    complete: db.prepare("UPDATE quiz_attempts SET completed_at = ?, correct = ?, skipped = ?, answers_json = ? WHERE id = ? AND student_id = ? AND completed_at IS NULL"),
    history: db.prepare("SELECT id, quiz_id, chapter, completed_at, total, correct, skipped FROM quiz_attempts WHERE student_id = ? AND quiz_id = ? AND completed_at IS NOT NULL ORDER BY completed_at DESC, rowid DESC LIMIT 20"),
    stats: db.prepare("SELECT count(*) AS attempts, max(1.0 * correct / total) AS best FROM quiz_attempts WHERE student_id = ? AND quiz_id = ? AND completed_at IS NOT NULL"),
    activeModel: db.prepare("SELECT quiz_attempts.*, deadline, choices_json FROM active_model_tests JOIN quiz_attempts ON quiz_attempts.id = attempt_id WHERE active_model_tests.student_id = ?"),
    addModel: db.prepare("INSERT INTO active_model_tests VALUES (?, ?, ?, ?)"),
    saveChoice: db.prepare("UPDATE active_model_tests SET choices_json = ? WHERE student_id = ?"),
    endModel: db.prepare("DELETE FROM active_model_tests WHERE student_id = ?"),
    parentLink: db.prepare("SELECT created_at, last_viewed FROM parent_links WHERE student_id = ?"),
    setParentLink: db.prepare("INSERT INTO parent_links(student_id, token_hash, created_at) VALUES (?, ?, ?) ON CONFLICT(student_id) DO UPDATE SET token_hash = excluded.token_hash, created_at = excluded.created_at, last_viewed = NULL"),
    revokeParentLink: db.prepare("DELETE FROM parent_links WHERE student_id = ?"),
    parentStudent: db.prepare("SELECT students.id, students.username FROM parent_links JOIN students ON students.id = parent_links.student_id WHERE token_hash = ?"),
    parentViewed: db.prepare("UPDATE parent_links SET last_viewed = ? WHERE student_id = ?"),
    recentAttempts: db.prepare("SELECT quiz_id, chapter, completed_at, total, correct, skipped FROM quiz_attempts WHERE student_id = ? AND completed_at IS NOT NULL ORDER BY completed_at DESC, rowid DESC LIMIT 8"),
    resolutions: db.prepare("SELECT source, q, resolved_at FROM mistake_resolutions WHERE student_id = ?"),
    resolve: db.prepare("INSERT INTO mistake_resolutions VALUES (?, ?, ?, ?) ON CONFLICT(student_id, source, q) DO UPDATE SET resolved_at = excluded.resolved_at"),
    completedAll: db.prepare("SELECT quiz_id, chapter, started_at, completed_at, total, correct, skipped, questions_json, answers_json FROM quiz_attempts WHERE student_id = ? AND completed_at IS NOT NULL ORDER BY completed_at ASC, rowid ASC LIMIT 1000")
  };

  // ড্যাশবোর্ডের সারাংশ: দিনভিত্তিক হিসাব (বাংলাদেশ সময়), ধারাবাহিকতা, পয়েন্ট ও ভুলের খাতা।
  const dayMs = 86_400_000;
  const dhakaDay = (ts) => new Date(ts + 6 * 3_600_000).toISOString().slice(0, 10);
  const maxStudyMs = 60 * 60_000; // ফেলে রাখা কুইজ যেন পড়ার সময় ফুলিয়ে না দেয়
  function overview(studentId, now) {
    const rows = sql.completedAll.all(studentId);
    const days = new Map();
    for (let i = 29; i >= 0; i -= 1) {
      days.set(dhakaDay(now - i * dayMs), { date: dhakaDay(now - i * dayMs), quizzes: 0, correct: 0, wrong: 0, skipped: 0, seconds: 0 });
    }
    const active = new Set();
    const mistakes = new Map();
    let totalCorrect = 0;
    for (const row of rows) {
      const day = dhakaDay(row.completed_at);
      active.add(day);
      totalCorrect += row.correct;
      const bucket = days.get(day);
      if (bucket) {
        bucket.quizzes += 1;
        bucket.correct += row.correct;
        bucket.skipped += row.skipped;
        bucket.wrong += row.total - row.correct - row.skipped;
        bucket.seconds += Math.round(Math.min(Math.max(row.completed_at - row.started_at, 0), maxStudyMs) / 1000);
      }
      let items;
      let answers;
      try {
        items = JSON.parse(row.questions_json);
        answers = JSON.parse(row.answers_json);
      } catch {
        continue;
      }
      items.forEach((item, index) => {
        const key = row.quiz_id + "\0" + item.q;
        const choice = answers[index] ?? null;
        if (choice === item.answer) {
          mistakes.delete(key); // পরে সঠিক হলে খাতা থেকে বাদ
          return;
        }
        const previous = mistakes.get(key);
        mistakes.delete(key);
        mistakes.set(key, {
          q: item.q, options: item.options, answer: item.answer, explain: item.explain, figure: item.figure, choice,
          source: row.quiz_id,
          quizId: row.quiz_id === modelId ? (item.chapterId ?? null) : row.quiz_id,
          chapter: item.chapterName ?? row.chapter,
          subjectName: item.subjectName ?? quizzes.get(row.quiz_id)?.subjectName ?? "",
          misses: (previous?.misses ?? 0) + 1, lastSeen: row.completed_at
        });
      });
    }
    // অনুশীলনে সঠিক করা প্রশ্ন খাতা থেকে বাদ, যদি তার পরে আবার ভুল না হয়ে থাকে
    const resolved = new Map(sql.resolutions.all(studentId).map((r) => [r.source + "\0" + r.q, r.resolved_at]));
    const open = [...mistakes.entries()].filter(([key, item]) => !(resolved.get(key) >= item.lastSeen)).map(([, item]) => item);
    const today = dhakaDay(now);
    let cursor = active.has(today) ? now : now - dayMs;
    let streak = 0;
    while (active.has(dhakaDay(cursor))) {
      streak += 1;
      cursor -= dayMs;
    }
    let best = 0;
    let run = 0;
    let previousDay = null;
    for (const day of [...active].sort()) {
      run = previousDay && Date.parse(day) - Date.parse(previousDay) === dayMs ? run + 1 : 1;
      best = Math.max(best, run);
      previousDay = day;
    }
    return {
      today, days: [...days.values()], streak, bestStreak: best, practicedToday: active.has(today),
      xp: totalCorrect * 10 + rows.length * 5, totalQuizzes: rows.length,
      mistakeCount: open.length, mistakes: open.reverse().slice(0, 60)
    };
  }

  function modelTransaction(action) {
    db.exec("BEGIN IMMEDIATE");
    try {
      const result = action(Date.now());
      db.exec("COMMIT");
      return result;
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }

  function scoreAttempt(row, items, answers, at) {
    const correct = items.filter((item, index) => item.answer === answers[index]).length;
    const skipped = answers.filter((answer) => answer === null).length;
    sql.complete.run(at, correct, skipped, JSON.stringify(answers), row.id, row.student_id);
    return sql.findAttempt.get(row.id, row.student_id);
  }

  function finishModel(row, at) {
    const completed = scoreAttempt(row, JSON.parse(row.questions_json), JSON.parse(row.choices_json), at);
    sql.endModel.run(row.student_id);
    return completed;
  }

  function modelState(row, now) {
    if (!row) return null;
    return {
      id: row.id, deadline: row.deadline, serverNow: now, choices: JSON.parse(row.choices_json),
      questions: JSON.parse(row.questions_json).map(({ q, options, figure, subjectName }) => ({
        q, options, figure, subjectName
      }))
    };
  }

  // অভিভাবকের জন্য শুধু-দেখার সারাংশ: কোনো উত্তর বা প্রশ্নের তালিকা নয়, শুধু অগ্রগতি
  function parentSummary(student, now) {
    const data = overview(student.id, now);
    const mistakesByChapter = new Map();
    for (const item of data.mistakes) {
      const key = item.chapter || "অন্যান্য";
      mistakesByChapter.set(key, { chapter: key, subjectName: item.subjectName, count: (mistakesByChapter.get(key)?.count ?? 0) + 1 });
    }
    const chapters = [...quizzes.values()].map(({ id, subjectName, chapter }) => {
      const attempts = sql.history.all(student.id, id);
      const recent = attempts.slice(0, 5);
      const total = recent.reduce((sum, a) => sum + a.total, 0);
      const correct = recent.reduce((sum, a) => sum + a.correct, 0);
      return {
        chapter, subjectName, attemptCount: sql.stats.get(student.id, id).attempts,
        accuracy: total ? Math.round(correct / total * 100) : null, lastAt: attempts[0]?.completed_at ?? null
      };
    });
    const modelStats = sql.stats.get(student.id, modelId);
    return {
      student: { username: student.username, classId: "c8" },
      generatedAt: now,
      overview: {
        today: data.today, days: data.days, streak: data.streak, bestStreak: data.bestStreak,
        practicedToday: data.practicedToday, xp: data.xp, totalQuizzes: data.totalQuizzes, mistakeCount: data.mistakeCount
      },
      chapters,
      weakChapters: [...mistakesByChapter.values()].sort((a, b) => b.count - a.count).slice(0, 5),
      recent: sql.recentAttempts.all(student.id).map((row) => ({
        chapter: row.quiz_id === modelId ? modelTitle : row.chapter, completedAt: row.completed_at,
        total: row.total, correct: row.correct, skipped: row.skipped, model: row.quiz_id === modelId
      })),
      modelTest: { attemptCount: modelStats.attempts, best: modelStats.best === null ? null : Math.round(modelStats.best * 100) }
    };
  }

  async function handleModel(request, response, path, studentId) {
    const method = request.method;
    const body = method === "POST" ? await readBody(request) : {};
    const { status, data } = modelTransaction((now) => {
      let active = sql.activeModel.get(studentId);
      if (active && now >= active.deadline) {
        finishModel(active, active.deadline);
        active = null;
      }

      if (path === "/model-test") {
        if (method === "GET") {
          const [latest] = sql.history.all(studentId, modelId);
          return { status: 200, data: { model, active: modelState(active, now), latest: latest ? summary(latest) : null } };
        }
        if (active) return { status: 200, data: { active: modelState(active, now) } };
        const id = randomUUID();
        sql.addAttempt.run(id, studentId, modelId, modelTitle, now, model.total, JSON.stringify(modelQuestions));
        sql.addModel.run(studentId, id, now + model.minutes * 60_000, JSON.stringify(Array(model.total).fill(null)));
        return { status: 201, data: { active: modelState(sql.activeModel.get(studentId), now) } };
      }

      const row = typeof body.id === "string" && uuid.test(body.id) ? sql.findAttempt.get(body.id, studentId) : null;
      if (row?.quiz_id !== modelId) {
        throw new RequestError(404, "মডেল টেস্টের এই চেষ্টা পাওয়া যায়নি।");
      }
      if (row.completed_at) return { status: 200, data: { attempt: review(row) } };
      if (path === "/model-test/finish") return { status: 200, data: { attempt: review(finishModel(active, now)) } };
      const { index, choice } = body;
      const items = JSON.parse(active.questions_json);
      if (!Number.isInteger(index) || index < 0 || index >= items.length ||
          (choice !== null && (!Number.isInteger(choice) || choice < 0 || choice >= items[index].options.length))) {
        throw new RequestError(400, "প্রশ্নটির জন্য একটি বৈধ উত্তর বেছে নিন।");
      }
      const choices = JSON.parse(active.choices_json);
      choices[index] = choice;
      sql.saveChoice.run(JSON.stringify(choices), studentId);
      return { status: 200, data: { choices } };
    });
    return json(response, status, data);
  }
  let parentViews = 0;
  let parentWindow = 0;
  let authAttempts = 0;
  let rateWindow = 0;
  const dummySalt = randomBytes(16).toString("hex");
  const dummyHash = Buffer.alloc(64);

  function signIn(request, response, student, status, extra = {}) {
    const token = randomBytes(32).toString("hex");
    const now = Date.now();
    sql.clearExpiredSessions.run(now);
    sql.addSession.run(sha256(token).toString("hex"), student.id, now + sessionSeconds * 1000);
    sql.endSession.run(sessionHash(request));
    json(response, status, { student: publicStudent(student), ...extra }, { "Set-Cookie": sessionCookie(token, sessionSeconds) });
  }

  function checkAuthRate() {
    const now = Date.now();
    if (now >= rateWindow) {
      rateWindow = now + 60_000;
      authAttempts = 0;
    }
    if (++authAttempts > 25) throw new RequestError(429, "অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।");
  }
  async function verifyPassword(student, password) {
    const candidate = await deriveKey(typeof password === "string" ? password : "", student?.salt ?? dummySalt, 64);
    return timingSafeEqual(candidate, student ? Buffer.from(student.password_hash, "hex") : dummyHash) && !!student;
  }
  async function storePassword(studentId, password) {
    const salt = randomBytes(16).toString("hex");
    const hash = await deriveKey(password, salt, 64);
    sql.setPassword.run(salt, hash.toString("hex"), studentId);
  }
  function newRecoveryCode(studentId) {
    const code = makeCode(3);
    sql.setRecovery.run(codeHash(code), studentId);
    return code;
  }
  const validPassword = (p) => typeof p === "string" && p.length >= 10 && Buffer.byteLength(p) <= 256;
  async function authenticate(request, response, register) {
    checkAuthRate();
    const body = await readBody(request);
    const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!/^[a-z][a-z0-9-]{3,23}$/.test(username) || password.length < 10 || Buffer.byteLength(password) > 256) {
      throw new RequestError(400, "আইডি ৪–২৪ অক্ষরের হবে এবং পাসওয়ার্ড অন্তত ১০ অক্ষরের হবে।");
    }
    if (register) {
      const suppliedInvite = typeof body.invite === "string" ? body.invite.trim() : "";
      if (inviteHash && !timingSafeEqual(sha256(suppliedInvite), inviteHash)) {
        throw new RequestError(403, "পরীক্ষামূলক আইডি খুলতে সঠিক আমন্ত্রণ কোড দিন।");
      }
      const id = randomUUID();
      const salt = randomBytes(16).toString("hex");
      const hash = await deriveKey(password, salt, 64);
      if (!sql.addStudent.run(id, username, salt, hash.toString("hex"), Date.now()).changes) {
        throw new RequestError(409, "এই আইডিটি ব্যবহৃত হচ্ছে। অন্য একটি আইডি বেছে নিন।");
      }
      return signIn(request, response, { id, username }, 201, { recoveryCode: newRecoveryCode(id) });
    }
    const student = sql.findStudent.get(username);
    const candidate = await deriveKey(password, student?.salt ?? dummySalt, 64);
    const matches = timingSafeEqual(candidate, student ? Buffer.from(student.password_hash, "hex") : dummyHash);
    if (!student || !matches) throw new RequestError(401, "আইডি বা পাসওয়ার্ড মেলেনি।");
    signIn(request, response, student, 200);
  }

  function adminToken(request) {
    const entry = request.headers.cookie?.split(";").map((part) => part.trim())
      .find((part) => part.startsWith(adminCookieName + "="));
    const token = entry?.slice(adminCookieName.length + 1);
    if (!/^[a-f0-9]{64}$/.test(token || "")) return "";
    const key = sha256(token).toString("hex");
    const expires = adminSessions.get(key);
    if (!expires || expires < Date.now()) { adminSessions.delete(key); return ""; }
    return key;
  }
  function adminCookie(token, seconds) {
    return adminCookieName + "=" + token + "; Path=/; HttpOnly; SameSite=Strict; Max-Age=" + seconds + (hosted ? "; Secure" : "");
  }
  async function handleAdmin(request, response, path, method) {
    const signedIn = adminToken(request);
    if (method === "GET" && path === "/admin/session") return json(response, 200, { enabled: !!adminHash, signedIn: !!signedIn });
    if (method === "POST" && path === "/admin/login") {
      checkAuthRate();
      const { password } = await readBody(request);
      if (!adminHash) throw new RequestError(403, "অ্যাডমিন অংশ চালু নেই। সার্ভারে PROSNOPATH_ADMIN_PASSWORD সেট করুন।");
      if (typeof password !== "string" || !timingSafeEqual(sha256(password), adminHash)) throw new RequestError(401, "অ্যাডমিন পাসওয়ার্ড মেলেনি।");
      const token = randomBytes(32).toString("hex");
      adminSessions.set(sha256(token).toString("hex"), Date.now() + adminSeconds * 1000);
      return json(response, 200, { signedIn: true }, { "Set-Cookie": adminCookie(token, adminSeconds) });
    }
    if (method === "POST" && path === "/admin/logout") {
      adminSessions.delete(signedIn);
      return json(response, 200, { signedIn: false }, { "Set-Cookie": adminCookie("", 0) });
    }
    if (!adminHash || !signedIn) throw new RequestError(401, "অ্যাডমিন হিসেবে লগইন করুন।");
    const now = Date.now();
    if (method === "GET" && path === "/admin/overview") {
      const weekAgo = now - 7 * 86_400_000;
      const totals = sql.adminTotals.get(weekAgo, weekAgo);
      return json(response, 200, {
        totals: { ...totals },
        inviteRequired: !!inviteHash,
        students: sql.adminStudents.all().map((row) => ({
          username: row.username, createdAt: row.created_at, quizzes: row.quizzes, lastActive: row.last_active,
          hasRecovery: !!row.has_recovery, parentLink: !!row.parent_link,
          resetPending: !!row.reset_expires && row.reset_expires > now ? row.reset_expires : null
        }))
      });
    }
    if (method === "POST" && (path === "/admin/reset-code" || path === "/admin/delete-student")) {
      const body = await readBody(request);
      const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
      const target = sql.findStudent.get(username);
      if (!target) throw new RequestError(404, "এই আইডির কোনো শিক্ষার্থী পাওয়া যায়নি।");
      if (path === "/admin/reset-code") {
        const code = makeCode(2, 5);
        const expiresAt = now + 24 * 60 * 60 * 1000;
        sql.setResetCode.run(target.id, codeHash(code), expiresAt);
        return json(response, 200, { username, code, expiresAt });
      }
      if (body.confirm !== username) throw new RequestError(400, "মুছতে আইডিটি হুবহু আবার লিখুন।");
      sql.deleteStudent.run(target.id);
      return json(response, 200, { deleted: username });
    }
    if (await teacherHub.handleAdmin(request, response, path, method)) return;
    throw new RequestError(404, "পাতাটি পাওয়া যায়নি।");
  }

  async function handle(request, response, path) {
    const host = request.headers.host;
    const validHost = hosted ? host === hosted.host : /^(?:127\.0\.0\.1|localhost)(?::[0-9]+)?$/i.test(host || "");
    if (!validHost) {
      throw new RequestError(403, "শিক্ষার্থী পাইলটের নির্ধারিত ঠিকানা থেকে খুলুন।");
    }
    const method = request.method;
    if (method !== "GET" && method !== "POST") throw new RequestError(405, "অনুরোধের পদ্ধতি গ্রহণযোগ্য নয়।");
    if (method === "POST" && request.headers.origin !== (hosted?.origin || "http://" + host)) {
      throw new RequestError(403, "একই সাইট থেকে আবার চেষ্টা করুন।");
    }

    if (method === "POST" && path === "/register") return authenticate(request, response, true);
    if (method === "POST" && path === "/login") return authenticate(request, response, false);
    if (method === "POST" && path === "/reset-password") {
      checkAuthRate();
      const body = await readBody(request);
      const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
      const code = normalizeCode(body.code);
      if (!/^[a-z][a-z0-9-]{3,23}$/.test(username) || code.length < 8 || code.length > 20) {
        throw new RequestError(400, "আইডি ও কোড ঠিকভাবে লিখুন।");
      }
      if (!validPassword(body.password)) throw new RequestError(400, "নতুন পাসওয়ার্ড অন্তত ১০ অক্ষরের হবে।");
      const target = sql.findStudent.get(username);
      const given = codeHash(code);
      const reset = target && sql.resetCode.get(target.id);
      const byRecovery = !!target && sameHex(target.recovery_hash, given);
      const byAdmin = !!reset && reset.expires_at > Date.now() && sameHex(reset.code_hash, given);
      if (!byRecovery && !byAdmin) throw new RequestError(401, "আইডি বা কোড মেলেনি। কোডের মেয়াদ শেষ হলে নতুন কোড নিন।");
      await storePassword(target.id, body.password);
      sql.endAllSessions.run(target.id);
      sql.deleteResetCode.run(target.id);
      return signIn(request, response, target, 200, { recoveryCode: newRecoveryCode(target.id) });
    }
    if (path.startsWith("/admin/")) return handleAdmin(request, response, path, method);
    if (method === "GET" && path === "/community") return teacherHub.handlePublic(request, response);
    if (path.startsWith("/teacher/")) return teacherHub.handleTeacher(request, response, path, method);
    const tokenHash = sessionHash(request);
    const student = tokenHash && sql.findSession.get(tokenHash, Date.now());
    if (method === "GET" && path === "/session") {
      return json(response, 200, { student: student ? publicStudent(student) : null, inviteRequired: !!inviteHash });
    }
    if (method === "POST" && path === "/logout") {
      sql.endSession.run(tokenHash);
      return json(response, 200, {}, { "Set-Cookie": sessionCookie("", 0) });
    }
    if (method === "POST" && path === "/parent-view") {
      const now = Date.now();
      if (now >= parentWindow) { parentWindow = now + 60_000; parentViews = 0; }
      if (++parentViews > 60) throw new RequestError(429, "অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।");
      const { token } = await readBody(request);
      if (typeof token !== "string" || !/^[A-Za-z0-9_-]{32,64}$/.test(token)) {
        throw new RequestError(400, "লিংকটি সঠিক নয়। শিক্ষার্থীর কাছ থেকে নতুন লিংক নিন।");
      }
      const owner = sql.parentStudent.get(sha256(token).toString("hex"));
      if (!owner) throw new RequestError(404, "লিংকটি আর চালু নেই। শিক্ষার্থীর কাছ থেকে নতুন লিংক নিন।");
      sql.parentViewed.run(now, owner.id);
      return json(response, 200, parentSummary(owner, now));
    }
    if (!student) throw new RequestError(401, "এই অংশটি দেখতে শিক্ষার্থী আইডিতে ঢুকুন।");
    if (method === "GET" && path === "/account") {
      return json(response, 200, { hasRecovery: !!sql.findStudentById.get(student.id)?.recovery_hash });
    }
    if (method === "POST" && (path === "/change-password" || path === "/recovery-code")) {
      checkAuthRate();
      const body = await readBody(request);
      const row = sql.findStudentById.get(student.id);
      if (!(await verifyPassword(row, body.current))) throw new RequestError(401, "বর্তমান পাসওয়ার্ড মেলেনি।");
      if (path === "/recovery-code") return json(response, 200, { recoveryCode: newRecoveryCode(student.id) });
      if (!validPassword(body.next)) throw new RequestError(400, "নতুন পাসওয়ার্ড অন্তত ১০ অক্ষরের হবে।");
      await storePassword(student.id, body.next);
      sql.endOtherSessions.run(student.id, tokenHash);
      return json(response, 200, { ok: true });
    }
    if (path === "/parent-link") {
      if (method === "GET") {
        const link = sql.parentLink.get(student.id);
        return json(response, 200, { active: !!link, createdAt: link?.created_at ?? null, lastViewed: link?.last_viewed ?? null });
      }
      const { action } = await readBody(request);
      if (action === "revoke") {
        sql.revokeParentLink.run(student.id);
        return json(response, 200, { active: false });
      }
      if (action !== "create") throw new RequestError(400, "অনুরোধটি বোঝা যায়নি।");
      const token = randomBytes(24).toString("base64url");
      const now = Date.now();
      sql.setParentLink.run(student.id, sha256(token).toString("hex"), now);
      return json(response, 200, { active: true, token, createdAt: now });
    }

    if (path === "/model-test" || (method === "POST" && ["/model-test/answer", "/model-test/finish"].includes(path))) {
      return handleModel(request, response, path, student.id);
    }
    if (method === "GET" && path === "/dashboard") {
      const chapterQuizzes = [...quizzes.values()].map(({ id, subjectId, subjectName, chapter, mcq }) => {
        const stats = sql.stats.get(student.id, id);
        return {
          quizId: id, subjectId, subjectName, chapter, questionCount: mcq.length,
          attempts: sql.history.all(student.id, id).map(summary),
          attemptCount: stats.attempts, best: stats.best
        };
      });
      // Keep the earlier dashboard fields for clients with cached scripts.
      const subjects = chapterQuizzes.slice(0, 2);
      const { attempts, attemptCount, best } = subjects[0];
      const modelTest = modelTransaction((now) => {
        const active = sql.activeModel.get(student.id);
        const isActive = !!active && now < active.deadline;
        if (active && !isActive) finishModel(active, active.deadline);
        const stats = sql.stats.get(student.id, modelId);
        return {
          ...model, isActive, attemptCount: stats.attempts, best: stats.best,
          attempts: sql.history.all(student.id, modelId).map(summary)
        };
      });
      const summaryData = overview(student.id, Date.now());
      return json(response, 200, { student: publicStudent(student), subjects, chapterQuizzes, attempts, attemptCount, best, modelTest, overview: summaryData });
    }
    if (method === "POST" && path === "/mistakes/resolve") {
      const { source, q } = await readBody(request);
      const known = typeof source === "string" && (source === modelId || quizzes.has(source));
      if (!known || typeof q !== "string" || !q || q.length > 600) {
        throw new RequestError(400, "প্রশ্নটি চেনা যায়নি।");
      }
      sql.resolve.run(student.id, source, q, Date.now());
      return json(response, 200, { ok: true });
    }
    if (method === "POST" && path === "/attempts") {
      const { quiz } = await readBody(request);
      const selectedQuiz = quizzes.get(quiz);
      if (!selectedQuiz) throw new RequestError(404, "পাইলট কুইজটি পাওয়া যায়নি।");
      const id = randomUUID();
      const { mcq, chapter } = selectedQuiz;
      sql.addAttempt.run(id, student.id, quiz, chapter, Date.now(), mcq.length, JSON.stringify(mcq));
      return json(response, 201, { id, questions: mcq.map(({ q, options, figure }) => ({ q, options, figure })) });
    }

    const attemptId = path.split("/").at(-1);
    if (!uuid.test(attemptId) || path !== "/attempts/" + attemptId) {
      throw new RequestError(404, "পাতাটি পাওয়া যায়নি।");
    }
    const findAttempt = () => sql.findAttempt.get(attemptId, student.id);
    if (method === "GET") {
      let row = findAttempt();
      if (row?.quiz_id === modelId && !row.completed_at) {
        row = modelTransaction((now) => {
          const active = sql.activeModel.get(student.id);
          return active?.id === attemptId && now >= active.deadline ? finishModel(active, active.deadline) : findAttempt();
        });
      }
      if (!row?.completed_at) throw new RequestError(404, "সংরক্ষিত ফলটি পাওয়া যায়নি।");
      return json(response, 200, { attempt: review(row) });
    }

    const { answers } = await readBody(request);
    const row = findAttempt();
    if (!row) throw new RequestError(404, "কুইজের এই চেষ্টা পাওয়া যায়নি।");
    if (row.quiz_id === modelId) throw new RequestError(400, "মডেল টেস্ট পেজ থেকে উত্তর জমা দিন।");
    const items = JSON.parse(row.questions_json);
    if (!Array.isArray(answers) || answers.length !== items.length || answers.some((choice, index) =>
      choice !== null && (!Number.isInteger(choice) || choice < 0 || choice >= items[index].options.length))) {
      throw new RequestError(400, "প্রতিটি প্রশ্নের জন্য একটি উত্তর বা বাদ দেওয়ার তথ্য দিন।");
    }
    const saved = JSON.stringify(answers);
    if (row.completed_at) {
      if (row.answers_json !== saved) throw new RequestError(409, "এই ফলটি আগেই জমা হয়েছে।");
      return json(response, 200, { attempt: review(row) });
    }
    const completed = scoreAttempt(row, items, answers, Date.now());
    if (completed.answers_json !== saved) throw new RequestError(409, "এই ফলটি আগেই জমা হয়েছে।");
    return json(response, 200, { attempt: review(completed) });
  }

  return {
    quizIds: [...quizzes.keys()],
    quizCounts: [...quizzes.values()].map(({ mcq }) => mcq.length),
    close() { db.close(); },
    async serve(request, response, path) {
      try {
        await handle(request, response, path);
      } catch (error) {
        if (!(error instanceof RequestError)) console.error("Student pilot request failed", error);
        json(response, error.status || 500, { error: error.status ? error.message : "সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করুন।" });
      }
    }
  };
}

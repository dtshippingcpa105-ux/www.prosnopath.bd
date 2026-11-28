import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtemp, rmdir, unlink } from "node:fs/promises";
import { createServer, request } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { openStudentPilot } from "./server.mjs";

test("subject results stay separate, private, and available across logins and restarts", async (t) => {
  const testDirectory = await mkdtemp(join(tmpdir(), "prosnopath-student-"));
  const dbPath = join(testDirectory, "test.sqlite");
  const stagedDb = join(testDirectory, "staged.sqlite");
  const contentRoot = new URL("../", import.meta.url);
  let server, pilot, origin;

  async function open(options = {}) {
    pilot = await openStudentPilot({ contentRoot, dbPath, ...options });
    server = createServer((request, response) => pilot.serve(request, response, request.url));
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    origin = "http://127.0.0.1:" + server.address().port;
  }

  async function close() {
    if (!pilot) return;
    if (server.listening) await new Promise((resolve) => server.close(resolve));
    pilot.close();
    pilot = null;
  }

  t.after(async () => {
    await close();
    for (const file of [dbPath, stagedDb]) {
      for (const suffix of ["", "-wal", "-shm"]) {
        await unlink(file + suffix).catch((error) => { if (error.code !== "ENOENT") throw error; });
      }
    }
    await rmdir(testDirectory);
  });

  await open();

  async function client(path, { cookie, body, status = 200, host, submittedOrigin = origin } = {}) {
    const headers = {};
    if (cookie) headers.Cookie = cookie;
    if (host) headers.Host = host;
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      headers.Origin = submittedOrigin;
    }
    return new Promise((resolve, reject) => {
      const connection = request(origin + path, { method: body === undefined ? "GET" : "POST", headers }, async (response) => {
        try {
          assert.ok([status].flat().includes(response.statusCode), path + " returned " + response.statusCode);
          assert.equal(response.headers["cache-control"], "no-store");
          const chunks = [];
          for await (const chunk of response) chunks.push(chunk);
          resolve({ data: JSON.parse(Buffer.concat(chunks).toString("utf8")), session: response.headers["set-cookie"]?.[0], status: response.statusCode });
        } catch (error) {
          reject(error);
        }
      });
      connection.on("error", reject);
      connection.end(body === undefined ? undefined : JSON.stringify(body));
    });
  }

  const password = randomBytes(18).toString("base64url");
  const first = { username: "learner-one", password };
  const second = { username: "learner-two", password: randomBytes(18).toString("base64url") };
  const a = await client("/register", { body: first, status: 201 });
  const b = await client("/register", { body: second, status: 201 });
  assert.notEqual(a.data.student.id, b.data.student.id);
  assert.equal(a.data.student.classId, "c8");
  assert.match(a.session, /HttpOnly; SameSite=Strict/);
  const cookieA = a.session.split(";")[0];
  const cookieB = b.session.split(";")[0];

  await client("/dashboard", { status: 401 });
  await client("/login", { body: { ...first, password: second.password }, status: 401 });
  const begun = await client("/attempts", { cookie: cookieA, body: { quiz: "plant-reproduction" }, status: 201 });
  const { questions, id } = begun.data;
  assert.equal(questions.length, 6);
  assert.ok(questions.every(({ answer, explain }) => answer === undefined && explain === undefined));
  const resultPath = "/attempts/" + id;
  await client(resultPath, { cookie: cookieA, status: 404 });
  await client(resultPath, { cookie: cookieA, body: { answers: [1] }, status: 400 });
  const answers = [1, 0, null, null, null, null];
  await client(resultPath, { cookie: cookieB, body: { answers }, status: 404 });
  const completed = await client(resultPath, { cookie: cookieA, body: { answers, correct: 6 } });
  const { attempt } = completed.data;
  assert.equal(attempt.quizId, "plant-reproduction");
  assert.equal(attempt.correct, 1);
  assert.equal(attempt.wrong, 1);
  assert.equal(attempt.skipped, 4);
  assert.equal(attempt.questions[1].choice, 0);
  assert.equal(attempt.questions[1].answer, 3);
  const retry = await client(resultPath, { cookie: cookieA, body: { answers } });
  assert.deepEqual(retry.data, completed.data);
  await client(resultPath, { cookie: cookieA, body: { answers: [0, ...answers.slice(1)] }, status: 409 });

  const independentSession = await client("/login", { body: first });
  const separateCookie = independentSession.session.split(";")[0];
  assert.notEqual(separateCookie, cookieA);
  const history = await client("/dashboard", { cookie: separateCookie });
  assert.equal(history.data.attemptCount, 1);
  assert.equal(history.data.attempts[0].id, id);
  assert.deepEqual(history.data.subjects.map(({ subjectId, attemptCount, best }) => [subjectId, attemptCount, best]),
    [["science", 1, 1 / 6], ["math", 0, null]]);
  await client(resultPath, { cookie: cookieB, status: 404 });
  assert.deepEqual((await client("/dashboard", { cookie: cookieB })).data.attempts, []);
  const overview = history.data.overview;
  assert.equal(overview.days.length, 30);
  assert.equal(overview.streak, 1);
  assert.equal(overview.practicedToday, true);
  assert.equal(overview.xp, 15);
  assert.equal(overview.totalQuizzes, 1);
  assert.deepEqual(overview.days.at(-1), { ...overview.days.at(-1), quizzes: 1, correct: 1, wrong: 1, skipped: 4 });
  assert.equal(overview.mistakeCount, 5);
  assert.ok(overview.mistakes.every((item) => item.choice !== item.answer && item.chapter && item.explain));
  const emptyOverview = (await client("/dashboard", { cookie: cookieB })).data.overview;
  assert.deepEqual([emptyOverview.streak, emptyOverview.xp, emptyOverview.mistakeCount], [0, 0, 0]);
  const firstMistake = overview.mistakes[0];
  assert.equal(firstMistake.source, "plant-reproduction");
  await client("/mistakes/resolve", { cookie: cookieA, body: { source: "unknown-quiz", q: firstMistake.q }, status: 400 });
  await client("/mistakes/resolve", { cookie: cookieA, body: { source: firstMistake.source, q: firstMistake.q } });
  const afterResolve = (await client("/dashboard", { cookie: cookieA })).data.overview;
  assert.equal(afterResolve.mistakeCount, 4);
  assert.ok(!afterResolve.mistakes.some((item) => item.q === firstMistake.q));
  assert.equal((await client("/dashboard", { cookie: cookieB })).data.overview.mistakeCount, 0);

  await close();
  await open();
  const persisted = await client(resultPath, { cookie: separateCookie });
  assert.deepEqual(persisted.data, completed.data);
  await client("/attempts", { cookie: separateCookie, body: { quiz: "math8-pattern" }, status: 404 });
  const math = await client("/attempts", { cookie: separateCookie, body: { quiz: "math8-profit" }, status: 201 });
  assert.equal(math.data.questions.length, 8);
  const mathPath = "/attempts/" + math.data.id;
  const profitAnswers = [math.data.questions[0].options.indexOf("১৫%"), ...Array(7).fill(null)];
  const savedProfit = await client(mathPath, { cookie: separateCookie, body: { answers: profitAnswers } });
  assert.equal(savedProfit.data.attempt.quizId, "math8-profit");
  assert.equal(savedProfit.data.attempt.correct, 1);
  assert.equal(savedProfit.data.attempt.skipped, 7);
  assert.deepEqual((await client(mathPath, { cookie: separateCookie, body: { answers: profitAnswers } })).data, savedProfit.data);
  await client(mathPath, { cookie: cookieB, status: 404 });
  const later = await client("/attempts", { cookie: separateCookie, body: { quiz: "math8-profit" }, status: 201 });
  await client("/attempts/" + later.data.id, { cookie: separateCookie, body: { answers: Array(8).fill(null) } });
  const reports = (await client("/dashboard", { cookie: separateCookie })).data.subjects;
  assert.deepEqual(reports[0].attempts.map((row) => row.id), [id]);
  assert.deepEqual(reports[1].attempts.map((row) => row.id), [later.data.id, math.data.id]);
  assert.deepEqual(reports.map(({ subjectId, attemptCount, best, attempts }) => [subjectId, attemptCount, best, attempts[0].correct]),
    [["science", 1, 1 / 6, 1], ["math", 2, 1 / 8, 0]]);
  const additions = [
    ["atomic-structure-c8", 8, 2],
    ["math8-patterns", 10, 1],
    ["math8-measurement", 10, 3]
  ];
  for (const [quiz, total, firstAnswer] of additions) {
    const start = (await client("/attempts", { cookie: separateCookie, body: { quiz }, status: 201 })).data;
    assert.equal(start.questions.length, total);
    assert.ok(start.questions.every((item) => item.answer === undefined && item.explain === undefined));
    if (quiz === "math8-patterns") assert.ok(start.questions.some((item) => item.figure?.image === "math8-pattern.png"));
    const saved = await client("/attempts/" + start.id, {
      cookie: separateCookie, body: { answers: [firstAnswer, ...Array(total - 1).fill(null)] }
    });
    assert.equal(saved.data.attempt.correct, 1);
    assert.equal(saved.data.attempt.quizId, quiz);
  }
  const allQuizReports = (await client("/dashboard", { cookie: separateCookie })).data.chapterQuizzes;
  assert.deepEqual(allQuizReports.map((item) => [item.quizId, item.questionCount, item.attemptCount]),
    [["plant-reproduction", 6, 1], ["math8-profit", 8, 2], ...additions.map(([id, total]) => [id, total, 1])]);

  const examPath = "/model-test";
  await client(examPath, { status: 401 });
  const model = { cookie: separateCookie };
  const examStarts = await Promise.all([{}, {}].map((body) =>
    client(examPath, { ...model, body, status: [200, 201] })));
  assert.deepEqual(examStarts.map((response) => response.status).sort(), [200, 201]);
  const { active } = examStarts[0].data;
  assert.equal(active.id, examStarts[1].data.active.id);
  assert.equal(active.deadline - active.serverNow, 600_000);
  assert.equal(active.questions.length, 12);
  assert.equal(active.questions.filter((item) => item.subjectName === "গণিত").length, 6);
  assert.ok(active.questions.every((item) => item.answer === undefined && item.explain === undefined));
  const save = { id: active.id, index: 0, choice: 1 };
  const examAttempt = "/attempts/" + active.id;
  await client(examPath + "/answer", { cookie: cookieB, body: save, status: 404 });
  await client(examPath + "/answer", { ...model, body: { ...save, choice: 40 }, status: 400 });
  await client(examAttempt, { ...model, body: { answers: Array(12).fill(1) }, status: 400 });
  await client(examAttempt, { ...model, status: 404 });
  await client(examPath + "/answer", { ...model, body: save });
  await client(examPath + "/answer", { ...model, body: { ...save, index: 1, choice: 2 } });
  await client(examPath + "/answer", { ...model, body: { ...save, index: 1, choice: null } });
  await client(examPath + "/answer", { ...model, body: { ...save, index: 6, choice: 0 } });
  await close();
  await open();
  const resumed = (await client(examPath, model)).data.active;
  assert.equal(resumed.id, active.id);
  assert.equal(resumed.deadline, active.deadline);
  assert.deepEqual(resumed.choices, [1, ...Array(5).fill(null), 0, ...Array(5).fill(null)]);
  const clock = t.mock.method(Date, "now", () => active.deadline);
  try {
    const finished = await client(examPath + "/answer", { ...model, body: { ...save, choice: 0 } });
    assert.equal(finished.data.attempt.correct, 1);
    assert.equal(finished.data.attempt.skipped, 10);
    const { breakdown } = finished.data.attempt;
    assert.deepEqual(breakdown.subjects.map(({ id, total, correct, wrong, skipped }) => [id, total, correct, wrong, skipped]),
      [["science", 6, 1, 0, 5], ["math", 6, 0, 1, 5]]);
    assert.deepEqual(breakdown.chapters.map(({ id }) => id), [
      "growth-heredity", "plant-reproduction", "atomic-structure-c8", "math8-patterns", "math8-profit", "math8-measurement"
    ]);
    assert.deepEqual(breakdown.chapters[3], {
      id: "math8-patterns", name: "প্যাটার্ন", subjectName: "গণিত", total: 2, correct: 0, wrong: 1, skipped: 1
    });
    assert.equal(finished.data.attempt.completedAt, active.deadline);
    assert.deepEqual((await client(examPath + "/finish", { ...model, body: { id: active.id } })).data, finished.data);
    assert.deepEqual((await client(examAttempt, model)).data, finished.data);
    await client(examAttempt, { cookie: cookieB, status: 404 });
    const report = (await client("/dashboard", model)).data;
    assert.deepEqual(report.subjects.map((item) => item.attemptCount), [1, 2]);
    assert.equal(report.modelTest.isActive, false);
    assert.equal(report.modelTest.attemptCount, 1);
    assert.equal(report.modelTest.best, 1 / 12);
    assert.equal((await client("/dashboard", { cookie: cookieB })).data.modelTest.attemptCount, 0);
  } finally {
    clock.mock.restore();
  }
  const manual = (await client(examPath, { ...model, body: {}, status: 201 })).data.active;
  assert.notEqual(manual.id, active.id);
  const blank = (await client(examPath + "/finish", { ...model, body: { id: manual.id } })).data.attempt;
  assert.equal(blank.skipped, 12);
  assert.ok(blank.completedAt < manual.deadline);
  await close();
  const legacy = new DatabaseSync(dbPath);
  try {
    const original = legacy.prepare("SELECT questions_json FROM quiz_attempts WHERE id = ?").get(active.id);
    const legacyItems = JSON.parse(original.questions_json).map(({ chapterId, chapterName, subjectId, ...question }) => question);
    legacy.prepare("UPDATE quiz_attempts SET questions_json = ? WHERE id = ?").run(JSON.stringify(legacyItems), active.id);
  } finally {
    legacy.close();
  }
  await open();
  const legacyBreakdown = (await client(examAttempt, model)).data.attempt.breakdown;
  assert.equal(legacyBreakdown.chapters[3].wrong, 1);
  assert.equal(legacyBreakdown.chapters[3].id, "math8-patterns");
  assert.equal(legacyBreakdown.subjects[0].correct, 1);

  await client("/logout", { cookie: separateCookie, body: {} });
  await client("/dashboard", { cookie: separateCookie, status: 401 });
  assert.equal((await client("/dashboard", { cookie: cookieA })).data.attemptCount, 1);

  await close();
  const publicOrigin = "https://pilot.example";
  const inviteCode = randomBytes(12).toString("hex");
  await open({ dbPath: stagedDb, publicOrigin, inviteCode });
  const stage = { host: "pilot.example", submittedOrigin: publicOrigin };
  await client("/session", { status: 403 });
  assert.deepEqual((await client("/session", stage)).data, { student: null, inviteRequired: true });
  await client("/register", { ...stage, body: first, status: 403 });
  await client("/register", { ...stage, submittedOrigin: origin, body: { ...first, invite: inviteCode }, status: 403 });
  const stagedAccount = await client("/register", { ...stage, body: { ...first, invite: inviteCode }, status: 201 });
  assert.match(stagedAccount.session, /^__Host-prosnopath_student=.*; Secure$/);
  const stagedCookie = stagedAccount.session.split(";")[0];
  assert.deepEqual((await client("/dashboard", { ...stage, cookie: stagedCookie })).data.attempts, []);
});

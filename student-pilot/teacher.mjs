// শিক্ষক হাব: শিক্ষক আইডি, প্রোফাইল, প্রশ্ন ও রিসোর্স জমা, অ্যাডমিনের অনুমোদন এবং প্রকাশিত কনটেন্টের পাবলিক তালিকা।
// শিক্ষকের জমা দেওয়া কিছুই অনুমোদন ছাড়া প্রকাশ হয় না।

const teacherSeconds = 7 * 24 * 60 * 60;
const maxPending = 50;
const text = (value, max) => typeof value === "string" ? value.trim().slice(0, max) : "";

export function setupTeacherHub(ctx) {
  const {
    db, json, readBody, RequestError, sha256, deriveKey, randomBytes, randomUUID, timingSafeEqual,
    hosted, checkAuthRate, subjectsByClass, siteOrigins
  } = ctx;
  const cookieName = hosted ? "__Host-prosnopath_teacher" : "prosnopath_teacher";
  const dummySalt = randomBytes(16).toString("hex");
  const dummyHash = Buffer.alloc(64);

  db.exec(`
    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      institution TEXT NOT NULL DEFAULT '',
      subjects TEXT NOT NULL DEFAULT '',
      bio TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS teacher_sessions (
      token_hash TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS teacher_questions (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
      class_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      chapter TEXT NOT NULL,
      type TEXT NOT NULL,
      q TEXT NOT NULL,
      options_json TEXT,
      answer INTEGER,
      explain TEXT NOT NULL DEFAULT '',
      model_answer TEXT NOT NULL DEFAULT '',
      marks INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'pending',
      review_note TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      reviewed_at INTEGER
    ) STRICT;
    CREATE INDEX IF NOT EXISTS teacher_question_status ON teacher_questions(status, created_at);
    CREATE TABLE IF NOT EXISTS teacher_resources (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
      class_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      review_note TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      reviewed_at INTEGER
    ) STRICT;
  `);

  const sql = {
    find: db.prepare("SELECT * FROM teachers WHERE username = ?"),
    add: db.prepare("INSERT INTO teachers(id, username, salt, password_hash, name, institution, subjects, bio, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(username) DO NOTHING"),
    session: db.prepare("SELECT teachers.* FROM teacher_sessions JOIN teachers ON teachers.id = teacher_sessions.teacher_id WHERE token_hash = ? AND expires_at > ?"),
    addSession: db.prepare("INSERT INTO teacher_sessions VALUES (?, ?, ?)"),
    endSession: db.prepare("DELETE FROM teacher_sessions WHERE token_hash = ?"),
    clearSessions: db.prepare("DELETE FROM teacher_sessions WHERE expires_at <= ?"),
    profile: db.prepare("UPDATE teachers SET name = ?, institution = ?, subjects = ?, bio = ? WHERE id = ?"),
    myQuestions: db.prepare("SELECT * FROM teacher_questions WHERE teacher_id = ? ORDER BY created_at DESC LIMIT 200"),
    myResources: db.prepare("SELECT * FROM teacher_resources WHERE teacher_id = ? ORDER BY created_at DESC LIMIT 200"),
    pendingCount: db.prepare("SELECT (SELECT count(*) FROM teacher_questions WHERE teacher_id = ? AND status = 'pending') + (SELECT count(*) FROM teacher_resources WHERE teacher_id = ? AND status = 'pending') AS n"),
    addQuestion: db.prepare("INSERT INTO teacher_questions(id, teacher_id, class_id, subject_id, chapter, type, q, options_json, answer, explain, model_answer, marks, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"),
    addResource: db.prepare("INSERT INTO teacher_resources(id, teacher_id, class_id, subject_id, title, url, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"),
    deleteQuestion: db.prepare("DELETE FROM teacher_questions WHERE id = ? AND teacher_id = ? AND status != 'approved'"),
    deleteResource: db.prepare("DELETE FROM teacher_resources WHERE id = ? AND teacher_id = ? AND status != 'approved'"),
    adminTeachers: db.prepare(`SELECT t.username, t.name, t.institution, t.subjects, t.status, t.created_at,
      (SELECT count(*) FROM teacher_questions q WHERE q.teacher_id = t.id) AS questions,
      (SELECT count(*) FROM teacher_questions q WHERE q.teacher_id = t.id AND q.status = 'approved') AS approved,
      (SELECT count(*) FROM teacher_resources r WHERE r.teacher_id = t.id) AS resources
      FROM teachers t ORDER BY t.status = 'pending' DESC, t.created_at DESC LIMIT 500`),
    setStatus: db.prepare("UPDATE teachers SET status = ? WHERE username = ?"),
    pendingQuestions: db.prepare("SELECT q.*, t.name AS teacher_name, t.institution FROM teacher_questions q JOIN teachers t ON t.id = q.teacher_id WHERE q.status = 'pending' ORDER BY q.created_at LIMIT 100"),
    pendingResources: db.prepare("SELECT r.*, t.name AS teacher_name, t.institution FROM teacher_resources r JOIN teachers t ON t.id = r.teacher_id WHERE r.status = 'pending' ORDER BY r.created_at LIMIT 100"),
    reviewQuestion: db.prepare("UPDATE teacher_questions SET status = ?, review_note = ?, reviewed_at = ? WHERE id = ?"),
    reviewResource: db.prepare("UPDATE teacher_resources SET status = ?, review_note = ?, reviewed_at = ? WHERE id = ?"),
    publicQuestions: db.prepare("SELECT q.*, t.name AS teacher_name, t.institution FROM teacher_questions q JOIN teachers t ON t.id = q.teacher_id WHERE q.status = 'approved' AND t.status = 'approved' ORDER BY q.reviewed_at DESC LIMIT 500"),
    publicResources: db.prepare("SELECT r.*, t.name AS teacher_name, t.institution FROM teacher_resources r JOIN teachers t ON t.id = r.teacher_id WHERE r.status = 'approved' AND t.status = 'approved' ORDER BY r.reviewed_at DESC LIMIT 200"),
    publicTeachers: db.prepare(`SELECT t.name, t.institution, t.subjects, t.bio,
      (SELECT count(*) FROM teacher_questions q WHERE q.teacher_id = t.id AND q.status = 'approved') AS questions
      FROM teachers t WHERE t.status = 'approved' ORDER BY questions DESC, t.created_at LIMIT 100`)
  };

  function token(request) {
    const entry = request.headers.cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith(cookieName + "="));
    const raw = entry?.slice(cookieName.length + 1);
    return /^[a-f0-9]{64}$/.test(raw || "") ? sha256(raw).toString("hex") : "";
  }
  const cookie = (value, seconds) => cookieName + "=" + value + "; Path=/; HttpOnly; SameSite=Strict; Max-Age=" + seconds + (hosted ? "; Secure" : "");
  const publicTeacher = (t) => ({ username: t.username, name: t.name, institution: t.institution, subjects: t.subjects, bio: t.bio, status: t.status });

  function checkPlace(classId, subjectId) {
    if (!subjectsByClass[classId]?.includes(subjectId)) throw new RequestError(400, "শ্রেণি ও বিষয় সঠিকভাবে বেছে নিন।");
  }

  function questionRow(row, withStatus) {
    const item = {
      id: row.id, classId: row.class_id, subjectId: row.subject_id, chapter: row.chapter, type: row.type, q: row.q,
      options: row.options_json ? JSON.parse(row.options_json) : null, answer: row.answer, explain: row.explain,
      modelAnswer: row.model_answer, marks: row.marks
    };
    if (row.teacher_name !== undefined) item.teacher = { name: row.teacher_name, institution: row.institution };
    if (withStatus) Object.assign(item, { status: row.status, reviewNote: row.review_note, createdAt: row.created_at });
    return item;
  }
  function resourceRow(row, withStatus) {
    const item = { id: row.id, classId: row.class_id, subjectId: row.subject_id, title: row.title, url: row.url, description: row.description };
    if (row.teacher_name !== undefined) item.teacher = { name: row.teacher_name, institution: row.institution };
    if (withStatus) Object.assign(item, { status: row.status, reviewNote: row.review_note, createdAt: row.created_at });
    return item;
  }

  function readQuestion(body) {
    const classId = text(body.classId, 10);
    const subjectId = text(body.subjectId, 30);
    checkPlace(classId, subjectId);
    const chapter = text(body.chapter, 100);
    const q = text(body.q, 600);
    if (!chapter) throw new RequestError(400, "অধ্যায়ের নাম লিখুন।");
    if (q.length < 5) throw new RequestError(400, "প্রশ্নটি পুরো লিখুন।");
    if (body.type === "mcq") {
      const options = Array.isArray(body.options) ? body.options.map((o) => text(o, 200)) : [];
      if (options.length !== 4 || options.some((o) => !o)) throw new RequestError(400, "চারটি অপশনই লিখুন।");
      if (new Set(options).size !== 4) throw new RequestError(400, "চারটি অপশন আলাদা হতে হবে।");
      if (!Number.isInteger(body.answer) || body.answer < 0 || body.answer > 3) throw new RequestError(400, "সঠিক উত্তর বেছে নিন।");
      const explain = text(body.explain, 600);
      if (!explain) throw new RequestError(400, "সঠিক উত্তরের ছোট ব্যাখ্যা লিখুন।");
      return { classId, subjectId, chapter, type: "mcq", q, options: JSON.stringify(options), answer: body.answer, explain, modelAnswer: "", marks: 1 };
    }
    if (body.type === "short") {
      const modelAnswer = text(body.modelAnswer, 1500);
      const marks = body.marks;
      if (!modelAnswer) throw new RequestError(400, "নমুনা উত্তর লিখুন।");
      if (!Number.isInteger(marks) || marks < 1 || marks > 20) throw new RequestError(400, "নম্বর ১ থেকে ২০-এর মধ্যে দিন।");
      return { classId, subjectId, chapter, type: "short", q, options: null, answer: null, explain: "", modelAnswer, marks };
    }
    throw new RequestError(400, "প্রশ্নের ধরন বেছে নিন।");
  }

  function readResource(body) {
    const classId = text(body.classId, 10);
    const subjectId = text(body.subjectId, 30);
    checkPlace(classId, subjectId);
    const title = text(body.title, 120);
    const url = text(body.url, 500);
    let parsed = null;
    try { parsed = new URL(url); } catch { /* নিচে বার্তা */ }
    if (title.length < 3) throw new RequestError(400, "রিসোর্সের শিরোনাম লিখুন।");
    if (!parsed || parsed.protocol !== "https:") throw new RequestError(400, "https:// দিয়ে শুরু হওয়া সঠিক লিংক দিন।");
    return { classId, subjectId, title, url: parsed.href, description: text(body.description, 400) };
  }

  // শিক্ষকের নিজের অনুরোধ (/teacher/...)
  async function handleTeacher(request, response, path, method) {
    const tokenHash = token(request);
    const teacher = tokenHash ? sql.session.get(tokenHash, Date.now()) : null;
    if (method === "GET" && path === "/teacher/session") return json(response, 200, { teacher: teacher ? publicTeacher(teacher) : null });
    if (method === "POST" && (path === "/teacher/register" || path === "/teacher/login")) {
      checkAuthRate();
      const body = await readBody(request);
      const username = text(body.username, 30).toLowerCase();
      const password = typeof body.password === "string" ? body.password : "";
      if (!/^[a-z][a-z0-9-]{3,23}$/.test(username) || password.length < 10 || Buffer.byteLength(password) > 256) {
        throw new RequestError(400, "আইডি ৪–২৪ অক্ষরের হবে এবং পাসওয়ার্ড অন্তত ১০ অক্ষরের হবে।");
      }
      let row;
      if (path === "/teacher/register") {
        const name = text(body.name, 60);
        if (name.length < 2) throw new RequestError(400, "আপনার নাম লিখুন।");
        const id = randomUUID();
        const salt = randomBytes(16).toString("hex");
        const hash = (await deriveKey(password, salt, 64)).toString("hex");
        if (!sql.add.run(id, username, salt, hash, name, text(body.institution, 100), text(body.subjects, 120), text(body.bio, 400), Date.now()).changes) {
          throw new RequestError(409, "এই আইডিটি ব্যবহৃত হচ্ছে। অন্য একটি আইডি বেছে নিন।");
        }
        row = sql.find.get(username);
      } else {
        row = sql.find.get(username);
        const candidate = await deriveKey(password, row?.salt ?? dummySalt, 64);
        const ok = timingSafeEqual(candidate, row ? Buffer.from(row.password_hash, "hex") : dummyHash);
        if (!row || !ok) throw new RequestError(401, "আইডি বা পাসওয়ার্ড মেলেনি।");
      }
      const raw = randomBytes(32).toString("hex");
      const now = Date.now();
      sql.clearSessions.run(now);
      sql.addSession.run(sha256(raw).toString("hex"), row.id, now + teacherSeconds * 1000);
      return json(response, path === "/teacher/register" ? 201 : 200, { teacher: publicTeacher(row) }, { "Set-Cookie": cookie(raw, teacherSeconds) });
    }
    if (method === "POST" && path === "/teacher/logout") {
      sql.endSession.run(tokenHash);
      return json(response, 200, {}, { "Set-Cookie": cookie("", 0) });
    }
    if (!teacher) throw new RequestError(401, "শিক্ষক আইডিতে লগইন করুন।");
    if (method === "GET" && path === "/teacher/dashboard") {
      return json(response, 200, {
        teacher: publicTeacher(teacher),
        questions: sql.myQuestions.all(teacher.id).map((r) => questionRow(r, true)),
        resources: sql.myResources.all(teacher.id).map((r) => resourceRow(r, true))
      });
    }
    if (method !== "POST") throw new RequestError(404, "পাতাটি পাওয়া যায়নি।");
    const body = await readBody(request);
    if (path === "/teacher/profile") {
      const name = text(body.name, 60);
      if (name.length < 2) throw new RequestError(400, "আপনার নাম লিখুন।");
      sql.profile.run(name, text(body.institution, 100), text(body.subjects, 120), text(body.bio, 400), teacher.id);
      return json(response, 200, { teacher: publicTeacher(sql.find.get(teacher.username)) });
    }
    if (path === "/teacher/delete") {
      const id = text(body.id, 40);
      const removed = body.kind === "resource" ? sql.deleteResource.run(id, teacher.id) : sql.deleteQuestion.run(id, teacher.id);
      if (!removed.changes) throw new RequestError(404, "এটি মোছা যাচ্ছে না। প্রকাশিত কনটেন্ট মুছতে প্রশ্নপাঠের সঙ্গে যোগাযোগ করুন।");
      return json(response, 200, { ok: true });
    }
    if (path === "/teacher/questions" || path === "/teacher/resources") {
      if (teacher.status !== "approved") throw new RequestError(403, "আপনার শিক্ষক আইডি এখনো অনুমোদনের অপেক্ষায়। অনুমোদন পেলে জমা দিতে পারবেন।");
      if (sql.pendingCount.get(teacher.id, teacher.id).n >= maxPending) {
        throw new RequestError(429, "যাচাইয়ের অপেক্ষায় অনেক কনটেন্ট জমে আছে। আগেরগুলো যাচাই হলে আবার জমা দিন।");
      }
      const id = randomUUID();
      if (path === "/teacher/questions") {
        const q = readQuestion(body);
        sql.addQuestion.run(id, teacher.id, q.classId, q.subjectId, q.chapter, q.type, q.q, q.options, q.answer, q.explain, q.modelAnswer, q.marks, Date.now());
      } else {
        const r = readResource(body);
        sql.addResource.run(id, teacher.id, r.classId, r.subjectId, r.title, r.url, r.description, Date.now());
      }
      return json(response, 201, { id, status: "pending" });
    }
    throw new RequestError(404, "পাতাটি পাওয়া যায়নি।");
  }

  // অ্যাডমিন (লগইন যাচাই server.mjs-এ হয়ে আসে)। এই অংশের পথ না হলে undefined ফেরত দেয়।
  async function handleAdmin(request, response, path, method) {
    if (method === "GET" && path === "/admin/teachers") {
      json(response, 200, {
        teachers: sql.adminTeachers.all().map((t) => ({ ...t })),
        questions: sql.pendingQuestions.all().map((r) => questionRow(r, true)),
        resources: sql.pendingResources.all().map((r) => resourceRow(r, true))
      });
      return true;
    }
    if (method === "POST" && path === "/admin/teacher-status") {
      const body = await readBody(request);
      if (!["approved", "pending", "suspended"].includes(body.status)) throw new RequestError(400, "অবস্থা বোঝা যায়নি।");
      if (!sql.setStatus.run(body.status, text(body.username, 30).toLowerCase()).changes) throw new RequestError(404, "এই শিক্ষক পাওয়া যায়নি।");
      json(response, 200, { ok: true });
      return true;
    }
    if (method === "POST" && path === "/admin/review") {
      const body = await readBody(request);
      if (!["approve", "reject"].includes(body.action)) throw new RequestError(400, "সিদ্ধান্ত বোঝা যায়নি।");
      const status = body.action === "approve" ? "approved" : "rejected";
      const note = text(body.note, 300);
      if (status === "rejected" && !note) throw new RequestError(400, "বাতিলের কারণ লিখুন, যাতে শিক্ষক ঠিক করতে পারেন।");
      const statement = body.kind === "resource" ? sql.reviewResource : sql.reviewQuestion;
      if (!statement.run(status, note, Date.now(), text(body.id, 40)).changes) throw new RequestError(404, "কনটেন্টটি পাওয়া যায়নি।");
      json(response, 200, { ok: true });
      return true;
    }
    return undefined;
  }

  // পাবলিক: প্রকাশিত প্রশ্ন, রিসোর্স ও শিক্ষক (মূল সাইট থেকেও পড়া যায়)
  function handlePublic(request, response) {
    const origin = request.headers.origin;
    const headers = origin && siteOrigins.includes(origin) ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {};
    return json(response, 200, {
      questions: sql.publicQuestions.all().map((r) => questionRow(r, false)),
      resources: sql.publicResources.all().map((r) => resourceRow(r, false)),
      teachers: sql.publicTeachers.all().map((t) => ({ ...t }))
    }, headers);
  }

  return { handleTeacher, handleAdmin, handlePublic };
}

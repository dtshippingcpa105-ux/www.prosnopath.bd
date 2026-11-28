// শিক্ষক হাব: লগইন/নিবন্ধন, প্রশ্ন ও রিসোর্স জমা, নিজের জমার অবস্থা, প্রোফাইল।
(() => {
  const get = PB.id;
  const api = (path, body) => PB.studentRequest("/teacher" + path, body);
  const status = get("teacherStatus");
  const statusName = { pending: "যাচাইয়ের অপেক্ষায়", approved: "অনুমোদিত", rejected: "ফেরত দেওয়া হয়েছে", suspended: "স্থগিত" };
  const date = new Intl.DateTimeFormat("bn-BD", { dateStyle: "medium", timeZone: "Asia/Dhaka" });
  const letters = ["ক", "খ", "গ", "ঘ"];
  let teacher = null;

  function say(text) { status.textContent = text; status.hidden = !text; if (text) status.scrollIntoView({ block: "nearest" }); }

  function fillPlace(classSelect, subjectSelect) {
    PB.select(classSelect, CLASSES.map((c) => [c.id, c.name]), "c8");
    const fillSubjects = () => PB.select(subjectSelect, (SUBJECTS_BY_CLASS[classSelect.value] ?? []).map((id) => [id, SUBJECTS[id].name]));
    classSelect.addEventListener("change", () => { fillSubjects(); fillChapters(); });
    fillSubjects();
  }
  function fillChapters() {
    const chapters = [...new Set(PB.entries().filter((e) => e.classId === get("tqClass").value && e.subjectId === get("tqSubject").value).map((e) => e.chapter))];
    get("tqChapters").innerHTML = chapters.map((c) => '<option value="' + PB.escape(c) + '">').join("");
  }

  function showTab(name) {
    for (const b of document.querySelectorAll(".teacher-tabs button")) b.setAttribute("aria-selected", String(b.dataset.tab === name));
    for (const pane of document.querySelectorAll(".teacher-pane")) pane.hidden = pane.dataset.pane !== name;
  }

  function itemMarkup(item, kind) {
    const where = (CLASSES.find((c) => c.id === item.classId)?.name ?? "") + " · " + (SUBJECTS[item.subjectId]?.name ?? "");
    const body = kind === "resource"
      ? '<p><strong>' + PB.escape(item.title) + '</strong></p><p><a href="' + PB.escape(item.url) + '" target="_blank" rel="noopener noreferrer">' + PB.escape(item.url) + '</a></p>'
      : '<p><strong>' + PB.escape(item.q) + '</strong></p>' + (item.options
        ? '<ol class="teacher-opts">' + item.options.map((o, i) => '<li' + (i === item.answer ? ' class="is-answer"' : "") + '>' + letters[i] + '. ' + PB.escape(o) + '</li>').join("") + '</ol>'
        : '<p class="muted">নম্বর ' + PB.bn(item.marks) + '</p>');
    return '<article class="teacher-item" data-status="' + item.status + '"><div class="teacher-item-head"><span>' + (kind === "resource" ? "রিসোর্স" : item.type === "mcq" ? "MCQ" : "লিখিত")
      + ' · ' + PB.escape(where) + (item.chapter ? ' · ' + PB.escape(item.chapter) : "") + ' · ' + date.format(new Date(item.createdAt)) + '</span>'
      + '<b>' + statusName[item.status] + '</b></div>' + body
      + (item.reviewNote ? '<p class="teacher-note">প্রশ্নপাঠের মন্তব্য: ' + PB.escape(item.reviewNote) + '</p>' : "")
      + (item.status !== "approved" ? '<button type="button" class="text-button" data-delete="' + PB.escape(item.id) + '" data-kind="' + kind + '">মুছে ফেলুন</button>' : "")
      + '</article>';
  }

  async function loadPanel() {
    const data = await api("/dashboard");
    teacher = data.teacher;
    get("teacherAuth").hidden = true;
    get("teacherPanel").hidden = false;
    get("tName").textContent = teacher.name;
    get("tInst").textContent = [teacher.institution, teacher.subjects].filter(Boolean).join(" · ");
    const badge = get("tStatusBadge");
    badge.textContent = statusName[teacher.status];
    badge.dataset.status = teacher.status;
    get("tPendingNote").hidden = teacher.status === "approved";
    for (const form of [get("tQuestionForm"), get("tResourceForm")]) form.querySelector("button[type=submit]").disabled = teacher.status !== "approved";
    get("tpName").value = teacher.name;
    get("tpInst").value = teacher.institution;
    get("tpSubjects").value = teacher.subjects;
    get("tpBio").value = teacher.bio;
    const all = [...data.questions.map((q) => ({ ...q, kind: "question" })), ...data.resources.map((r) => ({ ...r, kind: "resource" }))]
      .sort((a, b) => b.createdAt - a.createdAt);
    const approved = all.filter((i) => i.status === "approved").length;
    get("tMineCount").textContent = all.length ? "(" + PB.bn(all.length) + ")" : "";
    get("tMine").innerHTML = (all.length ? '<p class="muted">মোট ' + PB.bn(all.length) + 'টি জমা, প্রকাশিত ' + PB.bn(approved) + 'টি। ফেরত দেওয়া কনটেন্ট মন্তব্য দেখে ঠিক করে আবার জমা দিতে পারেন।</p>' : "")
      + (all.map((i) => itemMarkup(i, i.kind)).join("") || '<p class="muted">এখনো কিছু জমা দেননি।</p>');
    say("");
  }

  async function init() {
    fillPlace(get("tqClass"), get("tqSubject"));
    fillPlace(get("trClass"), get("trSubject"));
    get("tqSubject").addEventListener("change", fillChapters);
    fillChapters();
    try {
      const { teacher: current } = await api("/session");
      if (current) await loadPanel();
      else { get("teacherAuth").hidden = false; say(""); }
    } catch (error) {
      say(error.message);
    }
  }

  get("teacherLogin").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await api("/login", { username: get("tLoginUser").value, password: get("tLoginPass").value });
      event.target.reset();
      await loadPanel();
    } catch (error) { say(error.message); }
  });
  get("teacherRegister").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await api("/register", {
        username: get("tRegUser").value, password: get("tRegPass").value, name: get("tRegName").value,
        institution: get("tRegInst").value, subjects: get("tRegSubjects").value
      });
      event.target.reset();
      await loadPanel();
      say("নিবন্ধন হয়েছে। প্রশ্নপাঠ টিম যাচাই করে অনুমোদন দিলেই জমা দিতে পারবেন।");
    } catch (error) { say(error.message); }
  });
  get("teacherLogout").addEventListener("click", async () => { await api("/logout", {}).catch(() => {}); location.reload(); });
  for (const b of document.querySelectorAll(".teacher-tabs button")) b.addEventListener("click", () => showTab(b.dataset.tab));
  get("tqType").addEventListener("change", () => {
    const mcq = get("tqType").value === "mcq";
    get("tqMcq").hidden = !mcq;
    get("tqShort").hidden = mcq;
  });

  get("tQuestionForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const mcq = get("tqType").value === "mcq";
    const body = {
      classId: get("tqClass").value, subjectId: get("tqSubject").value, chapter: get("tqChapter").value,
      type: mcq ? "mcq" : "short", q: get("tqQ").value
    };
    if (mcq) {
      body.options = [...document.querySelectorAll(".tq-opt")].map((i) => i.value);
      body.answer = Number(document.querySelector("input[name=tqAnswer]:checked").value);
      body.explain = get("tqExplain").value;
    } else {
      body.modelAnswer = get("tqModel").value;
      body.marks = get("tqMarks").valueAsNumber;
    }
    try {
      await api("/questions", body);
      for (const id of ["tqQ", "tqExplain", "tqModel"]) get(id).value = "";
      for (const i of document.querySelectorAll(".tq-opt")) i.value = "";
      await loadPanel();
      say("প্রশ্ন জমা হয়েছে, যাচাইয়ের পর প্রকাশ হবে। একই অধ্যায়ের আরেকটি প্রশ্ন লিখতে পারেন।");
      get("tqQ").focus();
    } catch (error) { say(error.message); }
  });
  get("tResourceForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await api("/resources", {
        classId: get("trClass").value, subjectId: get("trSubject").value, title: get("trTitle").value,
        url: get("trUrl").value, description: get("trDesc").value
      });
      for (const id of ["trTitle", "trUrl", "trDesc"]) get(id).value = "";
      await loadPanel();
      say("রিসোর্স জমা হয়েছে, যাচাইয়ের পর প্রকাশ হবে।");
    } catch (error) { say(error.message); }
  });
  get("tProfileForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await api("/profile", { name: get("tpName").value, institution: get("tpInst").value, subjects: get("tpSubjects").value, bio: get("tpBio").value });
      await loadPanel();
      say("প্রোফাইল সংরক্ষণ হয়েছে।");
    } catch (error) { say(error.message); }
  });
  get("tMine").addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-delete]");
    if (!button || !confirm("এটি মুছে ফেলবেন?")) return;
    try {
      await api("/delete", { id: button.dataset.delete, kind: button.dataset.kind });
      await loadPanel();
    } catch (error) { say(error.message); }
  });

  init();
})();

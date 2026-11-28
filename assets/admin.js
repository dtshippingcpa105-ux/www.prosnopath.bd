// অ্যাডমিন পাতা: শিক্ষার্থীর হিসাব, রিসেট কোড, আইডি মুছে ফেলা।
(() => {
  const get = PB.id;
  const status = get("adminStatus");
  const date = new Intl.DateTimeFormat("bn-BD", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" });
  let students = [];
  let codeMessage = "";

  function say(text) { status.textContent = text; status.hidden = !text; }
  const when = (ms) => ms ? date.format(new Date(ms)) : "—";

  function renderRows() {
    const term = get("adminSearch").value.trim().toLowerCase();
    const rows = students.filter((s) => !term || s.username.includes(term));
    get("adminRows").innerHTML = rows.map((s) => '<tr><th scope="row" dir="ltr">' + PB.escape(s.username) + '<small>যোগ: ' + when(s.createdAt) + '</small></th>'
      + '<td>' + PB.bn(s.quizzes) + '</td><td>' + when(s.lastActive) + '</td><td class="admin-tags">'
      + (s.hasRecovery ? '<span data-ok="true">রিকভারি কোড আছে</span>' : '<span data-ok="false">রিকভারি কোড নেই</span>')
      + (s.parentLink ? '<span data-ok="true">অভিভাবক লিংক</span>' : "")
      + (s.resetPending ? '<span data-ok="warn">রিসেট কোড চালু (' + when(s.resetPending) + ' পর্যন্ত)</span>' : "") + '</div></td>'
      + '<td><div class="admin-actions"><button type="button" class="btn btn-secondary" data-reset="' + PB.escape(s.username) + '">রিসেট কোড</button>'
      + '<button type="button" class="text-button admin-delete" data-delete="' + PB.escape(s.username) + '">মুছে ফেলুন</button></div></td></tr>').join("")
      || '<tr><td colspan="5" class="muted">কোনো শিক্ষার্থী পাওয়া যায়নি।</td></tr>';
  }


  // ---- শিক্ষক ও যাচাই ----
  const tStatus = { pending: "অনুমোদনের অপেক্ষায়", approved: "অনুমোদিত", suspended: "স্থগিত" };
  const letters = ["ক", "খ", "গ", "ঘ"];
  const place = (item) => (CLASSES.find((c) => c.id === item.classId)?.name ?? item.classId) + " · " + (SUBJECTS[item.subjectId]?.name ?? item.subjectId);
  async function loadTeachers() {
    const data = await PB.studentRequest("/admin/teachers");
    get("adminTeacherRows").innerHTML = data.teachers.map((t) => '<tr><th scope="row">' + PB.escape(t.name) + '<small dir="ltr">' + PB.escape(t.username) + '</small></th>'
      + '<td>' + PB.escape([t.institution, t.subjects].filter(Boolean).join(" · ") || "—") + '</td>'
      + '<td>' + PB.bn(t.approved) + ' / ' + PB.bn(t.questions) + '</td><td><div class="admin-tags"><span data-ok="'
      + (t.status === "approved" ? "true" : t.status === "pending" ? "warn" : "false") + '">' + tStatus[t.status] + '</span></div></td><td><div class="admin-actions">'
      + (t.status !== "approved" ? '<button type="button" class="btn btn-secondary" data-tstatus="approved" data-user="' + PB.escape(t.username) + '">অনুমোদন দিন</button>' : "")
      + (t.status === "approved" ? '<button type="button" class="text-button admin-delete" data-tstatus="suspended" data-user="' + PB.escape(t.username) + '">স্থগিত করুন</button>' : "")
      + '</div></td></tr>').join("") || '<tr><td colspan="5" class="muted">এখনো কোনো শিক্ষক নিবন্ধন করেননি।</td></tr>';
    const items = [...data.questions.map((q) => ({ ...q, kind: "question" })), ...data.resources.map((r) => ({ ...r, kind: "resource" }))];
    get("adminReviewCount").textContent = PB.bn(items.length);
    get("adminReviewList").innerHTML = items.map((item) => '<article class="teacher-item"><div class="teacher-item-head"><span>'
      + (item.kind === "resource" ? "রিসোর্স" : item.type === "mcq" ? "MCQ" : "লিখিত · " + PB.bn(item.marks) + " নম্বর") + ' · ' + PB.escape(place(item))
      + (item.chapter ? ' · ' + PB.escape(item.chapter) : "") + '</span><b>' + PB.escape(item.teacher.name) + (item.teacher.institution ? ", " + PB.escape(item.teacher.institution) : "") + '</b></div>'
      + (item.kind === "resource"
        ? '<p><strong>' + PB.escape(item.title) + '</strong></p><p><a href="' + PB.escape(item.url) + '" target="_blank" rel="noopener noreferrer nofollow">' + PB.escape(item.url) + '</a></p><p>' + PB.escape(item.description) + '</p>'
        : '<p><strong>' + PB.escape(item.q) + '</strong></p>' + (item.options
          ? '<ol class="teacher-opts">' + item.options.map((o, i) => '<li' + (i === item.answer ? ' class="is-answer"' : "") + '>' + letters[i] + '. ' + PB.escape(o) + '</li>').join("") + '</ol><p class="muted">ব্যাখ্যা: ' + PB.escape(item.explain) + '</p>'
          : '<p class="muted">নমুনা উত্তর: ' + PB.escape(item.modelAnswer) + '</p>'))
      + '<div class="actions"><button type="button" class="btn btn-primary" data-review="approve" data-kind="' + item.kind + '" data-id="' + PB.escape(item.id) + '">অনুমোদন দিন</button>'
      + '<button type="button" class="btn btn-secondary" data-review="reject" data-kind="' + item.kind + '" data-id="' + PB.escape(item.id) + '">ফেরত দিন</button></div></article>').join("")
      || '<p class="muted">যাচাইয়ের অপেক্ষায় কিছু নেই।</p>';
  }
  get("adminTeacherRows").addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-tstatus]");
    if (!button) return;
    const status = button.dataset.tstatus;
    if (status === "suspended" && !confirm(button.dataset.user + " শিক্ষককে স্থগিত করবেন? তাঁর প্রকাশিত প্রশ্নও সাইট থেকে সরে যাবে।")) return;
    try { await PB.studentRequest("/admin/teacher-status", { username: button.dataset.user, status }); await loadTeachers(); } catch (error) { say(error.message); }
  });
  get("adminReviewList").addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-review]");
    if (!button) return;
    let note = "";
    if (button.dataset.review === "reject") {
      note = prompt("ফেরত দেওয়ার কারণ লিখুন (শিক্ষক দেখতে পাবেন):");
      if (note === null) return;
    }
    try {
      await PB.studentRequest("/admin/review", { kind: button.dataset.kind, id: button.dataset.id, action: button.dataset.review, note });
      await loadTeachers();
    } catch (error) { say(error.message); }
  });

  async function loadPanel() {
    const data = await PB.studentRequest("/admin/overview");
    students = data.students;
    const t = data.totals;
    get("adminTotals").innerHTML = [
      ["মোট শিক্ষার্থী", t.students], ["গত ৭ দিনে সক্রিয়", t.active7], ["মোট কুইজ", t.quizzes],
      ["গত ৭ দিনে কুইজ", t.quizzes7], ["অভিভাবক লিংক", t.parent_links]
    ].map(([label, n]) => '<div class="panel"><strong>' + PB.bn(n) + '</strong><span>' + label + '</span></div>').join("");
    renderRows();
    get("adminLogin").hidden = true;
    get("adminPanel").hidden = false;
    say(data.inviteRequired ? "" : "সতর্কতা: আমন্ত্রণ কোড ছাড়াই যে কেউ আইডি খুলতে পারছে।");
    await loadTeachers();
  }

  async function init() {
    try {
      const session = await PB.studentRequest("/admin/session");
      if (!session.enabled) {
        say("অ্যাডমিন অংশ এখনো চালু হয়নি। Railway-র Variables-এ PROSNOPATH_ADMIN_PASSWORD (অন্তত ১২ অক্ষর) যোগ করুন।");
        return;
      }
      if (session.signedIn) await loadPanel();
      else { say(""); get("adminLogin").hidden = false; get("adminPassword").focus(); }
    } catch (error) {
      say(error.message);
    }
  }

  get("adminLogin").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await PB.studentRequest("/admin/login", { password: get("adminPassword").value });
      event.target.reset();
      await loadPanel();
    } catch (error) {
      say(error.message);
    }
  });
  get("adminLogout").addEventListener("click", async () => {
    await PB.studentRequest("/admin/logout", {}).catch(() => {});
    location.reload();
  });
  get("adminSearch").addEventListener("input", renderRows);

  get("adminRows").addEventListener("click", async (event) => {
    const resetButton = event.target.closest("button[data-reset]");
    const deleteButton = event.target.closest("button[data-delete]");
    try {
      if (resetButton) {
        const username = resetButton.dataset.reset;
        if (!confirm(username + " আইডির জন্য ২৪ ঘণ্টার রিসেট কোড তৈরি করবেন? আগের রিসেট কোড থাকলে অচল হবে।")) return;
        const { code, expiresAt } = await PB.studentRequest("/admin/reset-code", { username });
        get("adminCodeFor").textContent = "আইডি: " + username;
        get("adminCode").textContent = code;
        get("adminCodeExpiry").textContent = "মেয়াদ: " + when(expiresAt) + " পর্যন্ত, একবারই ব্যবহার করা যাবে। শুধু ওই শিক্ষার্থী বা তার অভিভাবককে দিন।";
        codeMessage = "প্রশ্নপাঠ রিসেট কোড\nআইডি: " + username + "\nকোড: " + code + "\n“আমার অগ্রগতি” পাতায় “পাসওয়ার্ড ভুলে গেছি?” চেপে আইডি, এই কোড আর নতুন পাসওয়ার্ড দিন। কোডটি " + when(expiresAt) + " পর্যন্ত চালু।";
        get("adminCodeBox").hidden = false;
        get("adminCodeBox").scrollIntoView({ block: "start" });
        await loadPanel();
      }
      if (deleteButton) {
        const username = deleteButton.dataset.delete;
        const confirmName = prompt("সতর্কতা: " + username + " আইডির সব কুইজ, অগ্রগতি ও অভিভাবক লিংক চিরতরে মুছে যাবে, ফেরত আনা যাবে না।\nনিশ্চিত হলে আইডিটি হুবহু লিখুন:");
        if (confirmName === null) return;
        await PB.studentRequest("/admin/delete-student", { username, confirm: confirmName.trim().toLowerCase() });
        say(username + " আইডি মুছে ফেলা হয়েছে।");
        await loadPanel();
      }
    } catch (error) {
      say(error.message);
    }
  });
  get("adminCodeCopy").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(codeMessage); get("adminCodeCopy").textContent = "কপি হয়েছে ✓"; }
    catch { get("adminCodeCopy").textContent = "কোডটি নিজে লিখে নিন"; }
  });
  get("adminCodeClose").addEventListener("click", () => { get("adminCodeBox").hidden = true; });

  init();
})();

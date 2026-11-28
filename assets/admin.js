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

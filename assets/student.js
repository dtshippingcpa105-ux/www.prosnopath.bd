(() => {
  const get = PB.id;
  const form = get("studentAuth");
  const access = get("studentAccess");
  const records = get("studentRecords");
  const review = get("studentReview");
  const status = get("studentStatus");
  const buttons = form.querySelectorAll("button[type=submit]");
  const date = new Intl.DateTimeFormat("bn-BD", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" });
  const attemptId = PB.params().get("attempt");
  const score = (attempt) => PB.bn(attempt.correct) + " / " + PB.bn(attempt.total);

  function announce(message) {
    status.textContent = message;
    status.hidden = !message;
  }

  function showAccess() {
    records.hidden = true;
    review.hidden = true;
    get("studentDashboard").hidden = true;
    get("studentIdentity").textContent = "";
    get("studentSubjects").replaceChildren();
    get("studentReviewItems").replaceChildren();
    access.hidden = false;
  }

  function renderHistory(attempts, empty = "এই বিষয়ে প্রথম কুইজ জমা দিলে এখানে ফল দেখা যাবে।") {
    return attempts.map((attempt) => {
      const link = PB.href("student.html", { attempt: attempt.id }) + "#studentReview";
      const timestamp = new Date(attempt.completedAt);
      return '<article class="panel student-attempt"><div><p><strong>' + PB.escape(attempt.chapter)
        + '</strong></p><time datetime="' + timestamp.toISOString() + '">' + date.format(timestamp)
        + '</time><p>' + score(attempt) + ' · ' + PB.bn(attempt.correct) + 'টি সঠিক · ' + PB.bn(attempt.wrong)
        + 'টি ভুল · ' + PB.bn(attempt.skipped) + 'টি বাদ</p></div><a href="' + PB.escape(link)
        + '">ভুল ও বাদ পড়া প্রশ্ন দেখুন</a></article>';
    }).join("") || '<p class="muted">' + PB.escape(empty) + '</p>';
  }

  function renderChapter({ quizId, subjectId, chapter, questionCount, attempts, attemptCount, best }) {
    const card = get("studentSubjectTemplate").content.firstElementChild.cloneNode(true);
    const find = (selector) => card.querySelector(selector);
    const heading = find("[data-chapter]");
    heading.id = "student-quiz-" + quizId;
    heading.textContent = chapter;
    card.dataset.subject = subjectId;
    card.setAttribute("aria-labelledby", heading.id);
    if (questionCount) {
      const detail = find("[data-question-count]");
      detail.textContent = PB.bn(questionCount) + "টি প্রশ্ন";
      detail.hidden = false;
    }
    find("[data-attempt-count]").textContent = PB.bn(attemptCount);
    find("[data-latest-score]").textContent = attempts.length ? score(attempts[0]) : "—";
    find("[data-best-score]").textContent = best === null ? "—" : PB.bn(Math.round(best * 100)) + "%";
    const quizLink = find("[data-quiz-link]");
    quizLink.href = PB.href("quiz.html", { student: quizId }) + "#quizWorkspace";
    quizLink.setAttribute("aria-label", chapter + " কুইজ দিন");
    const noteLink = find("[data-note-link]");
    noteLink.href = PB.href("notes.html", { note: quizId });
    noteLink.setAttribute("aria-label", chapter + " অধ্যায়ের নোট পড়ুন");
    find("[data-attempt-history]").innerHTML = renderHistory(attempts, "এই অধ্যায়ে এখনো কুইজ জমা দেওয়া হয়নি।");
    return card;
  }

  function renderSubjectGroup([subjectId, chapters]) {
    const group = document.createElement("section");
    group.className = "student-chapter-group";
    const heading = document.createElement("h3");
    heading.id = "student-subject-" + subjectId;
    heading.textContent = chapters[0].subjectName;
    group.setAttribute("aria-labelledby", heading.id);
    group.append(heading, ...chapters.map(renderChapter));
    return group;
  }


  // ড্যাশবোর্ডের উপরের অংশ: পয়েন্ট, ধারাবাহিকতা, ৭/১৫/৩০ দিনের হিসাব, চার্ট ও ভুলের খাতা।
  let overviewData = null;
  let range = 7;
  const dayLabel = new Intl.DateTimeFormat("bn-BD", { day: "numeric", month: "short", timeZone: "UTC" });

  function formatMinutes(seconds) {
    if (!seconds) return "০ মিনিট";
    const minutes = Math.max(1, Math.round(seconds / 60));
    if (minutes < 60) return PB.bn(minutes) + " মিনিট";
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return PB.bn(hours) + " ঘণ্টা" + (rest ? " " + PB.bn(rest) + " মিনিট" : "");
  }

  function renderChart(days) {
    const max = Math.max(1, ...days.map((d) => d.correct + d.wrong + d.skipped));
    const width = 100 / days.length;
    const bars = days.map((d, i) => {
      const total = d.correct + d.wrong + d.skipped;
      const label = dayLabel.format(new Date(d.date + "T00:00:00Z"));
      const seg = (value, cls, offset) => value
        ? '<rect class="' + cls + '" x="' + (i * width + width * .18).toFixed(2) + '" width="' + (width * .64).toFixed(2)
          + '" y="' + (100 - (offset + value) / max * 100).toFixed(2) + '" height="' + (value / max * 100).toFixed(2) + '"></rect>'
        : "";
      return '<g><title>' + label + ': ' + PB.bn(d.correct) + ' সঠিক, ' + PB.bn(d.wrong) + ' ভুল, ' + PB.bn(d.skipped) + ' বাদ</title>'
        + seg(d.correct, "bar-right", 0) + seg(d.wrong, "bar-wrong", d.correct) + seg(d.skipped, "bar-skip", d.correct + d.wrong)
        + (total ? "" : '<rect class="bar-empty" x="' + (i * width + width * .18).toFixed(2) + '" width="' + (width * .64).toFixed(2) + '" y="99" height="1"></rect>')
        + '</g>';
    }).join("");
    const step = days.length > 15 ? 5 : days.length > 7 ? 3 : 1;
    const labels = days.map((d, i) => (i % step === 0 || i === days.length - 1)
      ? '<span style="left:' + ((i + .5) * width).toFixed(2) + '%">' + dayLabel.format(new Date(d.date + "T00:00:00Z")) + '</span>' : "").join("");
    return '<div class="dash-chart-plot"><span class="dash-chart-max">' + PB.bn(max) + '</span>'
      + '<svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="গত ' + PB.bn(days.length) + ' দিনে দিনভিত্তিক উত্তরের সংখ্যা">'
      + bars + '</svg></div><div class="dash-chart-x" aria-hidden="true">' + labels + '</div>';
  }

  function renderRange() {
    const days = overviewData.days.slice(-range);
    const sum = (key) => days.reduce((total, d) => total + d[key], 0);
    const right = sum("correct");
    const wrong = sum("wrong");
    const skip = sum("skipped");
    const answered = right + wrong + skip;
    const accuracy = answered ? Math.round(right / answered * 100) : 0;
    get("dashRangeTitle").textContent = "গত " + PB.bn(range) + " দিনের পড়াশোনা";
    get("dashTime").textContent = formatMinutes(sum("seconds"));
    get("dashQuizzes").textContent = PB.bn(sum("quizzes"));
    get("dashAccuracy").textContent = PB.bn(accuracy) + "%";
    get("dashRight").textContent = PB.bn(right);
    get("dashWrong").textContent = PB.bn(wrong);
    get("dashSkip").textContent = PB.bn(skip);
    const ring = get("dashRing");
    const r = answered ? right / answered * 360 : 0;
    const w = answered ? wrong / answered * 360 : 0;
    ring.style.setProperty("--right", r + "deg");
    ring.style.setProperty("--wrong", (r + w) + "deg");
    ring.dataset.empty = answered ? "false" : "true";
    ring.setAttribute("aria-label", "সঠিকতার হার " + PB.bn(accuracy) + "%");
    get("dashChart").innerHTML = renderChart(days);
    for (const button of document.querySelectorAll(".dash-range button")) {
      button.setAttribute("aria-pressed", String(Number(button.dataset.range) === range));
    }
  }

  function renderOverview(data) {
    const panel = get("studentDashboard");
    overviewData = data;
    panel.hidden = !data;
    if (!data) return;
    get("dashXp").textContent = PB.bn(data.xp);
    get("dashStreak").textContent = PB.bn(data.streak);
    get("dashStreakNote").textContent = data.practicedToday
      ? "আজকের অনুশীলন হয়ে গেছে। কাল আবার এলে ধারাবাহিকতা বাড়বে।" + (data.bestStreak > 1 ? " সেরা: " + PB.bn(data.bestStreak) + " দিন।" : "")
      : data.streak
        ? "আজ একটি কুইজ দিলে ধারাবাহিকতা টিকে থাকবে।"
        : "একটি কুইজ দিয়ে আজই ধারাবাহিকতা শুরু করুন।";
    get("studentDashboard").querySelector(".dash-streak").dataset.active = String(data.practicedToday);
    renderRange();
    get("dashMistakeCount").textContent = PB.bn(data.mistakeCount);
    get("dashPracticeStart").hidden = !data.mistakes.length || !!practice;
    const list = get("dashMistakeList");
    if (!data.mistakes.length) {
      list.innerHTML = '<p class="status-box">' + (data.totalQuizzes ? "খাতা খালি। সব ভুল ঠিক করে ফেলেছেন!" : "কুইজ দিলে ভুল ও বাদ পড়া প্রশ্ন এখানে জমা হবে।") + '</p>';
      return;
    }
    const groups = new Map();
    for (const item of data.mistakes) {
      const key = item.quizId || item.chapter;
      if (!groups.has(key)) groups.set(key, { ...item, items: [] });
      groups.get(key).items.push(item);
    }
    list.innerHTML = [...groups.values()].map((group, groupIndex) => {
      const link = group.quizId && overviewQuizIds.has(group.quizId)
        ? '<a class="btn btn-secondary dash-retry" href="' + PB.escape(PB.href("quiz.html", { student: group.quizId }) + "#quizWorkspace") + '">আবার কুইজ দিন</a>' : "";
      return '<details class="dash-mistake-group"' + (groupIndex === 0 ? " open" : "") + '><summary class="dash-mistake-title"><p><strong>' + PB.escape(group.chapter) + '</strong>'
        + (group.subjectName ? ' <span class="muted">· ' + PB.escape(group.subjectName) + '</span>' : "")
        + ' <span class="dash-badge">' + PB.bn(group.items.length) + '</span></p>' + link + '</summary>'
        + PB.quizReview(group.items.map((item, index) => ({ ...item, position: index + 1 }))) + '</details>';
    }).join("");
  }

  let overviewQuizIds = new Set();
  for (const button of document.querySelectorAll(".dash-range button")) {
    button.addEventListener("click", () => {
      range = Number(button.dataset.range);
      if (overviewData) renderRange();
    });
  }


  // ---- অধ্যায়ভিত্তিক দক্ষতা ----
  function renderWeak(reports) {
    const list = get("dashWeakList");
    const tried = reports.filter((r) => r.attempts?.length).map((r) => {
      const recent = r.attempts.slice(0, 5);
      const total = recent.reduce((s, a) => s + a.total, 0);
      const correct = recent.reduce((s, a) => s + a.correct, 0);
      return { ...r, pct: total ? Math.round(correct / total * 100) : 0 };
    }).sort((a, b) => a.pct - b.pct);
    const untried = reports.filter((r) => !r.attempts?.length).length;
    if (!tried.length) {
      list.innerHTML = '<p class="status-box">যেকোনো অধ্যায়ের কুইজ দিলে এখানে আপনার দক্ষতার হিসাব দেখাবে।</p>';
      return;
    }
    list.innerHTML = tried.map((r) => {
      const level = r.pct < 50 ? "low" : r.pct < 80 ? "mid" : "high";
      const tip = level === "low" ? "নোট আবার পড়ুন" : level === "mid" ? "আরেকটু অনুশীলন" : "চমৎকার";
      return '<div class="dash-weak-row" data-level="' + level + '"><div class="dash-weak-name"><strong>' + PB.escape(r.chapter)
        + '</strong><small>' + PB.escape(r.subjectName) + ' · ' + tip + '</small></div>'
        + '<div class="dash-weak-bar" aria-hidden="true"><span style="width:' + Math.max(4, r.pct) + '%"></span></div>'
        + '<b>' + PB.bn(r.pct) + '%</b><div class="dash-weak-links">'
        + '<a href="' + PB.escape(PB.href("notes.html", { note: r.quizId })) + '">নোট</a>'
        + '<a href="' + PB.escape(PB.href("quiz.html", { student: r.quizId }) + "#quizWorkspace") + '">কুইজ</a></div></div>';
    }).join("") + (untried ? '<p class="muted">এখনো শুরু করেননি: ' + PB.bn(untried) + 'টি অধ্যায়।</p>' : "");
  }

  // ---- ভুলের খাতা থেকে অনুশীলন ----
  let practice = null;
  const letters = ["ক", "খ", "গ", "ঘ", "ঙ"];

  function showPracticeQuestion() {
    const { items, index } = practice;
    const item = items[index];
    get("dashPracticeProgress").textContent = "প্রশ্ন " + PB.bn(index + 1) + " / " + PB.bn(items.length)
      + " · সঠিক " + PB.bn(practice.fixed);
    get("dashPracticeMeta").textContent = [item.subjectName, item.chapter].filter(Boolean).join(" · ");
    get("dashPracticeQuestion").textContent = item.q;
    get("dashPracticeOptions").innerHTML = item.options.map((text, i) =>
      '<button type="button" class="dash-practice-option" data-choice="' + i + '"><span>' + letters[i] + '</span>' + PB.escape(text) + '</button>').join("");
    get("dashPracticeFeedback").innerHTML = "";
    get("dashPracticeNext").hidden = true;
    get("dashPracticeQuestion").focus();
  }

  async function answerPractice(choice) {
    const item = practice.items[practice.index];
    const buttons = [...get("dashPracticeOptions").querySelectorAll("button")];
    for (const b of buttons) b.disabled = true;
    buttons[item.answer].dataset.state = "right";
    const right = choice === item.answer;
    if (!right) buttons[choice].dataset.state = "wrong";
    get("dashPracticeFeedback").innerHTML = '<p class="dash-practice-verdict" data-right="' + right + '">'
      + (right ? "সঠিক! খাতা থেকে সরানো হচ্ছে।" : "হয়নি। সঠিক উত্তর: " + PB.escape(item.options[item.answer])) + '</p>'
      + (item.explain ? '<p>' + PB.escape(item.explain) + '</p>' : "");
    if (right) {
      practice.fixed += 1;
      try {
        await PB.studentRequest("/mistakes/resolve", { source: item.source, q: item.q });
      } catch (error) {
        get("dashPracticeFeedback").insertAdjacentHTML("beforeend", '<p class="muted">' + PB.escape(error.message) + '</p>');
      }
    }
    const last = practice.index === practice.items.length - 1;
    const next = get("dashPracticeNext");
    next.textContent = last ? "অনুশীলন শেষ করুন" : "পরের প্রশ্ন";
    next.hidden = false;
    next.focus();
  }

  async function endPractice() {
    const fixed = practice?.fixed ?? 0;
    const total = practice?.items.length ?? 0;
    practice = null;
    get("dashPractice").hidden = true;
    get("dashPracticeStart").hidden = false;
    if (fixed) await loadDashboard();
    if (total) announce(PB.bn(total) + "টির মধ্যে " + PB.bn(fixed) + "টি সঠিক হয়েছে" + (fixed ? ", সেগুলো খাতা থেকে সরানো হয়েছে।" : "।"));
    get("mistakeTitle").scrollIntoView({ block: "start" });
  }

  get("dashPracticeStart").addEventListener("click", () => {
    const items = (overviewData?.mistakes ?? []).filter((m) => Array.isArray(m.options) && Number.isInteger(m.answer) && m.source);
    if (!items.length) return;
    for (let i = items.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; }
    practice = { items: items.slice(0, 10), index: 0, fixed: 0 };
    get("dashPracticeStart").hidden = true;
    get("dashPractice").hidden = false;
    showPracticeQuestion();
  });
  get("dashPracticeOptions").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-choice]");
    if (button && !button.disabled) answerPractice(Number(button.dataset.choice));
  });
  get("dashPracticeNext").addEventListener("click", () => {
    if (!practice) return;
    if (practice.index === practice.items.length - 1) endPractice();
    else { practice.index += 1; showPracticeQuestion(); }
  });
  get("dashPracticeClose").addEventListener("click", endPractice);


  // ---- অভিভাবকের সঙ্গে শেয়ার ----
  const shareDate = new Intl.DateTimeFormat("bn-BD", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" });
  function showParentLink(info, token) {
    const state = get("parentShareState");
    get("parentShareRevoke").hidden = !info.active;
    get("parentShareCreate").textContent = info.active ? "নতুন লিংক তৈরি করো" : "অভিভাবক লিংক তৈরি করো";
    state.textContent = info.active
      ? "লিংক চালু আছে (তৈরি: " + shareDate.format(new Date(info.createdAt)) + ")"
        + (info.lastViewed ? " · অভিভাবক শেষ দেখেছেন " + shareDate.format(new Date(info.lastViewed)) : " · এখনো খোলা হয়নি")
      : "এখন কোনো অভিভাবক লিংক চালু নেই।";
    state.dataset.active = String(!!info.active);
    const box = get("parentShareBox");
    if (!token) {
      box.hidden = true;
      if (info.active) state.textContent += "। নিরাপত্তার জন্য লিংক একবারই দেখানো হয়; আবার পাঠাতে চাইলে নতুন লিংক তৈরি করো।";
      return;
    }
    const url = new URL("parent-view.html", location.href);
    url.hash = "t=" + token;
    get("parentShareUrl").value = url.href;
    get("parentShareWhatsapp").href = "https://wa.me/?text=" + encodeURIComponent("প্রশ্নপাঠে আমার পড়াশোনার অগ্রগতি দেখুন: " + url.href);
    box.hidden = false;
  }
  async function loadParentLink() {
    try { showParentLink(await PB.studentRequest("/parent-link")); } catch { get("parentShare").hidden = true; }
  }
  get("parentShareCreate").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    if (get("parentShareRevoke").hidden === false && !confirm("নতুন লিংক তৈরি করলে আগের লিংকটা আর কাজ করবে না। এগিয়ে যাবে?")) return;
    button.disabled = true;
    try {
      const info = await PB.studentRequest("/parent-link", { action: "create" });
      showParentLink(info, info.token);
      get("parentShareUrl").select();
    } catch (error) {
      announce(error.message);
    } finally {
      button.disabled = false;
    }
  });
  get("parentShareRevoke").addEventListener("click", async () => {
    if (!confirm("লিংকটা বন্ধ করলে অভিভাবক আর অগ্রগতি দেখতে পারবেন না। বন্ধ করবে?")) return;
    try { showParentLink(await PB.studentRequest("/parent-link", { action: "revoke" })); } catch (error) { announce(error.message); }
  });
  get("parentShareCopy").addEventListener("click", async () => {
    const input = get("parentShareUrl");
    try { await navigator.clipboard.writeText(input.value); get("parentShareCopy").textContent = "কপি হয়েছে ✓"; }
    catch { input.select(); get("parentShareCopy").textContent = "লিংকটা নির্বাচন করা আছে, কপি করো"; }
    setTimeout(() => { get("parentShareCopy").textContent = "লিংক কপি করো"; }, 2500);
  });


  // ---- রিকভারি কোড, পাসওয়ার্ড রিসেট ও বদল ----
  function showRecovery(code) {
    get("recoveryCode").textContent = code;
    get("recoveryBox").hidden = false;
    get("recoveryTitle").focus();
    get("recoveryBox").scrollIntoView({ block: "start" });
  }
  get("recoveryCopy").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(get("recoveryCode").textContent); get("recoveryCopy").textContent = "কপি হয়েছে ✓"; }
    catch { get("recoveryCopy").textContent = "নিজে লিখে নাও"; }
  });
  get("recoveryDone").addEventListener("click", () => {
    if (!confirm("কোডটা কি সত্যিই লিখে রেখেছ? এটা আর দেখানো হবে না।")) return;
    get("recoveryBox").hidden = true;
    loadAccount();
  });
  const resetForm = get("studentReset");
  get("studentForgot").addEventListener("click", () => {
    form.hidden = true;
    resetForm.hidden = false;
    get("resetUsername").value = form.elements.username.value;
    get("resetUsername").focus();
  });
  get("studentResetBack").addEventListener("click", () => { resetForm.hidden = true; form.hidden = false; });
  resetForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = resetForm.querySelector("button[type=submit]");
    button.disabled = true;
    announce("যাচাই হচ্ছে…");
    try {
      const result = await PB.studentRequest("/reset-password", {
        username: get("resetUsername").value, code: get("resetCode").value, password: get("resetPassword").value
      });
      resetForm.reset();
      resetForm.hidden = true;
      form.hidden = false;
      await loadDashboard();
      announce("পাসওয়ার্ড বদলেছে। পুরোনো কোড আর কাজ করবে না, নিচে তোমার নতুন রিকভারি কোড।");
      showRecovery(result.recoveryCode);
    } catch (error) {
      announce(error.message);
    } finally {
      button.disabled = false;
    }
  });
  function accountMessage(text) { const box = get("accountStatus"); box.textContent = text; box.hidden = !text; }
  async function loadAccount() {
    try {
      const { hasRecovery } = await PB.studentRequest("/account");
      get("accountFlag").hidden = hasRecovery;
      get("accountRecoveryInfo").textContent = hasRecovery
        ? "তোমার রিকভারি কোড আছে। হারিয়ে ফেললে নতুন কোড নাও; আগেরটা আর কাজ করবে না।"
        : "তোমার এখনো রিকভারি কোড নেই। পাসওয়ার্ড ভুলে গেলে যেন আইডি না হারাও, এখনই একটা কোড নিয়ে লিখে রাখো।";
      get("accountRecoveryButton").textContent = hasRecovery ? "নতুন রিকভারি কোড নাও" : "রিকভারি কোড তৈরি করো";
      if (!hasRecovery) get("accountSettings").open = true;
    } catch { /* অ্যাকাউন্ট তথ্য না এলে বাকি ড্যাশবোর্ড চলবে */ }
  }
  get("accountPassword").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await PB.studentRequest("/change-password", { current: get("accountCurrent").value, next: get("accountNext").value });
      event.target.reset();
      accountMessage("পাসওয়ার্ড বদলেছে। অন্য ডিভাইসে আবার লগইন করতে হবে।");
    } catch (error) { accountMessage(error.message); }
  });
  get("accountRecovery").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const { recoveryCode } = await PB.studentRequest("/recovery-code", { current: get("accountRecoveryPassword").value });
      event.target.reset();
      accountMessage("");
      showRecovery(recoveryCode);
    } catch (error) { accountMessage(error.message); }
  });

  async function loadDashboard() {
    const { student, subjects, chapterQuizzes, attempts, attemptCount, best, modelTest, overview } = await PB.studentRequest("/dashboard");
    const reports = chapterQuizzes ?? subjects ?? [{
      quizId: "plant-reproduction", subjectId: "science", subjectName: "বিজ্ঞান", chapter: "উদ্ভিদের বংশবৃদ্ধি",
      attempts, attemptCount, best
    }];
    get("studentIdentity").textContent = student.username;
    const bySubject = new Map();
    for (const record of reports) {
      if (!bySubject.has(record.subjectId)) bySubject.set(record.subjectId, []);
      bySubject.get(record.subjectId).push(record);
    }
    get("studentSubjects").replaceChildren(...[...bySubject].map(renderSubjectGroup));
    overviewQuizIds = new Set(reports.map((item) => item.quizId));
    renderOverview(overview);
    renderWeak(reports);
    loadParentLink();
    loadAccount();
    get("studentModel").hidden = !modelTest;
    if (modelTest) {
      get("studentModelInfo").textContent = modelTest.title + " · " + PB.bn(modelTest.total) + "টি প্রশ্ন · " + PB.bn(modelTest.minutes) + " মিনিট";
      get("studentModelCount").textContent = PB.bn(modelTest.attemptCount);
      get("studentModelLatest").textContent = modelTest.attempts.length ? score(modelTest.attempts[0]) : "—";
      get("studentModelBest").textContent = modelTest.best === null ? "—" : PB.bn(Math.round(modelTest.best * 100)) + "%";
      get("studentModelLink").textContent = modelTest.isActive ? "চলমান টেস্টে ফিরুন" : "মডেল টেস্ট দিন";
      get("studentModelHistory").innerHTML = renderHistory(modelTest.attempts, "প্রথম মডেল টেস্ট জমা দিলে এখানে ফল দেখা যাবে।");
    }
    access.hidden = true;
    records.hidden = false;
    announce("");
    if (!attemptId) return;

    try {
      const { attempt } = await PB.studentRequest("/attempts/" + encodeURIComponent(attemptId));
      const subject = reports.find((item) => item.quizId === (attempt.quizId ?? "plant-reproduction"));
      const hasBreakdown = renderStudentModelBreakdown(get("studentReviewBreakdown"), attempt.breakdown);
      get("studentReviewTitle").textContent = hasBreakdown ? "মডেল টেস্টের বিস্তারিত ফল" : "ভুল ও বাদ পড়া প্রশ্ন";
      get("studentReviewContext").textContent = [subject?.subjectName, attempt.chapter, score(attempt)].filter(Boolean).join(" · ");
      const needsReview = attempt.questions.map((item, index) => ({ ...item, position: index + 1 }))
        .filter((item) => item.choice !== item.answer);
      get("studentReviewItems").innerHTML = needsReview.length
        ? (hasBreakdown ? '<h3>ভুল ও বাদ পড়া প্রশ্ন</h3>' : '') + PB.quizReview(needsReview)
        : '<p class="status-box">সব উত্তর সঠিক ছিল।</p>';
      review.hidden = false;
      if (location.hash === "#studentReview") get("studentReviewTitle").focus();
    } catch (error) {
      announce(error.message);
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (buttons[0].disabled) return;
    const action = event.submitter?.value === "register" ? "/register" : "/login";
    for (const button of buttons) button.disabled = true;
    announce("যাচাই হচ্ছে…");
    try {
      const result = await PB.studentRequest(action, {
        username: form.elements.username.value, password: form.elements.password.value,
        invite: action === "/register" ? form.elements.invite.value : undefined
      });
      form.reset();
      await loadDashboard();
      if (result.recoveryCode) { showRecovery(result.recoveryCode); return; }
      if (review.hidden) get("studentSubject").focus();
    } catch (error) {
      announce(error.message);
    } finally {
      for (const button of buttons) button.disabled = false;
    }
  });

  get("studentLogout").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await PB.studentRequest("/logout", {});
      history.replaceState(null, "", "student.html");
      location.reload();
    } catch (error) {
      announce(error.message);
      button.disabled = false;
    }
  });

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) location.reload();
  });

  async function initialize() {
    try {
      const { student, inviteRequired } = await PB.studentRequest("/session");
      get("studentInvite").hidden = !inviteRequired;
      if (student) {
        await loadDashboard();
      } else {
        showAccess();
        announce("");
      }
    } catch (error) {
      if (error.status === 401) showAccess();
      announce(error.message);
    }
  }

  initialize();
})();

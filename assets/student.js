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
      await PB.studentRequest(action, {
        username: form.elements.username.value, password: form.elements.password.value,
        invite: action === "/register" ? form.elements.invite.value : undefined
      });
      form.reset();
      await loadDashboard();
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

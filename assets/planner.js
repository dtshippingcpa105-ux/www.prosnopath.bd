// পড়ার পরিকল্পনা: পরীক্ষার তারিখ ধরে অধ্যায়ভিত্তিক দিনের রুটিন। শুধু এই ব্রাউজারে সংরক্ষিত।
(() => {
  const get = PB.id;
  const storageKey = "proshnopath-planner-v1";
  const form = get("plannerSetup");
  const classSelect = get("plannerClass");
  const subjectBox = get("plannerSubjects");
  const info = get("plannerSetupInfo");
  const board = get("plannerBoard");
  const entries = PB.entries();
  const dayMs = 86_400_000;
  const weekday = new Intl.DateTimeFormat("bn-BD", { weekday: "long", timeZone: "UTC" });
  const dateLabel = new Intl.DateTimeFormat("bn-BD", { day: "numeric", month: "long", timeZone: "UTC" });
  const minutesPerChapter = 45; // একটি অধ্যায়: নোট পড়া + কুইজ
  let plan = null;

  // বাংলাদেশ সময়ে আজকের তারিখ (YYYY-MM-DD)
  const today = () => new Date(Date.now() + 6 * 3_600_000).toISOString().slice(0, 10);
  const toUtc = (iso) => Date.parse(iso + "T00:00:00Z");
  const isoOf = (ms) => new Date(ms).toISOString().slice(0, 10);

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      return saved && Array.isArray(saved.days) ? saved : null;
    } catch {
      return null;
    }
  }

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(plan));
      return true;
    } catch {
      return false;
    }
  }

  function subjectsFor(classId) {
    const ids = [...new Set(entries.filter((e) => e.classId === classId).map((e) => e.subjectId))];
    return ids.map((id) => ({ id, name: SUBJECTS[id].name, count: entries.filter((e) => e.classId === classId && e.subjectId === id).length }));
  }

  function renderSubjects() {
    subjectBox.innerHTML = subjectsFor(classSelect.value).map((s) => '<label><input type="checkbox" value="' + PB.escape(s.id)
      + '" checked> <span>' + PB.escape(s.name) + ' <small>(' + PB.bn(s.count) + 'টি অধ্যায়)</small></span></label>').join("")
      || '<p class="muted">এই শ্রেণিতে এখনো অধ্যায় যোগ হয়নি।</p>';
    updateInfo();
  }

  function chosenSubjects() {
    return [...subjectBox.querySelectorAll("input:checked")].map((box) => box.value);
  }

  // শুরু থেকে পরীক্ষার আগের দিন পর্যন্ত, ছুটির দিন বাদে
  function studyDates(examIso, offDay) {
    const dates = [];
    for (let t = toUtc(today()); t < toUtc(examIso); t += dayMs) {
      if (offDay !== "" && new Date(t).getUTCDay() === Number(offDay)) continue;
      dates.push(isoOf(t));
    }
    return dates;
  }

  function updateInfo() {
    const exam = get("plannerExam").value;
    const subjects = chosenSubjects();
    if (!exam) { info.textContent = "পরীক্ষার তারিখ দিন।"; return; }
    if (toUtc(exam) <= toUtc(today())) { info.textContent = "পরীক্ষার তারিখ আজকের পরের কোনো দিন দিন।"; return; }
    if (!subjects.length) { info.textContent = "অন্তত একটি বিষয় বেছে নিন।"; return; }
    const chapters = entries.filter((e) => e.classId === classSelect.value && subjects.includes(e.subjectId)).length;
    const days = studyDates(exam, get("plannerOff").value).length;
    const perDay = Math.max(1, Math.floor(Number(get("plannerMinutes").value) / minutesPerChapter));
    const needed = Math.ceil(chapters / perDay);
    info.textContent = PB.bn(days) + "টি পড়ার দিন, " + PB.bn(chapters) + "টি অধ্যায়। "
      + (needed > Math.max(1, Math.round(days * 0.8))
        ? "সময় একটু কম। প্রতিদিন বেশি অধ্যায় রাখা হবে, চাইলে সময় বাড়িয়ে দিন।"
        : "সময় যথেষ্ট, শেষে রিভিশনের দিনও থাকবে।");
  }

  // বিষয়গুলো পালা করে সাজানো, যাতে একদিনে একঘেয়ে না লাগে
  function interleave(subjects) {
    const queues = subjects.map((id) => entries.filter((e) => e.classId === classSelect.value && e.subjectId === id));
    const out = [];
    while (queues.some((q) => q.length)) for (const q of queues) if (q.length) out.push(q.shift());
    return out;
  }

  function chapterTasks(entry) {
    const subject = SUBJECTS[entry.subjectId].name;
    const tasks = [];
    if (entry.noteId) tasks.push({ kind: "read", text: entry.chapter + " · নোট পড়ুন", subject, href: PB.href("notes.html", { note: entry.noteId }) });
    else tasks.push({ kind: "read", text: entry.chapter + " · পাঠ্যবই থেকে পড়ুন", subject, href: "textbooks.html" });
    if (entry.mcq?.length) {
      tasks.push({ kind: "quiz", text: entry.chapter + " · কুইজ দিন", subject,
        href: PB.href("quiz.html", { class: entry.classId, subject: entry.subjectId, chapter: entry.chapter }) });
    }
    return tasks;
  }

  function buildPlan() {
    const exam = get("plannerExam").value;
    const subjects = chosenSubjects();
    const dates = studyDates(exam, get("plannerOff").value);
    const chapters = interleave(subjects);
    if (!dates.length || !chapters.length) return null;
    const revisionDays = dates.length >= 5 ? Math.max(1, Math.round(dates.length * 0.2)) : 0;
    const learnDays = dates.length - revisionDays;
    const perDay = Math.max(Math.max(1, Math.floor(Number(get("plannerMinutes").value) / minutesPerChapter)), Math.ceil(chapters.length / learnDays));
    const days = dates.map((date) => ({ date, tasks: [] }));
    chapters.forEach((entry, i) => {
      const day = days[Math.min(learnDays - 1, Math.floor(i / perDay))];
      day.tasks.push(...chapterTasks(entry));
    });
    // শেষের দিনগুলো: বিষয়ভিত্তিক রিভিশন ও মডেল টেস্ট
    days.slice(learnDays).forEach((day, i) => {
      const id = subjects[i % subjects.length];
      const name = SUBJECTS[id].name;
      day.revision = true;
      day.tasks.push({ kind: "revise", text: name + " · সব অধ্যায়ের নোট রিভিশন", subject: name, href: PB.href("notes.html") });
      day.tasks.push({ kind: "test", text: name + " · মডেল প্রশ্নপত্র তৈরি করে পরীক্ষা দিন", subject: name,
        href: PB.href("paper-builder.html", { class: classSelect.value, subject: id }) + "#paperQuickTitle" });
    });
    // ফাঁকা দিনে আগের অধ্যায়ের ভুল অনুশীলন
    for (const day of days) {
      if (!day.tasks.length) day.tasks.push({ kind: "revise", text: "আগের অধ্যায়ের ভুলগুলো আবার দেখুন", subject: "", href: "student.html#studentMistakes" });
    }
    days.forEach((day) => day.tasks.forEach((task, i) => { task.id = day.date + "-" + i; task.done = false; }));
    return { classId: classSelect.value, exam, subjects, minutes: get("plannerMinutes").value, off: get("plannerOff").value, created: today(), days };
  }

  const icons = { read: "📖", quiz: "✅", revise: "🔁", test: "📝" };

  function taskMarkup(task) {
    return '<li class="planner-task" data-done="' + task.done + '"><label><input type="checkbox" data-task="' + PB.escape(task.id) + '"'
      + (task.done ? " checked" : "") + '><span class="planner-icon" aria-hidden="true">' + icons[task.kind] + '</span><span>'
      + PB.escape(task.text) + (task.subject ? ' <small>' + PB.escape(task.subject) + '</small>' : "") + '</span></label>'
      + '<a href="' + PB.escape(task.href) + '">শুরু করুন</a></li>';
  }

  function render() {
    if (!plan) { board.hidden = true; get("plannerReset").hidden = true; return; }
    board.hidden = false;
    get("plannerReset").hidden = false;
    const now = today();
    const all = plan.days.flatMap((d) => d.tasks);
    const done = all.filter((t) => t.done).length;
    get("plannerBar").style.width = (all.length ? done / all.length * 100 : 0) + "%";
    get("plannerProgressText").textContent = PB.bn(all.length) + "টি কাজের মধ্যে " + PB.bn(done) + "টি শেষ ("
      + PB.bn(all.length ? Math.round(done / all.length * 100) : 0) + "%)";
    const left = Math.round((toUtc(plan.exam) - toUtc(now)) / dayMs);
    get("plannerCountdown").textContent = left > 0 ? "পরীক্ষার বাকি " + PB.bn(left) + " দিন" : left === 0 ? "আজ পরীক্ষা, শুভকামনা!" : "পরীক্ষা শেষ";
    // আজকের কাজ + আগের অসম্পূর্ণ কাজ
    const pending = plan.days.filter((d) => d.date < now).flatMap((d) => d.tasks.filter((t) => !t.done));
    const todayDay = plan.days.find((d) => d.date === now);
    const nextDay = plan.days.find((d) => d.date > now);
    let html = "";
    if (todayDay) html += todayDay.tasks.map(taskMarkup).join("");
    else html += '<li class="planner-empty">আজ ' + (plan.off !== "" && new Date(toUtc(now)).getUTCDay() === Number(plan.off) ? "ছুটির দিন। " : "কোনো কাজ নেই। ")
      + (nextDay ? "পরের কাজ " + dateLabel.format(new Date(toUtc(nextDay.date))) + "।" : "") + '</li>';
    if (pending.length) html += '<li class="planner-pending-title">আগের বাকি কাজ (' + PB.bn(pending.length) + 'টি)</li>' + pending.slice(0, 8).map(taskMarkup).join("");
    get("plannerTodayList").innerHTML = html;
    get("plannerDays").innerHTML = plan.days.map((day) => {
      const finished = day.tasks.every((t) => t.done);
      const state = day.date === now ? "today" : day.date < now ? (finished ? "done" : "missed") : "future";
      return '<details class="planner-day" data-state="' + state + '"' + (state === "today" ? " open" : "") + '><summary>'
        + '<span class="planner-date"><strong>' + dateLabel.format(new Date(toUtc(day.date))) + '</strong><small>' + weekday.format(new Date(toUtc(day.date))) + '</small></span>'
        + '<span class="planner-day-sum">' + (day.revision ? "রিভিশন · " : "") + PB.bn(day.tasks.filter((t) => t.done).length) + "/" + PB.bn(day.tasks.length) + ' কাজ</span></summary>'
        + '<ul class="planner-tasks">' + day.tasks.map(taskMarkup).join("") + '</ul></details>';
    }).join("");
  }

  board.addEventListener("change", (event) => {
    const box = event.target.closest("input[data-task]");
    if (!box || !plan) return;
    for (const day of plan.days) for (const task of day.tasks) if (task.id === box.dataset.task) task.done = box.checked;
    save();
    render();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    updateInfo();
    const exam = get("plannerExam").value;
    if (!exam || toUtc(exam) <= toUtc(today()) || !chosenSubjects().length) return;
    if (plan && !confirm("আগের পরিকল্পনার জায়গায় নতুন পরিকল্পনা তৈরি হবে। টিক দেওয়া কাজগুলো মুছে যাবে। এগিয়ে যাবেন?")) return;
    plan = buildPlan();
    if (!plan) { info.textContent = "পরিকল্পনা তৈরি করা গেল না। তারিখ আর বিষয় দেখে নিন।"; return; }
    if (!save()) info.textContent = "এই ব্রাউজারে পরিকল্পনা সংরক্ষণ করা যাচ্ছে না।";
    render();
    get("plannerToday").focus();
    get("plannerToday").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  get("plannerReset").addEventListener("click", () => {
    if (!confirm("পরিকল্পনাটি মুছে নতুন করে শুরু করবেন?")) return;
    plan = null;
    try { localStorage.removeItem(storageKey); } catch { /* সংরক্ষণ না গেলেও চলবে */ }
    render();
    form.scrollIntoView({ behavior: "smooth" });
  });

  get("plannerPrint").addEventListener("click", () => {
    for (const d of document.querySelectorAll(".planner-day")) d.open = true;
    window.print();
  });

  classSelect.addEventListener("change", renderSubjects);
  subjectBox.addEventListener("change", updateInfo);
  for (const id of ["plannerExam", "plannerMinutes", "plannerOff"]) get(id).addEventListener("input", updateInfo);

  const classes = CLASSES.filter((c) => entries.some((e) => e.classId === c.id));
  plan = load();
  PB.select(classSelect, classes.map((c) => [c.id, c.name]), plan?.classId ?? PB.params().get("class") ?? "c8");
  get("plannerExam").min = isoOf(toUtc(today()) + dayMs);
  if (plan) {
    get("plannerExam").value = plan.exam;
    get("plannerMinutes").value = plan.minutes;
    get("plannerOff").value = plan.off;
  } else {
    get("plannerExam").value = isoOf(toUtc(today()) + 30 * dayMs);
  }
  renderSubjects();
  if (plan) for (const box of subjectBox.querySelectorAll("input")) box.checked = plan.subjects.includes(box.value);
  updateInfo();
  render();
})();

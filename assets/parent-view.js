// অভিভাবকের শুধু-দেখার পাতা। লিংকের # অংশের টোকেন সার্ভারের লগে যায় না, শুধু অনুরোধের ভেতরে পাঠানো হয়।
(() => {
  const get = PB.id;
  const status = get("parentStatus");
  const token = new URLSearchParams(location.hash.slice(1)).get("t") || "";
  const date = new Intl.DateTimeFormat("bn-BD", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" });
  const dayLabel = new Intl.DateTimeFormat("bn-BD", { day: "numeric", month: "short", timeZone: "UTC" });
  let data = null;
  let range = 7;

  function minutes(seconds) {
    if (!seconds) return "০ মিনিট";
    const m = Math.max(1, Math.round(seconds / 60));
    return m < 60 ? PB.bn(m) + " মিনিট" : PB.bn(Math.floor(m / 60)) + " ঘণ্টা" + (m % 60 ? " " + PB.bn(m % 60) + " মিনিট" : "");
  }

  function renderRange() {
    const days = data.overview.days.slice(-range);
    const sum = (k) => days.reduce((s, d) => s + d[k], 0);
    const right = sum("correct");
    const answered = right + sum("wrong") + sum("skipped");
    get("parentRangeTitle").textContent = "গত " + PB.bn(range) + " দিন";
    get("parentTime").textContent = minutes(sum("seconds"));
    get("parentQuizzes").textContent = PB.bn(sum("quizzes"));
    get("parentAccuracy").textContent = answered ? PB.bn(Math.round(right / answered * 100)) + "%" : "—";
    const max = Math.max(1, ...days.map((d) => d.correct + d.wrong + d.skipped));
    get("parentChart").innerHTML = days.map((d) => {
      const n = d.correct + d.wrong + d.skipped;
      return '<div class="parent-day" title="' + dayLabel.format(new Date(d.date + "T00:00:00Z")) + ': ' + PB.bn(d.quizzes) + 'টি কুইজ, ' + PB.bn(n) + 'টি উত্তর">'
        + '<span class="parent-day-bar" style="height:' + (n ? Math.max(8, n / max * 100) : 3) + '%" data-active="' + (n > 0) + '"></span>'
        + '<small>' + (range <= 15 ? dayLabel.format(new Date(d.date + "T00:00:00Z")) : "") + '</small></div>';
    }).join("");
    for (const b of document.querySelectorAll(".dash-range button")) b.setAttribute("aria-pressed", String(Number(b.dataset.range) === range));
  }

  function render() {
    const o = data.overview;
    get("parentStudent").textContent = data.student.username;
    get("parentUpdated").textContent = "সর্বশেষ তথ্য: " + date.format(new Date(data.generatedAt));
    const last7 = o.days.slice(-7).filter((d) => d.quizzes).length;
    get("parentSummary").textContent = o.totalQuizzes
      ? "গত ৭ দিনের " + PB.bn(last7) + " দিন অনুশীলন করেছে। মোট " + PB.bn(o.totalQuizzes) + "টি কুইজ দিয়েছে"
        + (o.practicedToday ? ", আজও অনুশীলন হয়েছে।" : "। আজ এখনো অনুশীলন হয়নি।")
      : "এখনো কোনো কুইজ দেওয়া হয়নি। একসঙ্গে প্রথম কুইজটি শুরু করতে পারেন।";
    get("parentStreak").textContent = PB.bn(o.streak) + " দিন";
    renderRange();

    const tried = data.chapters.filter((c) => c.accuracy !== null).sort((a, b) => a.accuracy - b.accuracy);
    const untried = data.chapters.filter((c) => c.accuracy === null);
    get("parentChapters").innerHTML = tried.map((c) => {
      const level = c.accuracy < 50 ? "low" : c.accuracy < 80 ? "mid" : "high";
      return '<div class="dash-weak-row parent-row" data-level="' + level + '"><div class="dash-weak-name"><strong>' + PB.escape(c.chapter)
        + '</strong><small>' + PB.escape(c.subjectName) + ' · ' + PB.bn(c.attemptCount) + 'বার কুইজ</small></div>'
        + '<div class="dash-weak-bar" aria-hidden="true"><span style="width:' + Math.max(4, c.accuracy) + '%"></span></div><b>' + PB.bn(c.accuracy) + '%</b></div>';
    }).join("") + (untried.length ? '<p class="muted">এখনো শুরু হয়নি: ' + untried.map((c) => PB.escape(c.chapter)).join(", ") + '</p>' : "");

    get("parentRecent").innerHTML = data.recent.map((r) => '<li><div><strong>' + PB.escape(r.chapter) + '</strong><small>'
      + date.format(new Date(r.completedAt)) + '</small></div><b>' + PB.bn(r.correct) + ' / ' + PB.bn(r.total) + '</b></li>').join("")
      || '<li class="muted">এখনো কোনো কুইজ দেওয়া হয়নি।</li>';

    const tips = [];
    const weakest = tried[0];
    if (!o.totalQuizzes) tips.push("আজ ১০ মিনিট সময় নিয়ে একসঙ্গে একটি অধ্যায়ের নোট পড়ে কুইজটি দিন।");
    if (o.streak >= 3) tips.push("টানা " + PB.bn(o.streak) + " দিন অনুশীলন করেছে, এই ধারাবাহিকতার জন্য প্রশংসা করুন।");
    if (weakest && weakest.accuracy < 60) tips.push("“" + weakest.chapter + "” অধ্যায়ে সঠিকতা " + PB.bn(weakest.accuracy) + "%। জিজ্ঞেস করুন কোন অংশটা কঠিন লাগছে, নোটটা আবার একসঙ্গে দেখুন।");
    const best = tried.at(-1);
    if (best && best.accuracy >= 80) tips.push("“" + best.chapter + "” অধ্যায়ে ভালো করছে (" + PB.bn(best.accuracy) + "%)। এই অধ্যায়টা আপনাকে বুঝিয়ে বলতে বলুন।");
    if (o.mistakeCount) tips.push("ভুলের খাতায় " + PB.bn(o.mistakeCount) + "টি প্রশ্ন জমে আছে। সপ্তাহে একদিন সেগুলো অনুশীলনের সময় ঠিক করুন।");
    if (o.totalQuizzes && !o.practicedToday) tips.push("আজ এখনো অনুশীলন হয়নি। একটি ছোট কুইজ দিয়ে দিনটা শেষ করার কথা বলুন।");
    get("parentTips").innerHTML = tips.slice(0, 4).map((t) => "<li>" + PB.escape(t) + "</li>").join("");

    status.hidden = true;
    get("parentView").hidden = false;
  }

  for (const b of document.querySelectorAll(".dash-range button")) {
    b.addEventListener("click", () => { range = Number(b.dataset.range); if (data) renderRange(); });
  }

  async function load() {
    if (!token) {
      status.textContent = "এই পাতা দেখতে শিক্ষার্থীর দেওয়া অভিভাবক লিংক লাগবে। সন্তানকে বলুন “আমার অগ্রগতি” পাতা থেকে লিংকটি পাঠাতে।";
      return;
    }
    try {
      data = await PB.studentRequest("/parent-view", { token });
      render();
    } catch (error) {
      status.textContent = error.message;
    }
  }
  load();
})();

// শিক্ষকদের প্রকাশিত প্রশ্ন, রিসোর্স ও শিক্ষক তালিকা (শিক্ষার্থী সার্ভার থেকে)। সার্ভার না পেলে অংশটি লুকানো থাকে।
(() => {
  const portal = "https://student-portal-production-b3ce231b.up.railway.app";
  const base = location.origin === portal || /^(127\.0\.0\.1|localhost)$/.test(location.hostname) ? "" : portal;
  const letters = ["ক", "খ", "গ", "ঘ"];
  const place = (item) => (CLASSES.find((c) => c.id === item.classId)?.name ?? "") + " · " + (SUBJECTS[item.subjectId]?.name ?? "");
  const byline = (t) => '<p class="community-by">✍️ ' + PB.escape(t.name) + (t.institution ? ", " + PB.escape(t.institution) : "") + '</p>';

  function questionCard(item, n) {
    const body = item.options
      ? '<div class="q-options">' + item.options.map((o, i) => '<button type="button" class="option" data-option="' + i + '"><span>' + letters[i] + '. ' + PB.escape(o) + '</span></button>').join("") + '</div>'
        + '<p class="community-explain" hidden>' + PB.escape(item.explain) + '</p>'
      : '<details class="community-answer"><summary>নমুনা উত্তর দেখুন (' + PB.bn(item.marks) + ' নম্বর)</summary><p>' + PB.escape(item.modelAnswer) + '</p></details>';
    return '<article class="panel q-block community-q" data-answer="' + (item.answer ?? "") + '"><p class="community-meta">' + PB.escape(place(item)) + ' · ' + PB.escape(item.chapter)
      + '</p><h4>' + PB.bn(n + 1) + '. ' + PB.escape(item.q) + '</h4>' + body + byline(item.teacher) + '</article>';
  }

  async function load() {
    const questionsBox = PB.id("communityQuestions");
    const resourcesBox = PB.id("communityResources");
    const teachersBox = PB.id("communityTeachers");
    if (!questionsBox && !resourcesBox && !teachersBox) return;
    let data;
    try {
      const response = await fetch(base + "/api/student/community", { credentials: "omit" });
      if (!response.ok) return;
      data = await response.json();
    } catch {
      return;
    }
    if (questionsBox) {
      const render = () => {
        const params = PB.params();
        const cls = params.get("class");
        const subject = params.get("subject");
        const list = data.questions.filter((q) => (!cls || q.classId === cls) && (!subject || q.subjectId === subject)).slice(0, 20);
        questionsBox.closest("section").hidden = !list.length;
        questionsBox.innerHTML = list.map(questionCard).join("");
      };
      questionsBox.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-option]");
        const card = button?.closest(".community-q");
        if (!card || card.dataset.done) return;
        card.dataset.done = "1";
        PB.showAnswer([...card.querySelectorAll("button[data-option]")], Number(card.dataset.answer), Number(button.dataset.option));
        card.querySelector(".community-explain").hidden = false;
      });
      render();
      addEventListener("popstate", render);
      document.addEventListener("change", () => setTimeout(render, 60));
      document.addEventListener("click", (event) => { if (event.target.closest("a, button:not([data-option])")) setTimeout(render, 120); });
    }
    if (resourcesBox) {
      resourcesBox.closest("section").hidden = !data.resources.length;
      resourcesBox.innerHTML = data.resources.slice(0, 30).map((r) => '<a class="tool-card community-resource" href="' + PB.escape(r.url)
        + '" target="_blank" rel="noopener noreferrer nofollow"><span class="note-subject">' + PB.escape(place(r)) + '</span><h3>' + PB.escape(r.title) + '</h3>'
        + (r.description ? '<p>' + PB.escape(r.description) + '</p>' : "") + byline(r.teacher) + '<span class="card-link">খুলুন ↗</span></a>').join("");
    }
    if (teachersBox) {
      teachersBox.closest("section").hidden = !data.teachers.length;
      teachersBox.innerHTML = data.teachers.map((t) => '<article class="panel community-teacher"><h3>' + PB.escape(t.name) + '</h3><p class="muted">'
        + PB.escape([t.institution, t.subjects].filter(Boolean).join(" · ")) + '</p>' + (t.bio ? '<p>' + PB.escape(t.bio) + '</p>' : "")
        + '<p class="community-count">প্রকাশিত প্রশ্ন ' + PB.bn(t.questions) + 'টি</p></article>').join("");
    }
  }
  load();
})();

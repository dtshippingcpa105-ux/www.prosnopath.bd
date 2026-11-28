(() => {
  const index = PB.id("noteIndex");
  const detail = PB.id("noteDetail");
  const filters = PB.id("noteFilters");
  const cards = PB.id("noteCards");
  const escape = PB.escape;
  const notesUrl = PB.href("notes.html");
  const params = PB.params();
  const classId = params.get("class");
  const catalog = STUDY_CHAPTERS.filter((note) => !classId || note.classId === classId);
  const subjects = [...new Set(catalog.map((note) => note.subjectId))];
  const requestedNote = params.get("note");
  const current = STUDY_CHAPTERS.find((note) => note.id === requestedNote);
  const scholarshipSubjects = ["science", "math", "bgs"];
  const scholarship = (subject) => PB.href("paper-builder.html", { exam: subject + "-britti-1" });

  const readKey = "proshnopath-notes-read-v1";
  function readMap() {
    try { return JSON.parse(localStorage.getItem(readKey)) ?? {}; } catch { return {}; }
  }
  function setRead(id, value) {
    const map = readMap();
    if (value) map[id] = new Date().toISOString().slice(0, 10); else delete map[id];
    try { localStorage.setItem(readKey, JSON.stringify(map)); } catch { /* সংরক্ষণ না হলেও চলবে */ }
  }
  const letters = ["ক", "খ", "গ", "ঘ", "ঙ"];

  function readingMinutes(note) {
    const text = [note.goal, ...note.keyPoints, note.example?.prompt, ...(note.example?.steps ?? []), note.commonMistake,
      ...(note.tables ?? []).flatMap((t) => t.rows.flat())].join(" ");
    return Math.max(3, Math.round(text.length / 550));
  }

  function keyPointList(note) {
    const important = new Set(note.important ?? []);
    return "<ul>" + note.keyPoints.map((item, i) => important.has(i)
      ? '<li class="note-important"><span class="note-star">★ পরীক্ষায় গুরুত্বপূর্ণ</span> ' + escape(item) + "</li>"
      : "<li>" + escape(item) + "</li>").join("") + "</ul>";
  }

  function quickCheck(note) {
    const pool = (note.mcq ?? []).filter((item) => !item.useFigure);
    if (!pool.length) return "";
    const picked = [...pool].sort(() => Math.random() - .5).slice(0, 3);
    return '<section class="note-section note-check" aria-labelledby="noteCheckTitle"><h2 id="noteCheckTitle">ঝটপট যাচাই</h2>'
      + '<p class="muted">নোট পড়া শেষ? ' + PB.bn(picked.length) + 'টি প্রশ্নে নিজেকে যাচাই করুন।</p>'
      + picked.map((item, n) => '<div class="note-check-item" data-answer="' + item.answer + '" data-explain="' + escape(item.explain ?? "") + '">'
        + '<p><strong>' + PB.bn(n + 1) + '.</strong> ' + escape(item.q) + '</p><div class="q-options">'
        + item.options.map((text, i) => '<button type="button" class="option" data-option="' + i + '"><span>' + letters[i] + '. ' + escape(text) + '</span></button>').join("")
        + '</div><p class="note-check-explain" hidden></p></div>').join("")
      + '<p class="note-check-score" id="noteCheckScore" role="status"></p></section>';
  }

  function subjectName(note) {
    return SUBJECTS[note.subjectId].name;
  }

  function renderCards(subject) {
    for (const button of filters.querySelectorAll("button")) {
      button.setAttribute("aria-pressed", String(button.dataset.subject === subject));
    }
    cards.innerHTML = catalog.filter((note) => !subject || note.subjectId === subject)
      .map((note) => '<a class="tool-card note-card" href="' + escape(PB.href("notes.html", { note: note.id })) + '">'
        + '<span class="note-subject">' + escape(PB.classById(note.classId).name) + ' · ' + escape(subjectName(note))
        + '</span><h3>' + (note.number ? PB.bn(note.number) + '. ' : '') + escape(note.chapter) + '</h3><p>'
        + escape(note.goal) + '</p><span class="card-link">' + (readMap()[note.id] ? "✓ পড়া হয়েছে · আবার পড়ুন" : "নোট পড়ুন") + '</span></a>').join("")
      || '<p class="status-box">এই শ্রেণি ও বিষয়ের কোনো নোট নেই।</p>';
    for (const link of filters.querySelectorAll("[data-scholarship-subject]")) {
      link.hidden = (classId && classId !== "c8") || (subject && subject !== link.dataset.scholarshipSubject);
    }
  }

  function list(tag, items) {
    return "<" + tag + ">" + items.map((item) => "<li>" + escape(item) + "</li>").join("") + "</" + tag + ">";
  }

  function comparison(table) {
    return '<section class="note-section"><div class="note-table" role="region" tabindex="0" aria-label="' + escape(table.title)
      + '"><table><caption>' + escape(table.title) + '</caption><thead><tr>'
      + table.headings.map((heading) => '<th scope="col">' + escape(heading) + '</th>').join("")
      + '</tr></thead><tbody>' + table.rows.map(([label, ...cells]) => '<tr><th scope="row">' + escape(label)
        + '</th>' + cells.map((cell) => '<td>' + escape(cell) + '</td>').join("") + '</tr>').join("")
      + '</tbody></table></div></section>';
  }

  function visualExample(example) {
    return '<section class="note-section science-visual" id="science-visual" tabindex="-1">'
      + '<h2>চিত্রে বাস্তব উদাহরণ</h2><p>' + escape(example.context) + '</p>'
      + PB.figure(example) + '<p>' + escape(example.explanation) + '</p>'
      + '<div class="science-recall"><p><strong>ভেবে দেখো</strong> ' + escape(example.check[0]) + '</p>'
      + '<details><summary>উত্তর মিলিয়ে দেখো</summary><p>' + escape(example.check[1]) + '</p></details></div></section>';
  }

  if (current) {
    const hasPollinationLesson = current.id === "plant-reproduction";
    const visual = SCIENCE_EIGHT_VISUALS[current.id];
    PB.id("notesOverview").hidden = true;
    index.hidden = true;
    detail.hidden = false;
    document.title = current.chapter + " — অধ্যায়ভিত্তিক নোট | " + SITE.name;
    const selection = { class: current.classId, subject: current.subjectId, chapter: current.chapter };
    const savedQuiz = PB.id("studentNavLink")?.dataset.quizzes?.split(",").includes(current.id);
    const book = STUDY_CHAPTERS.filter((note) => note.classId === current.classId && note.subjectId === current.subjectId && note.number);
    const chapterIndex = book.indexOf(current);
    const neighbors = chapterIndex >= 0 ? [[book[chapterIndex - 1], "আগের অধ্যায়"], [book[chapterIndex + 1], "পরের অধ্যায়"]]
      .filter(([note]) => note) : [];
    const nextLinks = neighbors.length ? '<nav class="actions" aria-label="পাঠ্যবইয়ের অধ্যায়">'
      + neighbors.map(([note, label]) => '<a class="btn btn-secondary" href="'
        + escape(PB.href("notes.html", { note: note.id })) + '">' + label + ' · ' + escape(note.chapter) + '</a>').join("")
      + '</nav>' : '';
    detail.innerHTML = '<p class="note-subject">' + escape(PB.classById(current.classId).name) + ' · ' + escape(subjectName(current)) + '</p>'
      + '<h1>' + escape(current.chapter) + '</h1><p><strong>শিখনলক্ষ্য</strong> ' + escape(current.goal) + '</p>'
      + '<p class="muted">প্রশ্নপাঠের নিজস্ব অনুশীলনী। বিষয়শিক্ষকের পর্যালোচনার জন্য প্রস্তুত।</p>'
      + '<div class="note-tools"><span>⏱ প্রায় ' + PB.bn(readingMinutes(current)) + ' মিনিট · ' + PB.bn(current.keyPoints.length) + 'টি মূল ধারণা</span>'
      + '<button type="button" class="btn btn-secondary" id="noteRead" aria-pressed="false">✓ পড়া শেষ চিহ্ন দিন</button>'
      + '<button type="button" class="btn btn-secondary" id="notePrint">🖨️ প্রিন্ট / PDF</button></div>'
      + (hasPollinationLesson ? '<p><a href="#pollination">পরাগায়নের চিত্রপাঠ দেখুন</a></p>' : '')
      + (visual ? '<p><a href="#science-visual">চিত্রসহ বাস্তব উদাহরণ দেখো</a></p>' : '')
      + '<section class="note-section"><h2>মূল ধারণা</h2>' + keyPointList(current) + '</section>'
      + (visual ? visualExample(visual) : '')
      + (current.tables ?? []).map(comparison).join("")
      + PB.figure(current.figure)
      + '<section class="note-section note-example"' + (hasPollinationLesson ? ' id="pollination-types" tabindex="-1"' : '')
      + '><h2>সমাধানসহ উদাহরণ</h2><p>' + escape(current.example.prompt)
      + '</p>' + list("ol", current.example.steps) + '</section>'
      + '<section class="note-section"><h2>এ ভুলটি এড়ান</h2><p>' + escape(current.commonMistake) + '</p></section>'
      + quickCheck(current)
      + '<div class="actions"><a class="btn btn-primary" href="' + escape(PB.href("question-bank.html", selection)) + '">অনুশীলনী ও সমাধান</a>'
      + '<a class="btn btn-secondary" href="' + escape(PB.href("quiz.html", selection)) + '">কুইজ দিন</a>'
      + (savedQuiz ? '<a class="btn btn-secondary" href="'
        + escape(PB.href("quiz.html", { student: current.id }) + "#quizWorkspace") + '">আইডিতে ফল সেভ করে কুইজ দিন</a>' : '')
      + '<a class="btn btn-secondary" href="' + escape(PB.href("paper-builder.html", selection)) + '">এই অধ্যায়ের প্রশ্নপত্র</a></div>'
      + nextLinks
      + '<p class="source-extra"><a href="' + escape(notesUrl) + '">সব নোট</a>'
      + (chapterIndex >= 0 && current.classId === "c8" && scholarshipSubjects.includes(current.subjectId)
        ? '<a href="' + escape(scholarship(current.subjectId)) + '">পূর্ণ বইয়ের বৃত্তি মডেল সেট</a>' : '')
      + '<a href="' + escape(current.source?.url || PB.href("textbooks.html")) + '">'
      + escape(current.source?.label || "পাঠ্যবইয়ের সরকারি উৎস") + '</a>'
      + (current.source?.pages ? '<span>পাঠ্যবইয়ের পৃষ্ঠা ' + escape(current.source.pages) + '</span>' : '') + '</p>'
      + '<p class="question-feedback"><a href="' + escape(PB.feedbackHref(PB.href("notes.html", { note: current.id })))
      + '">এই নোটে ভুল জানান</a></p>';
    if (hasPollinationLesson) {
      const lesson = PB.id("pollinationLesson").content.cloneNode(true);
      lesson.querySelector("[data-pollination-quiz]").href = PB.href("quiz.html", selection);
      detail.querySelector(".note-section").after(lesson);
    }
    const readButton = PB.id("noteRead");
    const showRead = () => {
      const done = Boolean(readMap()[current.id]);
      readButton.setAttribute("aria-pressed", String(done));
      readButton.textContent = done ? "✓ পড়া শেষ হয়েছে" : "✓ পড়া শেষ চিহ্ন দিন";
    };
    readButton.addEventListener("click", () => { setRead(current.id, !readMap()[current.id]); showRead(); });
    showRead();
    PB.id("notePrint").addEventListener("click", () => window.print());
    let checked = 0;
    let right = 0;
    for (const item of detail.querySelectorAll(".note-check-item")) {
      item.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-option]");
        if (!button || item.dataset.done) return;
        item.dataset.done = "1";
        const answer = Number(item.dataset.answer);
        const choice = Number(button.dataset.option);
        PB.showAnswer([...item.querySelectorAll("button[data-option]")], answer, choice);
        const explain = item.querySelector(".note-check-explain");
        if (item.dataset.explain) { explain.textContent = item.dataset.explain; explain.hidden = false; }
        checked += 1;
        if (choice === answer) right += 1;
        const total = detail.querySelectorAll(".note-check-item").length;
        if (checked === total) {
          PB.id("noteCheckScore").textContent = PB.bn(right) + " / " + PB.bn(total) + " সঠিক। "
            + (right === total ? "চমৎকার! পড়া শেষ চিহ্ন দেওয়া হলো।" : "ভুলগুলোর ব্যাখ্যা দেখে নিন, তারপর পুরো কুইজ দিন।");
          if (right === total) { setRead(current.id, true); showRead(); }
        }
      });
    }
    return;
  }

  if (requestedNote) {
    const alert = document.createElement("p");
    alert.className = "status-box";
    alert.textContent = "এই নামে কোনো অধ্যায়ের নোট পাওয়া যায়নি। নিচের তালিকা থেকে বেছে নিন।";
    index.prepend(alert);
  }
  filters.innerHTML = [["", "সব বিষয়"], ...subjects.map((id) => [id, SUBJECTS[id].name])]
    .map(([id, name]) => '<button type="button" class="btn btn-secondary" data-subject="' + escape(id)
      + '" aria-pressed="false">' + escape(name) + "</button>").join("");
  filters.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-subject]");
    if (button) renderCards(button.dataset.subject);
  });
  for (const subject of scholarshipSubjects) {
    const modelLink = document.createElement("a");
    modelLink.className = "btn btn-secondary";
    modelLink.href = scholarship(subject);
    modelLink.dataset.scholarshipSubject = subject;
    modelLink.textContent = "৮ম শ্রেণির " + SUBJECTS[subject].name + " · বৃত্তি মডেল প্রশ্নপত্র";
    filters.append(modelLink);
  }
  const initial = params.get("subject");
  renderCards(subjects.includes(initial) ? initial : "");
})();

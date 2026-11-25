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
  const scholarshipSubjects = ["science", "math"];
  const scholarship = (subject) => PB.href("paper-builder.html", { exam: subject + "-britti-1" });

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
        + escape(note.goal) + '</p><span class="card-link">নোট পড়ুন</span></a>').join("")
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
      + (hasPollinationLesson ? '<p><a href="#pollination">পরাগায়নের চিত্রপাঠ দেখুন</a></p>' : '')
      + (visual ? '<p><a href="#science-visual">চিত্রসহ বাস্তব উদাহরণ দেখো</a></p>' : '')
      + '<section class="note-section"><h2>মূল ধারণা</h2>' + list("ul", current.keyPoints) + '</section>'
      + (visual ? visualExample(visual) : '')
      + (current.tables ?? []).map(comparison).join("")
      + PB.figure(current.figure)
      + '<section class="note-section note-example"' + (hasPollinationLesson ? ' id="pollination-types" tabindex="-1"' : '')
      + '><h2>সমাধানসহ উদাহরণ</h2><p>' + escape(current.example.prompt)
      + '</p>' + list("ol", current.example.steps) + '</section>'
      + '<section class="note-section"><h2>এ ভুলটি এড়ান</h2><p>' + escape(current.commonMistake) + '</p></section>'
      + '<div class="actions"><a class="btn btn-primary" href="' + escape(PB.href("question-bank.html", selection)) + '">অনুশীলনী ও সমাধান</a>'
      + '<a class="btn btn-secondary" href="' + escape(PB.href("quiz.html", selection)) + '">কুইজ দিন</a>'
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

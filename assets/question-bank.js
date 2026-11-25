(() => {
  const content = PB.id("bankContent");
  const trail = PB.id("bankTrail");
  const escape = PB.escape;
  const bank = (filters) => PB.href("question-bank.html", filters);
  const types = { mcq: "বহুনির্বাচনী", short: "সংক্ষিপ্ত প্রশ্ন", creative: "সৃজনশীল প্রশ্ন" };
  const limit = 24;

  try {
    init();
  } catch (error) {
    console.error("Question bank failed to initialize", error);
    content.innerHTML = '<p class="status-box" role="alert">প্রশ্নব্যাংক লোড করা যায়নি। <a href="'
      + escape(bank()) + '">আবার চেষ্টা করুন</a></p>';
  }

  function init() {
    const entries = PB.entries();
    const questions = entries.flatMap((entry) => [
      ...entry.mcq.map((item) => ({ item, type: "mcq" })),
      ...entry.short.map((item) => ({ item, type: item.kind === "creative" ? "creative" : "short" }))
    ].map((row, index) => ({
      ...row, entry, id: [entry.classId, entry.subjectId, entry.chapter, index].join("|"),
      source: PB.questionSource(row.item)
    })));
    const byId = new Map(questions.map((record) => [record.id, record]));
    const answers = new Map();
    const params = PB.params();
    const questionAnchor = (id) => "question-" + encodeURIComponent(id).replaceAll("%", "_");
    const linkedQuestion = questions.find(({ id }) => "#" + questionAnchor(id) === location.hash);
    const names = [
      ["class", "শ্রেণি"], ["subject", "বিষয়"], ["chapter", "অধ্যায়"],
      ["type", "প্রশ্নের ধরন"], ["source", "প্রশ্নের উৎস"]
    ];

    content.innerHTML = '<form class="panel bank-filters" aria-label="প্রশ্ন খোঁজা ও ফিল্টার">'
      + '<div class="bank-filter-grid">' + names.map(([key, label]) =>
        '<label>' + label + '<select name="' + key + '"></select></label>').join("")
      + '<label>প্রশ্ন খুঁজুন<input type="search" name="q" maxlength="100" placeholder="প্রশ্নের শব্দ লিখুন"></label>'
      + '</div></form><div id="bankOutput"></div>';
    const form = content.querySelector("form");
    const output = PB.id("bankOutput");
    const select = (name) => form.elements.namedItem(name);
    const values = () => Object.fromEntries(new FormData(form));
    const grade = select("class");
    const subject = select("subject");
    const chapter = select("chapter");
    const query = select("q");
    let shown = limit;
    let printState = [];

    function choicesForGrade(selectedSubject, selectedChapter) {
      const ids = grade.value ? SUBJECTS_BY_CLASS[grade.value] : Object.keys(SUBJECTS);
      PB.select(subject, [["", "সব বিষয়"], ...ids.map((id) => [id, SUBJECTS[id].name])], selectedSubject);
      choicesForSubject(selectedChapter);
    }

    function choicesForSubject(selectedChapter) {
      const chapters = [...new Set(entries.filter((entry) => (!grade.value || entry.classId === grade.value)
        && (!subject.value || entry.subjectId === subject.value)).map((entry) => entry.chapter))];
      PB.select(chapter, [["", "সব অধ্যায়"], ...chapters.map((name) => [name, name])], selectedChapter);
    }

    PB.select(grade, [["", "সব শ্রেণি"], ...CLASSES.map(({ id, name }) => [id, name])], params.get("class"));
    choicesForGrade(params.get("subject"), params.get("chapter"));
    PB.select(select("type"), [["", "সব ধরন"], ...Object.entries(types)], params.get("type"));
    PB.select(select("source"), [["", "সব উৎস"], ...Object.entries(PB.questionSources)], params.get("source"));
    query.value = (params.get("q") ?? "").slice(0, 100);

    function showBrowse(filters) {
      if (!filters.class) {
        return '<div class="section-head"><h2>শ্রেণি নির্বাচন করুন</h2></div><div class="class-grid">'
          + CLASSES.map(({ id, name, icon }) => {
            const count = entries.filter((entry) => entry.classId === id).length;
            return '<a class="class-card" href="' + escape(bank({ class: id })) + '">'
              + '<span class="class-badge" aria-hidden="true">' + escape(icon) + '</span><span><strong>'
              + escape(name) + '</strong><small>' + PB.bn(count) + 'টি অনুশীলন সেট</small></span></a>';
          }).join("") + '</div>';
      }
      return '<div class="section-head"><h2>' + escape(PB.classById(filters.class).name)
        + '</h2><p>অনুশীলনের বিষয় বেছে নিন।</p></div><div class="tool-grid">'
        + SUBJECTS_BY_CLASS[filters.class].map((id) => {
          const count = entries.filter((entry) => entry.classId === filters.class && entry.subjectId === id).length;
          const title = escape(SUBJECTS[id].name);
          return count
            ? '<a class="panel source-card" href="' + escape(bank({ class: filters.class, subject: id }))
              + '"><strong>' + title + '</strong><span>' + PB.bn(count) + 'টি অনুশীলন সেট</span></a>'
            : '<div class="panel source-card unavailable"><strong>' + title + '</strong><span>অনুশীলনী যোগ করা হয়নি</span></div>';
        }).join("") + '</div>';
    }

    function renderQuestion(record, index) {
      const { item, entry, type, source, id } = record;
      const sourceLabel = PB.questionSources[source];
      const sourceUrl = typeof item.source?.url === "string" && /^https:\/\//i.test(item.source.url) ? item.source.url : "";
      const attribution = sourceUrl ? '<a href="' + escape(sourceUrl) + '">' + escape(sourceLabel) + '</a>' : escape(sourceLabel);
      const detail = [item.source?.board, item.source?.year, item.source?.locator].filter(Boolean).map((part) => escape(part)).join(" · ");
      const reference = entry.reference;
      const reading = reference && /^https:\/\//i.test(reference.url)
        ? '<span><a href="' + escape(reference.url) + '">পাঠ্যবই</a> · পৃ. ' + escape(reference.pages) + '</span>' : "";
      const options = type === "mcq" ? PB.figure(item.figure)
        + '<div class="q-options" role="group" aria-labelledby="bank-question-' + index + '">'
        + item.options.map((option, optionIndex) => '<button type="button" class="option" aria-pressed="false" data-option="'
          + optionIndex + '">' + escape(option) + '</button>').join("")
        + '</div><div class="q-explain" role="status" hidden></div>'
        : '<p class="muted">' + PB.bn(item.marks) + ' নম্বর</p>'
          + (item.solution ? '<details class="short-answer"><summary>নমুনা উত্তর দেখুন</summary><p class="question-lines">'
            + escape(item.solution) + '</p>' + (item.criteria?.length ? '<ul>' + PB.rubric(item.criteria) + '</ul>' : '') + '</details>' : "");
      const anchor = questionAnchor(id);
      const page = bank({ class: entry.classId, subject: entry.subjectId, chapter: entry.chapter, type, source }) + "#" + anchor;
      const report = PB.feedbackHref(page, { question: item.q });
      return '<details class="panel bank-question" id="' + escape(anchor) + '" data-question="' + escape(id) + '"'
        + (index === 0 || linkedQuestion?.id === id ? ' open' : '') + '>'
        + '<summary class="question-lines" id="bank-question-' + index + '">' + PB.bn(index + 1) + '. ' + escape(item.q)
        + '</summary><div class="bank-question-inner"><div class="bank-provenance"><span>' + escape(types[type])
        + '</span><span>' + escape(PB.classById(entry.classId).name + " · " + SUBJECTS[entry.subjectId].name + " · " + entry.chapter)
        + '</span><span>উৎস ' + attribution + (detail ? ' · ' + detail : '') + '</span>' + reading
        + '</div>' + options + '<p class="question-feedback"><a href="' + escape(report)
        + '">এই প্রশ্নে ভুল জানান</a></p></div></details>';
    }

    function applyAnswer(card, item, choice) {
      PB.showAnswer([...card.querySelectorAll("button[data-option]")], item.answer, choice);
      const explanation = card.querySelector(".q-explain");
      explanation.hidden = false;
      explanation.textContent = (choice === item.answer ? "সঠিক। " : "সঠিক উত্তর " + item.options[item.answer] + "। ") + item.explain;
    }

    function boardReferences(filters) {
      if (filters.source !== "board" || (filters.class && filters.class !== "c8")) return "";
      const refs = Object.entries(CLASS_EIGHT_BOARD_ANSWER_KEYS)
        .filter(([subject]) => !filters.subject || subject === filters.subject);
      return refs.length ? '<aside class="panel bank-archive"><h3>২০২৫ সালের জুনিয়র বৃত্তি পরীক্ষার নমুনা উত্তরমালা</h3>'
        + '<p>বরিশাল শিক্ষা বোর্ড পরীক্ষকদের জন্য এই মূল্যায়ন নথিগুলো প্রকাশ করেছে।</p><ul class="actions">'
        + refs.map(([subject, url]) => '<li><a href="' + escape(url) + '">'
          + escape(SUBJECTS[subject].name) + ' (PDF)</a></li>').join("") + '</ul></aside>' : "";
    }

    function render(moveFocus = false) {
      const filters = values();
      trail.hidden = !filters.class;
      trail.innerHTML = filters.class ? '<a href="' + escape(bank()) + '">সব শ্রেণি</a><span aria-hidden="true"> / </span>'
        + '<a href="' + escape(bank({ class: filters.class })) + '">' + escape(PB.classById(filters.class).name) + '</a>'
        + (filters.subject ? '<span aria-hidden="true"> / </span><span aria-current="page">' + escape(SUBJECTS[filters.subject].name) + '</span>' : '') : '';
      if (!filters.subject && !filters.chapter && !filters.q.trim() && !filters.type && !filters.source) {
        output.innerHTML = showBrowse(filters);
        return;
      }

      const matches = questions.filter(({ entry, item, type, source }) => (!filters.class || entry.classId === filters.class)
        && (!filters.subject || entry.subjectId === filters.subject)
        && (!filters.chapter || entry.chapter === filters.chapter)
        && (!filters.type || type === filters.type)
        && (!filters.source || source === filters.source)
        && PB.matches([item.q, ...(item.options ?? []), entry.chapter, SUBJECTS[entry.subjectId].name].join(" "), filters.q));
      const entry = filters.class && filters.subject && filters.chapter
        ? entries.find((row) => row.classId === filters.class && row.subjectId === filters.subject && row.chapter === filters.chapter)
        : null;
      const heading = filters.chapter || (filters.subject && SUBJECTS[filters.subject].name) || "প্রশ্নের ফলাফল";
      const buttons = !filters.source && entry?.mcq.length
        ? '<a class="btn btn-primary" href="' + escape(PB.href("quiz.html", { class: entry.classId, subject: entry.subjectId, chapter: entry.chapter })) + '">এই সেটের কুইজ দিন</a>' : "";
      const note = entry?.noteId ? '<a class="btn btn-secondary" href="' + escape(PB.href("notes.html", { note: entry.noteId })) + '">অধ্যায়ের নোট</a>' : "";
      const print = matches.length ? '<button class="btn btn-secondary" type="button" id="printPractice">প্রিন্ট / PDF</button>' : "";
      const message = filters.source === "board" && !questions.some((row) => row.source === "board")
        ? "যাচাইকৃত বিগত বোর্ড প্রশ্ন এখনো যোগ করা হয়নি।"
        : filters.source === "nctb" && !questions.some((row) => row.source === "nctb")
          ? "যাচাইকৃত এনসিটিবি প্রশ্ন এখনো যোগ করা হয়নি।"
          : "এই ফিল্টারে কোনো প্রশ্ন পাওয়া যায়নি। অন্য শব্দ, অধ্যায় বা উৎস বেছে দেখুন।";
      const pages = matches.slice(0, shown);
      const expanded = new Set([...output.querySelectorAll(".bank-question[open]")].map((card) => card.dataset.question));
      output.innerHTML = '<section class="bank-results" aria-labelledby="bankResultsHeading"><h2 id="bankResultsHeading">'
        + escape(heading) + '</h2><p class="list-status" role="status">'
        + (matches.length ? PB.bn(matches.length) + 'টি প্রশ্ন · ' + PB.bn(pages.length) + 'টি দেখানো হচ্ছে' : '০টি প্রশ্ন')
        + '</p>' + (buttons || note || print ? '<div class="actions bank-result-tools">' + buttons + note + print + '</div>' : '')
        + (matches.length ? pages.map(renderQuestion).join("") : '<p class="status-box">' + escape(message) + '</p>')
        + (!matches.length && filters.source === "nctb" ? '<p class="bank-empty-action"><a href="'
          + escape(PB.href("textbooks.html")) + '">এনসিটিবি পাঠ্যবই দেখুন</a></p>' : '')
        + (pages.length < matches.length ? '<button id="bankMore" class="btn btn-secondary bank-more" type="button">আরও প্রশ্ন দেখুন</button>' : '')
        + boardReferences(filters) + '</section>';
      for (const card of output.querySelectorAll(".bank-question")) {
        const id = card.dataset.question;
        if (expanded.has(id)) card.open = true;
        if (answers.has(id)) applyAnswer(card, byId.get(id).item, answers.get(id));
      }
      if (moveFocus) output.querySelectorAll(".bank-question")[shown - limit]?.querySelector("summary")?.focus();
    }

    function update() {
      shown = limit;
      history.replaceState(history.state, "", bank(values()));
      render();
    }

    form.addEventListener("submit", (event) => event.preventDefault());
    form.addEventListener("change", (event) => {
      if (event.target === query) return;
      if (event.target === grade) choicesForGrade("", "");
      if (event.target === subject) choicesForSubject("");
      update();
    });
    query.addEventListener("input", update);

    output.addEventListener("click", (event) => {
      const option = event.target.closest("button[data-option]");
      if (option) {
        const card = option.closest(".bank-question");
        const id = card.dataset.question;
        if (answers.has(id)) return;
        const choice = Number(option.dataset.option);
        answers.set(id, choice);
        applyAnswer(card, byId.get(id).item, choice);
        return;
      }
      if (event.target.closest("#bankMore")) {
        shown += limit;
        render(true);
      } else if (event.target.closest("#printPractice")) {
        window.print();
      }
    });
    window.addEventListener("beforeprint", () => {
      printState = [...output.querySelectorAll(".bank-question:not([open])")];
      printState.forEach((card) => { card.open = true; });
    });
    window.addEventListener("afterprint", () => {
      printState.forEach((card) => { card.open = false; });
      printState = [];
    });
    if (linkedQuestion) {
      const entry = linkedQuestion.entry;
      const relevant = questions.filter((row) => row.entry === entry
        && row.type === linkedQuestion.type && row.source === linkedQuestion.source);
      shown = Math.max(limit, Math.ceil((relevant.indexOf(linkedQuestion) + 1) / limit) * limit);
    }
    render();
    if (linkedQuestion) requestAnimationFrame(() => PB.id(questionAnchor(linkedQuestion.id))?.scrollIntoView());
  }
})();


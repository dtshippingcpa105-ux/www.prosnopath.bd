(() => {
  const get = PB.id;
  const setup = get("quizSetup");
  const pick = get("quizPick");
  const run = get("quizRun");
  const result = get("quizResult");
  const classSelect = get("quizClass");
  const subjectSelect = get("quizSubject");
  const chapterSelect = get("quizChapter");
  const questions = PB.entries().filter((entry) => entry.mcq.length);
  const options = get("quizOptions");
  const next = get("quizNext");
  const skip = get("quizSkip");
  const display = get("quizTimer");
  const explanation = get("quizExplain");
  const params = PB.params();
  const modelTest = params.get("mode") === "model";
  let selected, items, answers, index, duration, deadline, timer;
  let active = false;

  if (modelTest) {
    document.title = "মডেল টেস্ট | " + SITE.name;
    get("quizHeroTitle").textContent = "মডেল টেস্ট";
    get("quizHeroIntro").textContent = "অধ্যায় বেছে পরীক্ষার মতো অনুশীলন করুন। সব প্রশ্ন শেষ হলে ফল, সঠিক উত্তর ও ব্যাখ্যা দেখবেন।";
    for (const link of document.querySelectorAll("#mainNav a")) {
      const url = new URL(link.href, location.href);
      if (url.searchParams.get(window.PP_ROUTES ? "pp_mode" : "mode") === "model") link.setAttribute("aria-current", "page");
      else if (link.textContent === "কুইজ") link.removeAttribute("aria-current");
    }
  }

  function fillChapters(chapter) {
    const matching = questions.filter((entry) =>
      entry.classId === classSelect.value && entry.subjectId === subjectSelect.value);
    PB.select(chapterSelect, matching.map((entry) => [entry.chapter, entry.chapter]), chapter);
    updateInfo();
  }

  function fillSubjects(subject, chapter) {
    const ids = [...new Set(questions.filter((entry) => entry.classId === classSelect.value)
      .map((entry) => entry.subjectId))];
    PB.select(subjectSelect, ids.map((id) => [id, SUBJECTS[id].name]), subject);
    fillChapters(chapter);
  }

  function updateInfo() {
    selected = questions.find((entry) => entry.classId === classSelect.value
      && entry.subjectId === subjectSelect.value && entry.chapter === chapterSelect.value);
    get("quizStart").disabled = !selected;
    get("quizSetInfo").textContent = selected ? PB.bn(selected.mcq.length) + "টি প্রশ্ন" : "কোনো কুইজ পাওয়া যায়নি।";
  }

  function shuffle(itemsToShuffle) {
    const copy = [...itemsToShuffle];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function stopTimer() {
    clearInterval(timer);
    timer = undefined;
  }

  function showScreen(screen) {
    for (const section of [pick, run, result]) section.hidden = section !== screen;
  }

  function start() {
    if (!selected || active) return;
    items = shuffle(selected.mcq);
    answers = [];
    index = 0;
    duration = Number(get("quizTime").value);
    active = true;
    showScreen(run);
    renderQuestion();
  }

  function tick() {
    const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    display.textContent = "সময় বাকি " + PB.bn(remaining) + " সেকেন্ড";
    display.classList.toggle("danger", remaining <= 5);
    if (remaining === 0) submitAnswer(null, "সময় শেষ।");
  }

  function renderQuestion() {
    stopTimer();
    const item = items[index];
    const heading = get("quizQText");
    heading.textContent = item.q;
    get("quizFigure").innerHTML = PB.figure(item.figure);
    get("quizQNum").textContent = "প্রশ্ন " + PB.bn(index + 1) + " / " + PB.bn(items.length);
    const bar = get("quizBar");
    bar.max = items.length;
    bar.value = index;
    explanation.hidden = true;
    explanation.textContent = "";
    skip.disabled = false;
    next.disabled = true;
    next.textContent = index + 1 === items.length ? "ফলাফল দেখুন" : "পরবর্তী প্রশ্ন →";
    options.replaceChildren(...shuffle(item.options.map((text, optionIndex) => ({ text, optionIndex }))).map(({ text, optionIndex }) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "option";
      button.dataset.option = optionIndex;
      button.setAttribute("aria-pressed", "false");
      button.textContent = text;
      return button;
    }));
    display.hidden = duration === 0;
    if (duration) {
      deadline = Date.now() + duration * 1000;
      tick();
      timer = setInterval(tick, 200);
    }
    heading.focus();
  }

  function submitAnswer(choice, status) {
    if (!active || answers.length > index) return;
    if (duration && Date.now() >= deadline) {
      choice = null;
      status = "সময় শেষ।";
    }
    stopTimer();
    const item = items[index];
    answers.push(choice);
    const buttons = options.querySelectorAll("button");
    if (modelTest) {
      for (const button of buttons) {
        button.setAttribute("aria-disabled", "true");
        if (Number(button.dataset.option) === choice) button.setAttribute("aria-pressed", "true");
      }
    } else {
      PB.showAnswer(buttons, item.answer, choice);
    }
    explanation.hidden = false;
    explanation.textContent = modelTest ? status || "উত্তর নেওয়া হয়েছে।"
      : (status || (choice === item.answer ? "সঠিক।" : "ভুল।"))
        + " সঠিক উত্তর " + item.options[item.answer] + "। " + item.explain;
    const moveFocus = document.activeElement === skip;
    skip.disabled = true;
    next.disabled = false;
    get("quizBar").value = index + 1;
    if (moveFocus) next.focus();
  }

  function finish() {
    stopTimer();
    active = false;
    const correct = items.filter((item, i) => item.answer === answers[i]).length;
    const skipped = answers.filter((answer) => answer === null).length;
    get("quizScore").textContent = PB.bn(correct) + " / " + PB.bn(items.length);
    get("quizFeedback").textContent = PB.bn(correct) + "টি সঠিক · "
      + PB.bn(items.length - correct - skipped) + "টি ভুল · " + PB.bn(skipped) + "টি বাদ";
    get("quizScholarship").hidden = selected.classId !== "c8" || !["science", "math"].includes(selected.subjectId);
    const escape = PB.escape;
    get("quizReview").innerHTML = '<h3 class="review-title">উত্তর পর্যালোচনা</h3>'
      + items.map((item, i) => {
        const choice = answers[i];
        const tag = choice === null ? "বাদ" : choice === item.answer ? "সঠিক" : "ভুল";
        return '<details class="panel review"><summary>' + PB.bn(i + 1) + '. ' + escape(item.q)
          + ' <span class="review-tag">(' + tag + ')</span></summary>' + PB.figure(item.figure) + '<p>আপনার উত্তর — '
          + (choice === null ? "উত্তর দেওয়া হয়নি" : escape(item.options[choice]))
          + '</p><p>সঠিক উত্তর — ' + escape(item.options[item.answer]) + '</p><p>' + escape(item.explain) + '</p></details>';
      }).join("");
    showScreen(result);
    get("quizResultTitle").focus();
  }

  function backToSetup() {
    active = false;
    stopTimer();
    showScreen(pick);
    get("quizPickTitle").focus();
  }

  const classOptions = CLASSES.filter((entry) => questions.some((item) => item.classId === entry.id));
  PB.select(classSelect, classOptions.map((entry) => [entry.id, entry.name]), params.get("class"));
  fillSubjects(params.get("subject"), params.get("chapter"));

  classSelect.addEventListener("change", () => fillSubjects());
  subjectSelect.addEventListener("change", () => fillChapters());
  chapterSelect.addEventListener("change", updateInfo);
  setup.addEventListener("submit", (event) => {
    event.preventDefault();
    start();
  });
  options.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-option]");
    if (button) submitAnswer(Number(button.dataset.option));
  });
  skip.addEventListener("click", () => submitAnswer(null, "প্রশ্নটি এড়িয়ে গেছেন।"));
  next.addEventListener("click", () => {
    if (!active || answers.length <= index) return;
    index += 1;
    if (index === items.length) finish();
    else renderQuestion();
  });
  get("quizQuit").addEventListener("click", backToSetup);
  get("quizOther").addEventListener("click", backToSetup);
  get("quizRetry").addEventListener("click", start);
})();

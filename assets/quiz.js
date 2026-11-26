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
  const studentNavLink = get("studentNavLink");
  const quizId = params.get("student");
  const pilotQuizIds = (studentNavLink?.dataset.quizzes || "plant-reproduction").split(",");
  const studentQuiz = studentNavLink && pilotQuizIds.includes(quizId)
    ? questions.find((entry) => entry.classId === "c8" && entry.noteId === quizId)
    : null;
  const pilotQuestionCount = Number(studentNavLink?.dataset.quizCounts?.split(",")[pilotQuizIds.indexOf(quizId)]);
  const modelTest = !studentQuiz && params.get("mode") === "model";
  const showAnswersAtEnd = studentQuiz || modelTest;
  const studentStatus = get("quizStudentStatus");
  let selected, items, answers, index, duration, deadline, timer, attemptId;
  let active = false;
  let busy = false;

  if (modelTest) {
    document.title = "পরীক্ষার ধাঁচে অধ্যায়ভিত্তিক কুইজ | " + SITE.name;
    get("quizHeroTitle").textContent = "পরীক্ষার ধাঁচে কুইজ";
    get("quizHeroIntro").textContent = "অধ্যায় বেছে পরীক্ষার মতো অনুশীলন করুন। সব প্রশ্ন শেষ হলে ফল, সঠিক উত্তর ও ব্যাখ্যা দেখবেন।";
  }
  if (studentQuiz) {
    document.title = studentQuiz.chapter + " · শিক্ষার্থী কুইজ | " + SITE.name;
    get("quizHeroTitle").textContent = studentQuiz.chapter;
    get("quizHeroIntro").textContent = "অষ্টম শ্রেণি · " + SUBJECTS[studentQuiz.subjectId].name
      + "। সব প্রশ্ন শেষে ফল ও ব্যাখ্যা আপনার শিক্ষার্থী আইডিতে সংরক্ষিত হবে।";
    const dial = document.querySelector(".quiz-dial");
    dial.querySelector("strong").textContent = PB.bn(pilotQuestionCount || studentQuiz.mcq.length);
    dial.querySelector("span").textContent = "প্রশ্ন";
    const modeCopy = document.querySelector(".quiz-mode-copy");
    modeCopy.firstElementChild.textContent = "সময়সীমা ছাড়া কুইজ";
    modeCopy.lastElementChild.hidden = true;
  }

  function showStudentStatus(message) {
    studentStatus.textContent = message;
    studentStatus.hidden = !message;
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
    const count = studentQuiz && pilotQuestionCount ? pilotQuestionCount : selected?.mcq.length;
    get("quizSetInfo").textContent = count ? PB.bn(count) + "টি প্রশ্ন" : "কোনো কুইজ পাওয়া যায়নি।";
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

  async function start() {
    if (!selected || active || busy) return;
    if (studentQuiz) {
      busy = true;
      const startButton = get("quizStart");
      startButton.disabled = true;
      showStudentStatus("কুইজ প্রস্তুত হচ্ছে…");
      try {
        const attempt = await PB.studentRequest("/attempts", { quiz: quizId });
        items = attempt.questions;
        attemptId = attempt.id;
        showStudentStatus("");
      } catch (error) {
        showStudentStatus(error.message);
        return;
      } finally {
        busy = false;
        startButton.disabled = false;
      }
    } else {
      items = shuffle(selected.mcq);
    }
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
    if (showAnswersAtEnd) {
      for (const button of buttons) {
        button.setAttribute("aria-disabled", "true");
        if (Number(button.dataset.option) === choice) button.setAttribute("aria-pressed", "true");
      }
    } else {
      PB.showAnswer(buttons, item.answer, choice);
    }
    explanation.hidden = false;
    explanation.textContent = showAnswersAtEnd ? status || "উত্তর নেওয়া হয়েছে।"
      : (status || (choice === item.answer ? "সঠিক।" : "ভুল।"))
        + " সঠিক উত্তর " + item.options[item.answer] + "। " + item.explain;
    const moveFocus = document.activeElement === skip;
    skip.disabled = true;
    next.disabled = false;
    get("quizBar").value = index + 1;
    if (moveFocus) next.focus();
  }

  async function finish() {
    stopTimer();
    if (studentQuiz) {
      busy = true;
      next.disabled = true;
      const quit = get("quizQuit");
      quit.disabled = true;
      showStudentStatus("ফল সংরক্ষণ হচ্ছে…");
      try {
        const { attempt } = await PB.studentRequest("/attempts/" + attemptId, { answers });
        const dashboard = get("quizStudentResult");
        dashboard.href = PB.href("student.html", { attempt: attempt.id }) + "#studentReview";
        dashboard.hidden = false;
        showStudentStatus("ফল আপনার শিক্ষার্থী আইডিতে সংরক্ষিত হয়েছে।");
        renderResult(attempt, attempt.questions);
      } catch (error) {
        showStudentStatus(error.message + " ফল সংরক্ষণ করতে আবার ‘জমা দিন’ চাপুন।");
        next.textContent = "আবার জমা দিন";
        next.disabled = false;
        studentStatus.scrollIntoView({ block: "nearest" });
      } finally {
        busy = false;
        quit.disabled = false;
      }
      return;
    }
    const correct = items.filter((item, i) => item.answer === answers[i]).length;
    const skipped = answers.filter((answer) => answer === null).length;
    renderResult({ correct, skipped, total: items.length, wrong: items.length - correct - skipped },
      items.map((item, i) => ({ ...item, choice: answers[i] })));
  }

  function renderResult({ correct, skipped, total, wrong }, review) {
    active = false;
    get("quizScore").textContent = PB.bn(correct) + " / " + PB.bn(total);
    get("quizFeedback").textContent = PB.bn(correct) + "টি সঠিক · "
      + PB.bn(wrong) + "টি ভুল · " + PB.bn(skipped) + "টি বাদ";
    get("quizScholarship").hidden = studentQuiz || selected.classId !== "c8"
      || !["science", "math"].includes(selected.subjectId);
    get("quizReview").innerHTML = '<h3 class="review-title">উত্তর পর্যালোচনা</h3>'
      + PB.quizReview(review);
    showScreen(result);
    get("quizResultTitle").focus();
  }

  function backToSetup() {
    active = false;
    stopTimer();
    if (studentQuiz) showStudentStatus("");
    showScreen(pick);
    get("quizPickTitle").focus();
  }

  const classOptions = CLASSES.filter((entry) => questions.some((item) => item.classId === entry.id));
  PB.select(classSelect, classOptions.map((entry) => [entry.id, entry.name]), studentQuiz?.classId ?? params.get("class"));
  fillSubjects(studentQuiz?.subjectId ?? params.get("subject"), studentQuiz?.chapter ?? params.get("chapter"));
  if (studentQuiz) {
    get("quizTime").value = "0";
    for (const field of [classSelect, subjectSelect, chapterSelect, get("quizTime")]) field.disabled = true;
    get("quizOther").hidden = true;
  }

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
    if (!active || busy || answers.length <= index) return;
    if (index === items.length - 1) finish();
    else {
      index += 1;
      renderQuestion();
    }
  });
  get("quizQuit").addEventListener("click", backToSetup);
  get("quizOther").addEventListener("click", backToSetup);
  get("quizRetry").addEventListener("click", start);
})();

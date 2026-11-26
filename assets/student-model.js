(() => {
  const get = PB.id;
  const selection = get("modelOptions");
  const pages = get("modelPages");
  const timer = get("modelTimer");
  const status = get("modelStatus");
  const saveStatus = get("modelSaveStatus");
  let attempt, deadline, ticker;
  let index = 0;
  let busy = false;
  let expired = false;

  const request = (path = "", body) => PB.studentRequest("/model-test" + path, body, AbortSignal.timeout(8000));
  const answerCount = () => attempt.choices.filter((choice) => choice !== null).length;
  const reviewLink = (record) => PB.href("student.html", { attempt: record.id }) + "#studentReview";

  function announce(message) {
    status.textContent = message;
    status.hidden = !message;
  }

  function show(section) {
    for (const name of ["modelSetup", "modelRun", "modelResult"]) get(name).hidden = name !== section;
  }

  function updateControls() {
    get("modelAnswered").textContent = PB.bn(answerCount()) + " / " + PB.bn(attempt.questions.length) + " উত্তর সংরক্ষিত";
    for (const [position, button] of [...pages.children].entries()) {
      const answered = attempt.choices[position] !== null;
      button.dataset.answered = answered;
      button.setAttribute("aria-label", "প্রশ্ন " + PB.bn(position + 1) + (answered ? ", উত্তর দেওয়া" : ", উত্তর বাকি"));
      if (position === index) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    }
    for (const [position, button] of [...selection.children].entries()) {
      button.setAttribute("aria-pressed", String(attempt.choices[index] === position));
      button.setAttribute("aria-disabled", String(busy || expired));
    }
    get("modelPrevious").disabled = index === 0;
    get("modelNext").disabled = index === attempt.questions.length - 1;
    get("modelClear").disabled = busy || expired || attempt.choices[index] === null;
    get("modelSubmit").disabled = busy;
    get("modelFinish").disabled = busy;
    get("modelConfirmText").textContent = PB.bn(attempt.questions.length - answerCount()) + "টি প্রশ্নে উত্তর বাকি। এখন জমা দেবেন?";
  }

  function renderQuestion(position) {
    index = position;
    const question = attempt.questions[index];
    get("modelPosition").textContent = question.subjectName + " · প্রশ্ন " + PB.bn(index + 1) + " / " + PB.bn(attempt.questions.length);
    get("modelQuestion").textContent = question.q;
    get("modelFigure").innerHTML = PB.figure(question.figure);
    selection.replaceChildren(...question.options.map((text, option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "option";
      button.dataset.choice = option;
      button.textContent = text;
      return button;
    }));
    updateControls();
    get("modelQuestion").focus();
  }

  function tick() {
    const seconds = Math.max(0, Math.ceil((deadline - performance.now()) / 1000));
    timer.textContent = "সময় বাকি " + PB.bn(Math.floor(seconds / 60)) + ":" + PB.bn(String(seconds % 60).padStart(2, "0"));
    timer.classList.toggle("danger", seconds <= 60);
    if (seconds === 0 && !expired) {
      expired = true;
      clearInterval(ticker);
      get("modelConfirm").hidden = true;
      get("modelSubmit").hidden = false;
      get("modelSubmit").textContent = "ফল দেখুন";
      updateControls();
      if (!busy) finish();
    }
  }

  function run(active) {
    attempt = active;
    deadline = performance.now() + Math.max(0, active.deadline - active.serverNow);
    expired = false;
    get("modelConfirm").hidden = true;
    pages.replaceChildren(...attempt.questions.map((_, position) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.position = position;
      button.textContent = PB.bn(position + 1);
      return button;
    }));
    announce("");
    show("modelRun");
    const unanswered = attempt.choices.indexOf(null);
    renderQuestion(unanswered === -1 ? 0 : unanswered);
    ticker = setInterval(tick, 250);
    tick();
  }

  function result(record) {
    clearInterval(ticker);
    attempt = null;
    announce(expired ? "সময় শেষ। সংরক্ষিত উত্তর জমা হয়েছে।" : "ফল আপনার শিক্ষার্থী আইডিতে সংরক্ষিত হয়েছে।");
    get("modelScore").textContent = PB.bn(record.correct) + " / " + PB.bn(record.total);
    get("modelBreakdown").textContent = PB.bn(record.correct) + "টি সঠিক · " + PB.bn(record.wrong) + "টি ভুল · " + PB.bn(record.skipped) + "টি বাদ";
    renderStudentModelBreakdown(get("modelByChapter"), record.breakdown);
    get("modelReview").href = reviewLink(record);
    get("modelReviewItems").innerHTML = PB.quizReview(record.questions);
    show("modelResult");
    get("modelResultTitle").focus();
  }

  async function save(choice) {
    if (busy || expired) return;
    busy = true;
    updateControls();
    saveStatus.textContent = "উত্তর সংরক্ষণ হচ্ছে…";
    let saved = false;
    try {
      const data = await request("/answer", { id: attempt.id, index, choice });
      if (data.attempt) {
        expired = true;
        result(data.attempt);
      } else {
        attempt.choices = data.choices;
        saved = true;
        saveStatus.textContent = "উত্তর সংরক্ষিত।";
      }
    } catch (error) {
      saveStatus.textContent = error.message + " উত্তরটি আবার বেছে নিন।";
    } finally {
      busy = false;
      if (attempt) updateControls();
    }
    if (attempt && expired) finish();
    else if (saved) announce("");
  }

  async function finish() {
    if (busy || !attempt) return;
    busy = true;
    updateControls();
    announce("ফল প্রস্তুত হচ্ছে…");
    try {
      const { attempt: completed } = await request("/finish", { id: attempt.id });
      result(completed);
    } catch (error) {
      announce(error.message + " আবার ‘ফল দেখুন’ চাপুন।");
      get("modelConfirm").hidden = true;
      get("modelSubmit").hidden = false;
      get("modelSubmit").textContent = "ফল দেখুন";
      get("modelSubmit").dataset.retry = "true";
      status.scrollIntoView({ block: "nearest" });
    } finally {
      busy = false;
      if (attempt) updateControls();
    }
  }

  async function load() {
    get("modelLoadRetry").hidden = true;
    announce("মডেল টেস্ট লোড হচ্ছে…");
    try {
      const { model, active, latest } = await request();
      get("modelInfo").textContent = model.title + " · " + PB.bn(model.total) + "টি প্রশ্ন · " + PB.bn(model.minutes) + " মিনিট";
      if (active) return run(active);
      if (latest) {
        get("modelLatest").href = reviewLink(latest);
        get("modelLatest").hidden = false;
      }
      announce("");
      show("modelSetup");
    } catch (error) {
      announce(error.status === 401 ? "মডেল টেস্ট দিতে ‘আমার অগ্রগতি’ পেজে গিয়ে লগইন করুন।" : error.message);
      get("modelLoadRetry").hidden = error.status === 401;
    }
  }

  get("modelStart").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    announce("প্রশ্নগুলো প্রস্তুত হচ্ছে…");
    try {
      const { active } = await request("", {});
      run(active);
    } catch (error) {
      announce(error.message);
    } finally {
      button.disabled = false;
    }
  });
  pages.addEventListener("click", (event) => {
    const button = event.target.closest("[data-position]");
    if (button) renderQuestion(Number(button.dataset.position));
  });
  selection.addEventListener("click", (event) => {
    const button = event.target.closest("[data-choice]");
    if (button) save(Number(button.dataset.choice));
  });
  get("modelPrevious").addEventListener("click", () => renderQuestion(index - 1));
  get("modelNext").addEventListener("click", () => renderQuestion(index + 1));
  get("modelClear").addEventListener("click", () => save(null));
  get("modelSubmit").addEventListener("click", (event) => {
    if (expired || event.currentTarget.dataset.retry) return finish();
    event.currentTarget.hidden = true;
    get("modelConfirm").hidden = false;
    get("modelFinish").focus();
  });
  get("modelCancel").addEventListener("click", () => {
    get("modelConfirm").hidden = true;
    get("modelSubmit").hidden = false;
    get("modelSubmit").focus();
  });
  get("modelFinish").addEventListener("click", finish);
  get("modelLoadRetry").addEventListener("click", load);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && attempt) tick(); });
  window.addEventListener("pageshow", (event) => { if (event.persisted) location.reload(); });
  load();
})();

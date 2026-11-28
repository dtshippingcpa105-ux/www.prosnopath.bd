(() => {
  const root = document.querySelector(".premium-home");
  if (!root) return;
  const escape = PB.escape;
  const entries = PB.entries();
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const glyphs = {
    bangla: "অ", bangla1: "অ", bangla2: "অ", english: "Aa", english1: "Aa", english2: "Aa", math: "∑", highermath1: "∫",
    science: "⚗", physics: "λ", physics1: "λ", chemistry: "⚗", chemistry1: "⚗",
    biology: "❋", bgs: "◎", religion: "✧", ict: "</>", agriculture: "❧"
  };
  const subjects = PB.id("homeSubjects");
  const grade = PB.id("homeSubjectClass");
  const more = PB.id("homeSubjectsMore");
  let showAll = false;

  PB.select(grade, [["", "সব শ্রেণি"], ...CLASSES.map(({ id, name }) => [id, name])], "");
  grade.parentElement.hidden = false;

  function renderSubjects() {
    const sections = entries.filter((entry) => !grade.value || entry.classId === grade.value);
    const totals = new Map();
    for (const entry of sections) {
      const count = totals.get(entry.subjectId) ?? { chapters: 0, questions: 0 };
      count.chapters += 1;
      count.questions += entry.mcq.length + entry.short.length;
      totals.set(entry.subjectId, count);
    }
    const list = [...totals].sort((a, b) => b[1].questions - a[1].questions);
    subjects.innerHTML = list.slice(0, showAll ? list.length : 6).map(([id, count]) =>
      '<a class="tool-card" href="' + escape(PB.href("question-bank.html", { class: grade.value, subject: id })) + '">'
      + '<span class="tool-icon" aria-hidden="true">' + escape(glyphs[id] ?? "▤") + '</span>'
      + '<h3>' + escape(SUBJECTS[id].name) + '</h3><span class="subject-count">'
      + PB.bn(count.chapters) + 'টি অধ্যায় · ' + PB.bn(count.questions) + 'টি প্রশ্ন</span></a>').join("");
    more.hidden = showAll || list.length <= 6;
    more.textContent = 'আরও ' + PB.bn(list.length - 6) + 'টি বিষয় দেখুন';
  }

  grade.addEventListener("change", () => {
    showAll = false;
    renderSubjects();
  });
  more.addEventListener("click", () => {
    showAll = true;
    renderSubjects();
    subjects.children[6]?.focus();
  });
  renderSubjects();

  const stats = {
    mcq: entries.reduce((sum, entry) => sum + entry.mcq.length, 0),
    written: entries.reduce((sum, entry) => sum + entry.short.length, 0),
    resources: STUDY_CHAPTERS.length,
    subjects: new Set(entries.map((entry) => entry.subjectId)).size
  };
  // তাকের প্রতিটি বইয়ে সেই শ্রেণির বিষয় ও অধ্যায়ের সংখ্যা
  for (const meta of root.querySelectorAll("[data-class-meta]")) {
    const own = entries.filter((entry) => entry.classId === meta.dataset.classMeta);
    if (own.length) meta.textContent = PB.bn(new Set(own.map((entry) => entry.subjectId)).size) + "টি বিষয় · " + PB.bn(own.length) + "টি অধ্যায়";
  }
  const statsBox = root.querySelector(".premium-stats");
  const counters = Object.entries(stats).map(([name, total]) => {
    const counter = statsBox.querySelector('[data-stat="' + name + '"]');
    counter.textContent = PB.bn(total);
    return [counter, total];
  });
  statsBox.hidden = false;

  if (typeof IntersectionObserver === "function") {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      if (motion.matches) return;
      let start;
      function frame(now) {
        start ??= now;
        const progress = Math.min(1, (now - start) / 650);
        for (const [counter, total] of counters) {
          counter.textContent = PB.bn(Math.round(total * (1 - (1 - progress) ** 3)));
        }
        if (progress < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }, { threshold: .35 });
    observer.observe(statsBox);
  }

  const preview = root.querySelector("[data-learning-preview]");
  const scene = preview.querySelector("[data-scene]");
  const frames = Array.from(scene.querySelectorAll("[data-preview-art]"));
  const captions = preview.querySelectorAll("[data-preview-caption]");
  const controls = preview.querySelector("[data-preview-controls]");
  const count = controls.querySelector("[data-preview-count]");
  let active = 0;
  let pointerOrigin;

  function showScene(index) {
    const next = (index + frames.length) % frames.length;
    if (next === active) return;

    frames[active].classList.remove("is-current");
    captions[active].hidden = true;
    active = next;
    frames[active].classList.add("is-current");
    captions[active].hidden = false;
    count.textContent = PB.bn(active + 1) + " / " + PB.bn(frames.length);
  }

  function stepScene(direction) {
    pointerOrigin = undefined;
    showScene(active + direction);
  }

  controls.addEventListener("click", (event) => {
    const button = event.target.closest("[data-preview-step]");
    if (button) stepScene(Number(button.dataset.previewStep));
  });
  controls.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    stepScene(event.key === "ArrowLeft" ? -1 : 1);
  });
  controls.hidden = false;

  function tilt(event, element, prefix, range) {
    const bounds = element.getBoundingClientRect();
    element.style.setProperty("--" + prefix + "-y", ((event.clientX - bounds.left) / bounds.width - .5) * range + "deg");
    element.style.setProperty("--" + prefix + "-x", ((event.clientY - bounds.top) / bounds.height - .5) * -range + "deg");
  }
  function reset(element, prefix) {
    element.style.removeProperty("--" + prefix + "-x");
    element.style.removeProperty("--" + prefix + "-y");
  }
  scene.addEventListener("pointermove", (event) => {
    if (!finePointer.matches || motion.matches || event.pointerType !== "mouse") return;
    tilt(event, scene, "scene", 12);
    pointerOrigin ??= event.clientX;
    const distance = event.clientX - pointerOrigin;
    if (Math.abs(distance) < Math.max(44, scene.clientWidth * .16)) return;
    pointerOrigin = event.clientX;
    const next = active + Math.sign(distance);
    if (next >= 0 && next < frames.length && !captions[active].contains(document.activeElement)) showScene(next);
  });
  scene.addEventListener("pointerleave", () => {
    pointerOrigin = undefined;
    reset(scene, "scene");
  });
})();

const PB = {
  id(id) {
    return document.getElementById(id);
  },

  bn(number) {
    return String(number).replace(/\d/g, (digit) => "০১২৩৪৫৬৭৮৯"[digit]);
  },

  escape(value) {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return String(value).replace(/[&<>"']/g, (character) => entities[character]);
  },

  normalize(value) {
    return String(value).normalize("NFC").toLowerCase()
      .replace(/[০-৯]/g, (digit) => "০১২৩৪৫৬৭৮৯".indexOf(digit))
      .replace(/[\u200b-\u200d\ufeff]/g, "")
      .replace(/[^\p{L}\p{M}\p{N}]+/gu, " ").trim();
  },

  matches(value, term) {
    const text = this.normalize(value);
    return this.normalize(term).split(" ").every((word) => text.includes(word));
  },

  href(page, filters = {}) {
    const route = window.PP_ROUTES?.[page] || page;
    const params = new URLSearchParams();
    const prefix = window.PP_ROUTES ? "pp_" : "";
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(prefix + key, value);
    }
    if (!params.size) return route;
    return route + (route.includes("?") ? "&" : "?") + params;
  },

  params() {
    const params = new URLSearchParams(location.search);
    if (window.PP_ROUTES) {
      for (const [key, value] of [...params]) {
        if (key.startsWith("pp_")) params.set(key.slice(3), value);
      }
    }
    return params;
  },

  feedbackHref(page, { type = "content", question = "" } = {}) {
    const url = new URL(page, location.href);
    return this.href("contact.html", { page: url.href, type, question: question.slice(0, 250) }) + "#feedbackForm";
  },

  classById(id) {
    return CLASSES.find((entry) => entry.id === id);
  },

  questionSources: {
    bank: "প্রশ্নপাঠ প্রশ্নব্যাংক",
    nctb: "এনসিটিবি",
    board: "বিগত বোর্ড পরীক্ষা"
  },

  questionSource(item) {
    const source = item.source;
    return source?.verified === true && ["nctb", "board"].includes(source.type) ? source.type : "bank";
  },

  figure(figure) {
    if (!figure) return "";
    const image = /^[a-z0-9-]+\.png$/.test(figure.image ?? "")
      ? '<img src="' + this.escape((window.PP_MEDIA?.assets || "assets/") + figure.image)
        + '" alt="" width="720" height="320" decoding="async">'
      : "";
    return '<figure class="study-figure"><figcaption>' + this.escape(figure.title)
      + '</figcaption>' + image + '<ul>' + figure.labels.map((label) => '<li>' + this.escape(label) + '</li>').join("")
      + '</ul></figure>';
  },

  rubric(criteria = []) {
    return criteria.map((step) => {
      const { text, marks } = typeof step === "string" ? { text: step, marks: 1 } : step;
      return '<li>' + this.escape(text) + ' · ' + this.bn(marks) + ' নম্বর</li>';
    }).join("");
  },

  entries() {
    const entries = new Map();
    for (const [key, subject] of Object.entries(QUESTION_BANK)) {
      const [classId, subjectId] = key.split("|");
      for (const [chapter, questions] of Object.entries(subject.chapters)) {
        entries.set([classId, subjectId, chapter].join("|"), { classId, subjectId, chapter, ...questions });
      }
    }
    const notes = typeof STUDY_CHAPTERS === "undefined" ? [] : STUDY_CHAPTERS;
    for (const note of notes) {
      const { classId, subjectId, chapter, id, mcq, short, figure } = note;
      const key = [classId, subjectId, chapter].join("|");
      const existing = entries.get(key);
      entries.set(key, { classId, subjectId, chapter, noteId: id,
        mcq: [...(existing?.mcq ?? []), ...mcq.map((item) => item.useFigure ? { ...item, figure } : item)],
        short: [...(existing?.short ?? []), ...short] });
    }
    return [...entries.values()];
  },

  select(select, options, selected) {
    select.replaceChildren(...options.map(([value, label]) => new Option(label, value)));
    if (options.some(([value]) => value === selected)) select.value = selected;
  },

  bookLevels: {
    "pre-primary": "প্রাক-প্রাথমিক", primary: "প্রাথমিক", secondary: "মাধ্যমিক",
    dakhil: "মাদ্রাসা", vocational: "কারিগরি"
  },

  bookClass(value) {
    const names = {
      "pre-primary": "প্রাক-প্রাথমিক", "1": "১ম শ্রেণি", "4": "৪র্থ শ্রেণি",
      "5": "৫ম শ্রেণি", "6": "৬ষ্ঠ শ্রেণি", "7": "৭ম শ্রেণি",
      "8": "৮ম শ্রেণি", "9": "৯ম–১০ম শ্রেণি", general: "সাধারণ"
    };
    return Object.hasOwn(names, value) ? names[value] : this.bn(value);
  },

  archive() {
    const seen = new Set();
    return (window.TEXTBOOK_LINKS ?? []).filter((item) => {
      if (item.year !== 2024 && item.year !== 2025) return false;
      if (!/^https:\/\//i.test(item.url) || !/^https:\/\//i.test(item.source)) return false;
      const key = [item.year, item.level, item.class, item.url].join("|");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  showAnswer(buttons, answer, selected) {
    buttons.forEach((button) => {
      const index = Number(button.dataset.option);
      button.setAttribute("aria-disabled", "true");
      if (index === selected) button.setAttribute("aria-pressed", "true");
      if (index === answer || index === selected) {
        const correct = index === answer;
        button.classList.add(correct ? "correct" : "wrong");
        const status = document.createElement("span");
        status.className = "option-status";
        status.textContent = correct ? "সঠিক" : "ভুল";
        button.append(status);
      }
    });
  }
};

(function initNavigation() {
  const toggle = PB.id("navToggle");
  const nav = PB.id("mainNav");
  if (!toggle || !nav) return;
  const mobile = matchMedia("(max-width: 980px)");
  const more = nav.querySelector(".nav-more");

  function setOpen(open) {
    nav.hidden = mobile.matches && !open;
    toggle.hidden = !mobile.matches;
    toggle.setAttribute("aria-expanded", String(mobile.matches && open));
  }

  toggle.addEventListener("click", () => setOpen(nav.hidden));
  nav.addEventListener("click", (event) => {
    if (!event.target.closest("a")) return;
    if (more) more.open = false;
    if (mobile.matches) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (more?.open && more.contains(document.activeElement)) {
      more.open = false;
      more.querySelector("summary").focus();
    } else if (mobile.matches && !nav.hidden) {
      setOpen(false);
      toggle.focus();
    }
  });
  mobile.addEventListener("change", () => setOpen(false));
  setOpen(false);
})();

(() => {
  const byId = PB.id;
  const esc = PB.escape;
  const controls = ["paperSchool", "paperTitle", "paperTime", "paperClass", "paperSubject", "paperChapter"];
  const gradeSelect = byId("paperClass");
  const subjectSelect = byId("paperSubject");
  const chapterSelect = byId("paperChapter");
  const bankList = byId("paperBankList");
  const order = byId("paperOrder");
  const print = byId("paperPrint");
  const preview = byId("paperPreview");
  const status = byId("paperStatus");
  const storageKey = "proshnopath-paper-v1";
  const maxQuestions = 100;
  const pageSize = 12;
  const all = PB.entries();
  const bank = all.flatMap((topic) => ["mcq", "short"].flatMap((type) =>
    topic[type].map((item, index) => ({
      ...item, id: [topic.classId, topic.subjectId, topic.chapter, type, index].join("|"),
      classId: topic.classId, subjectId: topic.subjectId, chapter: topic.chapter, type,
      marks: type === "mcq" ? 1 : item.marks
    }))));
  const byKey = new Map(bank.map((item) => [item.id, item]));
  let selected = [];
  let shown = pageSize;
  let keyMode = false;
  const params = PB.params();
  const examSpecs = {
    science: { chapters: 14, sets: 5, counts: [10, 5, 3], minutes: 90, pick: scienceQuestions },
    math: { chapters: 11, sets: 5, counts: [30, 10, 5], minutes: 180, pick: mathQuestions },
    bgs: { chapters: 13, sets: 5, counts: [10, 5, 3], minutes: 90, subjectCode: 150, pick: bgsQuestions }
  };
  const sections = [
    { label: "বহুনির্বাচনি প্রশ্ন", marks: 1, accepts: (item) => item.type === "mcq" },
    { label: "সংক্ষিপ্ত-উত্তর প্রশ্ন", marks: 2, accepts: (item) => item.type === "short" && item.kind !== "creative" },
    { label: "সৃজনশীল প্রশ্ন", marks: 10, accepts: (item) => item.kind === "creative" }
  ];

  function rotate(items, offset) {
    return items.slice(offset).concat(items.slice(0, offset));
  }

  function questionPool(note, section) {
    return bank.filter((item) => item.classId === note.classId && item.subjectId === note.subjectId
      && item.chapter === note.chapter && item.marks === section.marks && section.accepts(item));
  }

  // বিজ্ঞান: ৫টি সেটে কোনো প্রশ্ন পুনরাবৃত্তি হবে না, আর প্রতিটি সেটে ১৪টি অধ্যায়ই থাকবে
  let sciencePlan;
  function scienceQuestions(chapters, index) {
    if (!sciencePlan) {
      const used = new Map();
      const take = (note, section) => {
        const key = note.chapter + "|" + section.label;
        const n = used.get(key) ?? 0;
        used.set(key, n + 1);
        return questionPool(note, section)[n];
      };
      const creative = chapters.flatMap((note) => questionPool(note, sections[2]).map((item) => ({ note, item })));
      sciencePlan = Array.from({ length: examSpecs.science.sets }, (_, set) => {
        const picks = [set, set + 5, set + 10].map((i) => creative[i]).filter(Boolean);
        const creativeChapters = new Set(picks.map(({ note }) => note.chapter));
        const rest = rotate(chapters.filter((note) => !creativeChapters.has(note.chapter)), set * 3);
        const mcqNotes = rest.slice(0, 10);
        const shortNotes = rest.slice(10).concat(rotate(mcqNotes, set).slice(0, 5 - rest.slice(10).length));
        return [mcqNotes.map((note) => take(note, sections[0])), shortNotes.map((note) => take(note, sections[1])), picks.map(({ item }) => item)];
      });
    }
    return sciencePlan[index];
  }

  // সব সেট মিলিয়ে কোনো প্রশ্ন দুবার আসবে না; যে অধ্যায়ে প্রশ্ন বেশি বাকি, সেখান থেকে আগে নেওয়া হয়
  const plans = new Map();
  function balancedPlan(subject, chapters) {
    if (plans.has(subject)) return plans.get(subject);
    const spec = examSpecs[subject];
    const pools = sections.map((section) => chapters.map((note) => questionPool(note, section)));
    const used = sections.map(() => chapters.map(() => 0));
    const plan = Array.from({ length: spec.sets }, (_, set) => sections.map((section, s) => {
      const picked = [];
      while (picked.length < spec.counts[s]) {
        const order = chapters.map((_, i) => i)
          .filter((i) => used[s][i] < pools[s][i].length)
          .sort((x, y) => (pools[s][y].length - used[s][y]) - (pools[s][x].length - used[s][x])
            || ((x - set * 3 + 99) % chapters.length) - ((y - set * 3 + 99) % chapters.length));
        if (!order.length) break;
        const counted = new Map(picked.map((item) => [item.chapter, 0]));
        picked.forEach((item) => counted.set(item.chapter, counted.get(item.chapter) + 1));
        const least = Math.min(...order.map((i) => counted.get(chapters[i].chapter) ?? 0));
        const i = order.find((j) => (counted.get(chapters[j].chapter) ?? 0) === least);
        picked.push(pools[s][i][used[s][i]++]);
      }
      const rank = new Map(chapters.map((note, i) => [note.chapter, i]));
      return picked.sort((x, y) => rank.get(x.chapter) - rank.get(y.chapter));
    }));
    plans.set(subject, plan);
    return plan;
  }

  function mathQuestions(chapters, index) {
    return balancedPlan("math", chapters)[index];
  }

  // বাংলাদেশ ও বিশ্বপরিচয়: প্রতি সেটে ১৩টি অধ্যায়ই আসবে, সেটগুলোর মধ্যে প্রশ্ন পুনরাবৃত্তি হবে না
  let bgsPlan;
  function bgsQuestions(chapters, index) {
    if (!bgsPlan) {
      const pools = sections.map((section) => chapters.map((topic) => questionPool(topic, section)));
      const used = sections.map(() => chapters.map(() => 0));
      const left = (s, i) => pools[s][i].length - used[s][i];
      const answerPositions = [1, 3, 0, 2, 1, 0, 3, 2, 0, 1, 2, 3, 0];
      const make = (s, i, n, set) => {
        const item = pools[s][i][used[s][i]++];
        if (!item) return;
        const question = { ...item, reference: item.chapter + " · ২০২৬ পাঠ্যবই, পৃ. " + chapters[i].reference.pages };
        if (item.type === "mcq") {
          const options = [...item.options];
          const [correct] = options.splice(item.answer, 1);
          question.answer = answerPositions[(n + set * 3) % answerPositions.length];
          options.splice(question.answer, 0, correct);
          question.options = options;
        }
        return question;
      };
      const byLeft = (s, set) => chapters.map((_, i) => i).sort((x, y) => left(s, y) - left(s, x)
        || ((x - set * 3 + 39) % 13) - ((y - set * 3 + 39) % 13));
      bgsPlan = Array.from({ length: examSpecs.bgs.sets }, (_, set) => {
        const creative = byLeft(2, set).slice(0, 3).sort((x, y) => x - y);
        const mcq = chapters.map((_, i) => i).filter((i) => !creative.includes(i));
        const short = byLeft(1, set).slice(0, 5).sort((x, y) => x - y);
        return [mcq.map((i, n) => make(0, i, n, set)), short.map((i, n) => make(1, i, n, set)),
          creative.map((i, n) => make(2, i, n, set))];
      });
    }
    return bgsPlan[index];
  }

  function scholarshipSet(subject, chapters, index) {
    const spec = examSpecs[subject];
    const schedule = spec.pick(chapters, index);
    const groups = sections.map((section, i) => ({
      ...section, count: spec.counts[i], items: schedule[i]
    }));
    if (groups.some((group) => group.items.length !== group.count || group.items.some((item) => !item))) return null;
    const coverage = new Set(groups.flatMap((group) => group.items.map((item) => item.chapter)));
    if (coverage.size !== spec.chapters) return null;
    const totalMarks = groups.reduce((sum, group) => sum + group.marks * group.count, 0);
    return { subject, number: index + 1, groups, totalMarks, minutes: spec.minutes, subjectCode: spec.subjectCode };
  }

  const availableSets = Object.entries(examSpecs).flatMap(([subject, spec]) => {
    const chapters = subject === "bgs"
      ? all.filter((topic) => topic.classId === "c8" && topic.subjectId === subject
        && topic.reference?.url === CLASS_EIGHT_BGS_TEXTBOOK)
      : STUDY_CHAPTERS.filter((note) => note.classId === "c8" && note.subjectId === subject
        && Number.isInteger(note.number)).sort((a, b) => a.number - b.number);
    if (chapters.length !== spec.chapters) return [];
    return Array.from({ length: spec.sets }, (_, i) => scholarshipSet(subject, chapters, i)).filter(Boolean);
  });
  availableSets.unshift(CLASS_EIGHT_BANGLA_MODEL, ...CLASS_EIGHT_BANGLA_MODELS,
    CLASS_EIGHT_ENGLISH_MODEL, ...CLASS_EIGHT_ENGLISH_MODELS);
  const exam = params.get("exam");
  const model = availableSets.find(({ subject, number }) => exam === subject + "-britti-" + number);
  const packSets = ["bangla", "english", "math", "science", "bgs"]
    .map((subject) => availableSets.find((set) => set.subject === subject && set.number === 1));
  const packReady = packSets.every(Boolean) && packSets.reduce((sum, set) => sum + set.totalMarks, 0) === 400;
  const packMode = exam === "pack-britti-1" && packReady;

  function clean(value, max) {
    return typeof value === "string" ? value.trim().slice(0, max) : "";
  }

  function readDraft() {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) ?? {};
    } catch {
      return {};
    }
  }

  function restore(item) {
    if (typeof item === "string") return byKey.get(item);
    if (!item || typeof item !== "object" || !/^custom-[\da-z-]{1,45}$/.test(item.id)
      || !PB.classById(item.classId) || !SUBJECTS_BY_CLASS[item.classId]?.includes(item.subjectId)
      || !Number.isInteger(item.marks) || item.marks < 1 || item.marks > 100) return undefined;
    const q = clean(item.q, 500);
    if (!q) return undefined;
    return {
      id: item.id, type: "short", q, solution: clean(item.solution, 1000), marks: item.marks,
      classId: item.classId, subjectId: item.subjectId, chapter: clean(item.chapter, 100)
    };
  }

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        fields: Object.fromEntries(controls.map((id) => [id, byId(id).value])),
        selected: selected.map((item) => byKey.has(item.id) ? item.id : item)
      }));
      return true;
    } catch {
      return false;
    }
  }

  function fillChapters(initial) {
    const chapters = all.filter((topic) => topic.classId === gradeSelect.value && topic.subjectId === subjectSelect.value);
    PB.select(chapterSelect, [["", "সব অধ্যায়"], ...chapters.map((topic) => [topic.chapter, topic.chapter])], initial);
  }

  function fillSubjects(subject, chapter) {
    const ids = [...new Set(all.filter((topic) => topic.classId === gradeSelect.value).map((topic) => topic.subjectId))];
    PB.select(subjectSelect, ids.map((id) => [id, SUBJECTS[id].name]), subject);
    fillChapters(chapter);
  }

  function source() {
    return bank.filter((item) => item.classId === gradeSelect.value && item.subjectId === subjectSelect.value
      && (!chapterSelect.value || item.chapter === chapterSelect.value));
  }

  function renderBank() {
    const type = byId("paperType").value;
    const query = byId("paperQuery").value;
    const available = source().filter((item) => (!type || item.type === type)
      && PB.matches([item.q, item.chapter].join(" "), query));
    const displayed = available.slice(0, shown);
    const picked = new Set(selected.map(({ id }) => id));
    byId("paperBankCount").textContent = available.length
      ? PB.bn(available.length) + "টি প্রশ্নের মধ্যে " + PB.bn(displayed.length) + "টি দেখানো হচ্ছে।"
      : "এই ফিল্টারে কোনো প্রশ্ন পাওয়া যায়নি।";
    bankList.innerHTML = displayed.map((item) => {
      const added = picked.has(item.id);
      return '<div class="paper-item"><div><p>' + esc(item.q) + '</p><small>' + esc(item.chapter) + " · "
        + (item.type === "mcq" ? "MCQ" : "লিখিত") + " · " + PB.bn(item.marks) + ' নম্বর</small></div>'
        + '<button class="btn btn-secondary" type="button" data-pick="' + esc(item.id) + '" aria-disabled="'
        + added + '" aria-label="' + (added ? "যোগ হয়েছে " : "যোগ করুন ") + esc(item.q) + '">' + (added ? "যোগ হয়েছে" : "যোগ করুন") + "</button></div>";
    }).join("");
    byId("paperMore").hidden = displayed.length === available.length;
  }

  function mix(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const other = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[other]] = [copy[other], copy[i]];
    }
    return copy;
  }

  function renderOrder() {
    const marks = selected.reduce((sum, item) => sum + item.marks, 0);
    byId("paperClear").disabled = !selected.length;
    byId("paperSummary").textContent = selected.length
      ? PB.bn(selected.length) + "টি প্রশ্ন · পূর্ণমান " + PB.bn(marks)
      : "প্রশ্নভান্ডার থেকে প্রশ্ন যোগ করুন।";
    order.innerHTML = selected.map((item, i) =>
      '<li><div><p>' + esc(item.q) + '</p><small>' + esc(SUBJECTS[item.subjectId].name) + " · " + PB.bn(item.marks)
      + ' নম্বর</small></div><div class="paper-order-actions">'
      + '<button type="button" class="btn btn-secondary" data-order="up" data-index="' + i + '" aria-label="' + PB.bn(i + 1)
      + ' নম্বর প্রশ্ন উপরে নিন" ' + (!i ? "disabled" : "") + '>উপরে</button>'
      + '<button type="button" class="btn btn-secondary" data-order="down" data-index="' + i + '" aria-label="' + PB.bn(i + 1)
      + ' নম্বর প্রশ্ন নিচে নিন" ' + (i === selected.length - 1 ? "disabled" : "") + '>নিচে</button>'
      + '<button type="button" class="text-button" data-order="remove" data-index="' + i
      + '" aria-label="' + PB.bn(i + 1) + ' নম্বর প্রশ্ন বাদ দিন">বাদ দিন</button></div></li>').join("");
    return marks;
  }

  function renderPreview(marks) {
    byId("paperStudent").setAttribute("aria-pressed", String(!keyMode));
    byId("paperKey").setAttribute("aria-pressed", String(keyMode));
    print.disabled = !packMode && !selected.length;
    if (packMode) {
      preview.innerHTML = packMarkup(marks);
      return;
    }
    if (!selected.length) {
      preview.innerHTML = '<p class="paper-empty">প্রশ্ন যোগ করলে এখানে প্রিভিউ দেখা যাবে।</p>';
      return;
    }
    if (model?.subject === "english") preview.lang = "en";
    if (model) preview.dataset.subject = model.subject;
    preview.innerHTML = paperMarkup(selected, model, marks);
  }

  function packMarkup(marks) {
    const rows = packSets.map((set, index) => '<tr><td>' + PB.bn(Math.min(index + 1, 4))
      + '</td><th scope="row"><a href="#pack-' + set.subject + '">' + esc(SUBJECTS[set.subject].name)
      + '</a></th><td>' + PB.bn(set.totalMarks) + '</td><td>' + PB.bn(set.minutes) + ' মিনিট</td></tr>').join("");
    const intro = keyMode
      ? "বিষয়শিক্ষক প্রশ্নের ভাষা, কঠিনতার ভারসাম্য ও উত্তরমালা মিলিয়ে দেখুন। পরীক্ষামূলক অনুশীলনে কোন প্রশ্নে বেশি সময় লাগছে, কোন নির্দেশ অস্পষ্ট এবং নির্ধারিত সময়ে শেষ হয়েছে কি না, তা প্রশ্ন নম্বরসহ লিখে রাখুন।"
      : "চারটি সেশনে সময় ধরে অনুশীলন করো। চতুর্থ সেশনে বিজ্ঞান ও বাংলাদেশ ও বিশ্বপরিচয়ের জন্য আলাদাভাবে ৯০ মিনিট রাখো। উত্তর লেখার জন্য আলাদা খাতা ব্যবহার করো।";
    const review = keyMode ? '<h4>পর্যালোচনার নোট</h4><table class="printed-task-table printed-review-table">'
      + '<thead><tr><th scope="col">বিষয় ও প্রশ্ন নম্বর</th><th scope="col">পর্যবেক্ষণ বা সংশোধন</th>'
      + '<th scope="col">অনুশীলনে সময়</th></tr></thead>'
      + '<tbody><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr></tbody></table>' : "";
    const cover = '<section class="printed-pack-cover"><header class="printed-header"><h3>'
      + 'অষ্টম শ্রেণির বৃত্তি অনুশীলন প্যাক ১' + (keyMode ? ' · উত্তরমালা' : ' · প্রশ্নপত্র')
      + '</h3><p>প্রশ্নপাঠ · ৫ বিষয় · মোট ' + PB.bn(marks) + ' নম্বর</p></header>'
      + '<p class="model-paper-instructions">' + esc(intro) + '</p>'
      + '<table class="printed-task-table"><thead><tr><th scope="col">সেশন</th><th scope="col">বিষয়</th>'
      + '<th scope="col">পূর্ণমান</th><th scope="col">সময়</th></tr></thead><tbody>' + rows
      + '</tbody></table>' + review + '</section>';
    return cover + packSets.map((set) => '<article class="printed-pack-subject" id="pack-' + set.subject + '"'
      + (set.subject === "english" ? ' lang="en"' : '') + '>'
      + paperMarkup(set.groups.flatMap((group) => group.items), set, set.totalMarks) + '</article>').join("");
  }

  function paperMarkup(selected, model, marks) {
    const english = model?.subject === "english";
    const numeral = english ? String : PB.bn;
    const classes = [...new Set(selected.map(({ classId }) => PB.classById(classId).name))].join(", ");
    const subjects = [...new Set(selected.map(({ subjectId }) => SUBJECTS[subjectId].name))].join(", ");
    const title = model ? "জুনিয়র বৃত্তি · " + SUBJECTS[model.subject].name + " · মডেল সেট " + PB.bn(model.number)
      : clean(byId("paperTitle").value, 100) || "অধ্যায়ভিত্তিক অনুশীলন";
    const school = model ? "" : clean(byId("paperSchool").value, 100);
    const minutes = model ? model.minutes : byId("paperTime").valueAsNumber;
    const header = english ? '<header class="printed-header">'
      + '<h3>Junior Scholarship Practice · English Model Paper ' + model.number
      + (keyMode ? ' · Answer Key' : '') + '</h3>'
      + '<p>Class 8 · Subject Code ' + model.subjectCode + '</p><p>Full Marks ' + marks + ' · Time '
      + model.minutes / 60 + ' hours</p>'
      + (keyMode ? '' : '<p class="printed-name">Name ________________________</p>') + '</header>'
      : '<header class="printed-header">'
      + (school ? '<p>' + esc(school) + '</p>' : '')
      + '<h3>' + esc(title) + (keyMode ? " · উত্তরমালা" : "") + '</h3>'
      + '<p>' + esc(classes) + ' · ' + esc(subjects)
      + (model?.subjectCode ? ' · বিষয় কোড ' + PB.bn(model.subjectCode) : '') + '</p><p>পূর্ণমান ' + PB.bn(marks)
      + (Number.isInteger(minutes) && minutes >= 1 && minutes <= 300 ? " · সময় " + PB.bn(minutes) + " মিনিট" : "")
      + '</p>' + (!keyMode ? '<p class="printed-name">নাম ________________________</p>' : '') + '</header>';
    function questionText(item) {
      const total = numeral(item.marks);
      if (item.points !== undefined) {
        return esc(item.q) + '&nbsp;<span>[' + item.required + ' × ' + item.points + ' = ' + total + ']</span>';
      }
      if (item.kind === "essay") {
        const [prompt, ...topics] = item.q.split("\n");
        return esc(prompt) + '&nbsp;<span>[' + total + ']</span>\n' + esc(topics.join("\n"));
      }
      if (model && (item.kind === "creative" || item.kind === "descriptive")) {
        const [stimulus, ...parts] = item.q.split("\n");
        const marksByPart = item.criteria?.map((step) => step.marks) ?? [];
        if (marksByPart.length === parts.length && marksByPart.every(Number.isInteger)
            && marksByPart.reduce((sum, mark) => sum + mark, 0) === item.marks) {
          const intro = ["bangla", "bgs"].includes(model.subject)
            ? '<span class="printed-stimulus">' + esc(stimulus) + '</span>' : esc(stimulus);
          return intro + '&nbsp;<span>[মোট ' + total + ']</span>\n'
            + parts.map((part, i) => esc(part) + '&nbsp;<span>[' + PB.bn(marksByPart[i]) + ']</span>').join("\n");
        }
      }
      return esc(item.q) + '&nbsp;<span>[' + total + ']</span>';
    }
    function writtenAnswer(item) {
      if (item.kind === "essay") {
        return item.solution.split("\n\n").map((paragraph) => {
          const headingClass = /^[কখ]\. /.test(paragraph) ? ' class="printed-essay-title"' : "";
          return '<p' + headingClass + '>' + esc(paragraph) + '</p>';
        }).join("");
      }
      return '<p>' + esc(item.solution || "নমুনা উত্তর যোগ করা হয়নি।") + '</p>';
    }
    function questionDetails(item) {
      const parts = item.parts?.length
        ? '<ol class="printed-subquestions">' + item.parts.map((part) => {
          if (typeof part === "string") return '<li>' + esc(part) + '</li>';
          const options = part.options.map((option, index) => '<li>' + "ABCD"[index] + '. ' + esc(option) + '</li>');
          return '<li>' + esc(part.q) + '<ul class="printed-options">' + options.join("") + '</ul></li>';
        }).join("") + '</ol>' : "";
      const table = item.table
        ? '<table class="printed-task-table"><thead><tr>'
          + item.table.headings.map((heading) => '<th scope="col">' + esc(heading) + '</th>').join("")
          + '</tr></thead><tbody>' + item.table.rows.map((row) => '<tr>'
            + row.map((cell) => '<td>' + esc(cell) + '</td>').join("") + '</tr>').join("") + '</tbody></table>' : "";
      const prompt = item.prompt ? '<p class="printed-task-prompt question-lines">' + esc(item.prompt) + '</p>' : "";
      const wordBank = item.wordBank ? '<p class="printed-word-bank">' + item.wordBank.map(esc).join(" · ") + '</p>' : "";
      return wordBank + prompt + parts + table;
    }
    function questionList(items, start = 1) {
      return '<ol class="printed-items" start="' + start + '">' + items.map((item) => {
        let body;
        if (keyMode) {
          body = item.type === "mcq"
            ? '<p><strong>সঠিক উত্তর</strong> ' + "কখগঘ"[item.answer] + '. '
              + esc(item.options[item.answer]) + '</p><p>' + esc(item.explain) + '</p>'
            : writtenAnswer(item)
              + (item.criteria?.length ? '<p class="printed-rubric-heading"><strong>'
                + (english ? 'Marking guide' : 'নম্বর বণ্টন') + '</strong></p><ul class="printed-rubric">'
                + (english ? item.criteria.map(({ text, marks }) => '<li>' + esc(text) + ' · ' + marks
                  + (marks === 1 ? ' mark' : ' marks') + '</li>').join("") : PB.rubric(item.criteria)) + '</ul>' : '');
        } else {
          body = item.type === "mcq"
            ? PB.figure(item.figure) + '<ol class="printed-options">' + item.options.map((option, oi) => '<li>'
              + "কখগঘ"[oi] + '. ' + esc(option) + '</li>').join("") + '</ol>' : questionDetails(item);
        }
        const longAnswer = english || (keyMode && ["bangla", "bgs"].includes(model?.subject) && item.type !== "mcq");
        return '<li' + (longAnswer ? ' class="printed-long-answer"' : '') + '><p class="printed-question question-lines">' + questionText(item)
          + '</p>' + (keyMode && model && (!english || item.reference)
            ? '<p class="muted">' + esc(item.reference || "অধ্যায় · " + item.chapter) + '</p>' : '')
          + body + '</li>';
      }).join("") + '</ol>';
    }
    function groupQuestions(group) {
      const blocks = [{ start: group.start ?? 1, items: [] }];
      group.items.forEach((item, index) => {
        if (item.passage && !keyMode) {
          const block = { start: (group.start ?? 1) + index, items: [], passage: item.passage };
          if (index === 0) blocks[0] = block;
          else blocks.push(block);
        }
        blocks.at(-1).items.push(item);
      });
      return blocks.map(({ passage, items, start }) => {
        const attribution = passage?.attribution ? '<p class="muted">' + esc(passage.attribution) + '</p>' : "";
        const intro = passage ? '<div class="printed-passage"><h5>' + esc(passage.title) + '</h5>' + attribution
          + passage.text.split("\n\n").map((paragraph) => '<p>' + esc(paragraph) + '</p>').join("") + '</div>' : "";
        return intro + questionList(items, start);
      }).join("");
    }
    if (!model) return header + questionList(selected);
    const instructions = keyMode
      ? model.keyInstructions || "প্রতিটি প্রশ্নের নমুনা উত্তর দিয়ে উত্তর মিলিয়ে নাও।"
      : model.instructions || "সব প্রশ্নের উত্তর দাও। বহুনির্বাচনি প্রশ্নে একটি উত্তর বেছে নাও।";
    return header + '<p class="model-paper-instructions">' + esc(instructions) + '</p>'
      + model.groups.map((group) => {
        const headingMarks = Number.isInteger(group.marks)
          ? PB.bn(group.count) + ' × ' + PB.bn(group.marks) + ' = ' + PB.bn(group.count * group.marks)
          : numeral(group.items.reduce((total, item) => total + item.marks, 0)) + (english ? ' marks' : ' নম্বর');
        return '<section class="model-paper-group"><h4>' + esc(group.label) + ' · ' + headingMarks
          + '</h4>' + groupQuestions(group) + '</section>';
      }).join("");
  }

  function render(message, focus) {
    renderBank();
    renderPreview(renderOrder());
    if (!save()) message = (message ? message + " " : "") + "এই ব্রাউজারে খসড়া সংরক্ষণ করা যাচ্ছে না।";
    status.textContent = message || "";
    focus?.();
  }

  if (availableSets.length) {
    const scholarship = byId("paperScholarship");
    const links = byId("paperScholarshipLinks");
    scholarship.hidden = false;
    const shownSets = model || packMode
      ? availableSets.filter((set) => set.subject === model?.subject || set.number === 1)
      : availableSets;
    links.innerHTML = shownSets.map(({ subject, number }) => '<a class="btn btn-secondary" href="'
      + esc(PB.href("paper-builder.html", { exam: subject + "-britti-" + number })) + '"'
      + (model?.subject === subject && model.number === number ? ' aria-current="page"' : "") + '>'
      + (model?.subject === subject ? "" : esc(SUBJECTS[subject].name) + " · ") + 'মডেল সেট ' + PB.bn(number) + '</a>').join("")
      + (packReady && !packMode ? '<a class="btn btn-secondary" href="'
        + esc(PB.href("paper-builder.html", { exam: "pack-britti-1" })) + '">৪০০ নম্বরের অনুশীলন প্যাক</a>' : "")
      + (model || packMode ? '<a class="btn btn-secondary" href="'
        + esc(PB.href("paper-builder.html")) + '">নিজের প্রশ্নপত্র তৈরি</a>' : "");
  }
  if (model || packMode) {
    const title = packMode ? "অষ্টম শ্রেণির ৪০০ নম্বরের বৃত্তি অনুশীলন প্যাক"
      : "অষ্টম শ্রেণির " + SUBJECTS[model.subject].name + " · বৃত্তি মডেল প্রশ্নপত্র";
    const summary = packMode ? "পাঁচ বিষয়ের প্রথম মডেল সেট। পুরো প্রশ্নপত্র ও উত্তরমালা আলাদাভাবে প্রিন্ট করা যায়।"
      : (model.summary || "৮ম শ্রেণির " + PB.bn(examSpecs[model.subject].chapters) + " অধ্যায় থেকে প্রতি সেটে ")
        + PB.bn(model.totalMarks) + " নম্বর। সময় " + PB.bn(model.minutes)
        + " মিনিট। প্রশ্নপত্র ও উত্তরমালা আলাদাভাবে প্রিন্ট করা যায়।";
    const marks = packMode ? packSets.reduce((sum, set) => sum + set.totalMarks, 0) : model.totalMarks;
    document.title = title + " | " + SITE.name;
    byId("paperOverview").hidden = true;
    byId("paperScholarshipTitle").outerHTML = '<h1 id="paperScholarshipTitle">' + esc(title) + '</h1>';
    byId("paperScholarshipSummary").textContent = summary;
    byId("paperReview").hidden = false;
    const reviewLink = byId("paperFeedback");
    function updateReviewLink() {
      reviewLink.href = PB.feedbackHref(PB.href("paper-builder.html", { exam, view: keyMode ? "key" : "" }));
    }
    if (model) selected = model.groups.flatMap((group) => group.items);
    keyMode = params.get("view") === "key";
    byId("paperOutput").hidden = false;
    for (const [id, answerMode] of [["paperStudent", false], ["paperKey", true]]) {
      byId(id).addEventListener("click", () => {
        keyMode = answerMode;
        const url = new URL(location.href);
        const view = window.PP_ROUTES ? "pp_view" : "view";
        if (keyMode) url.searchParams.set(view, "key");
        else url.searchParams.delete(view);
        history.replaceState(null, "", url);
        updateReviewLink();
        renderPreview(marks);
      });
    }
    print.addEventListener("click", () => window.print());
    updateReviewLink();
    renderPreview(marks);
    return;
  }
  const draft = readDraft();
  selected = Array.isArray(draft.selected)
    ? [...new Map(draft.selected.slice(0, maxQuestions).map(restore).filter(Boolean).map((row) => [row.id, row])).values()]
    : [];
  for (const field of controls.slice(0, 3)) {
    if (typeof draft.fields?.[field] === "string") byId(field).value = draft.fields[field].slice(0, 100);
  }
  const grades = CLASSES.filter((grade) => all.some((topic) => topic.classId === grade.id));
  PB.select(gradeSelect, grades.map((grade) => [grade.id, grade.name]), params.get("class") ?? draft.fields?.paperClass ?? "c9");
  fillSubjects(params.get("subject") ?? draft.fields?.paperSubject, params.get("chapter") ?? draft.fields?.paperChapter);

  gradeSelect.addEventListener("change", () => { fillSubjects(); shown = pageSize; render(); });
  subjectSelect.addEventListener("change", () => { fillChapters(); shown = pageSize; render(); });
  chapterSelect.addEventListener("change", () => { shown = pageSize; render(); });
  for (const id of ["paperType", "paperQuery"]) byId(id).addEventListener("input", () => { shown = pageSize; renderBank(); });
  for (const id of controls.slice(0, 3)) byId(id).addEventListener("input", () => { renderPreview(renderOrder()); save(); });

  byId("paperMore").addEventListener("click", () => {
    const previous = shown;
    shown += pageSize;
    renderBank();
    bankList.children[previous]?.querySelector("button").focus();
  });

  bankList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-pick]");
    if (!button || button.getAttribute("aria-disabled") === "true") return;
    if (selected.length === maxQuestions) { status.textContent = "একটি প্রশ্নপত্রে সর্বোচ্চ ১০০টি প্রশ্ন রাখা যায়।"; return; }
    const item = byKey.get(button.dataset.pick);
    selected.push(item);
    render("প্রশ্ন যোগ হয়েছে।", () => {
      [...bankList.querySelectorAll("button")].find((candidate) => candidate.dataset.pick === item.id)?.focus();
    });
  });

  byId("paperAuto").addEventListener("submit", (event) => {
    event.preventDefault();
    const pool = source().filter((item) => !selected.some((row) => row.id === item.id));
    const target = { mcq: byId("paperMcqCount").valueAsNumber, short: byId("paperShortCount").valueAsNumber };
    const limit = maxQuestions - selected.length;
    if (!limit) { status.textContent = "একটি প্রশ্নপত্রে সর্বোচ্চ ১০০টি প্রশ্ন রাখা যায়।"; return; }
    const candidates = ["mcq", "short"].flatMap((type) => mix(pool.filter((item) => item.type === type)).slice(0, target[type]));
    const added = candidates.slice(0, limit);
    selected = selected.concat(added);
    render(added.length < target.mcq + target.short
      ? PB.bn(added.length) + "টি প্রশ্ন যোগ হয়েছে। চাহিদামতো নতুন প্রশ্ন বা খালি স্থান ছিল না।"
      : PB.bn(added.length) + "টি নতুন প্রশ্ন যোগ হয়েছে।");
  });

  byId("paperCustom").addEventListener("submit", (event) => {
    event.preventDefault();
    const question = byId("paperCustomQuestion");
    const q = clean(question.value, 500);
    if (!q) { status.textContent = "নিজের প্রশ্নটি লিখুন।"; question.focus(); return; }
    if (selected.length === maxQuestions) { status.textContent = "একটি প্রশ্নপত্রে সর্বোচ্চ ১০০টি প্রশ্ন রাখা যায়।"; return; }
    selected.push({
      id: "custom-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2),
      type: "short", q, marks: byId("paperCustomMarks").valueAsNumber,
      solution: clean(byId("paperCustomAnswer").value, 1000), classId: gradeSelect.value,
      subjectId: subjectSelect.value, chapter: chapterSelect.value
    });
    event.currentTarget.reset();
    render("নিজের প্রশ্ন যোগ হয়েছে।");
    question.focus();
  });

  order.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-order]");
    if (!button) return;
    const index = Number(button.dataset.index);
    const action = button.dataset.order;
    if (action === "remove") {
      selected.splice(index, 1);
      render("প্রশ্ন বাদ দেওয়া হয়েছে।", () => {
        (order.children[Math.min(index, selected.length - 1)]?.querySelector("[data-order='remove']")
          ?? byId("paperQuery")).focus();
      });
      return;
    }
    const other = index + (action === "up" ? -1 : 1);
    if (other < 0 || other >= selected.length) return;
    [selected[index], selected[other]] = [selected[other], selected[index]];
    render("প্রশ্নের ক্রম বদলেছে।", () => {
      const track = order.children[other];
      (track.querySelector('[data-order="' + action + '"]:not(:disabled)') ?? track.querySelector("button:not(:disabled)"))?.focus();
    });
  });

  for (const [id, answerMode] of [["paperStudent", false], ["paperKey", true]]) {
    byId(id).addEventListener("click", () => { keyMode = answerMode; renderPreview(renderOrder()); });
  }
  byId("paperClear").addEventListener("click", () => {
    selected = [];
    render("খসড়া থেকে সব প্রশ্ন সরানো হয়েছে।", () => byId("paperQuery").focus());
  });
  print.addEventListener("click", () => window.print());


  // ---- এক ক্লিকে প্রশ্নপত্র ----
  const quickList = byId("paperQuickChapterList");
  const quickInfo = byId("paperQuickInfo");
  const presets = { quick: [10, 0], class: [10, 2], chapter: [20, 4] };
  let lastQuick = null;

  function quickChapters() {
    return all.filter((topic) => topic.classId === gradeSelect.value && topic.subjectId === subjectSelect.value);
  }

  function renderQuickChapters() {
    const chapters = quickChapters();
    const focus = chapterSelect.value;
    quickList.innerHTML = chapters.map((topic, i) => '<label><input type="checkbox" value="' + esc(topic.chapter) + '"'
      + (!focus || focus === topic.chapter ? " checked" : "") + '> <span>' + esc(topic.chapter)
      + ' <small>(' + PB.bn(topic.mcq.length) + ' MCQ · ' + PB.bn(topic.short.length) + ' লিখিত)</small></span></label>').join("")
      || '<p class="muted">এই বিষয়ে এখনো অধ্যায় যোগ হয়নি।</p>';
    updateQuickInfo();
  }

  function quickTarget() {
    const preset = document.querySelector("input[name=paperPreset]:checked").value;
    byId("paperQuickCustom").hidden = preset !== "custom";
    if (preset === "custom") {
      const n = (id, max) => Math.min(max, Math.max(0, byId(id).valueAsNumber || 0));
      return { preset, mcq: n("paperQuickMcq", 60), short: n("paperQuickShort", 20) };
    }
    return { preset, mcq: presets[preset][0], short: presets[preset][1] };
  }

  function chosenChapters() {
    return [...quickList.querySelectorAll("input:checked")].map((box) => box.value);
  }

  function quickPool(chapters) {
    const set = new Set(chapters);
    return bank.filter((item) => item.classId === gradeSelect.value && item.subjectId === subjectSelect.value && set.has(item.chapter));
  }

  function updateQuickInfo() {
    const chapters = chosenChapters();
    const target = quickTarget();
    const pool = quickPool(chapters);
    const have = { mcq: pool.filter((i) => i.type === "mcq").length, short: pool.filter((i) => i.type === "short").length };
    if (!chapters.length) { quickInfo.textContent = "অন্তত একটি অধ্যায় বেছে নিন।"; return; }
    const short = [];
    if (have.mcq < target.mcq) short.push("MCQ আছে " + PB.bn(have.mcq) + "টি");
    if (have.short < target.short) short.push("লিখিত আছে " + PB.bn(have.short) + "টি");
    quickInfo.textContent = PB.bn(chapters.length) + "টি অধ্যায় থেকে প্রশ্ন নেওয়া হবে।"
      + (short.length ? " এই অধ্যায়গুলোতে " + short.join(", ") + ", তাই যতটা আছে ততটাই যোগ হবে।" : "");
  }

  // প্রতিটি অধ্যায় থেকে পালা করে নেওয়া, যাতে সব অধ্যায় থেকে প্রশ্ন আসে
  function balancedPick(pool, type, count, chapters) {
    const queues = chapters.map((chapter) => mix(pool.filter((i) => i.type === type && i.chapter === chapter)));
    const picked = [];
    while (picked.length < count && queues.some((q) => q.length)) {
      for (const q of mix(queues)) {
        if (picked.length >= count) break;
        if (q.length) picked.push(q.shift());
      }
    }
    return picked;
  }

  function makeQuickPaper() {
    const chapters = chosenChapters();
    if (!chapters.length) { quickInfo.textContent = "অন্তত একটি অধ্যায় বেছে নিন।"; return; }
    const target = quickTarget();
    if (!target.mcq && !target.short) { quickInfo.textContent = "অন্তত একটি প্রশ্নের সংখ্যা দিন।"; return; }
    const pool = quickPool(chapters);
    const mcqs = balancedPick(pool, "mcq", target.mcq, chapters);
    const written = balancedPick(pool, "short", target.short, chapters);
    if (!mcqs.length && !written.length) { quickInfo.textContent = "এই অধ্যায়গুলোতে এখনো প্রশ্ন নেই।"; return; }
    const hadDraft = selected.length;
    selected = [...mcqs, ...written].slice(0, maxQuestions);
    const subjectName = SUBJECTS[subjectSelect.value].name;
    const label = { quick: "দ্রুত যাচাই", class: "ক্লাস টেস্ট", chapter: "অধ্যায় পরীক্ষা", custom: "অনুশীলন পরীক্ষা" }[target.preset];
    const allChapters = chapters.length === quickChapters().length && chapters.length > 1;
    byId("paperTitle").value = (chapters.length === 1 ? chapters[0] : allChapters ? subjectName : subjectName + " · " + PB.bn(chapters.length) + " অধ্যায়") + " · " + label;
    const writtenMarks = written.reduce((sum, item) => sum + item.marks, 0);
    byId("paperTime").value = String(Math.min(300, Math.max(10, Math.ceil((mcqs.length + writtenMarks * 2) / 5) * 5)));
    lastQuick = true;
    byId("paperQuickAgain").hidden = false;
    keyMode = false;
    const missing = mcqs.length < target.mcq || written.length < target.short;
    render(PB.bn(selected.length) + "টি প্রশ্নের প্রশ্নপত্র তৈরি হয়েছে"
      + (hadDraft ? " (আগের খসড়ার জায়গায়)" : "") + "।"
      + (missing ? " চাহিদার চেয়ে কম প্রশ্ন ছিল, যতটা আছে ততটাই নেওয়া হয়েছে।" : ""));
    byId("paperOutput").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  quickList.addEventListener("change", updateQuickInfo);
  for (const radio of document.querySelectorAll("input[name=paperPreset]")) radio.addEventListener("change", updateQuickInfo);
  for (const id of ["paperQuickMcq", "paperQuickShort"]) byId(id).addEventListener("input", updateQuickInfo);
  byId("paperQuickAll").addEventListener("click", () => { for (const box of quickList.querySelectorAll("input")) box.checked = true; updateQuickInfo(); });
  byId("paperQuickNone").addEventListener("click", () => { for (const box of quickList.querySelectorAll("input")) box.checked = false; updateQuickInfo(); });
  byId("paperQuickMake").addEventListener("click", makeQuickPaper);
  byId("paperQuickAgain").addEventListener("click", makeQuickPaper);
  for (const select of [gradeSelect, subjectSelect, chapterSelect]) select.addEventListener("change", renderQuickChapters);
  renderQuickChapters();

  byId("paperWorkspace").hidden = false;
  byId("paperOutput").hidden = false;
  render();
})();

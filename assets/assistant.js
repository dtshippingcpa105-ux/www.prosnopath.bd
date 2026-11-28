// প্রশ্নপাঠ সহায়ক: সম্পূর্ণ ব্রাউজারে চলে। উত্তর আসে শুধু প্রশ্নপাঠের যাচাই করা কনটেন্ট থেকে; কোনো তথ্য বাইরে যায় না।
(() => {
  const { id: get, escape, bn } = PB;
  const log = get("chatLog");
  const form = get("chatForm");
  const input = get("chatInput");
  const classSel = get("chatClass");
  const classKey = "proshnopath-assistant-class";
  const portal = "https://student-portal-production-b3ce231b.up.railway.app";
  const onPortal = location.origin === portal || /^(127\.0\.0\.1|localhost)$/.test(location.hostname);
  const letters = ["ক", "খ", "গ", "ঘ"];
  const clip = (text, max = 260) => (text.length > max ? text.slice(0, max).replace(/\s+\S*$/, "") + "…" : text);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  // ---------- লেখা স্বাভাবিক করা ----------
  const toLatinDigits = (s) => s.replace(/[০-৯]/g, (d) => "০১২৩৪৫৬৭৮৯".indexOf(d));
  const clean = (s) => String(s).normalize("NFC").replace(/য়/g, "য়").replace(/ড়/g, "ড়").replace(/ঢ়/g, "ঢ়")
    .replace(/[‌‍]/g, "").toLowerCase();
  const stop = new Set(("কী কি কাকে বলে বলা কেন কীভাবে কিভাবে কোনটি কোনটা কোন কয়টি কয়টা কত কে কার কারা হয় হলো হল হচ্ছে হবে করে করো করুন করা এবং ও বা একটি একটা এক আমাকে আমি আমার তুমি আপনি বলো বলুন বলেন বোঝাও বুঝিয়ে দাও দিন দেও সম্পর্কে নিয়ে মানে অর্থ "
    + "লিখ লেখো লিখুন উদাহরণসহ সংজ্ঞা ব্যাখ্যা কর এর এ যে না সব থেকে দিয়ে জন্য সাথে সঙ্গে প্লিজ please what is are the a an of to in and or meaning define explain how why which").split(" "));
  const suffixes = ["গুলোর", "গুলোকে", "গুলিকে", "গুলো", "গুলি", "দেরকে", "দের", "টির", "টিকে", "টাকে", "টি", "টা", "কে", "তে", "য়ের", "য়", "ের", "রা", "র", "ে"];
  function stem(word) {
    for (const s of suffixes) if (word.length - s.length >= 2 && word.endsWith(s)) return word.slice(0, -s.length);
    return word;
  }
  const tokens = (s) => clean(s).split(/[^\p{L}\p{M}\p{N}]+/u).filter((w) => w && !stop.has(w)).map(stem).filter((w) => w.length > 1 || /\d/.test(w));

  // ---------- সূচি তৈরি ----------
  const docs = [];
  const add = (doc, title, body) => {
    doc.titleTokens = tokens(title);
    doc.bodyTokens = tokens(body);
    docs.push(doc);
  };
  const subjectName = (id) => SUBJECTS[id]?.name ?? "";
  const className = (id) => CLASSES.find((c) => c.id === id)?.name ?? "";
  if (typeof STUDY_CHAPTERS !== "undefined") {
    for (const note of STUDY_CHAPTERS) {
      const base = { type: "note", classId: note.classId, subjectId: note.subjectId, chapter: note.chapter, href: PB.href("notes.html", { note: note.id }) };
      add({ ...base, kind: "লক্ষ্য", text: note.goal }, note.chapter, note.goal);
      (note.keyPoints ?? []).forEach((point) => add({ ...base, kind: "মূল ধারণা", text: point }, note.chapter, point));
      if (note.commonMistake) add({ ...base, kind: "সাধারণ ভুল", text: note.commonMistake }, note.chapter, note.commonMistake);
      if (note.example) {
        const text = note.example.prompt + " " + (note.example.steps ?? []).join(" ");
        add({ ...base, kind: "উদাহরণ", text: note.example.prompt, steps: note.example.steps }, note.chapter, text);
      }
      for (const table of note.tables ?? []) for (const row of table.rows ?? []) {
        add({ ...base, kind: table.title, text: row.join(" · ") }, row[0] + " " + note.chapter, row.join(" "));
      }
    }
  }
  for (const section of PB.entries()) {
    const base = { classId: section.classId, subjectId: section.subjectId, chapter: section.chapter,
      href: PB.href("question-bank.html", { class: section.classId, subject: section.subjectId, chapter: section.chapter }) };
    for (const item of section.mcq ?? []) {
      if (item.figure || !Array.isArray(item.options)) continue;
      add({ ...base, type: "mcq", item }, item.q, section.chapter + " " + item.options.join(" ") + " " + (item.explain ?? ""));
    }
    for (const item of section.short ?? []) {
      if (!item.solution) continue;
      add({ ...base, type: "short", item }, item.q, section.chapter + " " + item.solution);
    }
  }
  if (typeof VOCAB_TOPICS !== "undefined") {
    for (const topic of VOCAB_TOPICS) for (const [word, pos, meaning, example, synonym] of topic.words) {
      add({ type: "vocab", word, pos, meaning, example, synonym, topic: topic.name, href: "vocabulary.html" }, word + " " + meaning, example + " " + (synonym ?? ""));
    }
  }
  if (typeof VISUAL_LESSONS !== "undefined") {
    for (const lesson of VISUAL_LESSONS) {
      lesson.parts.forEach((part, i) => add({ type: "visual", lesson, part, n: i + 1, classIds: lesson.classIds, subjectId: lesson.subject,
        href: PB.href("visual.html", { visual: lesson.id }) }, part.name + " " + lesson.title, part.tip + " " + lesson.intro));
    }
  }

  // শব্দ → নথি তালিকা (দ্রুত খোঁজার জন্য)
  const postings = new Map();
  docs.forEach((doc, index) => {
    const seen = new Map();
    doc.titleTokens.forEach((t) => seen.set(t, (seen.get(t) ?? 0) + 2.5));
    doc.bodyTokens.forEach((t) => seen.set(t, (seen.get(t) ?? 0) + 1));
    for (const [t, w] of seen) {
      if (!postings.has(t)) postings.set(t, []);
      postings.get(t).push([index, Math.min(w, 5)]);
    }
  });
  const vocabulary = [...postings.keys()];

  const typeWeight = { note: 1, visual: 0.95, vocab: 0.9, short: 0.6, mcq: 0.5 };
  function search(query, { types, classId, limit = 8 } = {}) {
    const terms = [...new Set(tokens(query))];
    const definitional = /(কী|কি|কাকে বলে|সংজ্ঞা|মানে|বলতে কী|what is|define)/.test(clean(query));
    if (!terms.length) return [];
    const scores = new Map();
    const hits = new Map();
    for (const term of terms) {
      const matched = new Map();
      for (const word of vocabulary) {
        let weight = 0;
        if (word === term) weight = 1;
        else if (term.length >= 3 && word.startsWith(term) && word.length - term.length <= 3) weight = 0.6;
        else if (word.length >= 3 && term.startsWith(word) && term.length - word.length <= 3) weight = 0.5;
        if (!weight) continue;
        const idf = Math.log(1 + docs.length / postings.get(word).length);
        for (const [index, tf] of postings.get(word)) matched.set(index, Math.max(matched.get(index) ?? 0, weight * tf * idf));
      }
      for (const [index, value] of matched) {
        scores.set(index, (scores.get(index) ?? 0) + value);
        hits.set(index, (hits.get(index) ?? 0) + 1);
      }
    }
    return [...scores.entries()].map(([index, score]) => {
      const doc = docs[index];
      const coverage = hits.get(index) / terms.length;
      let final = score * (0.4 + coverage);
      const classes = doc.classIds ?? (doc.classId ? [doc.classId] : null);
      if (classId && classes?.includes(classId)) final *= 1.35;
      final *= typeWeight[doc.type] ?? 1;
      if (doc.type === "note") {
        final *= doc.kind === "মূল ধারণা" ? 1.15 : doc.kind === "উদাহরণ" ? (definitional ? 0.6 : 0.8) : doc.kind === "লক্ষ্য" ? 0.75 : doc.kind === "সাধারণ ভুল" ? 0.8 : 1;
        if (tokens(doc.text.slice(0, 70)).some((t) => terms.includes(t))) final *= 1.2;
      }
      const titleHit = terms.filter((t) => doc.titleTokens.includes(t)).length / terms.length;
      if ((doc.type === "short" || doc.type === "mcq") && (titleHit < 0.6 || definitional)) final *= 0.7;
      return { doc, score: final, coverage, titleHit };
    }).filter((r) => !types || types.includes(r.doc.type)).sort((a, b) => b.score - a.score).slice(0, limit);
  }

  // ---------- বার্তা দেখানো ----------
  function bubble(role, html) {
    const node = document.createElement("div");
    node.className = "chat-msg chat-" + role;
    node.innerHTML = role === "bot" ? '<span class="chat-avatar" aria-hidden="true">প</span><div class="chat-bubble">' + html + "</div>" : '<div class="chat-bubble">' + html + "</div>";
    log.append(node);
    node.scrollIntoView({ behavior: "smooth", block: "nearest" });
    return node;
  }
  const source = (href, label) => '<a class="chat-source" href="' + escape(href) + '">' + escape(label) + " →</a>";
  const chips = (list) => '<div class="chat-chips">' + list.map((q) => '<button type="button" data-ask="' + escape(q) + '">' + escape(q) + "</button>").join("") + "</div>";
  const place = (doc) => [className(doc.classId), subjectName(doc.subjectId), doc.chapter].filter(Boolean).join(" · ");

  // ---------- কুইজ কার্ড ----------
  let quizScore = { right: 0, total: 0 };
  function mcqCard(doc, topic) {
    const { item } = doc;
    const id = "q" + Math.random().toString(36).slice(2, 8);
    return '<div class="chat-mcq" id="' + id + '" data-answer="' + item.answer + '" data-topic="' + escape(topic ?? "") + '"><p class="chat-meta">' + escape(place(doc)) + "</p><p><strong>" + escape(item.q) + "</strong></p>"
      + '<div class="chat-options">' + item.options.map((o, i) => '<button type="button" data-option="' + i + '">' + letters[i] + ". " + escape(o) + "</button>").join("") + "</div>"
      + '<p class="chat-explain" hidden>' + escape(item.explain ?? "") + "</p>"
      + '<div class="chat-chips"><button type="button" data-hint>💡 ইঙ্গিত দাও</button><button type="button" data-next>আরেকটি প্রশ্ন</button></div></div>';
  }
  const asked = new Set();
  function practice(topic) {
    const classId = classSel.value;
    let pool = [];
    if (topic) {
      const want = tokens(topic);
      const mcqs = docs.filter((d) => d.type === "mcq");
      const chapterHit = (d) => { const ct = tokens(d.chapter + " " + subjectName(d.subjectId)); return want.filter((t) => ct.some((w) => w === t || (w.startsWith(t) && w.length - t.length <= 3))).length / want.length; };
      pool = mcqs.filter((d) => chapterHit(d) >= 0.99);
      if (classId && pool.some((d) => d.classId === classId)) pool = pool.filter((d) => d.classId === classId);
      if (!pool.length) pool = search(topic, { types: ["mcq"], classId, limit: 25 }).filter((r) => r.coverage >= 0.99).map((r) => r.doc);
    }
    const matchedTopic = pool.length > 0;
    if (!pool.length) pool = docs.filter((d) => d.type === "mcq" && (!classId || d.classId === classId));
    if (!pool.length) pool = docs.filter((d) => d.type === "mcq");
    const fresh = pool.filter((d) => !asked.has(d.item.q));
    const doc = pick(fresh.length ? fresh.slice(0, 40) : pool);
    asked.add(doc.item.q);
    const intro = topic && matchedTopic
      ? "“" + escape(topic) + "” নিয়ে একটি প্রশ্ন। আগে নিজে ভাবো, দরকার হলে ইঙ্গিত নাও।"
      : topic ? "“" + escape(topic) + "” নিয়ে ঠিক মিলে যাওয়া প্রশ্ন পাইনি, তাই তোমার শ্রেণি থেকে একটি প্রশ্ন দিলাম।" : "চলো একটা প্রশ্ন দিয়ে শুরু করি।";
    bubble("bot", "<p>" + intro + "</p>" + mcqCard(doc, topic));
  }

  // ---------- হিসাব ----------
  function calculate(raw) {
    let s = toLatinDigits(raw).replace(/হিসাব\s*(করো|কর|করুন)?|সমান কত|কত হয়|কত|=|\?/g, " ")
      .replace(/×|x(?=\s*[\d(])/gi, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/যোগ/g, "+").replace(/বিয়োগ/g, "-").replace(/গুণ/g, "*").replace(/ভাগ/g, "/");
    s = s.replace(/বর্গমূল\s*([\d.]+)|([\d.]+)\s*(?:এর|এর\s+)?\s*বর্গমূল/g, (m, a, b) => "√" + (a ?? b));
    s = s.replace(/([\d.]+)\s*(?:এর)?\s*বর্গ(?!মূল)/g, "($1)^2").replace(/([\d.]+)\s*(?:এর)?\s*ঘন/g, "($1)^3");
    s = s.replace(/([\d.]+)\s*এর\s*([\d.]+)\s*%/g, "($1*$2/100)").replace(/%/g, "/100").replace(/\bof\b/gi, "*");
    if (/[^\d.+\-*/^()√\s]/.test(s) || !/\d/.test(s)) return null;
    let pos = 0;
    const src = s.replace(/\s+/g, "");
    const peek = () => src[pos];
    function number() {
      const m = /^\d*\.?\d+/.exec(src.slice(pos));
      if (!m) throw new Error();
      pos += m[0].length;
      return parseFloat(m[0]);
    }
    function factor() {
      if (peek() === "-") { pos++; return -factor(); }
      if (peek() === "√") { pos++; const v = factor(); if (v < 0) throw new Error(); return Math.sqrt(v); }
      let v;
      if (peek() === "(") { pos++; v = expr(); if (peek() !== ")") throw new Error(); pos++; } else v = number();
      if (peek() === "^") { pos++; v = Math.pow(v, factor()); }
      return v;
    }
    function term() {
      let v = factor();
      while (peek() === "*" || peek() === "/" || peek() === "(" || peek() === "√") {
        const op = peek() === "/" ? "/" : "*";
        if (peek() === "*" || peek() === "/") pos++;
        const r = factor();
        if (op === "/" && r === 0) throw new Error("zero");
        v = op === "*" ? v * r : v / r;
      }
      return v;
    }
    function expr() {
      let v = term();
      while (peek() === "+" || peek() === "-") { const op = src[pos++]; const r = term(); v = op === "+" ? v + r : v - r; }
      return v;
    }
    try {
      const value = expr();
      if (pos !== src.length || !Number.isFinite(value)) return null;
      const shown = Math.abs(value - Math.round(value)) < 1e-9 ? String(Math.round(value)) : String(Number(value.toFixed(6)));
      return { expression: src.replace(/\*/g, " × ").replace(/\//g, " ÷ ").replace(/\+/g, " + ").replace(/(\d)-/g, "$1 − "), value: shown };
    } catch (error) {
      return error.message === "zero" ? { error: "শূন্য দিয়ে ভাগ করা যায় না। কোনো সংখ্যাকে ০ দিয়ে ভাগ করলে তার কোনো নির্দিষ্ট মান হয় না।" } : null;
    }
  }

  // ---------- পড়ার পরামর্শ ----------
  async function advice() {
    const parts = [];
    try {
      const plan = JSON.parse(localStorage.getItem("proshnopath-planner-v1"));
      const today = new Date().toISOString().slice(0, 10);
      const day = plan?.days?.find((d) => d.date >= today);
      const open = day?.tasks.filter((t) => !t.done) ?? [];
      if (open.length) parts.push("<p><strong>তোমার পড়ার পরিকল্পনা থেকে আজকের কাজ:</strong></p><ul>" + open.slice(0, 4).map((t) => '<li><a href="' + escape(t.href) + '">' + escape(t.text) + "</a></li>").join("") + "</ul>");
    } catch { /* পরিকল্পনা না থাকলেও চলবে */ }
    if (onPortal) {
      try {
        const data = await PB.studentRequest("/dashboard");
        const mistakes = data.overview?.mistakes ?? [];
        if (data.overview) parts.push("<p>🔥 তোমার ধারাবাহিকতা " + bn(data.overview.streak) + " দিন" + (data.overview.practicedToday ? ", আজকের অনুশীলন হয়ে গেছে। দারুণ!" : "। আজ অন্তত একটি কুইজ দিয়ে ধারা ধরে রাখো।") + "</p>");
        if (mistakes.length) {
          const byChapter = new Map();
          for (const m of mistakes) byChapter.set(m.chapter, (byChapter.get(m.chapter) ?? 0) + 1);
          const weak = [...byChapter.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
          parts.push("<p><strong>ভুলের খাতা বলছে এই অধ্যায়গুলোতে আরেকটু সময় দাও:</strong></p><ul>" + weak.map(([c, n]) => "<li>" + escape(c) + " · " + bn(n) + "টি ভুল</li>").join("") + "</ul>"
            + chips(weak.map(([c]) => c + " কুইজ দাও")) + source("student.html#studentMistakes", "ভুলের খাতা খুলে আবার চেষ্টা করো"));
        }
      } catch { /* লগইন না থাকলে বাদ */ }
    }
    if (!parts.length) {
      parts.push("<p>এখনো তোমার কোনো পরিকল্পনা বা ভুলের হিসাব আমার কাছে নেই। তিনটি উপায়ে শুরু করতে পারো:</p><ul>"
        + '<li><a href="planner.html">পড়ার পরিকল্পনা</a> বানাও; তাহলে প্রতিদিন বলতে পারব আজ কী পড়বে।</li>'
        + '<li><a href="' + portal + '/student.html">শিক্ষার্থী আইডিতে</a> লগইন করে কুইজ দাও; তারপর পোর্টালের সহায়ক তোমার ভুলের খাতা দেখে পরামর্শ দেবে।</li>'
        + "<li>এখনই আমার কাছে একটি কুইজ দাও।</li></ul>" + chips(["কুইজ দাও"]));
    }
    parts.push('<p class="chat-tip">টিপস: ২৫ মিনিট মন দিয়ে পড়ো, ৫ মিনিট বিরতি নাও। পড়া শেষে বই বন্ধ করে নিজের ভাষায় ৩টি মূল কথা লেখো।</p>');
    bubble("bot", parts.join(""));
  }

  // ---------- মূল উত্তর ----------
  const greetings = /^(হাই|হ্যালো|হেলো|সালাম|আসসালামু|আস্সালামু|hi|hello|hey|শুভ সকাল|শুভ সন্ধ্যা)/;
  const distress = /(আত্মহত্যা|মরে যেতে|মরে যাব|বাঁচতে চাই না|নিজেকে শেষ|নিজের ক্ষতি|suicide|kill myself)/;
  function helpText() {
    return "<p>আমি প্রশ্নপাঠ সহায়ক। প্রশ্নপাঠের যাচাই করা নোট, প্রশ্নব্যাংক, শব্দভান্ডার আর চিত্র থেকে উত্তর দিই। যা পারি:</p><ul>"
      + "<li>কোনো বিষয় বুঝিয়ে দেওয়া, যেমন “সালোকসংশ্লেষণ কী?”</li><li>যেকোনো অধ্যায় থেকে কুইজ নেওয়া ও ইঙ্গিত দেওয়া</li>"
      + "<li>ইংরেজি শব্দের অর্থ বলা, যেমন “diligent meaning”</li><li>হিসাব করা, যেমন “১২৫ × ৮” বা “১৪৪ এর বর্গমূল”</li><li>আজ কী পড়বে তার পরামর্শ</li></ul>"
      + chips(["সালোকসংশ্লেষণ কী?", "আলোর প্রতিফলন কুইজ দাও", "achieve meaning", "আজ কী পড়ব?"]);
  }

  function explain(query) {
    const classId = classSel.value;
    const results = search(query, { classId, limit: 30 });
    const best = results[0];
    if (!best || best.score < 2.2 || best.coverage < 0.5) {
      bubble("bot", "<p>দুঃখিত, “" + escape(query) + "” নিয়ে প্রশ্নপাঠে এখনো নিশ্চিত কোনো কনটেন্ট পাইনি। ভুল কিছু বানিয়ে বলতে চাই না।</p><ul>"
        + "<li>প্রশ্নটি অন্যভাবে বা ছোট করে লিখে দেখো, যেমন শুধু বিষয়ের নাম।</li>"
        + '<li><a href="' + escape(PB.href("search.html", { q: query })) + '">পুরো সাইটে খুঁজে দেখো</a> অথবা <a href="textbooks.html">পাঠ্যবই</a> খোলো।</li>'
        + '<li>শিক্ষক বা অভিভাবককে জিজ্ঞেস করো। চাইলে <a href="' + escape(PB.feedbackHref("assistant.html", { type: "other", question: "সহায়কে এই বিষয়টি যোগ করুন: " + query })) + '">প্রশ্নপাঠকে এই বিষয় যোগ করতে বলো</a>।</li></ul>');
      return;
    }
    const top = best.doc;
    const html = [];
    if (top.type === "vocab") return vocabAnswer([top, ...results.slice(1, 3).filter((r) => r.doc.type === "vocab" && r.score > best.score * 0.6).map((r) => r.doc)]);
    if (top.type === "short") {
      html.push("<p>এটি প্রশ্নপাঠের প্রশ্নব্যাংকের একটি প্রশ্ন (" + escape(place(top)) + ", " + bn(top.item.marks ?? 2) + " নম্বর)।</p><p><strong>" + escape(top.item.q) + "</strong></p>"
        + '<p class="chat-tip">আগে নিজে খাতায় উত্তর লিখে দেখো, তারপর মিলিয়ে নাও।</p><details class="chat-reveal"><summary>নমুনা উত্তর দেখাও</summary><p>' + escape(top.item.solution) + "</p></details>" + source(top.href, "এই অধ্যায়ের সব প্রশ্ন"));
    } else if (top.type === "mcq") {
      html.push("<p>এই বিষয়ে প্রশ্নব্যাংকে একটি প্রশ্ন আছে। চেষ্টা করে দেখো:</p>" + mcqCard(top, query));
    } else if (top.type === "visual" && (() => { const q = tokens(query); const hit = (s) => tokens(s).filter((t) => q.includes(t)).length; const l = hit(top.lesson.title); return l > 0 && l >= hit(top.part.name); })()) {
      html.push("<p><strong>" + escape(top.lesson.title) + "</strong></p><p>" + escape(top.lesson.intro) + "</p>"
        + '<div class="chat-figure">' + visualSvg(top.lesson, -1) + "</div><p class=\"chat-meta\">চিত্রের অংশ: " + top.lesson.parts.map((p, i) => bn(i + 1) + ". " + escape(p.name)).join(", ") + "</p>"
        + source(top.href, "চিত্রে শিখি-তে প্রতিটি অংশ শেখো ও যাচাই করো"));
    } else if (top.type === "visual") {
      html.push("<p><strong>" + escape(top.part.name) + "</strong> (" + escape(top.lesson.title) + ")</p><p>" + escape(top.part.tip) + "</p>"
        + '<div class="chat-figure">' + visualSvg(top.lesson, top.n - 1) + "</div>" + source(top.href, "চিত্রে শিখি-তে পুরো চিত্র দেখো ও যাচাই করো"));
    } else {
      const definitional = /(কী|কি|কাকে বলে|সংজ্ঞা|মানে|বলতে কী)/.test(clean(query));
      const rank = { "মূল ধারণা": 0, "উদাহরণ": 2, "লক্ষ্য": 3 };
      const notes = results.filter((r) => r.doc.type === "note" && r.doc.chapter === top.chapter && r.score >= best.score * 0.55)
        .sort((a, b) => (definitional ? (rank[a.doc.kind] ?? 1) - (rank[b.doc.kind] ?? 1) : 0) || b.score - a.score).slice(0, 2).map((r) => r.doc);
      html.push('<p class="chat-meta">' + escape(place(top)) + "</p>");
      for (const doc of notes) {
        html.push("<p><strong>" + escape(doc.kind) + ":</strong> " + escape(doc.text) + "</p>");
        if (doc.steps?.length) html.push("<ol>" + doc.steps.map((s) => "<li>" + escape(s) + "</li>").join("") + "</ol>");
      }
      html.push(source(top.href, "পুরো নোট পড়ো"));
    }
    // সম্পর্কিত চিত্র ও অনুশীলন
    if (top.type !== "visual") {
      const visual = results.find((r) => r.doc.type === "visual" && r.coverage >= 0.5 && r.score >= best.score * 0.45);
      if (visual) html.push('<div class="chat-extra"><p>🖼️ <strong>চিত্রে দেখো:</strong> ' + escape(visual.doc.part.name) + " (" + escape(visual.doc.lesson.title) + ")</p>" + source(visual.doc.href, "চিত্রটি খোলো") + "</div>");
    }
    if (top.type === "note" || top.type === "visual") {
      const chapter = top.chapter;
      const practiceDoc = chapter
        ? results.find((r) => r.doc.type === "mcq" && r.doc.chapter === chapter)?.doc ?? docs.find((d) => d.type === "mcq" && d.chapter === chapter && d.classId === top.classId)
        : results.find((r) => r.doc.type === "mcq" && r.coverage >= 0.99 && r.titleHit >= 0.5)?.doc;
      if (practiceDoc) { asked.add(practiceDoc.item.q); html.push('<div class="chat-extra"><p>✍️ <strong>এবার যাচাই করো:</strong></p>' + mcqCard(practiceDoc, chapter) + "</div>"); }
    }
    bubble("bot", html.join(""));
  }

  function visualSvg(lesson, active) {
    const marks = lesson.parts.map((part, i) => i === active || active < 0
      ? '<g class="vl-mark' + (active < 0 ? "" : " is-active") + '"><line x1="' + part.p[0] + '" y1="' + part.p[1] + '" x2="' + part.m[0] + '" y2="' + part.m[1] + '"/><circle class="vl-dot" cx="' + part.p[0] + '" cy="' + part.p[1] + '" r="5"/><circle class="vl-badge" cx="' + part.m[0] + '" cy="' + part.m[1] + '" r="16"/><text x="' + part.m[0] + '" y="' + part.m[1] + '" dominant-baseline="central">' + bn(i + 1) + "</text></g>" : "").join("");
    return '<svg viewBox="0 0 600 400" role="img" aria-label="' + escape(lesson.title + (active >= 0 ? ": " + lesson.parts[active].name : "")) + '">' + lesson.svg + marks + "</svg>";
  }

  function vocabAnswer(list) {
    bubble("bot", list.map((v) => '<div class="chat-vocab"><p><strong lang="en">' + escape(v.word) + "</strong> <span class=\"chat-meta\">(" + escape(v.pos) + ")</span> = " + escape(v.meaning) + "</p>"
      + '<p lang="en">“' + escape(v.example) + "”</p>" + (v.synonym ? '<p class="chat-meta">সমার্থক: <span lang="en">' + escape(v.synonym) + "</span> · বিষয়: " + escape(v.topic) + "</p>" : "") + "</div>").join("")
      + source("vocabulary.html", "শব্দভান্ডারে আরও শব্দ শেখো"));
  }

  async function answer(raw) {
    const text = raw.trim().slice(0, 300);
    if (!text) return;
    bubble("user", escape(text));
    const q = clean(text);
    if (distress.test(q)) {
      bubble("bot", "<p>তুমি যা অনুভব করছ তা খুব গুরুত্বপূর্ণ, আর তুমি একা নও। এখনই তোমার বাবা-মা, পরিবারের কেউ বা একজন শিক্ষক, যাকে বিশ্বাস করো, তাঁকে জানাও। বিপদ মনে হলে এখনই <strong>৯৯৯</strong>-এ ফোন করো।</p><p>আমি পড়াশোনার সহায়ক, তাই এ বিষয়ে ঠিকমতো সাহায্য করতে পারব না, কিন্তু তোমার পাশে থাকার মতো মানুষ আছেন।</p>");
      return;
    }
    if (greetings.test(q) || /(তুমি কী পার|তুমি কি পার|সাহায্য|help|কী করতে পার)/.test(q)) { bubble("bot", (greetings.test(q) ? "<p>শুভেচ্ছা! 😊</p>" : "") + helpText()); return; }
    if (/(ধন্যবাদ|থ্যাংক|thanks|thank you)/.test(q)) { bubble("bot", "<p>তোমাকেও ধন্যবাদ! আরও কিছু জানতে চাইলে লিখো। নিয়মিত অনুশীলনই এগিয়ে যাওয়ার চাবি। 🌱</p>"); return; }
    const calc = /[\d০-৯]/.test(q) && (/[+\-×x*÷/^√%=]|যোগ|বিয়োগ|গুণ|ভাগ|বর্গ|ঘন|হিসাব/.test(q)) ? calculate(q) : null;
    if (calc) {
      bubble("bot", calc.error ? "<p>" + calc.error + "</p>" : '<p class="chat-calc">' + bn(calc.expression).replace(/√/g, "√") + " = <strong>" + bn(calc.value) + "</strong></p>"
        + '<p class="chat-tip">পরীক্ষায় শুধু উত্তর নয়, ধাপগুলোও লিখতে হয়। খাতায় নিজে করে মিলিয়ে নাও।</p>');
      return;
    }
    if (/(আজ কী পড়|আজকে কী পড়|কী পড়ব|কি পড়ব|কী পড়া উচিত|পরামর্শ|দুর্বল|ভুলের খাতা|রুটিন)/.test(q)) { await advice(); return; }
    const practiceMatch = /(কুইজ|অনুশীলন|প্রশ্ন দাও|প্রশ্ন দিন|প্রশ্ন করো|mcq|এমসিকিউ|পরীক্ষা নাও|পরীক্ষা নিন|টেস্ট)/.exec(q);
    if (practiceMatch) {
      const topic = text.replace(/(কুইজ|অনুশীলন|প্রশ্ন|দাও|দিন|করো|নাও|নিন|mcq|এমসিকিউ|পরীক্ষা|টেস্ট|থেকে|নিয়ে|একটি|একটা|আমাকে)/gi, " ").replace(/\s+/g, " ").trim();
      practice(topic.length > 1 ? topic : "");
      return;
    }
    const latin = text.match(/^[a-zA-Z][a-zA-Z\s-]*$/) || /(meaning|মানে কী|এর অর্থ|অর্থ কী|ইংরেজি)/.test(q);
    if (latin) {
      const word = (text.match(/[a-zA-Z][a-zA-Z-]*/g) ?? []).filter((w) => !/^(meaning|what|is|the|of|define)$/i.test(w))[0];
      const exact = word ? docs.filter((d) => d.type === "vocab" && d.word.toLowerCase() === word.toLowerCase()) : [];
      if (exact.length) { vocabAnswer(exact); return; }
      const byMeaning = search(text, { types: ["vocab"], limit: 3 }).filter((r) => r.coverage >= 0.5);
      if (byMeaning.length) { vocabAnswer(byMeaning.map((r) => r.doc)); return; }
      if (word) {
        bubble("bot", "<p>“" + escape(word) + "” শব্দটি এখনো প্রশ্নপাঠের শব্দভান্ডারে নেই। একটি ভালো ইংরেজি-বাংলা অভিধানে (যেমন বাংলা একাডেমির) দেখে নাও।</p>" + source("vocabulary.html", "শব্দভান্ডারের শব্দগুলো দেখো"));
        return;
      }
    }
    explain(text);
  }

  // ---------- ঘটনা ----------
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value;
    input.value = "";
    answer(text);
    input.focus();
  });
  log.addEventListener("click", (event) => {
    const ask = event.target.closest("[data-ask]");
    if (ask) { answer(ask.dataset.ask); return; }
    const card = event.target.closest(".chat-mcq");
    if (!card) return;
    const optionButtons = [...card.querySelectorAll("[data-option]")];
    if (event.target.closest("[data-hint]")) {
      if (card.dataset.done || card.dataset.hinted) return;
      card.dataset.hinted = "1";
      const wrong = optionButtons.filter((b) => Number(b.dataset.option) !== Number(card.dataset.answer));
      wrong.sort(() => Math.random() - 0.5).slice(0, 2).forEach((b) => { b.disabled = true; b.classList.add("is-out"); });
      event.target.closest("[data-hint]").textContent = "দুটি ভুল অপশন বাদ দিলাম";
      return;
    }
    if (event.target.closest("[data-next]")) { practice(card.dataset.topic); return; }
    const option = event.target.closest("[data-option]");
    if (!option || card.dataset.done) return;
    card.dataset.done = "1";
    const correct = Number(card.dataset.answer);
    const chosen = Number(option.dataset.option);
    PB.showAnswer(optionButtons, correct, chosen);
    quizScore.total++;
    if (chosen === correct) quizScore.right++;
    const explainNode = card.querySelector(".chat-explain");
    explainNode.hidden = false;
    explainNode.innerHTML = (chosen === correct ? "✅ <strong>" + pick(["দারুণ! ঠিক হয়েছে।", "চমৎকার, সঠিক!", "একদম ঠিক!"]) + "</strong> " : "❌ <strong>এবার হয়নি, সমস্যা নেই।</strong> সঠিক উত্তর " + letters[correct] + "। ")
      + escape(explainNode.textContent) + ' <span class="chat-meta">(এই আলাপে ' + bn(quizScore.total) + "টির মধ্যে " + bn(quizScore.right) + "টি সঠিক)</span>";
  });
  classSel.innerHTML = '<option value="">সব শ্রেণি</option>' + CLASSES.map((c) => '<option value="' + c.id + '">' + escape(c.name) + "</option>").join("");
  try { classSel.value = localStorage.getItem(classKey) ?? "c8"; } catch { classSel.value = "c8"; }
  classSel.addEventListener("change", () => { try { localStorage.setItem(classKey, classSel.value); } catch {} });

  bubble("bot", "<p>আসসালামু আলাইকুম! আমি <strong>প্রশ্নপাঠ সহায়ক</strong>। পড়ার যেকোনো প্রশ্ন লিখো, আমি প্রশ্নপাঠের যাচাই করা নোট আর প্রশ্নব্যাংক থেকে উত্তর খুঁজে দেব।</p>" + helpText().replace(/^<p>[^<]*<\/p>/, ""));
  const first = PB.params().get("q");
  if (first) answer(first);
  window.PB_ASSISTANT = { search, calculate, docs };
})();

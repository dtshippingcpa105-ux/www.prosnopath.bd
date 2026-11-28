// চিত্রে শিখি: নম্বর দেওয়া চিত্র দেখে শেখা, তারপর নাম মিলিয়ে নিজেকে যাচাই।
(() => {
  const { id: get, escape, bn } = PB;
  const store = "prosnopath-visual-best";
  const best = (() => { try { return JSON.parse(localStorage.getItem(store) || "{}"); } catch { return {}; } })();
  const saveBest = () => { try { localStorage.setItem(store, JSON.stringify(best)); } catch {} };
  const classSel = get("visualClass");
  const subjectSel = get("visualSubject");
  const list = get("visualList");
  const work = get("visualWork");
  let current = null;
  let mode = "learn";
  let active = -1;

  const subjectsUsed = [...new Set(VISUAL_LESSONS.map((v) => v.subject))];
  classSel.innerHTML = '<option value="">সব শ্রেণি</option>' + CLASSES.filter((c) => VISUAL_LESSONS.some((v) => v.classIds.includes(c.id)))
    .map((c) => '<option value="' + c.id + '">' + escape(c.name) + "</option>").join("");
  subjectSel.innerHTML = '<option value="">সব বিষয়</option>' + subjectsUsed.map((s) => '<option value="' + s + '">' + escape(SUBJECTS[s]?.name ?? s) + "</option>").join("");

  const classLabel = (v) => v.classIds.map((c) => CLASSES.find((x) => x.id === c)?.icon ?? "").join(", ") + " শ্রেণি";

  function drawing(v, small) {
    const marks = small ? "" : v.parts.map((part, i) => {
      const [px, py] = part.p;
      const [mx, my] = part.m;
      return '<g class="vl-mark" data-i="' + i + '" tabindex="0" role="button" aria-label="' + bn(i + 1) + ' নম্বর অংশ">'
        + '<line x1="' + px + '" y1="' + py + '" x2="' + mx + '" y2="' + my + '"/><circle class="vl-dot" cx="' + px + '" cy="' + py + '" r="4"/>'
        + '<circle class="vl-badge" cx="' + mx + '" cy="' + my + '" r="15"/><text x="' + mx + '" y="' + (my + 6) + '">' + bn(i + 1) + "</text></g>";
    }).join("");
    return '<svg viewBox="0 0 600 400" ' + (small ? 'aria-hidden="true"' : 'role="img" aria-label="' + escape(v.title) + ' চিত্র"') + ">" + v.svg + marks + "</svg>";
  }

  function renderList() {
    const cls = classSel.value;
    const subject = subjectSel.value;
    const items = VISUAL_LESSONS.filter((v) => (!cls || v.classIds.includes(cls)) && (!subject || v.subject === subject));
    list.innerHTML = items.map((v) => '<button type="button" class="visual-card' + (current?.id === v.id ? " is-current" : "") + '" data-visual="' + v.id + '">'
      + '<span class="visual-thumb">' + drawing(v, true) + "</span><span class=\"note-subject\">" + escape(SUBJECTS[v.subject]?.name ?? "") + " · " + escape(classLabel(v)) + "</span>"
      + "<strong>" + escape(v.title) + "</strong><span class=\"muted\">" + bn(v.parts.length) + "টি অংশ" + (best[v.id] != null ? " · সেরা স্কোর " + bn(best[v.id]) + "/" + bn(v.parts.length) : "") + "</span></button>").join("")
      || '<p class="muted">এই বাছাইয়ে এখনো চিত্র নেই। অন্য শ্রেণি বা বিষয় বেছে দেখুন।</p>';
  }

  function select(i) {
    active = i;
    work.querySelectorAll(".vl-mark").forEach((g) => g.classList.toggle("is-active", Number(g.dataset.i) === i));
    work.querySelectorAll(".visual-legend li").forEach((li) => li.classList.toggle("is-active", Number(li.dataset.i) === i));
    const info = get("visualInfo");
    if (!info || mode !== "learn") return;
    const part = current.parts[i];
    info.innerHTML = "<h3>" + bn(i + 1) + ". " + escape(part.name) + "</h3><p>" + escape(part.tip) + "</p>";
  }

  function side() {
    const v = current;
    if (mode === "learn") {
      return '<ol class="visual-legend">' + v.parts.map((p, i) => '<li data-i="' + i + '"><button type="button" data-pick="' + i + '"><b>' + bn(i + 1) + "</b>" + escape(p.name) + "</button></li>").join("") + "</ol>"
        + '<div class="visual-info" id="visualInfo" aria-live="polite"><p class="muted">চিত্রের যেকোনো নম্বরে বা তালিকার নামে চাপ দিন, ওই অংশের কাজ এখানে দেখাবে।</p></div>'
        + '<button type="button" class="btn btn-primary" data-mode="quiz">এবার নিজেকে যাচাই করুন</button>';
    }
    const names = v.parts.map((p) => p.name).sort(() => Math.random() - 0.5);
    return '<p class="muted">প্রতিটি নম্বরের পাশে সঠিক নাম বেছে নিন, তারপর মিলিয়ে দেখুন।</p><form id="visualQuiz" class="visual-quiz">'
      + v.parts.map((p, i) => '<label data-i="' + i + '"><b>' + bn(i + 1) + '</b><select data-q="' + i + '" required><option value="">নাম বাছুন</option>'
        + names.map((n) => '<option value="' + escape(n) + '">' + escape(n) + "</option>").join("") + '</select><span class="visual-mark" aria-live="polite"></span></label>').join("")
      + '<p id="visualScore" class="visual-score" role="status"></p><div class="actions"><button class="btn btn-primary" type="submit">মিলিয়ে দেখুন</button>'
      + '<button class="btn btn-secondary" type="button" data-mode="learn">আবার শিখুন</button></div></form>';
  }

  function open(idValue, scroll) {
    current = VISUAL_LESSONS.find((v) => v.id === idValue) ?? null;
    if (!current) { work.hidden = true; renderList(); return; }
    active = -1;
    work.hidden = false;
    work.innerHTML = '<div class="visual-head"><div><p class="note-subject">' + escape(SUBJECTS[current.subject]?.name ?? "") + " · " + escape(classLabel(current)) + " · " + escape(current.chapter)
      + '</p><h2 id="visualTitle" tabindex="-1">' + escape(current.title) + "</h2><p>" + escape(current.intro) + '</p></div><div class="visual-modes" role="tablist">'
      + '<button type="button" role="tab" data-mode="learn" aria-selected="' + (mode === "learn") + '">শিখুন</button><button type="button" role="tab" data-mode="quiz" aria-selected="' + (mode === "quiz") + '">যাচাই করুন</button></div></div>'
      + '<div class="visual-body"><figure class="panel visual-figure' + (mode === "quiz" ? " is-quiz" : "") + '">' + drawing(current) + '<figcaption class="muted">প্রশ্নপাঠের নিজস্ব আঁকা শিক্ষামূলক চিত্র</figcaption></figure>'
      + '<div class="panel visual-side">' + side() + "</div></div>"
      + '<div class="actions visual-print"><button type="button" class="btn btn-secondary" id="visualPrint">চিত্র প্রিন্ট / PDF</button></div>';
    renderList();
    const url = new URL(location.href);
    url.searchParams.set("visual", current.id);
    history.replaceState(null, "", url);
    if (scroll) { work.scrollIntoView({ behavior: "smooth", block: "start" }); get("visualTitle").focus({ preventScroll: true }); }
  }

  function check(event) {
    event.preventDefault();
    let right = 0;
    work.querySelectorAll("select[data-q]").forEach((s) => {
      const i = Number(s.dataset.q);
      const ok = s.value === current.parts[i].name;
      if (ok) right++;
      const label = s.closest("label");
      label.dataset.ok = ok;
      label.querySelector(".visual-mark").textContent = ok ? "✓ সঠিক" : "✗ সঠিক: " + current.parts[i].name;
    });
    work.querySelectorAll(".vl-mark").forEach((g) => g.dataset.ok = work.querySelector('label[data-i="' + g.dataset.i + '"]').dataset.ok);
    const total = current.parts.length;
    const improved = best[current.id] == null || right > best[current.id];
    if (improved) { best[current.id] = right; saveBest(); renderList(); }
    get("visualScore").textContent = bn(total) + "টির মধ্যে " + bn(right) + "টি সঠিক। "
      + (right === total ? "অসাধারণ! পুরো চিত্রটি আপনার আয়ত্তে।" : right >= total / 2 ? "ভালো হয়েছে; ভুলগুলো আরেকবার শিখে নিন।" : "\"আবার শিখুন\" চেপে অংশগুলো দেখে আবার চেষ্টা করুন।");
  }

  list.addEventListener("click", (event) => {
    const card = event.target.closest("[data-visual]");
    if (card) { mode = "learn"; open(card.dataset.visual, true); }
  });
  work.addEventListener("click", (event) => {
    const modeButton = event.target.closest("[data-mode]");
    if (modeButton) { mode = modeButton.dataset.mode; open(current.id); return; }
    if (event.target.closest("#visualPrint")) { print(); return; }
    const pick = event.target.closest("[data-pick], .vl-mark");
    if (!pick) return;
    const i = Number(pick.dataset.pick ?? pick.dataset.i);
    if (mode === "learn") select(i);
    else work.querySelector('select[data-q="' + i + '"]')?.focus();
  });
  work.addEventListener("keydown", (event) => {
    const mark = event.target.closest?.(".vl-mark");
    if (mark && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); mark.dispatchEvent(new MouseEvent("click", { bubbles: true })); }
  });
  work.addEventListener("submit", check);
  work.addEventListener("change", (event) => {
    const label = event.target.closest("label[data-i]");
    if (label) { delete label.dataset.ok; label.querySelector(".visual-mark").textContent = ""; }
  });
  [classSel, subjectSel].forEach((s) => s.addEventListener("change", renderList));

  const params = PB.params();
  if (params.get("class")) classSel.value = params.get("class");
  if (params.get("subject")) subjectSel.value = params.get("subject");
  renderList();
  if (params.get("visual")) open(params.get("visual"));

  // পাঠের ছবি-গল্প: ৮ম শ্রেণির বিজ্ঞান নোটের ছবি
  const gallery = get("visualStories");
  if (gallery && typeof SCIENCE_EIGHT_VISUALS !== "undefined") {
    gallery.innerHTML = Object.entries(SCIENCE_EIGHT_VISUALS).map(([note, item]) => '<a class="tool-card visual-story" href="' + escape(PB.href("notes.html", { note })) + '">'
      + '<img src="assets/' + escape(item.image) + '" alt="" loading="lazy" width="720" height="320"><h3>' + escape(item.title) + "</h3><p>" + escape(item.context) + '</p><span class="card-link">নোটে পড়ুন →</span></a>').join("");
  }
})();

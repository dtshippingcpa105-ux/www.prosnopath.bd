(() => {
  const escape = PB.escape;
  const query = PB.id("q");
  const output = PB.id("searchResults");
  const status = PB.id("searchStatus");
  const more = PB.id("searchMore");
  const term = (PB.params().get("q") ?? "").slice(0, 100).trim();
  query.value = term;

  if (!PB.normalize(term)) {
    status.textContent = "খুঁজতে কোনো শ্রেণি, বিষয়, অধ্যায় বা বইয়ের নাম লিখুন।";
    return;
  }

  const matches = [];
  const classAliases = {
    c5: "পঞ্চম class 5", c6: "ষষ্ঠ class 6", c7: "সপ্তম class 7", c8: "অষ্টম class 8",
    c9: "৯ম শ্রেণি ১০ম শ্রেণি নবম দশম এসএসসি SSC class 9 class 10",
    c11: "১১শ শ্রেণি ১২শ শ্রেণি একাদশ দ্বাদশ এইচএসসি HSC class 11 class 12"
  };
  for (const item of CLASSES) {
    if (PB.matches(item.name + " " + classAliases[item.id], term)) {
      matches.push({
        href: PB.href("question-bank.html", { class: item.id }),
        title: item.name, description: "শ্রেণির প্রশ্নব্যাংক"
      });
    }
  }
  for (const section of PB.entries()) {
    const grade = PB.classById(section.classId).name;
    const subject = SUBJECTS[section.subjectId];
    const context = [grade, classAliases[section.classId], subject.name, subject.en, section.chapter].join(" ");
    if (section.noteId && PB.matches(context + " নোট", term)) {
      matches.push({ href: PB.href("notes.html", { note: section.noteId }), title: section.chapter,
        description: grade + " · " + subject.name + " · অধ্যায়ের নোট" });
    }
    const items = [...section.mcq, ...section.short];
    if (!PB.matches(context, term) && !items.some((item) => PB.matches(context + " " + item.q, term))) continue;
    matches.push({
      href: PB.href("question-bank.html", { class: section.classId, subject: section.subjectId, chapter: section.chapter }),
      title: section.chapter, description: grade + " · " + subject.name + " · অনুশীলনী"
    });
  }
  if (PB.matches("এনসিটিবি NCTB পাঠ্যবই পাঠ্যপুস্তক বই textbooks ২০২৬ শিক্ষাবর্ষ", term)) {
    matches.push({ href: PB.href("textbooks.html"), title: "NCTB পাঠ্যবই", description: "২০২৬ শিক্ষাবর্ষের সরকারি বইয়ের তালিকা" });
  }
  for (const book of PB.archive()) {
    const context = [book.title, book.year, PB.bookClass(book.class), PB.bookLevels[book.level]].join(" ");
    if (!PB.matches(context, term)) continue;
    matches.push({
      href: book.url, title: book.title,
      description: "সংরক্ষিত বই · " + PB.bn(book.year) + " · " + PB.bookClass(book.class)
    });
  }

  if (!matches.length) {
    status.textContent = "“" + term + "” লিখে কোনো ফলাফল পাওয়া যায়নি।";
    output.innerHTML = '<p class="status-box">আরও ছোট শব্দ দিয়ে চেষ্টা করুন, যেমন “গণিত” বা “ভগ্নাংশ”।</p>';
    return;
  }

  output.classList.add("resource-list");
  let shown = 0;
  function appendResults(moveFocus = false) {
    const start = shown;
    const page = matches.slice(start, start + 20);
    output.insertAdjacentHTML("beforeend", page.map((item) =>
      '<a class="panel resource-item result-link" href="' + escape(item.href) + '"><div><h3>'
      + escape(item.title) + '</h3><p>' + escape(item.description)
      + '</p></div><span aria-hidden="true">→</span></a>').join(""));
    shown += page.length;
    status.textContent = "“" + term + "” এর জন্য " + PB.bn(matches.length) + "টি ফল, দেখানো হচ্ছে " + PB.bn(shown) + "টি।";
    more.hidden = shown >= matches.length;
    if (moveFocus) output.children[start]?.focus();
  }

  appendResults();
  more.addEventListener("click", () => appendResults(true));
})();

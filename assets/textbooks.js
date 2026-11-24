(() => {
  const form = PB.id("bookFilters");
  const year = PB.id("bookYear");
  const level = PB.id("bookLevel");
  const grade = PB.id("bookClass");
  const query = PB.id("bookQuery");
  const results = PB.id("bookResults");
  const status = PB.id("bookStatus");
  const more = PB.id("bookMore");
  const archive = PB.archive().sort((a, b) => b.year - a.year || a.title.localeCompare(b.title, "bn"));
  const params = PB.params();
  const pageSize = 20;
  let matches = [];
  let offset = 0;

  function setupShelf(shelf) {
    const stage = shelf.querySelector(".book-shelf-stage");
    const controls = shelf.querySelector(".book-shelf-controls");
    const status = controls.querySelector(".shelf-edition");
    const covers = Array.from(stage.querySelectorAll("[data-book-year]"));
    const links = shelf.querySelectorAll("[data-shelf-link]");
    let activeIndex = 0;
    let swipeStart;
    let ignoreSwipeClick = false;

    function selectCover(index) {
      activeIndex = (index + covers.length) % covers.length;
      const rightIndex = (activeIndex + 1) % covers.length;
      const activeYear = covers[activeIndex].dataset.bookYear;

      covers.forEach((cover, i) => {
        cover.dataset.position = i === activeIndex ? "center" : i === rightIndex ? "right" : "left";
        cover.setAttribute("aria-pressed", String(i === activeIndex));
      });
      links.forEach((link) => { link.hidden = link.dataset.shelfLink !== activeYear; });
      const caption = PB.bn(activeYear) + " শিক্ষাবর্ষ";
      if (status.textContent !== caption) status.textContent = caption;
    }

    covers.forEach((cover, i) => {
      cover.disabled = false;
      cover.addEventListener("click", (event) => {
        // A touch swipe may also produce a click on its starting cover.
        if (ignoreSwipeClick && event.detail > 0) return;
        selectCover(i);
      });
    });
    controls.querySelectorAll("[data-shelf-step]").forEach((arrow) => {
      arrow.addEventListener("click", () => selectCover(activeIndex + Number(arrow.dataset.shelfStep)));
    });
    stage.parentElement.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      selectCover(activeIndex + (event.key === "ArrowLeft" ? -1 : 1));
      if (stage.contains(event.target)) covers[activeIndex].focus();
    });
    stage.addEventListener("pointerdown", (event) => {
      if (!event.isPrimary) return;
      ignoreSwipeClick = false;
      if (event.pointerType === "mouse") return;
      swipeStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
    });
    stage.addEventListener("pointerup", (event) => {
      if (event.pointerId !== swipeStart?.id) return;
      const dx = event.clientX - swipeStart.x;
      const dy = event.clientY - swipeStart.y;
      swipeStart = undefined;
      if (Math.abs(dx) < 35 || Math.abs(dx) <= Math.abs(dy)) return;
      ignoreSwipeClick = true;
      selectCover(activeIndex + (dx < 0 ? 1 : -1));
    });
    stage.addEventListener("pointercancel", (event) => {
      if (event.pointerId === swipeStart?.id) swipeStart = undefined;
    });

    const requested = covers.findIndex((cover) => cover.dataset.bookYear === params.get("year"));
    selectCover(Math.max(0, requested));
    controls.hidden = false;
  }

  function filterByEdition(item) {
    return (!year.value || item.year === Number(year.value)) && (!level.value || item.level === level.value);
  }

  function updateClasses(selected = grade.value) {
    const grades = [...new Set(archive.filter(filterByEdition).map((item) => item.class))];
    grades.sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
    PB.select(grade, [["", "সব শ্রেণি"], ...grades.map((value) => [value, PB.bookClass(value)])], selected);
  }

  function card(item) {
    const esc = PB.escape;
    return '<article class="panel resource-item"><div><h3>' + esc(item.title) + '</h3><p>'
      + [PB.bn(item.year), PB.bookLevels[item.level] ?? item.level, PB.bookClass(item.class)].map(esc).join(" · ")
      + '</p></div><div class="actions"><a href="' + esc(item.url) + '" aria-label="বইয়ের লিংক: ' + esc(item.title)
      + '">বইয়ের লিংক ↗</a><a href="' + esc(item.source) + '" aria-label="সংরক্ষিত তালিকা: ' + esc(item.title)
      + '">সংরক্ষিত তালিকা ↗</a></div></article>';
  }

  function appendResults(moveFocus = false) {
    const start = offset;
    const page = matches.slice(start, start + pageSize);
    results.insertAdjacentHTML("beforeend", page.map(card).join(""));
    offset += page.length;
    status.textContent = PB.bn(matches.length) + "টি লিংকের মধ্যে " + PB.bn(offset) + "টি দেখানো হচ্ছে।";
    more.hidden = offset >= matches.length;
    if (moveFocus) results.children[start]?.querySelector("a")?.focus();
  }

  function render() {
    matches = archive.filter((item) => filterByEdition(item) && (!grade.value || item.class === grade.value)
      && PB.matches(item.title, query.value));
    offset = 0;
    results.replaceChildren();
    if (!matches.length) {
      status.textContent = "এই ফিল্টারে কোনো বই পাওয়া যায়নি।";
      more.hidden = true;
      return;
    }
    appendResults();
  }

  const years = [...new Set(archive.map((item) => item.year))].map(String);
  const levels = [...new Set(archive.map((item) => item.level))];
  PB.select(year, [["", "সব শিক্ষাবর্ষ"], ...years.map((value) => [value, PB.bn(value)])], params.get("year"));
  PB.select(level, [["", "সব শিক্ষাধারা"], ...levels.map((value) => [value, PB.bookLevels[value] ?? value])], params.get("level"));
  updateClasses(params.get("class"));
  query.value = (params.get("q") ?? "").slice(0, 100);
  render();
  setupShelf(PB.id("bookShelf"));

  form.addEventListener("submit", (event) => event.preventDefault());
  year.addEventListener("change", () => { updateClasses(); render(); });
  level.addEventListener("change", () => { updateClasses(); render(); });
  grade.addEventListener("change", render);
  query.addEventListener("input", render);
  form.addEventListener("reset", () => {
    requestAnimationFrame(() => { updateClasses(""); render(); });
  });
  more.addEventListener("click", () => appendResults(true));
})();

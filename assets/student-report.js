function renderStudentModelBreakdown(container, breakdown) {
  container.replaceChildren();
  const visible = Boolean(breakdown?.subjects.length || breakdown?.chapters.length);
  container.hidden = !visible;
  if (!visible) return false;

  function section(title, entries, notes) {
    if (!entries.length) return;
    const heading = document.createElement("h3");
    heading.textContent = title;
    const list = document.createElement("ul");
    list.className = "model-report-list";
    for (const entry of entries) {
      const row = document.createElement("li");
      const label = document.createElement("strong");
      label.textContent = entry.name;
      const scores = document.createElement("p");
      scores.textContent = (entry.subjectName ? entry.subjectName + " · " : "")
        + PB.bn(entry.correct) + " / " + PB.bn(entry.total) + " সঠিক · "
        + PB.bn(entry.wrong) + " ভুল · " + PB.bn(entry.skipped) + " বাদ";
      row.append(label, scores);
      if (notes && entry.correct < entry.total) {
        const link = document.createElement("a");
        link.href = PB.href("notes.html", { note: entry.id });
        link.textContent = "নোট আবার পড়ুন";
        link.setAttribute("aria-label", entry.name + " · নোট আবার পড়ুন");
        row.append(link);
      }
      list.append(row);
    }
    container.append(heading, list);
  }

  const byReviewPriority = [...breakdown.chapters].sort((a, b) =>
    (b.wrong + b.skipped) - (a.wrong + a.skipped) || b.wrong - a.wrong);
  section("বিষয়ভিত্তিক ফল", breakdown.subjects, false);
  section("অধ্যায়ভিত্তিক ফল", byReviewPriority, true);
  return true;
}

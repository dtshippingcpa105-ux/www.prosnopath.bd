// ৯ম-১০ম শ্রেণির বাড়তি বিষয়ের অধ্যায় যোগ করার সহায়ক। ssc-data.js-এর পরে লোড হয়।
// বিষয়ের ফাইলগুলো sscRegister([...]) ডেকে নিজেদের অধ্যায় যোগ করে।
if (!SUBJECTS.bangla2) SUBJECTS.bangla2 = { name: "বাংলা ২য় পত্র", en: "Bangla 2nd" };
if (!SUBJECTS.english2) SUBJECTS.english2 = { name: "ইংরেজি ২য় পত্র", en: "English 2nd" };
for (const id of ["bangla2", "english2"]) {
  if (!SUBJECTS_BY_CLASS.c9.includes(id)) {
    const after = SUBJECTS_BY_CLASS.c9.indexOf(id === "bangla2" ? "bangla1" : "english1");
    SUBJECTS_BY_CLASS.c9.splice(after + 1, 0, id);
  }
}

const SSC_BOOK = (name) => ({ label: "এনসিটিবি · নবম-দশম শ্রেণির " + name + " পাঠ্যবই (২০২৫ শিক্ষাবর্ষ থেকে নির্ধারিত)" });
const sscM = (q, options, answer, explain) => ({ q, options, answer, explain });
const sscS = (q, marks, solution, criteria) => ({ q, marks, solution, criteria });

function sscRegister(chapters) {
  const fixedLast = /সবগুলো|সব কটি|কোনোটিই|উভয়|i, ii ও iii|All of|None of/;
  for (const chapter of chapters) {
    chapter.classId = "c9";
    for (const item of chapter.mcq) {
      if (item.options.some((option) => fixedLast.test(option))) continue;
      let hash = 0;
      for (const char of item.q) hash = (hash * 31 + char.codePointAt(0)) >>> 0;
      const shift = hash % 4;
      item.options = item.options.map((_, i) => item.options[(i + shift) % 4]);
      item.answer = (item.answer - shift + 4) % 4;
    }
  }
  const ids = new Set(chapters.map((chapter) => chapter.id));
  for (let i = STUDY_CHAPTERS.length - 1; i >= 0; i--) if (ids.has(STUDY_CHAPTERS[i].id)) STUDY_CHAPTERS.splice(i, 1);
  STUDY_CHAPTERS.push(...chapters);
  for (const subjectId of new Set(chapters.map((chapter) => chapter.subjectId))) {
    const key = "c9|" + subjectId;
    const old = QUESTION_BANK[key]?.chapters ?? {};
    const ordered = {};
    for (const chapter of chapters.filter((c) => c.subjectId === subjectId).sort((a, b) => a.number - b.number)) {
      ordered[chapter.chapter] = old[chapter.chapter] ?? { mcq: [], short: [] };
    }
    for (const [name, value] of Object.entries(old)) if (!ordered[name]) ordered[name] = value;
    QUESTION_BANK[key] = { ...(QUESTION_BANK[key] ?? {}), chapters: ordered };
  }
}

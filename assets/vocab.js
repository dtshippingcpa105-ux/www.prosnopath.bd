// শব্দভান্ডার: ফ্ল্যাশকার্ড (লাইটনার পদ্ধতিতে পুনরাবৃত্তি), কুইজ, তালিকা। অগ্রগতি এই ব্রাউজারে সংরক্ষিত।
(() => {
  const get = PB.id;
  const storageKey = "proshnopath-vocab-v1";
  const posName = { n: "বিশেষ্য", v: "ক্রিয়া", adj: "বিশেষণ", adv: "ক্রিয়াবিশেষণ" };
  const gaps = [0, 1, 3, 7, 14, 30]; // বাক্স অনুযায়ী কত দিন পর আবার আসবে
  const dayMs = 86_400_000;
  const today = () => Math.floor((Date.now() + 6 * 3_600_000) / dayMs); // বাংলাদেশ সময়ে দিনের নম্বর
  const words = VOCAB_TOPICS.flatMap((topic) => topic.words.map(([word, pos, meaning, example, syn]) => ({
    key: word + "|" + pos, word, pos, meaning, example, syn, topic: topic.id, topicName: topic.name
  })));
  let topic = "";
  let progress = load();
  let queue = [];
  let current = null;
  let flipped = false;
  let quiz = { asked: 0, right: 0, item: null, locked: false };

  function load() {
    try { return JSON.parse(localStorage.getItem(storageKey)) ?? {}; } catch { return {}; }
  }
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(progress)); } catch { /* সংরক্ষণ না হলেও কাজ চলবে */ }
  }
  const inTopic = (w) => !topic || w.topic === topic;
  const state = (w) => progress[w.key] ?? { box: 0, due: 0 };
  const isDue = (w) => state(w).due <= today();
  const learned = (w) => state(w).box >= 3;

  function shuffle(list) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
    return copy;
  }

  function renderStats() {
    const seen = words.filter((w) => progress[w.key]).length;
    const done = words.filter(learned).length;
    const due = words.filter((w) => progress[w.key] && isDue(w)).length;
    get("vocabStats").innerHTML = [
      ["মোট শব্দ", words.length], ["শুরু করেছেন", seen], ["আয়ত্তে এসেছে", done], ["আজ ঝালাই", due]
    ].map(([label, n]) => '<div><strong>' + PB.bn(n) + '</strong><span>' + label + '</span></div>').join("");
  }

  function renderTopics() {
    get("vocabTopics").innerHTML = [["", "সব বিষয়"], ...VOCAB_TOPICS.map((t) => [t.id, t.name])].map(([id, name]) =>
      '<button type="button" data-topic="' + id + '" aria-pressed="' + (topic === id) + '">' + PB.escape(name) + '</button>').join("");
  }

  // আজকের সারি: আগে যেগুলোর সময় হয়েছে, তারপর নতুন শব্দ (সর্বোচ্চ ১০টি নতুন)
  function buildQueue() {
    const pool = words.filter(inTopic);
    const due = shuffle(pool.filter((w) => progress[w.key] && isDue(w)));
    const fresh = pool.filter((w) => !progress[w.key]).slice(0, 10);
    queue = [...due, ...fresh];
    get("vocabDue").textContent = queue.length
      ? "আজ " + PB.bn(due.length) + "টি ঝালাই, " + PB.bn(fresh.length) + "টি নতুন শব্দ"
      : "আজকের সব শব্দ শেষ! কাল আবার আসুন, বা অন্য বিষয় বেছে নিন।";
    nextCard();
  }

  function nextCard() {
    current = queue.shift() ?? null;
    flipped = false;
    const card = get("vocabCard");
    card.classList.remove("is-flipped");
    get("vocabKnow").disabled = get("vocabAgain").disabled = true;
    get("vocabSpeak").disabled = !current;
    if (!current) {
      get("vocabWord").textContent = "🎉";
      get("vocabPos").textContent = "";
      card.querySelector(".vocab-front small").textContent = "আজকের শব্দ শেষ হয়েছে";
      return;
    }
    card.querySelector(".vocab-front small").textContent = "কার্ডে চাপ দিয়ে অর্থ দেখুন";
    get("vocabWord").textContent = current.word;
    get("vocabPos").textContent = posName[current.pos] + " · " + current.topicName;
    get("vocabMeaning").textContent = current.meaning;
    get("vocabExample").textContent = current.example;
    get("vocabSyn").textContent = current.syn ? "সমার্থক: " + current.syn : "";
  }

  function flip() {
    if (!current) return;
    flipped = !flipped;
    get("vocabCard").classList.toggle("is-flipped", flipped);
    if (flipped) get("vocabKnow").disabled = get("vocabAgain").disabled = false;
  }

  function grade(known) {
    if (!current) return;
    const s = state(current);
    const box = known ? Math.min(gaps.length - 1, s.box + 1) : 0;
    progress[current.key] = { box, due: today() + (known ? gaps[box] : 0) };
    if (!known) queue.splice(Math.min(3, queue.length), 0, current); // একটু পরে আবার
    save();
    renderStats();
    renderList();
    nextCard();
  }

  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const say = new SpeechSynthesisUtterance(text);
    say.lang = "en-US";
    say.rate = .85;
    speechSynthesis.speak(say);
  }

  // কুইজ: ইংরেজি শব্দ দেখে বাংলা অর্থ, অথবা বাংলা অর্থ দেখে ইংরেজি শব্দ
  function nextQuiz() {
    const pool = words.filter(inTopic);
    const item = pool[Math.floor(Math.random() * pool.length)];
    const reverse = Math.random() < .4;
    const others = shuffle(pool.filter((w) => w.meaning !== item.meaning && w.word !== item.word)).slice(0, 3);
    const options = shuffle([item, ...others]);
    quiz.item = item;
    quiz.reverse = reverse;
    quiz.locked = false;
    get("vocabQuizQ").innerHTML = reverse
      ? '“<strong>' + PB.escape(item.meaning) + '</strong>”-এর ইংরেজি কোনটি?'
      : '<strong lang="en">' + PB.escape(item.word) + '</strong> শব্দের অর্থ কী?';
    get("vocabQuizOptions").innerHTML = options.map((w) => '<button type="button" data-key="' + PB.escape(w.key) + '"'
      + (reverse ? ' lang="en"' : "") + '>' + PB.escape(reverse ? w.word : w.meaning) + '</button>').join("");
    get("vocabQuizFeedback").textContent = "";
    get("vocabQuizFeedback").className = "";
  }

  function answerQuiz(key) {
    if (quiz.locked) return;
    quiz.locked = true;
    quiz.asked += 1;
    const right = key === quiz.item.key;
    if (right) quiz.right += 1;
    for (const b of get("vocabQuizOptions").querySelectorAll("button")) {
      b.disabled = true;
      if (b.dataset.key === quiz.item.key) b.dataset.state = "right";
      else if (b.dataset.key === key) b.dataset.state = "wrong";
    }
    const fb = get("vocabQuizFeedback");
    fb.className = right ? "vocab-right" : "vocab-wrong";
    fb.textContent = (right ? "সঠিক! " : "হয়নি। ") + quiz.item.word + " = " + quiz.item.meaning + " · " + quiz.item.example;
    get("vocabQuizScore").textContent = "স্কোর " + PB.bn(quiz.right) + " / " + PB.bn(quiz.asked);
    // কুইজে ভুল হলে শব্দটা ঝালাইয়ের সারিতে ফিরে আসে
    if (!right && progress[quiz.item.key]) { progress[quiz.item.key] = { box: 0, due: today() }; save(); renderStats(); }
  }

  function renderList() {
    const term = get("vocabSearch").value;
    const shown = words.filter((w) => inTopic(w) && PB.matches([w.word, w.meaning, w.syn].join(" "), term));
    get("vocabList").innerHTML = shown.map((w) => '<div class="vocab-row" data-learned="' + learned(w) + '">'
      + '<button type="button" class="vocab-say" data-say="' + PB.escape(w.word) + '" aria-label="' + PB.escape(w.word) + ' উচ্চারণ শুনুন">🔊</button>'
      + '<div><strong lang="en">' + PB.escape(w.word) + '</strong> <small>' + posName[w.pos] + '</small><span>' + PB.escape(w.meaning) + '</span>'
      + '<em lang="en">' + PB.escape(w.example) + '</em></div>'
      + (learned(w) ? '<span class="vocab-badge">আয়ত্তে</span>' : "") + '</div>').join("")
      || '<p class="muted">এই খোঁজে কোনো শব্দ পাওয়া যায়নি।</p>';
  }

  get("vocabTopics").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-topic]");
    if (!button) return;
    topic = button.dataset.topic;
    renderTopics();
    buildQueue();
    nextQuiz();
    renderList();
  });
  const card = get("vocabCard");
  card.addEventListener("click", flip);
  card.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); flip(); } });
  get("vocabKnow").addEventListener("click", () => grade(true));
  get("vocabAgain").addEventListener("click", () => grade(false));
  get("vocabSpeak").addEventListener("click", () => current && speak(current.word + ". " + current.example));
  get("vocabQuizOptions").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-key]");
    if (button) answerQuiz(button.dataset.key);
  });
  get("vocabQuizNext").addEventListener("click", nextQuiz);
  get("vocabSearch").addEventListener("input", renderList);
  get("vocabList").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-say]");
    if (button) speak(button.dataset.say);
  });
  if (!("speechSynthesis" in window)) get("vocabSpeak").hidden = true;

  renderTopics();
  renderStats();
  buildQueue();
  nextQuiz();
  renderList();
})();

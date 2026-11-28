// ৯ম-১০ম শ্রেণির ইংরেজি ১ম ও ২য় পত্র: এসএসসি প্রশ্নের ধরন অনুযায়ী দক্ষতাভিত্তিক নোট ও অনুশীলন।
// সব অনুচ্ছেদ প্রশ্নপাঠের নিজস্ব রচনা (unseen passage)।
(() => {
  const m = sscM, s = sscS;
  const e1 = (number, id, chapter, body) => ({ id, number, subjectId: "english1", chapter, source: SSC_BOOK("English For Today"), ...body });
  const e2 = (number, id, chapter, body) => ({ id, number, subjectId: "english2", chapter, source: SSC_BOOK("English Grammar and Composition"), ...body });

  const mangrove = "Passage: The Sundarbans protects millions of people living on the coast of Bangladesh. Its thick roots slow down the force of storm waves, and its trees break strong winds. When Cyclone Sidr hit in 2007, villages behind the forest suffered much less damage than open areas. The forest also gives honey, fish and timber to thousands of families. However, illegal tree cutting and rising salinity are threatening it. Experts say that the forest can survive only if local people are involved in protecting it.";
  const library = "Passage: Mitu’s village had no library. So she started one in a corner of her house with twenty old books. She lent them to children free of cost. Soon people began to donate more books. Within two years, the collection grew to five hundred books, and the union council gave her a small room. Now about sixty children visit the library every week. Mitu says, “A book is a window that never closes.”";

  sscRegister([
    // ইংরেজি ১ম পত্র
    e1(1, "ssc-en1-mcq", "Reading: Multiple Choice Questions", {
      goal: "অনুচ্ছেদ পড়ে তথ্য, শব্দের প্রসঙ্গগত অর্থ ও লেখকের মূল বক্তব্য নিয়ে বহুনির্বাচনি প্রশ্নের সঠিক উত্তর বেছে নেওয়া।",
      keyPoints: [
        "প্রথমে প্রশ্নগুলো দেখে নাও, তারপর অনুচ্ছেদ পড়ো; এতে কোন তথ্য খুঁজতে হবে তা জানা থাকে।",
        "শব্দের অর্থ জিজ্ঞাসা করলে অভিধানের সাধারণ অর্থ নয়, অনুচ্ছেদে বাক্যের প্রসঙ্গে যে অর্থ মেলে সেটি বেছে নাও।",
        "যে বিকল্পে অনুচ্ছেদে নেই এমন তথ্য বা অতিরিক্ত দাবি আছে (always, only, never), সেটি সাধারণত ভুল।"
      ],
      example: { prompt: mangrove + "\n\nWhy did villages behind the forest suffer less damage in 2007?",
        steps: ["Find the sentence about Cyclone Sidr.", "The previous sentences explain that roots slow waves and trees break winds.", "Answer: The forest reduced the force of the waves and winds."] },
      commonMistake: "অনুচ্ছেদে একই শব্দ আছে বলে বিকল্প বেছে নিয়ো না; পুরো বাক্যের অর্থ মিলছে কি না দেখো।",
      mcq: [
        m(mangrove + "\n\nWhat does the forest slow down?", ["The force of storm waves", "The flow of rivers", "The growth of trees", "The speed of boats"], 0, "Its thick roots slow down the force of storm waves."),
        m(mangrove + "\n\nThe word “threatening” in the passage means —", ["putting in danger", "protecting", "measuring", "feeding"], 0, "Tree cutting and salinity are putting the forest in danger."),
        m(mangrove + "\n\nWhich of the following is NOT mentioned as a product of the forest?", ["Rice", "Honey", "Fish", "Timber"], 0, "Rice is not mentioned."),
        m(mangrove + "\n\nAccording to experts, the forest can survive if —", ["local people help protect it", "all people leave the coast", "more timber is cut", "salinity increases"], 0, "The last sentence says so."),
        m(library + "\n\nHow many books did Mitu start her library with?", ["Twenty", "Sixty", "Five hundred", "Two hundred"], 0, "She started with twenty old books."),
        m(library + "\n\nWhat does Mitu mean by “A book is a window that never closes”?", ["Books always open new ideas and knowledge", "Books should be kept near windows", "Libraries need many windows", "Books cannot be closed"], 0, "It is a metaphor: books always show us the world.")
      ],
      short: [
        s(library + "\n\nWho gave Mitu a room, and why do you think they did so?", 2, "The union council gave her a small room (1), probably because the library had grown large and was useful to many children (1).", ["Correct information", "Reasonable explanation"]),
        s(mangrove + "\n\nMention two threats to the Sundarbans and suggest one way to reduce them.", 3, "Threats: illegal tree cutting and rising salinity (1 + 1). Solution: involving local people in protecting the forest / strict monitoring of tree cutting (1).", ["First threat", "Second threat", "Suitable solution"])
      ]
    }),

    e1(2, "ssc-en1-questions", "Reading: Answering Questions", {
      goal: "অনুচ্ছেদ থেকে প্রশ্নের উত্তর নিজের ভাষায়, সম্পূর্ণ বাক্যে ও প্রমাণসহ লেখা।",
      keyPoints: [
        "Wh-প্রশ্নের ধরন বোঝো: Why প্রশ্নে কারণ, How প্রশ্নে উপায় বা অবস্থা, What does it show প্রশ্নে অনুমান বা শিক্ষা চাওয়া হয়।",
        "অনুচ্ছেদের বাক্য হুবহু কপি না করে নিজের ভাষায় লেখো; প্রশ্নের শব্দ দিয়ে উত্তর শুরু করলে উত্তর স্পষ্ট হয়।",
        "দুই নম্বরের প্রশ্নে সাধারণত দুটি তথ্য বা একটি তথ্য ও একটি ব্যাখ্যা চাওয়া হয়।"
      ],
      example: { prompt: library + "\n\nHow did Mitu’s library grow?",
        steps: ["Look for changes over time: people donated books; it grew to 500 books; the council gave a room.", "Answer: Mitu’s library grew because people donated books, so within two years it had five hundred books and got a room from the union council."] },
      commonMistake: "এক শব্দে বা অসম্পূর্ণ বাক্যে উত্তর লিখলে নম্বর কাটা যায়।",
      mcq: [
        m("A question beginning with “Why” usually asks for —", ["a reason", "a place", "a time", "a number"], 0, "Why asks for a reason."),
        m("A question beginning with “How often” asks about —", ["frequency", "manner", "place", "reason"], 0, "How often = how many times."),
        m(library + "\n\nWhich answer is written in the best way? (Q: Why did people donate books?)", ["People donated books because they saw that Mitu’s free library was helping children.", "Because.", "Books.", "She started one."], 0, "It is complete and explains the reason."),
        m(library + "\n\nWhat quality of Mitu does the passage mainly show?", ["Generosity and initiative", "Laziness", "Greed", "Fear"], 0, "She took an initiative and lent books free of cost."),
        m("In a 2-mark answer, examiners usually look for —", ["two relevant points or a point with an explanation", "one word", "a copied paragraph", "only the question repeated"], 0, "Each mark is for one relevant point.")
      ],
      short: [
        s(library + "\n\nWhat difference has Mitu’s library made to her village? Answer in two sentences.", 2, "Children in the village now have free access to books (1). About sixty children visit it every week, so reading has become a habit for many (1).", ["First change", "Second change"]),
        s(mangrove + "\n\nWhy is the Sundarbans important for coastal people? Give two reasons.", 2, "It protects them from storms by slowing waves and breaking winds (1), and it gives honey, fish and timber that support thousands of families (1).", ["Protection", "Livelihood"])
      ]
    }),

    e1(3, "ssc-en1-gap-clues", "Gap Filling with Clues", {
      goal: "শব্দতালিকা থেকে অর্থ ও ব্যাকরণ উভয় দিক মিলিয়ে উপযুক্ত শব্দ দিয়ে শূন্যস্থান পূরণ করা।",
      keyPoints: [
        "শূন্যস্থানের আগে-পরের শব্দ দেখে কোন পদ লাগবে (noun, verb, adjective, preposition) তা ঠিক করো।",
        "Clue-এর শব্দের রূপ বদলানো যায় কি না নির্দেশনা দেখো; বদলানো গেলে কাল, বচন ও subject-verb agreement মেলাও।",
        "প্রথমে নিশ্চিত শূন্যস্থানগুলো পূরণ করো; বাকি শব্দ কম থাকলে কঠিনগুলো সহজ হয়।"
      ],
      example: { prompt: "Fill in the gaps with words from the box (protect, depend, honey, threat, survive): Thousands of families (a) — on the Sundarbans. They collect (b) — and fish. Illegal cutting is a serious (c) — to the forest.",
        steps: ["(a) after a plural subject we need a verb: depend.", "(b) something collected with fish: honey.", "(c) after “a serious” we need a noun: threat."] },
      commonMistake: "অর্থ মিললেও ব্যাকরণ না মিললে উত্তর ভুল হয়; যেমন “a serious threaten” ভুল, “a serious threat” সঠিক।",
      mcq: [
        m("Choose the right word: The children were very ___ to see the new library. (excite)", ["excited", "exciting", "excite", "excitement"], 0, "Feelings of people take -ed adjectives."),
        m("Choose the right word: Mitu has a great ___ for books. (love)", ["love", "loving", "lovely", "loved"], 0, "After “a great” a noun is needed."),
        m("Choose the right word: The forest ___ the coast from storms. (protect)", ["protects", "protect", "protecting", "protection"], 0, "Singular subject in present tense takes -s."),
        m("Choose the right word: Salinity is ___ year by year. (increase)", ["increasing", "increase", "increases", "increased to"], 0, "is + verb-ing (present continuous)."),
        m("Choose the right word: We should be ___ about the environment. (care)", ["careful", "care", "carefully", "caring for"], 0, "After be we need an adjective: careful.")
      ],
      short: [
        s("Fill in the gaps with suitable words from the box. (reading, habit, knowledge, regularly, widen)\nBooks (a) ___ our minds. A good (b) ___ of (c) ___ helps us gain (d) ___. We should read (e) ___.", 3, "(a) widen (b) habit (c) reading (d) knowledge (e) regularly", ["Award 0.5 each for (a)–(d)", "Award 1 for (e) used correctly as an adverb", "Spelling and form correct"])
      ]
    }),

    e1(4, "ssc-en1-gap-noclues", "Gap Filling without Clues", {
      goal: "কোনো শব্দতালিকা ছাড়া প্রসঙ্গ ও ব্যাকরণ দেখে নিজে উপযুক্ত শব্দ বসানো।",
      keyPoints: [
        "শূন্যস্থানে article (a, an, the), preposition, conjunction, pronoun বা verb-এর রূপ বেশি আসে।",
        "পুরো অনুচ্ছেদ একবার পড়ে বিষয় ও কাল বুঝে নাও; একই কাল সাধারণত পুরো অনুচ্ছেদে বজায় থাকে।",
        "একাধিক শব্দ সঠিক হতে পারে; অর্থ ও ব্যাকরণ মিললে বিকল্প শব্দও গ্রহণযোগ্য।"
      ],
      example: { prompt: "Fill in the gaps: Dhaka is (a) — capital of Bangladesh. It stands (b) — the bank of the Buriganga. Millions of people live (c) — work here.",
        steps: ["(a) unique capital → the.", "(b) stands on the bank → on.", "(c) joining two verbs → and."] },
      commonMistake: "Article বাদ দেওয়া বা ভুল বসানো সবচেয়ে বেশি দেখা যায়; বিশেষ্যটি নির্দিষ্ট (the) নাকি অনির্দিষ্ট (a/an) দেখো।",
      mcq: [
        m("Fill in the gap: She is ___ honest woman.", ["an", "a", "the", "no article"], 0, "Honest begins with a vowel sound."),
        m("Fill in the gap: He has been ill ___ Monday.", ["since", "for", "from", "at"], 0, "Since + point of time."),
        m("Fill in the gap: The sun rises ___ the east.", ["in", "from", "at", "on"], 0, "We say “in the east”."),
        m("Fill in the gap: Work hard, ___ you will fail.", ["or", "and", "but", "so"], 0, "Or = otherwise."),
        m("Fill in the gap: Neither Rana nor his friends ___ present.", ["were", "was", "is", "has"], 0, "The verb agrees with the nearer subject “friends”.")
      ],
      short: [
        s("Fill in the gaps with suitable words:\nOnce there lived (a) ___ old farmer in a village. He had three sons (b) ___ were very lazy. One day he called them (c) ___ his bed and told them about a treasure hidden (d) ___ the field. After his death, they dug the whole field (e) ___ found no treasure.", 3, "(a) an (b) who (c) to (d) in (e) but", ["0.5 each for (a)–(d)", "1 for (e)", "Accept other correct words (e.g. “near” for (c))"])
      ]
    }),

    e1(5, "ssc-en1-information", "Information Transfer: Table and Flow Chart", {
      goal: "অনুচ্ছেদের তথ্য সংক্ষেপে সারণি বা ফ্লো-চার্টে ঘটনাক্রম অনুযায়ী স্থানান্তর করা।",
      keyPoints: [
        "সারণির শিরোনাম দেখে কোন ধরনের তথ্য লাগবে (সাল, স্থান, কারণ, ফল) চিহ্নিত করো।",
        "ফ্লো-চার্টে ঘটনাগুলো সময়ের ক্রমে আসে; প্রতিটি ঘরে ছোট বাক্যাংশে লেখো, পুরো বাক্য দরকার নেই।",
        "অনুচ্ছেদের তথ্যের বাইরে কিছু যোগ কোরো না।"
      ],
      example: { prompt: library + "\n\nMake a flow chart of the growth of Mitu’s library in four steps.",
        steps: ["Started with 20 old books at home", "→ Lent books to children free of cost", "→ People donated more books; 500 books in two years", "→ Union council gave a room; 60 children visit weekly"] },
      commonMistake: "ফ্লো-চার্টের ঘটনাক্রম উল্টে গেলে নম্বর কাটা যায়।",
      mcq: [
        m(library + "\n\nWhich information fits the cell “Number of weekly visitors”?", ["About sixty", "Twenty", "Five hundred", "Two"], 0, "About sixty children visit every week."),
        m(library + "\n\nWhat comes first in the flow chart?", ["Mitu started with twenty old books", "The council gave a room", "Sixty children visit", "People donated books"], 0, "This happened first."),
        m(mangrove + "\n\nWhich information fits the cell “Year of Cyclone Sidr”?", ["2007", "1970", "1991", "2020"], 0, "The passage says 2007."),
        m("In a flow chart, the boxes are usually arranged according to —", ["the order of events", "the length of sentences", "alphabetical order", "the number of words"], 0, "A flow chart shows a sequence."),
        m("Information in a table should be written —", ["briefly, in key words", "as long paragraphs", "in Bangla only", "with extra opinions"], 0, "Brief, exact information is expected.")
      ],
      short: [
        s(mangrove + "\n\nComplete the table:\n(a) Name of the forest — ___\n(b) How roots help — ___\n(c) Year of the cyclone mentioned — ___\n(d) Two products — ___\n(e) Who must be involved in protection — ___", 5, "(a) The Sundarbans (b) They slow down the force of storm waves (c) 2007 (d) Any two: honey, fish, timber (e) Local people", ["(a)", "(b)", "(c)", "(d)", "(e)"].map((x) => x + " · 1 mark"))
      ]
    }),

    e1(6, "ssc-en1-summary", "Writing a Summary", {
      goal: "অনুচ্ছেদের মূলভাব ও প্রধান তথ্যগুলো নিজের ভাষায় সংক্ষেপে গুছিয়ে লেখা।",
      keyPoints: [
        "সারাংশ মূল অনুচ্ছেদের প্রায় এক-তৃতীয়াংশ বা তার কম হওয়া উচিত।",
        "উদাহরণ, পুনরাবৃত্তি ও উদ্ধৃতি বাদ দিয়ে মূল বক্তব্য, কারণ ও ফল রাখো।",
        "প্রথম বাক্যে মূলভাব দাও; নিজের মতামত যোগ কোরো না।"
      ],
      example: { prompt: mangrove + "\n\nWrite a summary.",
        steps: ["Main idea: the Sundarbans protects coastal people and supports livelihoods.", "Problem: cutting and salinity threaten it.", "Model: The Sundarbans shields coastal Bangladesh from storms and supports many families, but illegal cutting and salinity endanger it, so local people must help protect it."] },
      commonMistake: "অনুচ্ছেদের বাক্য জুড়ে জুড়ে কপি করা সারাংশ নয়।",
      mcq: [
        m("A good summary should include —", ["the main idea and key points", "every example", "the writer’s full quotations", "your personal opinion"], 0, "Only the essentials."),
        m("A summary should be written —", ["in your own words", "word for word from the passage", "in point form only", "with new information"], 0, "Paraphrase the main points."),
        m(library + "\n\nWhich is the best one-sentence summary?", ["Mitu’s small free library grew with community support and now serves many children.", "Mitu has twenty books.", "The union council has a room.", "Children like windows."], 0, "It covers the main idea."),
        m("Which should you remove from a summary?", ["Repeated examples", "The main idea", "Key results", "Important causes"], 0, "Repetition is unnecessary."),
        m("The length of a summary is usually —", ["about one-third of the passage or less", "twice the passage", "the same as the passage", "one word"], 0, "A summary is short.")
      ],
      short: [
        s(library + "\n\nWrite a summary of the passage in your own words.", 5, "Mitu started a free library at home with a few old books for village children. Donations helped it grow to five hundred books in two years, the union council gave it a room, and now many children use it every week.", ["Main idea (1)", "Growth through donations (1)", "Council’s support (1)", "Current use (1)", "Own words and conciseness (1)"])
      ]
    }),

    e1(7, "ssc-en1-rearrange", "Matching and Rearranging", {
      goal: "বাক্যাংশ মিলিয়ে অর্থপূর্ণ বাক্য গঠন এবং এলোমেলো বাক্য যুক্তিপূর্ণ ক্রমে সাজিয়ে গল্প বা অনুচ্ছেদ তৈরি করা।",
      keyPoints: [
        "Matching-এ প্রথম অংশের ব্যাকরণ (subject, tense) ও অর্থ দ্বিতীয় অংশের সঙ্গে মিলতে হবে; একটি অতিরিক্ত অংশ থাকে।",
        "Rearranging-এ প্রথম বাক্য সাধারণত পরিচয় দেয় (Once there lived…), শেষ বাক্যে ফল বা শিক্ষা থাকে।",
        "সর্বনাম (he, it, they) ও সংযোজক শব্দ (then, at last, after that) কোন বাক্য আগে-পরে বসবে তা বোঝায়।"
      ],
      example: { prompt: "Rearrange: (a) He dropped pebbles into it. (b) A thirsty crow found a pitcher. (c) At last he drank and flew away. (d) The water was too low to reach. (e) The water rose slowly.",
        steps: ["Introduction: (b).", "Problem: (d).", "Action: (a), result (e).", "End: (c). Order: b → d → a → e → c."] },
      commonMistake: "সর্বনাম যে বিশেষ্যকে বোঝায়, সেই বিশেষ্যযুক্ত বাক্যটি আগে আসবে।",
      mcq: [
        m("Which sentence most likely begins a story?", ["Once there lived a poor woodcutter in a village.", "At last he became happy.", "Then he went home.", "So he thanked the angel."], 0, "It introduces the character."),
        m("Which word signals the end of a story?", ["Finally", "Once", "First", "One day"], 0, "Finally / At last indicate the end."),
        m("Match: “If you work hard,” —", ["you will succeed.", "you succeeded yesterday.", "you are succeeded.", "succeeding you."], 0, "First conditional: If + present, will + verb."),
        m("Match: “The man who helped us” —", ["is my uncle.", "are my uncles.", "helping us.", "to my uncle."], 0, "Singular subject takes “is”."),
        m("In rearranging, a sentence with “he” should come —", ["after the sentence that names the person", "before the person is named", "always first", "always last"], 0, "A pronoun refers to a noun already mentioned.")
      ],
      short: [
        s("Rearrange the sentences to make a meaningful story:\n(a) The mouse cut the net with its teeth.\n(b) A lion caught a mouse but let it go.\n(c) The lion thanked the mouse.\n(d) One day the lion was trapped in a net.\n(e) The mouse heard the lion roar.", 5, "b → d → e → a → c", ["1 mark for each sentence in correct position"])
      ]
    }),

    e1(8, "ssc-en1-paragraph", "Writing a Paragraph", {
      goal: "প্রদত্ত প্রশ্ন বা বিষয় অনুযায়ী ১৫০–২০০ শব্দের সুসংগঠিত অনুচ্ছেদ লেখা।",
      keyPoints: [
        "অনুচ্ছেদের তিন অংশ: topic sentence (মূল বিষয়), supporting sentences (ব্যাখ্যা, উদাহরণ) এবং concluding sentence (উপসংহার)।",
        "প্রশ্নে দেওয়া সব দিক (what, why, how) উত্তরে রাখো; অনুচ্ছেদ একটানা লেখো, ভাগ করবে না।",
        "সংযোজক শব্দ (moreover, however, therefore, for example) বাক্যগুলোর মধ্যে যোগসূত্র তৈরি করে।"
      ],
      example: { prompt: "Write a paragraph on “A Rainy Day” answering: What is it like? How do people feel? What do you do?",
        steps: ["Topic sentence: A rainy day brings a different mood to our life.", "Support: sky, streets, people’s movement, feelings, your activities.", "Conclusion: Though it causes problems, a rainy day gives rest and joy."] },
      commonMistake: "প্রশ্নের একটি অংশের উত্তর বাদ পড়লে কনটেন্টের নম্বর কমে যায়।",
      mcq: [
        m("The first sentence of a paragraph that tells its main idea is called the —", ["topic sentence", "concluding sentence", "supporting detail", "title"], 0, "It introduces the topic."),
        m("Which linking word shows contrast?", ["However", "Moreover", "Therefore", "For example"], 0, "However shows contrast."),
        m("Which linking word shows result?", ["Therefore", "However", "Although", "Besides"], 0, "Therefore = as a result."),
        m("A paragraph should be written —", ["as one continuous block", "in several short points", "as a dialogue", "with headings"], 0, "A paragraph is one unit."),
        m("Which sentence is the best concluding sentence for a paragraph on tree plantation?", ["Therefore, we should plant more trees to save our environment.", "Trees are green.", "My uncle has a garden.", "Some trees are tall."], 0, "It concludes the main idea.")
      ],
      short: [
        s("Write a paragraph on “Your Daily Routine” in about 150 words.", 10, "My daily routine helps me use my time properly. I get up at 5:30 a.m., say my prayers and take a short walk. After breakfast I revise my lessons for an hour. I leave for school at 9 a.m. and attend classes until 3 p.m. After returning home, I take lunch and rest for a while. In the afternoon I play football with my friends, which keeps me fit. In the evening I do my homework and prepare the next day’s lessons. I watch the news for a short time and then have dinner with my family. I go to bed at 10 p.m. Following a routine makes me disciplined, saves time and helps me do better in my studies.", ["Topic sentence and relevance (2)", "Coverage of the day with details (4)", "Coherence and linking words (2)", "Grammar and spelling (2)"])
      ]
    }),

    e1(9, "ssc-en1-story", "Completing a Story", {
      goal: "প্রদত্ত সূচনা থেকে যৌক্তিক ঘটনাক্রম, সমস্যা ও সমাধান দিয়ে গল্প শেষ করা এবং উপযুক্ত শিরোনাম দেওয়া।",
      keyPoints: [
        "শুরুর অংশ ভালো করে পড়ে চরিত্র, স্থান ও সমস্যা বুঝে নাও; গল্প যেন সেখান থেকেই এগোয়।",
        "গল্প সাধারণত অতীত কালে লেখা হয়; কাল মিশিয়ে ফেলো না।",
        "শেষে সমস্যার সমাধান ও প্রয়োজনে একটি শিক্ষা থাকে; শিরোনাম গল্পের মূলভাব প্রকাশ করবে।"
      ],
      example: { prompt: "Complete the story: Rahim found a wallet full of money on his way to school…",
        steps: ["Develop: he checks for an ID card, feels tempted but decides to return it.", "Climax: the owner is a poor man who needed the money for his child’s treatment.", "Ending: the owner is grateful; Rahim is praised. Title: Honesty Is the Best Policy."] },
      commonMistake: "শুরুর অংশের সঙ্গে সম্পর্কহীন ঘটনা দিয়ে গল্প শেষ করা।",
      mcq: [
        m("Stories are usually written in the —", ["past tense", "future tense", "present perfect tense", "imperative mood"], 0, "Narratives use the past tense."),
        m("A good title should —", ["reflect the main idea of the story", "be very long", "name every character", "be unrelated to the story"], 0, "It reflects the theme."),
        m("The turning point of a story is called the —", ["climax", "title", "introduction", "summary"], 0, "Climax is the turning point."),
        m("Which is the best moral for a story about a boy who returns a lost wallet?", ["Honesty is the best policy.", "Slow and steady wins the race.", "Pride goes before a fall.", "Too many cooks spoil the broth."], 0, "Returning the wallet shows honesty."),
        m("Which sentence best continues: “The bus stopped suddenly in the middle of the road.”?", ["A huge tree had fallen across the road.", "I like mangoes.", "Tomorrow will be Friday.", "My sister is a doctor."], 0, "It follows logically.")
      ],
      short: [
        s("Complete the story: “It was the day of the final exam. Nila was hurrying to school when she saw an old man lying on the road…”", 10, "Nila stopped at once. The old man had fainted in the heat. She called a rickshaw puller and took the man to a nearby clinic. The doctor said that he would be fine. Nila gave the clinic his address from his pocket and ran to school. She reached the exam hall twenty minutes late. The head teacher heard her story and allowed her to sit for the exam with extra time. A few days later, the old man came to the school with his son to thank her. He turned out to be a retired teacher. Nila learnt that helping others never goes unrewarded. Title: A Late but Lucky Day.", ["Suitable title (1)", "Logical continuation (3)", "Clear ending/resolution (3)", "Language accuracy (3)"])
      ]
    }),

    e1(10, "ssc-en1-letter", "Writing Letters and Emails", {
      goal: "ব্যক্তিগত চিঠি, আনুষ্ঠানিক আবেদনপত্র ও ইমেইলের সঠিক কাঠামো ও উপযুক্ত ভাষা ব্যবহার করে লেখা।",
      keyPoints: [
        "ব্যক্তিগত চিঠির কাঠামো: ঠিকানা ও তারিখ → সম্বোধন (Dear …) → মূল অংশ → বিদায় (Yours ever/Your loving …) → নাম।",
        "আবেদনপত্রে তারিখ, প্রাপক, Subject, ‘Sir/Madam’, বিনীত ও স্পষ্ট অনুরোধ এবং ‘Yours obediently’ থাকে।",
        "ইমেইলে To, Subject ও সংক্ষিপ্ত, ভদ্র ভাষা দরকার; Subject লাইনে মূল উদ্দেশ্য লেখো।"
      ],
      example: { prompt: "Write an application to your head teacher for two days’ leave.",
        steps: ["Date, To: The Head Teacher, school name.", "Subject: Prayer for two days’ leave.", "Body: reason (fever), dates, request.", "Closing: Yours obediently, name, class, roll."] },
      commonMistake: "আনুষ্ঠানিক আবেদনে ‘Dear friend’ বা ‘Yours ever’ ব্যবহার করা।",
      mcq: [
        m("Which closing is suitable for an application to a head teacher?", ["Yours obediently", "Yours ever", "With love", "Your loving son"], 0, "Formal applications use “Yours obediently”."),
        m("In an email, the main purpose should be written in the —", ["Subject line", "CC field", "signature", "date"], 0, "The subject tells the purpose."),
        m("Which salutation suits a letter to a friend?", ["Dear Rafi,", "Sir,", "To whom it may concern,", "Respected Madam,"], 0, "Personal letters use “Dear …”."),
        m("An application must include —", ["a subject line", "a story", "a poem", "a dialogue"], 0, "The subject line states the purpose."),
        m("Which sentence is most polite for a formal request?", ["I would be grateful if you kindly granted me leave for two days.", "Give me leave now.", "I want leave.", "Leave me alone for two days."], 0, "It is polite and formal.")
      ],
      short: [
        s("Write an email to your friend describing your plan for the winter vacation.", 8, "To: rafi@example.com\nSubject: My plan for the winter vacation\n\nDear Rafi,\n\nI hope you are well. Our winter vacation starts next week, and I want to share my plan with you. First, I will visit my grandparents in Kurigram for a week. I will enjoy the foggy mornings and the date-juice there. Then I will join a computer course at our district ICT centre to improve my typing and spreadsheet skills. I also plan to read two novels and practise English writing every day.\n\nWhat are your plans? Please write back soon.\n\nYours,\nTanim", ["Email format (2)", "Clear and relevant plan (4)", "Language accuracy (2)"])
      ]
    }),

    // ইংরেজি ২য় পত্র
    e2(1, "ssc-en2-articles", "Articles", {
      goal: "a, an ও the-এর ব্যবহারবিধি বুঝে বাক্যে সঠিক article বসানো।",
      keyPoints: [
        "a/an অনির্দিষ্ট একবচন গণনযোগ্য বিশেষ্যের আগে বসে। উচ্চারণ স্বরধ্বনি দিয়ে শুরু হলে an (an hour, an honest man), ব্যঞ্জনধ্বনি দিয়ে শুরু হলে a (a university, a one-taka note)।",
        "the বসে নির্দিষ্ট বা আগে উল্লেখিত বিশেষ্য, অনন্য বস্তু (the sun), নদী-সাগর-পর্বতমালা (the Padma, the Himalayas), ধর্মগ্রন্থ, বাদ্যযন্ত্র এবং superlative degree-র আগে (the best)।",
        "সাধারণত ব্যক্তির নাম, দেশ, শহর, ভাষা, খেলা ও খাবারের নামের আগে article বসে না (He plays football. We speak Bangla.)।"
      ],
      example: { prompt: "Use articles: ___ Meghna is ___ big river. It takes ___ hour to cross it.",
        steps: ["River name → The Meghna.", "Indefinite singular → a big river.", "Vowel sound (silent h) → an hour."] },
      commonMistake: "university, European, one-এর শুরুর ধ্বনি ‘ইউ/ও’ ব্যঞ্জনধ্বনি; তাই a বসে, an নয়।",
      mcq: [
        m("He is ___ honest man.", ["an", "a", "the", "no article"], 0, "h is silent; vowel sound."),
        m("She studies at ___ university.", ["a", "an", "the", "no article"], 0, "University begins with a consonant sound /j/."),
        m("___ Padma is a long river.", ["The", "A", "An", "no article"], 0, "Names of rivers take “the”."),
        m("He is ___ best student in the class.", ["the", "a", "an", "no article"], 0, "Superlative takes “the”."),
        m("They play ___ cricket every afternoon.", ["no article", "the", "a", "an"], 0, "Names of games take no article."),
        m("I saw ___ one-eyed man.", ["a", "an", "the", "no article"], 0, "One begins with a /w/ sound.")
      ],
      short: [
        s("Use articles where necessary: (a) ___ moon moves round ___ earth. (b) He is ___ MA. (c) ___ cow is ___ useful animal. (d) I play ___ guitar.", 3, "(a) The, the (b) an (MA begins with a vowel sound) (c) The (or A), a (d) the", ["(a) both articles", "(b) and (c)", "(d)"])
      ]
    }),

    e2(2, "ssc-en2-prepositions", "Prepositions", {
      goal: "সময়, স্থান, দিক ও নির্দিষ্ট শব্দের সঙ্গে ব্যবহৃত (appropriate preposition) prepositions সঠিকভাবে বসানো।",
      keyPoints: [
        "সময়: at + নির্দিষ্ট সময় (at 9 a.m.), on + দিন/তারিখ (on Friday, on 16 December), in + মাস/বছর/ঋতু (in May, in 1971)। since + শুরুর সময়, for + সময়ের দৈর্ঘ্য।",
        "স্থান: at + ছোট নির্দিষ্ট স্থান (at the gate), in + বড় স্থান বা ভেতরে (in Dhaka, in the room), on + কোনো তলের ওপর (on the table)।",
        "কিছু শব্দের সঙ্গে নির্দিষ্ট preposition বসে: interested in, good at, afraid of, depend on, angry with (ব্যক্তি), angry at (বিষয়), consist of, prevent from।"
      ],
      example: { prompt: "Fill in: He was born ___ 2010 ___ a cold morning ___ Rangpur.",
        steps: ["Year → in 2010.", "Specific morning → on a cold morning.", "Town → in Rangpur."] },
      commonMistake: "since ও for গুলিয়ে ফেলা: since 2020 (শুরুর বিন্দু), for six years (মোট সময়)।",
      mcq: [
        m("He has lived here ___ six years.", ["for", "since", "from", "at"], 0, "For + period of time."),
        m("The meeting will start ___ 10 a.m.", ["at", "on", "in", "by"], 0, "At + exact time."),
        m("Our Victory Day is ___ 16 December.", ["on", "in", "at", "by"], 0, "On + date."),
        m("She is good ___ mathematics.", ["at", "in", "on", "of"], 0, "good at."),
        m("I am not afraid ___ dogs.", ["of", "from", "with", "at"], 0, "afraid of."),
        m("The book consists ___ ten chapters.", ["of", "in", "with", "from"], 0, "consist of.")
      ],
      short: [
        s("Fill in the gaps with appropriate prepositions: (a) He was angry ___ me. (b) Rice depends ___ rain. (c) She was absent ___ class. (d) Rain prevented us ___ going out. (e) He is interested ___ music. (f) The cat jumped ___ the wall.", 3, "(a) with (b) on (c) from (d) from (e) in (f) over/onto", ["0.5 for each correct preposition"])
      ]
    }),

    e2(3, "ssc-en2-verbs", "Right Form of Verbs", {
      goal: "কাল, subject ও বাক্যগঠন অনুযায়ী বন্ধনীর verb-এর সঠিক রূপ বসানো।",
      keyPoints: [
        "চিরন্তন সত্য ও অভ্যাস → present indefinite (The sun rises in the east.)। কাজ চলছে → present continuous। ফল এখনো বর্তমান → present perfect (I have finished my work.)।",
        "অতীতে দুটি কাজের মধ্যে যেটি আগে ঘটেছে তা past perfect হয়: The train had left before we reached the station.",
        "Modal (can, must, should) ও to-এর পরে verb-এর মূল রূপ বসে; কিছু শব্দের পরে verb + ing বসে: look forward to, be used to, avoid, enjoy, mind।",
        "It is time / It is high time-এর পরে past tense বসে (It is high time we started.)। Wish-এর পরে অবাস্তব কল্পনায় past (I wish I were a bird.)।"
      ],
      example: { prompt: "Use the right form: The patient (die) before the doctor (come).",
        steps: ["Two past actions; dying happened first.", "First action → past perfect: had died.", "Second → past indefinite: came."] },
      commonMistake: "After since + past time the main clause takes present perfect: He has been ill since he came back.",
      mcq: [
        m("The earth ___ (move) round the sun.", ["moves", "moved", "is moving", "has moved"], 0, "Universal truth: present indefinite."),
        m("I ___ (finish) my homework already.", ["have finished", "finished", "had finished", "finish"], 0, "Already + present perfect."),
        m("It is high time we ___ (leave).", ["left", "leave", "had left", "will leave"], 0, "It is high time + past."),
        m("I look forward to ___ (meet) you.", ["meeting", "meet", "met", "be meeting"], 0, "look forward to + verb-ing."),
        m("He ___ (live) here since 2015.", ["has been living", "lived", "lives", "is living"], 0, "Since + present perfect (continuous)."),
        m("I wish I ___ (be) a scientist.", ["were", "am", "was being", "have been"], 0, "Wish + were for unreal wishes.")
      ],
      short: [
        s("Use the right forms of verbs: Yesterday I (a) ___ (go) to the market. When I (b) ___ (reach) there, the shop (c) ___ (close) already. I (d) ___ (decide) to come back. Since then I (e) ___ (not go) there. I (f) ___ (go) again tomorrow.", 3, "(a) went (b) reached (c) had closed / had been closed (d) decided (e) have not gone (f) will go", ["0.5 for each correct form"])
      ]
    }),

    e2(4, "ssc-en2-agreement", "Subject–Verb Agreement", {
      goal: "Subject-এর বচন ও পুরুষ অনুযায়ী verb-এর সঠিক রূপ বেছে নেওয়া।",
      keyPoints: [
        "একবচন subject → একবচন verb (He writes.), বহুবচন subject → বহুবচন verb (They write.)। Each, every, everyone, nobody → একবচন।",
        "Either … or / Neither … nor দিয়ে যুক্ত subject-এ verb কাছের subject অনুযায়ী হয়।",
        "Subject-এর পরে with, along with, as well as থাকলে verb প্রথম subject অনুযায়ী হয়: The teacher, along with his students, is coming.",
        "The number of + plural noun → একবচন verb; A number of + plural noun → বহুবচন verb।"
      ],
      example: { prompt: "Choose: The number of students (is/are) increasing.",
        steps: ["“The number” is the real subject (singular).", "Answer: is."] },
      commonMistake: "Subject ও verb-এর মাঝে prepositional phrase থাকলে বিভ্রান্ত হওয়া: The box of pens is on the table (box একবচন)।",
      mcq: [
        m("Each of the boys ___ a prize.", ["gets", "get", "are getting", "have got"], 0, "Each takes a singular verb."),
        m("Neither the teacher nor the students ___ present.", ["were", "was", "is", "has been"], 0, "Agrees with the nearer subject (students)."),
        m("The captain, with his players, ___ arrived.", ["has", "have", "are", "were"], 0, "The verb agrees with “the captain”."),
        m("A number of people ___ waiting outside.", ["are", "is", "was", "has"], 0, "A number of + plural verb."),
        m("Bread and butter ___ my favourite breakfast.", ["is", "are", "were", "have"], 0, "Considered as one dish → singular."),
        m("Everybody ___ to be happy.", ["wants", "want", "are wanting", "have wanted"], 0, "Everybody is singular.")
      ],
      short: [
        s("Correct the errors: (a) The quality of these mangoes are good. (b) Neither of them have come. (c) Twenty miles are a long distance.", 3, "(a) The quality of these mangoes is good. (b) Neither of them has come. (c) Twenty miles is a long distance.", ["(a)", "(b)", "(c)"])
      ]
    }),

    e2(5, "ssc-en2-voice", "Voice: Active and Passive", {
      goal: "বিভিন্ন কাল ও বাক্যে active voice থেকে passive voice এবং passive থেকে active-এ রূপান্তর করা।",
      keyPoints: [
        "Passive গঠন: object → subject + be-এর কাল অনুযায়ী রূপ + past participle + by + subject (প্রয়োজনে)। He writes a letter → A letter is written by him.",
        "কাল অনুযায়ী be: present indefinite am/is/are, continuous is being, perfect has/have been, past was/were, future will be, modal + be।",
        "Imperative বাক্যে Let দিয়ে passive হয়: Open the door → Let the door be opened.",
        "প্রশ্নবোধক বাক্যে প্রশ্নের রূপ বজায় রেখে রূপান্তর করতে হয়: Who wrote it? → By whom was it written?"
      ],
      example: { prompt: "Make passive: They are building a new bridge.",
        steps: ["Object: a new bridge → subject.", "Present continuous → is being + past participle.", "A new bridge is being built by them."] },
      commonMistake: "Passive-এ past participle-এর বদলে past form ব্যবহার করা (is wrote ভুল, is written সঠিক)।",
      mcq: [
        m("Passive of “She sings a song.” is —", ["A song is sung by her.", "A song was sung by her.", "A song is sang by her.", "A song sung by her."], 0, "Present indefinite: is + past participle."),
        m("Passive of “They have finished the work.” is —", ["The work has been finished by them.", "The work is finished by them.", "The work had finished by them.", "The work have been finished by them."], 0, "Present perfect: has been + p.p."),
        m("Passive of “Close the window.” is —", ["Let the window be closed.", "The window is closed.", "The window be closed.", "Let close the window."], 0, "Imperative → Let … be + p.p."),
        m("Passive of “Who broke the glass?” is —", ["By whom was the glass broken?", "Who was broken the glass?", "By whom the glass was broken?", "Whom was the glass broken by him?"], 0, "Who → By whom, keep question form."),
        m("Passive of “We must obey the rules.” is —", ["The rules must be obeyed by us.", "The rules must obeyed by us.", "The rules must be obey by us.", "The rules are must obeyed."], 0, "Modal + be + p.p."),
        m("Active of “The thief was caught by the police.” is —", ["The police caught the thief.", "The police catches the thief.", "The police has caught the thief.", "The thief caught the police."], 0, "Past indefinite active.")
      ],
      short: [
        s("Change the voice: (a) People speak English all over the world. (b) Rina was writing a letter. (c) Do not insult the poor.", 3, "(a) English is spoken all over the world. (b) A letter was being written by Rina. (c) Let the poor not be insulted.", ["(a)", "(b)", "(c)"])
      ]
    }),

    e2(6, "ssc-en2-narration", "Narration", {
      goal: "প্রত্যক্ষ উক্তি (direct speech) থেকে পরোক্ষ উক্তি (indirect speech) এবং বিপরীতে রূপান্তরের নিয়ম প্রয়োগ করা।",
      keyPoints: [
        "Reporting verb past হলে reported speech-এর কাল পেছনে যায়: present → past, present perfect → past perfect, will → would, can → could।",
        "সর্বনাম বক্তা ও শ্রোতা অনুযায়ী বদলায়; সময়-স্থানবাচক শব্দ বদলায়: now → then, today → that day, tomorrow → the next day, here → there, this → that।",
        "প্রশ্নবোধক বাক্যে said to → asked; Wh-প্রশ্নে wh-শব্দ সংযোজক হয়, yes/no প্রশ্নে if/whether বসে এবং বাক্য assertive রূপ নেয়।",
        "অনুজ্ঞাসূচক বাক্যে said to → told/ordered/requested/advised + to + verb; নিষেধে not to।",
        "চিরন্তন সত্যের কাল বদলায় না: The teacher said that the earth moves round the sun."
      ],
      example: { prompt: "Change: He said to me, “Where are you going now?”",
        steps: ["said to → asked.", "Wh-question → where, assertive order: I was going.", "now → then. Answer: He asked me where I was going then."] },
      commonMistake: "পরোক্ষ উক্তিতে প্রশ্নের রূপ (Where was I going?) রেখে দেওয়া ভুল; assertive order দরকার।",
      mcq: [
        m("He said, “I am busy.” — Indirect:", ["He said that he was busy.", "He said that I am busy.", "He told that he is busy.", "He said that he is being busy."], 0, "am → was; I → he."),
        m("She said to me, “Do you like tea?” — Indirect:", ["She asked me if I liked tea.", "She asked me do I like tea.", "She said me that I liked tea.", "She asked if do I like tea."], 0, "Yes/no question → if + assertive order."),
        m("The teacher said to us, “Don’t make a noise.” — Indirect:", ["The teacher told us not to make a noise.", "The teacher told us don’t make a noise.", "The teacher said us not making noise.", "The teacher asked us that we not make noise."], 0, "Negative imperative → not to."),
        m("He said, “I will go tomorrow.” — Indirect:", ["He said that he would go the next day.", "He said that he will go tomorrow.", "He said that he would go tomorrow.", "He said he goes next day."], 0, "will → would; tomorrow → the next day."),
        m("The teacher said, “The sun rises in the east.” — Indirect:", ["The teacher said that the sun rises in the east.", "The teacher said that the sun rose in the east.", "The teacher said that the sun had risen in the east.", "The teacher told the sun rises in the east."], 0, "Universal truths keep the present tense.")
      ],
      short: [
        s("Change the narration: (a) Rina said to her mother, “May I go out?” (b) He said, “Alas! I have lost my purse.” (c) The doctor said to the patient, “Take rest.”", 3, "(a) Rina asked her mother if she might go out. (b) He exclaimed with sorrow that he had lost his purse. (c) The doctor advised the patient to take rest.", ["(a)", "(b)", "(c)"])
      ]
    }),

    e2(7, "ssc-en2-transformation", "Transformation of Sentences", {
      goal: "অর্থ অপরিবর্তিত রেখে assertive, negative, interrogative, exclamatory এবং simple, complex, compound ও degree-র রূপান্তর করা।",
      keyPoints: [
        "Affirmative → Negative: বিপরীত শব্দ ও not ব্যবহার (He is honest → He is not dishonest); only → none but (ব্যক্তি) বা nothing but (বস্তু); always → never।",
        "Simple → Complex: phrase-কে clause-এ রূপান্তর (Being ill, he could not come → As he was ill, he could not come)। Compound বাক্যে and, but, or, so দিয়ে দুটি স্বাধীন বাক্য যুক্ত হয়।",
        "Degree: Superlative → Comparative → Positive। Dhaka is the largest city → Dhaka is larger than any other city → No other city is as large as Dhaka.",
        "Assertive → Exclamatory: very বাদ দিয়ে How/What দিয়ে শুরু (She is very clever → How clever she is!)।"
      ],
      example: { prompt: "Make complex and compound: He worked hard to pass the exam.",
        steps: ["Complex: He worked hard so that he could pass the exam.", "Compound: He wanted to pass the exam, so he worked hard."] },
      commonMistake: "Positive degree-তে so/as … as ব্যবহারে অর্থ বদলে যায় কি না যাচাই না করা।",
      mcq: [
        m("Negative of “Only Rahim can do it.” is —", ["None but Rahim can do it.", "Nothing but Rahim can do it.", "Rahim cannot do it.", "Not only Rahim can do it."], 0, "Only (person) → None but."),
        m("Comparative of “Iron is the most useful metal.” is —", ["Iron is more useful than any other metal.", "Iron is more useful than all metal.", "Iron is useful than any metal.", "No metal is more useful than iron."], 0, "Superlative → comparative with “any other”."),
        m("Complex of “Being tired, he slept.” is —", ["As he was tired, he slept.", "He was tired and he slept.", "He slept being tired.", "Tired, he slept."], 0, "Phrase → adverb clause."),
        m("Exclamatory of “It is a very beautiful bird.” is —", ["What a beautiful bird it is!", "How a beautiful bird it is!", "What beautiful bird is it!", "How beautiful bird it is!"], 0, "What + a + adjective + noun + subject + verb."),
        m("Interrogative of “Everybody loves flowers.” is —", ["Who does not love flowers?", "Does everybody love flowers?", "Who loves flowers?", "Doesn’t nobody love flowers?"], 0, "Rhetorical question keeps the meaning."),
        m("Compound of “If you work hard, you will succeed.” is —", ["Work hard and you will succeed.", "Working hard, you will succeed.", "You will succeed working hard.", "Unless you work hard, you will succeed."], 0, "Imperative + and.")
      ],
      short: [
        s("Transform as directed: (a) He is too weak to walk. (complex) (b) No other boy in the class is as tall as Kamal. (superlative) (c) How fortunate I am! (assertive)", 3, "(a) He is so weak that he cannot walk. (b) Kamal is the tallest boy in the class. (c) I am very fortunate.", ["(a)", "(b)", "(c)"])
      ]
    }),

    e2(8, "ssc-en2-connectors", "Connectors and Linking Words", {
      goal: "যোগ, বৈপরীত্য, কারণ, ফল ও ক্রম প্রকাশকারী connectors ব্যবহার করে বাক্য ও অনুচ্ছেদকে সংগত করা।",
      keyPoints: [
        "যোগ: and, moreover, besides, in addition। বৈপরীত্য: but, however, although/though, in spite of, on the other hand।",
        "কারণ: because, since, as, due to, because of। ফল: so, therefore, as a result, consequently।",
        "ক্রম: first, then, after that, finally। although/though-এর সঙ্গে but ব্যবহার করা যায় না; in spite of/despite-এর পরে noun বা verb-ing বসে।"
      ],
      example: { prompt: "Join with a connector: It was raining. We went out.",
        steps: ["The ideas contrast.", "Although it was raining, we went out. / It was raining; however, we went out."] },
      commonMistake: "“Although he is poor, but he is honest” ভুল; although থাকলে but বসে না।",
      mcq: [
        m("___ he was ill, he attended the class.", ["Although", "Because", "So", "Therefore"], 0, "Contrast."),
        m("He was late ___ the traffic jam.", ["because of", "because", "although", "so"], 0, "because of + noun phrase."),
        m("She studied hard. ___, she passed with distinction.", ["As a result", "However", "Although", "Despite"], 0, "Result."),
        m("___ his poverty, he is happy.", ["In spite of", "Although", "Because", "Moreover"], 0, "In spite of + noun."),
        m("He is intelligent. ___, he is hardworking.", ["Moreover", "However", "Although", "Otherwise"], 0, "Addition."),
        m("Hurry up, ___ you will miss the bus.", ["otherwise", "because", "although", "moreover"], 0, "Otherwise = or else.")
      ],
      short: [
        s("Fill in the gaps with suitable connectors: (a) ___ it was cold, the children played outside. (b) He missed the train ___ he got up late. (c) She was tired; ___, she continued working. (d) First, we visited the museum; ___, we went to the zoo.", 2, "(a) Although/Though (b) because (c) however/nevertheless (d) then/after that", ["0.5 for each correct connector"])
      ]
    }),

    e2(9, "ssc-en2-tags", "Tag Questions", {
      goal: "মূল বাক্যের সঙ্গে সঠিক tag question যুক্ত করা।",
      keyPoints: [
        "হ্যাঁ-বোধক বাক্যে না-বোধক tag, না-বোধক বাক্যে হ্যাঁ-বোধক tag: He is a doctor, isn’t he? / She can’t swim, can she?",
        "Tag-এ মূল বাক্যের auxiliary verb ও subject-এর pronoun ব্যবহৃত হয়; auxiliary না থাকলে do/does/did বসে: He plays well, doesn’t he?",
        "বিশেষ ক্ষেত্র: I am → aren’t I?; Let’s → shall we?; imperative → will you?; never, hardly, seldom, nothing থাকলে বাক্য না-বোধক, তাই tag হ্যাঁ-বোধক; everybody/nobody → they।"
      ],
      example: { prompt: "Add tag: Nobody came to the party.",
        steps: ["Nobody makes the sentence negative.", "Nobody → they; past → did.", "Nobody came to the party, did they?"] },
      commonMistake: "never বা hardly-যুক্ত বাক্যকে হ্যাঁ-বোধক ভেবে না-বোধক tag দেওয়া।",
      mcq: [
        m("He likes tea, ___?", ["doesn’t he", "isn’t he", "does he", "didn’t he"], 0, "Present simple → doesn’t."),
        m("I am right, ___?", ["aren’t I", "am not I", "isn’t I", "don’t I"], 0, "Special case."),
        m("Let’s go out, ___?", ["shall we", "will you", "don’t we", "let we"], 0, "Let’s → shall we."),
        m("She never tells a lie, ___?", ["does she", "doesn’t she", "is she", "did she"], 0, "Never makes it negative."),
        m("Open the door, ___?", ["will you", "do you", "don’t you", "shall we"], 0, "Imperative → will you."),
        m("Everybody was present, ___?", ["weren’t they", "wasn’t he", "was they", "didn’t they"], 0, "Everybody → they.")
      ],
      short: [
        s("Add tag questions: (a) You have done the work. (b) He hardly comes here. (c) Don’t make a noise. (d) There is a pond near our house.", 2, "(a) haven’t you? (b) does he? (c) will you? (d) isn’t there?", ["0.5 for each correct tag"])
      ]
    }),

    e2(10, "ssc-en2-completing", "Completing Sentences", {
      goal: "শর্তবাচক বাক্য ও নির্দিষ্ট গঠন (as if, no sooner…than, unless, too…to) অনুযায়ী অসম্পূর্ণ বাক্য অর্থপূর্ণভাবে সম্পূর্ণ করা।",
      keyPoints: [
        "First conditional: If + present, will + verb (If you work hard, you will succeed)। Second: If + past, would + verb (If I were a bird, I would fly)। Third: If + past perfect, would have + p.p.।",
        "No sooner had … than; Hardly had … when: No sooner had the teacher entered the class than the students stood up.",
        "As if/as though-এর পরে অবাস্তব তুলনায় past বা were: He talks as if he were a king. Unless নিজেই না-বোধক অর্থ দেয়, তাই এর পরে not বসে না।"
      ],
      example: { prompt: "Complete: Had I known the news, ___",
        steps: ["Had I known = If I had known (third conditional).", "I would have informed you."] },
      commonMistake: "Unless-এর পরে আবার not বসানো: “Unless you do not work hard” ভুল।",
      mcq: [
        m("If I were rich, I ___ help the poor.", ["would", "will", "shall", "can"], 0, "Second conditional."),
        m("No sooner had he reached the station ___ the train left.", ["than", "when", "then", "that"], 0, "No sooner … than."),
        m("Unless you hurry, ___.", ["you will miss the train", "you will not miss the train", "you missed the train", "you do not miss the train"], 0, "Unless = if not."),
        m("He behaves as if he ___ the owner.", ["were", "is", "has been", "will be"], 0, "As if + were for unreal comparison."),
        m("If you had come earlier, you ___ him.", ["would have met", "would meet", "will meet", "had met"], 0, "Third conditional.")
      ],
      short: [
        s("Complete the sentences: (a) If it rains tomorrow, ___ (b) Hardly had we left home ___ (c) It is high time ___ (d) Make haste lest ___", 4, "(a) we will not go out. (b) when it began to rain. (c) we started our preparation. (d) you should miss the bus.", ["1 mark for each meaningful and grammatical completion"])
      ]
    }),

    e2(11, "ssc-en2-affixes", "Suffixes and Prefixes", {
      goal: "উপসর্গ (prefix) ও প্রত্যয় (suffix) যোগ করে শব্দের অর্থ ও পদ পরিবর্তন করা এবং বাক্যে সঠিক রূপ বসানো।",
      keyPoints: [
        "Prefix শব্দের আগে বসে অর্থ বদলায়: un-, in-, im-, dis-, ir-, mis- না-বোধক বা বিপরীত অর্থ দেয় (happy → unhappy, possible → impossible, regular → irregular)।",
        "Suffix শব্দের শেষে বসে পদ বদলায়: noun তৈরি -ness, -ment, -tion (kind → kindness); adjective -ful, -less, -able, -ous; adverb -ly; verb -en, -ize (short → shorten)।",
        "বাক্যে কোন পদ লাগবে তা দেখে উপযুক্ত affix বেছে নাও।"
      ],
      example: { prompt: "Use the right form: Smoking is (harm) to health. He was dismissed for his (honest).",
        steps: ["After “is” an adjective is needed → harmful.", "After “his” a noun is needed, and the meaning is negative → dishonesty."] },
      commonMistake: "পদ না মিলিয়ে affix যোগ করা; যেমন “a beauty girl” ভুল, “a beautiful girl” সঠিক।",
      mcq: [
        m("The opposite of “possible” is —", ["impossible", "unpossible", "dispossible", "inpossible"], 0, "im- before p."),
        m("The noun form of “kind” is —", ["kindness", "kindly", "kindful", "kindment"], 0, "-ness forms a noun."),
        m("Smoking is ___ (harm) to health.", ["harmful", "harmless", "harmfully", "harming"], 0, "Adjective after “is”."),
        m("The verb form of “short” is —", ["shorten", "shortly", "shortness", "shortage"], 0, "-en makes a verb."),
        m("He solved the problem ___ (easy).", ["easily", "easy", "easiness", "uneasy"], 0, "Adverb modifies the verb."),
        m("The opposite of “regular” is —", ["irregular", "unregular", "disregular", "inregular"], 0, "ir- before r.")
      ],
      short: [
        s("Use suitable affixes with the words in brackets: Education is the (a) ___ (back) of a nation. An (b) ___ (educate) nation cannot prosper. Education removes (c) ___ (ignorant) and helps (d) ___ (develop).", 2, "(a) backbone (b) uneducated (c) ignorance (d) development", ["0.5 for each correct form"])
      ]
    }),

    e2(12, "ssc-en2-punctuation", "Capitalisation and Punctuation", {
      goal: "বড় হাতের অক্ষর ও বিরামচিহ্ন (full stop, comma, question mark, exclamation mark, apostrophe, inverted comma) সঠিক স্থানে ব্যবহার করা।",
      keyPoints: [
        "বাক্যের শুরু, নামবাচক বিশেষ্য (ব্যক্তি, স্থান, দিন, মাস, ভাষা, প্রতিষ্ঠান), সর্বনাম I এবং উদ্ধৃতির প্রথম শব্দ বড় হাতের অক্ষরে শুরু হয়।",
        "Comma: তালিকায়, সম্বোধনের পরে, উদ্ধৃতির আগে এবং খণ্ডবাক্য আলাদা করতে। Question mark সরাসরি প্রশ্নের শেষে, exclamation mark আবেগের পরে।",
        "Apostrophe অধিকার ও সংক্ষিপ্ত রূপে: Rina’s book, don’t। বক্তার হুবহু কথা inverted comma-র ভেতরে থাকে।"
      ],
      example: { prompt: "Punctuate: rina said to me where are you going",
        steps: ["Capitalise Rina and the first word of the quotation.", "Comma before the quotation; question mark inside.", "Rina said to me, “Where are you going?”"] },
      commonMistake: "পরোক্ষ উক্তিতে (She asked me where I was going.) question mark দেওয়া ভুল।",
      mcq: [
        m("Which sentence is correctly capitalised?", ["We visited Cox’s Bazar in January.", "we visited cox’s bazar in january.", "We Visited Cox’s Bazar In January.", "We visited cox’s Bazar in january."], 0, "Proper nouns and the first word are capitalised."),
        m("Which punctuation mark ends a direct question?", ["Question mark", "Full stop", "Comma", "Colon"], 0, "?"),
        m("Choose the correct one:", ["Rina’s book is new.", "Rinas book is new.", "Rinas’ book is new.", "Rina,s book is new."], 0, "Possessive apostrophe."),
        m("Which needs a comma?", ["Rahim, come here.", "Rahim came here.", "He is a boy.", "I like tea."], 0, "A comma follows a name used in address."),
        m("Which is correctly punctuated?", ["She asked me where I lived.", "She asked me where I lived?", "She asked me, where I lived?", "She asked me “where I lived.”"], 0, "Indirect questions end with a full stop.")
      ],
      short: [
        s("Use capitals and punctuation marks: what a beautiful place sylhet is said nadia i want to visit the tea gardens again next december", 3, "“What a beautiful place Sylhet is!” said Nadia. “I want to visit the tea gardens again next December.”", ["Capitals: What, Sylhet, Nadia, I, December (1)", "Exclamation mark and full stops (1)", "Inverted commas and comma/structure (1)"])
      ]
    })
  ]);
})();

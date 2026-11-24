const CLASS_EIGHT_ENGLISH_MODEL = (() => {
  const eft = "English For Today (2026)";
  const grammar = "English Grammar and Composition (2026)";
  const alphabet = "abcdefghij";

  function task(q, fields) {
    const { points, required, criteria } = fields;
    const marks = points === undefined
      ? criteria.reduce((total, point) => total + point.marks, 0)
      : points * required;
    return { type: "short", classId: "c8", subjectId: "english", q, marks, ...fields };
  }

  function rubric(...criteria) {
    return criteria.map(([text, marks]) => ({ text, marks }));
  }

  function answers(entries) {
    return entries.map((entry, i) => "(" + alphabet[i] + ") " + entry).join("\n");
  }

  const bird = {
    title: "Seen Passage 1 · Read the passage and answer Questions 1–2",
    attribution: "Adapted from “The Little Bird”, English For Today, Unit 5, Lesson 1.",
    text: "Seryozha received a bird net from his uncle for his birthday. He put grain on the little board that operated the trap and waited beside it, but the birds stayed away. When he went indoors for dinner, he left the net in the garden. Later, he found a small bird struggling beneath it. His mother explained that it was a siskin and urged him to release it. Seryozha put it in a cage instead, believing he could look after it.\n\nFor two days he fed the bird, replaced its water and cleaned the cage. On the third day, he forgot about it. When he went to get fresh water, he left the cage door open. The bird flew towards the window and struck the glass it could not see. Seryozha put it back in the cage, but it was badly hurt. He stayed near it for much of the day and could hardly sleep that night. By morning the bird was dead. After this experience, he never caught another bird."
  };
  const birdReference = eft + " · Unit 5, Lesson 1, pp. 45–47";

  const birdChoices = [
    { q: "Which birthday gift sets the events of the story in motion?", options: ["A cage", "A bird net", "A bag of grain", "A picture book"], answer: 1,
      reason: "Seryozha uses the net to catch the bird." },
    { q: "Why does Seryozha put grain on the board?", options: ["To weigh the board down", "To feed a bird already in a cage", "To mark the place for his uncle", "To attract birds to the trap"], answer: 3,
      reason: "The grain serves as bait." },
    { q: "What is meant by “struggling” in the first paragraph?", options: ["Trying hard to get free", "Resting after a long flight", "Searching the ground for food", "Singing to attract another bird"], answer: 0,
      reason: "The trapped bird is trying to escape." },
    { q: "Which bird does Seryozha catch?", options: ["A sparrow", "A crow", "A siskin", "A pigeon"], answer: 2,
      reason: "His mother identifies it as a siskin." },
    { q: "When does Seryozha first fail to care for the bird?", options: ["On the evening of his birthday", "On the third day", "After the bird strikes the glass", "On both of the first two days"], answer: 1,
      reason: "He cares for the bird for two days, then forgets it on the third." },
    { q: "What does Seryozha leave open when he goes to get water?", options: ["The garden gate", "The front door", "The window", "The cage door"], answer: 3,
      reason: "The bird gets out through the open cage door." },
    { q: "What does Seryozha’s sleeplessness suggest?", options: ["He is deeply troubled by the bird’s injury.", "He is eager to use the net again.", "He expects another birthday gift.", "He thinks the bird has escaped safely."], answer: 0,
      reason: "His worry about the injured bird keeps him awake." },
    { q: "What is the most likely reason the bird flies towards the window?", options: ["It can see food on the glass.", "It is trying to get back to the cage.", "The window appears to offer a way out.", "It is following someone into the room."], answer: 2,
      reason: "The transparent pane looks like an opening to the bird." },
    { q: "Which sequence follows the story?", options: ["Injury → gift → capture", "Capture → injury → gift", "Gift → injury → capture", "Gift → capture → injury"], answer: 3,
      reason: "He receives the net, catches the bird and then the bird is injured." },
    { q: "Which idea is best supported by the story?", options: ["Good intentions alone do not protect a wild animal from harm.", "A gift should be used as soon as it is received.", "A wild bird soon becomes used to any cage.", "Looking after a pet always makes people happier."], answer: 0,
      reason: "Seryozha intends to care for the bird, but keeping it leads to suffering." }
  ];

  const dictionary = {
    title: "Seen Passage 2 · Read the passage and answer Questions 3–4",
    attribution: "Adapted from “Using a Dictionary” and “Looking up Words in a Dictionary”, English For Today, Unit 4.",
    text: "When you meet an unfamiliar word, a dictionary can help you check its spelling and pronunciation. Entries in a print dictionary follow alphabetical order. If two words begin with the same letter, compare the next letter, and keep comparing until you find a difference. The words at the top of a page help you find the right section quickly.\n\nAn entry does more than give a meaning. It may identify the word class and show a clear example sentence. A list of synonyms gives words with similar meanings, while antonyms express opposite meanings. Entries may also show how prefixes and suffixes change a base word. For common verbs, a dictionary can help you check the past form and the past participle. Learning how to read an entry helps you use a word accurately in your own writing."
  };
  const dictionaryReference = eft + " · Unit 4, pp. 39–40";

  const repair = {
    title: "Unseen Passage · Read the passage and answer Questions 5–7",
    text: "On 12 January, the students of Shapla High School opened a repair corner on the library veranda. They wanted to keep useful things in service for longer. The corner opens on Thursdays after lessons. Their mentor, the school caretaker, helps them check which repairs are safe for students. Pupils may bring torn notebooks, bags with loose straps or damaged rulers. Electrical items are turned away.\n\nAt the desk, a volunteer records each item in a logbook and gives its owner a numbered ticket. Small parts are stored in labelled jars so that they are easy to find. During the first month, the group received 28 items and repaired 19 of them. Repairing everything was never the aim. Some items needed a skilled worker, and others could only be used for parts. The volunteers now plan to run short demonstrations so that younger pupils can learn to carry out simple repairs themselves."
  };

  const poems = [
    ["In “The Field of the Embroidered Quilt”, why does the speaker ask her mother to put the quilt on her grave?",
      "The quilt holds the record of her grief and love. She hopes that her pain and Rupai’s pain can meet there and find relief.", "p. 5"],
    ["In “The Children’s Songs”, what kind of strength do the children ask for, and how would they use it?",
      "They ask for strength that does not harm the weak. They want to use it to comfort people who are suffering.", "pp. 11–12"],
    ["How does the poet give sunshine and rain human qualities in “The Little Plant”?",
      "The sunshine and the raindrop speak to the plant as though they were people. They call it to wake and begin growing.", "p. 19"],
    ["In “Ode on Solitude”, name two ways the land or trees meet the happy man’s needs.",
      "His fields provide food in the form of bread, and his trees provide shade in summer or fuel in winter. Other supported examples include milk from his herd and clothing from his flock.", "pp. 22–23"],
    ["In “Something Told the Wild Geese”, how does the warmth of the scene contrast with the birds’ sense of what lies ahead?",
      "The fields still look golden and the geese feel warmth, but the birds sense that snow, frost or ice is coming. The contrast explains why they leave before winter arrives.", "p. 49"],
    ["Give one city image and one image from nature in “Green Escape” to show the change the speaker seeks.",
      "The crowded streets or tall buildings show what the speaker leaves behind. The grassy place with humming bees or the marsh with a wild swan shows where the speaker wants to be.", "pp. 50–51"],
    ["Why is the poem “The News” humorous even though it sounds like a news bulletin?",
      "It uses the serious announcement style of a bulletin to report on imaginary shoes with impossible habits. This contrast makes the report funny.", "pp. 106–107"]
  ];

  const reading = [
    task("Choose the best answer from the alternatives.", {
      points: 0.5, required: 10, passage: bird, parts: birdChoices, reference: birdReference,
      solution: answers(birdChoices.map(({ options, answer, reason }) => "ABCD"[answer] + ". " + options[answer] + " — " + reason))
    }),
    task("Answer the following questions in your own words.", {
      points: 2, required: 4, reference: birdReference,
      parts: [
        "Why did the birds stay away at first, and when did Seryozha find that one had been caught?",
        "Describe two things Seryozha did to care for the bird during the first two days.",
        "How did his mother’s advice differ from his own plan for the bird?",
        "What decision did Seryozha make after the bird died, and what does it suggest he had learnt?"
      ],
      solution: answers([
        "The birds stayed away because he was waiting by the trap (1). He found the bird when he returned after dinner (1).",
        "Any two of these actions earn 1 mark each: he gave it food, replaced its water or cleaned the cage.",
        "His mother wanted him to release it (1). He planned to keep it in a cage and care for it there (1).",
        "He did not catch another bird (1). His decision suggests that he understood the harm that trapping a wild bird could cause (1)."
      ])
    }),
    task("Complete the text with one suitable word from Seen Passage 2 in each gap.", {
      points: 0.5, required: 5, passage: dictionary, reference: dictionaryReference,
      prompt: "A print dictionary arranges its entries in (a) _____ order. It can tell a reader how to spell a word and check its (b) _____. An (c) _____ sentence shows how the word is used. Some entries show how (d) _____ and suffixes alter a base word. Readers can also check the (e) _____ form and past participle of common verbs.",
      solution: answers(["alphabetical", "pronunciation", "example", "prefixes", "past"])
    }),
    task("Give a synonym or an antonym as directed. Keep the meaning in the passage in mind.", {
      points: 0.5, required: 5, reference: dictionaryReference,
      parts: ["unfamiliar (antonym)", "quickly (synonym)", "clear (synonym)", "similar (antonym)", "accurately (synonym)"],
      solution: answers(["familiar", "rapidly / swiftly", "easy to understand / plain", "different / dissimilar", "correctly / precisely"])
    }),
    task("Complete the table with information from the unseen passage.", {
      points: 1, required: 5, passage: repair,
      table: { headings: ["Information required", "Answer"],
        rows: [["(a) Opening date", "__________"], ["(b) Location at the school", "__________"],
          ["(c) Day of the week the corner opens", "__________"], ["(d) The volunteers’ mentor", "__________"],
          ["(e) Number of items repaired in the first month", "__________"]] },
      solution: answers(["12 January", "The library veranda", "Thursday / Thursdays", "The school caretaker", "19"])
    }),
    task("Write a summary of the unseen passage in your own words.", {
      criteria: rubric(["Main idea of the repair corner", 1], ["Key details on how it works and what the volunteers achieved or plan to do", 2],
        ["Coherent and concise organisation in own words", 1], ["Accuracy and clarity of language", 1]),
      solution: "Students at Shapla High School run a weekly repair corner to make useful items last longer. With guidance from the caretaker, they record items and deal with simple, safe repairs. They repaired 19 items in the first month and plan to teach younger pupils basic repair skills."
    }),
    task("Match the beginnings in Column A with the endings in Column B. There is one extra ending.", {
      points: 1, required: 4,
      table: { headings: ["Column A", "Column B"],
        rows: [["(a) The numbered ticket", "(i) keep small parts easy to find."],
          ["(b) The labelled jars", "(ii) require a skilled worker in some cases."],
          ["(c) The planned demonstrations", "(iii) is given to the owner at the desk."],
          ["(d) Some items", "(iv) are designed to teach younger pupils."],
          ["", "(v) closes immediately after lessons."]] },
      solution: answers(["(iii)", "(i)", "(iv)", "(ii)"])
    }),
    task("Answer any four of the following seven questions from the poems in English For Today.", {
      points: 2, required: 4, parts: poems.map(([q]) => q),
      solution: answers(poems.map(([,answer,page]) => answer + " [" + eft + ", " + page + "]"))
        + "\n\nAward 1 mark for a relevant idea and 1 mark for the supporting detail or explanation the question asks for. In (d) and (f), award 1 mark for each suitable example. Assess four answers only."
    })
  ];

  const grammarItems = [
    task("Fill in the gaps with words from the box. Use each word once.", {
      points: 0.5, required: 10, reference: grammar + " · Units 1 and 3",
      wordBank: ["a", "an", "at", "before", "carefully", "for", "of", "on", "the", "with"],
      prompt: "(a) _____ Monday, our class opened (b) _____ small reading corner. We placed it (c) _____ the back of the room. The head teacher brought (d) _____ illustrated dictionary. She asked us to handle each book (e) _____ and return it (f) _____ the end of the day. A notebook was kept (g) _____ recording the names of borrowers. Rupa worked (h) _____ Nabil to make a list (i) _____ new books. They pinned (j) _____ list beside the shelf.",
      solution: answers(["On", "a", "at", "an", "carefully", "before", "for", "with", "of", "the"])
    }),
    task("Make five meaningful sentences using the substitution table. Use each entry once.", {
      points: 1, required: 5, reference: grammar + " · Units 5 and 7",
      table: { headings: ["Subject", "Verb", "Rest of sentence"],
        rows: [
          ["A rain gauge", "help", "where clouds are moving."],
          ["A thermometer", "gives", "how much rain has fallen."],
          ["Cloud maps", "measures", "an idea of likely weather."],
          ["A weather forecast", "show", "people prepare for dangerous conditions."],
          ["Weather warnings", "records", "air temperature."]
        ] },
      solution: answers([
        "A rain gauge records how much rain has fallen.", "A thermometer measures air temperature.",
        "Cloud maps show where clouds are moving.", "A weather forecast gives an idea of likely weather.",
        "Weather warnings help people prepare for dangerous conditions."
      ]) + "\n\nAward 1 mark for each complete and meaningful sentence. Accept other sensible combinations that follow the one-use rule."
    }),
    task("Complete the text with the correct forms of the verbs in brackets.", {
      points: 0.5, required: 10, reference: grammar + " · Units 5 and 6",
      prompt: "Yesterday, our class (a) _____ (visit) a seed bank. When we arrived, the guide (b) _____ (wait) for us at the gate. She told us that the seed bank first (c) _____ (open) in 2018. Today the building still (d) _____ (contain) hundreds of jars. During our visit, we (e) _____ (not touch) them because the labels were delicate. While she (f) _____ (show) us the labels, I made a sketch. As a rule, each jar (g) _____ (have) a separate number. This makes it easy (h) _____ (find) a seed. Since that visit, our group (i) _____ (start) its own plant record. We plan (j) _____ (share) the record with the next class.",
      solution: answers(["visited", "was waiting", "opened / was opened", "contains", "did not touch / didn’t touch",
        "was showing / showed", "has", "to find", "has started", "to share"])
    }),
    task("Rewrite the sentences as directed. Keep the core meaning when you change sentence type.", {
      points: 1, required: 10, reference: grammar + " · Units 5 and 7",
      parts: [
        "He takes the bus to school. (Change to the simple past.)",
        "They plant trees beside the road. (Change to the simple future.)",
        "Nila did not forget her umbrella. (Change to affirmative.)",
        "Only club members may enter this room. (Change to negative.)",
        "The volunteers have finished the work. (Change to interrogative.)",
        "You should write your name at the top. (Change to imperative.)",
        "It is a very useful invention. (Change to exclamatory.)",
        "What a patient teacher she is! (Change to assertive.)",
        "I pray that you may live a long life. (Change to optative.)",
        "Please lend me your notebook. (Change to assertive.)"
      ],
      solution: answers([
        "He took the bus to school.", "They will plant trees beside the road.", "Nila remembered her umbrella.",
        "No one except club members may enter this room.", "Have the volunteers finished the work?",
        "Write your name at the top.", "What a useful invention it is!", "She is a very patient teacher.",
        "May you live a long life!", "I request you to lend me your notebook."
      ]) + "\n\nAccept another grammatically correct form that follows the instruction and preserves the core meaning."
    }),
    task("Rewrite the passage using the necessary capital letters and sentence-ending punctuation.", {
      points: 0.5, required: 10, reference: grammar + " · Unit 11, p. 180 onward",
      prompt: "last friday the members of our science club visited sonargaon we carried a map, a camera and two notebooks after lunch we took a group photo did everyone enjoy the trip",
      solution: "Last Friday the members of our science club visited Sonargaon. We carried a map, a camera and two notebooks. After lunch we took a group photo. Did everyone enjoy the trip?\n\nAward 0.5 for each of 10 corrections: six capital letters (Last, Friday, Sonargaon, We, After, Did), three full stops (after Sonargaon, notebooks and photo), and the question mark at the end. Optional commas do not affect the score."
    })
  ];

  const writing = [
    task("Write a formal email to your head teacher requesting permission to start a weekly English speaking club. Include when and where it could meet, what students would do and how it would be supervised.", {
      reference: grammar + " · Writing email, pp. 204–207",
      criteria: rubric(["Email conventions and appropriate tone", 2], ["Clear request and relevant details about activity, schedule, place and supervision", 4],
        ["Coherence and language accuracy", 2]),
      solution: "To: headteacher@example.org\nSubject: Permission to start a weekly English speaking club\n\nDear Head Teacher,\n\nI am writing on behalf of Class 8 to request permission to start an English speaking club. We would like to meet in Room 8 on Thursdays after lessons for thirty minutes. Members could practise short conversations, give two-minute talks and take turns receiving supportive feedback.\n\nOur English teacher has agreed to supervise the meetings if you approve the plan. We will prepare a schedule, keep an attendance record and leave the room tidy.\n\nI would be grateful for your permission to use the room and begin next month.\n\nYours faithfully,\nRafi Ahmed\nClass 8"
    }),
    task("Complete the story below in your own words. Give it a suitable title.", {
      prompt: "The school exhibition was about to open. Anika and her friends had built a model of a bridge. When they lifted it onto the display table, one support broke. Anika looked at the broken support, a pile of scrap cardboard and the clock on the wall…",
      criteria: rubric(["Suitable title", 1], ["A continuation that follows the opening and develops the problem", 3],
        ["Plausible resolution and a satisfying ending", 3], ["Clear organisation and language accuracy", 3]),
      solution: "A Bridge Worth Explaining\n\nAnika asked her friends to put the model down before another support broke. They had only fifteen minutes, so they inspected the broken leg together. It was made from a long strip of flat cardboard that bent under the weight of the bridge. One friend suggested folding the scrap cardboard into a triangular column. Another marked the place where the old leg had failed. They repaired the model and tested it with a few light blocks before putting it back on the table.\n\nWhen the visitors arrived, Anika did not hide the first support. She put it beside the new one and asked visitors to compare the two shapes. Several younger pupils tried bending the leftover strips and explained what they noticed. By the end of the exhibition, the broken part had become the most useful thing on the table. The group went home proud that it had turned a mistake into a lesson."
    }),
    task("Write a short composition in 200 words on “Using the Internet Responsibly”.", {
      reference: grammar + " · Developing Composition, pp. 209–210",
      criteria: rubric(["Clear focus and relevant ideas", 4], ["Development with effective examples", 3],
        ["Logical paragraphing, cohesion and conclusion", 3], ["Language accuracy and appropriate vocabulary", 2]),
      solution: "A message can reach hundreds of people before anyone asks whether it is true. For a student, using the internet responsibly means getting the benefits of quick communication without spreading confusion or causing harm.\n\nThe first habit is to check information before sharing it. If a post says that school will close tomorrow, I should look for an official notice and check its date. An old photograph or a convincing headline is not enough evidence. When I cannot confirm a claim, I can leave it unshared.\n\nAnother responsibility is to respect privacy. I should ask before posting a classmate’s photograph and avoid sharing anyone’s address or personal messages. In a group discussion, I can disagree with an idea politely without insulting the person who expressed it. If a message makes me feel unsafe, I can show it to a trusted adult.\n\nThe internet is also a place to learn. It helps me find explanations, compare sources and work with classmates. Setting aside time for homework and rest keeps a useful tool from becoming a distraction.\n\nResponsible online behaviour begins with small decisions. Checking facts, protecting privacy and thinking before replying help make online spaces safer and more useful for everyone."
    })
  ];

  const groups = [
    { label: "Part A · Reading", start: 1, items: reading },
    { label: "Part B · Grammar", start: 9, items: grammarItems },
    { label: "Part C · Writing", start: 14, items: writing }
  ];

  return {
    subject: "english", number: 1, subjectCode: 107, minutes: 180, groups,
    totalMarks: groups.flatMap(({ items }) => items).reduce((total, item) => total + item.marks, 0),
    summary: "Reading, Grammar ও Writing মিলিয়ে ",
    instructions: "Answer all numbered questions. For Question 8, choose any four of the seven items. Write your answers in the answer script. Marks are shown beside each question.",
    keyInstructions: "Award marks for the meaning and evidence required by each question. Accept equivalent wording and alternative correct answers. Apply the marking guides to extended responses. In Question 8, assess only four answers."
  };
})();

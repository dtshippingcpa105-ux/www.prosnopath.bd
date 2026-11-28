// Class 8 English: scholarship model papers 2–5. All passages are unseen texts written by Proshnopath.
const CLASS_EIGHT_ENGLISH_MODELS = (() => {
  const grammar = "English Grammar and Composition (2026)";
  const alphabet = "abcdefghij";
  const task = (q, fields) => {
    const { points, required, criteria } = fields;
    const marks = points === undefined ? criteria.reduce((total, point) => total + point.marks, 0) : points * required;
    return { type: "short", classId: "c8", subjectId: "english", q, marks, ...fields };
  };
  const rubric = (...criteria) => criteria.map(([text, marks]) => ({ text, marks }));
  const answers = (entries) => entries.map((entry, i) => "(" + alphabet[i] + ") " + entry).join("\n");
  const choice = (q, options, answer, reason) => ({ q, options, answer, reason });
  const blankRow = (label) => [label, "__________"];

  const positions = [2, 0, 3, 1, 3, 1, 0, 2, 1, 3, 0, 2];
  const spread = (items, number) => items.map((item, i) => {
    const options = [...item.options];
    const [correct] = options.splice(item.answer, 1);
    const answer = positions[(i + number * 3) % positions.length];
    options.splice(answer, 0, correct);
    return { ...item, options, answer };
  });

  function paper(number, p) {
    p.choices = spread(p.choices, number);
    const reading = [
      task("Choose the best answer from the alternatives.", {
        points: 0.5, required: 10, passage: p.passageA, parts: p.choices,
        solution: answers(p.choices.map(({ options, answer, reason }) => "ABCD"[answer] + ". " + options[answer] + " — " + reason))
      }),
      task("Answer the following questions in your own words.", {
        points: 2, required: 4, parts: p.questions.map(([q]) => q), solution: answers(p.questions.map(([, a]) => a))
      }),
      task("Write T for true and F for false statements. Correct the false statements.", {
        points: 1, required: 5, parts: p.truth.map(([q]) => q),
        solution: answers(p.truth.map(([, a]) => a)) + "\n\nAward 0.5 for T/F and 0.5 for the correction (or 1 mark for a correct T)."
      }),
      task("Give synonyms or antonyms of the following words as directed. The words are from Passage A.", {
        points: 0.5, required: 10, parts: p.words.map(([q]) => q), solution: answers(p.words.map(([, a]) => a))
      }),
      task("Complete the table with information from Passage B.", {
        points: 1, required: 5, passage: p.passageB,
        table: { headings: ["Information required", "Answer"], rows: p.table.map(([label]) => blankRow(label)) },
        solution: answers(p.table.map(([, a]) => a))
      }),
      task("Write a summary of Passage B in your own words.", {
        criteria: rubric(["Main idea of the passage", 1], ["Key supporting details", 2],
          ["Concise organisation in own words", 1], ["Accuracy of language", 1]),
        solution: p.summary
      }),
      task("Match the parts of sentences in Column A with those in Column B. There is one extra item in Column B.", {
        points: 1, required: 4, table: { headings: ["Column A", "Column B"], rows: p.match.rows }, solution: answers(p.match.key)
      }),
      task("Rearrange the following sentences in the correct order to make a meaningful story.", {
        points: 0.5, required: 6, parts: p.jumbled.lines, solution: p.jumbled.key + "\n\nAward 0.5 for each sentence in its correct position."
      })
    ];
    const grammarItems = [
      task("Fill in the gaps with words from the box. Use each word once.", {
        points: 0.5, required: 10, reference: grammar + " · Articles, Prepositions and Linking Words",
        wordBank: p.box.words, prompt: p.box.text, solution: answers(p.box.key)
      }),
      task("Make five meaningful sentences using the substitution table. Use each entry once.", {
        points: 1, required: 5, reference: grammar + " · Sentence Patterns",
        table: { headings: ["Subject", "Verb", "Rest of sentence"], rows: p.substitution.rows },
        solution: answers(p.substitution.key) + "\n\nAward 1 mark for each complete and meaningful sentence."
      }),
      task("Complete the text with the correct forms of the verbs in brackets.", {
        points: 0.5, required: 10, reference: grammar + " · Tense and Verb Forms",
        prompt: p.verbs.text, solution: answers(p.verbs.key)
      }),
      task("Rewrite the sentences as directed.", {
        points: 1, required: 10, reference: grammar + " · Transformation of Sentences",
        parts: p.transform.map(([q]) => q),
        solution: answers(p.transform.map(([, a]) => a)) + "\n\nAccept another correct form that follows the instruction and keeps the meaning."
      }),
      task("Rewrite the passage using capital letters and punctuation marks where necessary.", {
        points: 0.5, required: 10, reference: grammar + " · Capitalisation and Punctuation",
        prompt: p.punctuation.text, solution: p.punctuation.key
      })
    ];
    const writing = [
      task(p.letter.q, {
        reference: grammar + " · Writing Letters, Emails and Applications",
        criteria: rubric(["Format and appropriate tone", 2], ["Clear purpose and relevant details", 4], ["Coherence and language accuracy", 2]),
        solution: p.letter.a
      }),
      task("Complete the story below in your own words. Give it a suitable title.", {
        prompt: p.story.prompt,
        criteria: rubric(["Suitable title", 1], ["A continuation that follows the opening", 3],
          ["Plausible resolution and ending", 3], ["Organisation and language accuracy", 3]),
        solution: p.story.a
      }),
      task("Write a composition in about 200 words on “" + p.composition.topic + "”.", {
        reference: grammar + " · Developing Composition",
        criteria: rubric(["Clear focus and relevant ideas", 4], ["Development with examples", 3],
          ["Paragraphing, cohesion and conclusion", 3], ["Language accuracy and vocabulary", 2]),
        solution: p.composition.a
      })
    ];
    const groups = [
      { label: "Part A · Reading", start: 1, items: reading },
      { label: "Part B · Grammar", start: 9, items: grammarItems },
      { label: "Part C · Writing", start: 14, items: writing }
    ];
    return {
      subject: "english", number, subjectCode: 107, minutes: 180, groups,
      totalMarks: groups.flatMap(({ items }) => items).reduce((total, item) => total + item.marks, 0),
      summary: "অদেখা Reading passage, Grammar ও Writing মিলিয়ে ",
      instructions: "Answer all questions. Read Passage A for Questions 1–4 and Passage B for Questions 5–7. Write your answers in the answer script. Marks are shown beside each question.",
      keyInstructions: "Award marks for the meaning required by each question. Accept equivalent wording and other correct answers. Apply the marking guides to extended responses."
    };
  }

  const set2 = paper(2, {
    passageA: { title: "Passage A · Read the passage and answer Questions 1–4",
      text: "Rafiq lives in a village near the Padma. Every morning he walks two kilometres to school along a narrow mud road. During the monsoon the road becomes slippery, and many younger children stay at home because their parents are afraid they might fall into the ditch beside it.\n\nOne day Rafiq had an idea. He talked to his classmates, and together they collected broken bricks from a nearby kiln. The kiln owner was happy to give them away because he had no use for them. Every Friday the students spent two hours laying the bricks along the worst part of the road. Some fathers joined them with spades, and the local union council later sent a cart of sand.\n\nBy the end of the rainy season, a firm path ran for almost half a kilometre. Attendance at the primary school rose, and the head teacher thanked the students at the morning assembly. Rafiq felt proud, but he said that the work belonged to everyone who had helped." },
    choices: [
      choice("Where does Rafiq live?", ["In a town near the sea", "In a village near the Padma", "Beside a brick kiln", "Near the union council office"], 1, "The first sentence says so."),
      choice("How far does Rafiq walk to school?", ["Half a kilometre", "One kilometre", "Two kilometres", "Five kilometres"], 2, "He walks two kilometres every morning."),
      choice("Why did younger children stay at home in the monsoon?", ["The school was closed", "The road was slippery and unsafe", "They had to work in the fields", "There was no teacher"], 1, "Parents feared they might fall into the ditch."),
      choice("Where did the students get the bricks?", ["From the union council", "From their homes", "From a nearby kiln", "From the school"], 2, "They collected broken bricks from a kiln."),
      choice("Why did the kiln owner give the bricks away happily?", ["He wanted to be famous", "He had no use for them", "The students paid him", "The head teacher asked him"], 1, "The bricks were of no use to him."),
      choice("When did the students work on the road?", ["Every Friday", "Every morning", "After every exam", "Only on holidays"], 0, "They worked every Friday for two hours."),
      choice("What did the union council send?", ["Money", "Bricks", "A cart of sand", "Spades"], 2, "The council sent a cart of sand."),
      choice("The word “firm” in the third paragraph means —", ["soft", "solid", "narrow", "long"], 1, "A firm path is solid and stable."),
      choice("What was one result of the new path?", ["The kiln closed", "School attendance rose", "The road became longer", "The rain stopped"], 1, "Attendance at the primary school rose."),
      choice("What does Rafiq’s final remark show about him?", ["He was proud and selfish", "He was modest and fair", "He was tired of the work", "He wanted a prize"], 1, "He gave credit to everyone who helped.")
    ],
    questions: [
      ["What problem did the mud road cause during the monsoon?", "The road became slippery (1), so many younger children could not go to school safely and stayed at home (1)."],
      ["How did Rafiq turn his idea into action?", "He talked to his classmates (1) and they collected broken bricks and laid them on the road every Friday (1)."],
      ["Who else helped the students, and how?", "Some fathers joined them with spades (1) and the union council sent a cart of sand (1)."],
      ["What lesson can we learn from Rafiq?", "Any two suitable points: small steps can solve a shared problem / cooperation brings success / we should give credit to others (1 + 1)."]
    ],
    truth: [
      ["The road to Rafiq’s school is made of concrete.", "F — It is a narrow mud road."],
      ["The students worked for two hours every Friday.", "T"],
      ["The kiln owner sold the bricks to the students.", "F — He gave them away happily."],
      ["The new path was almost half a kilometre long.", "T"],
      ["Rafiq said that the work was only his.", "F — He said it belonged to everyone who had helped."]
    ],
    words: [["narrow (antonym)", "wide / broad"], ["afraid (synonym)", "scared / fearful"], ["collected (synonym)", "gathered"], ["broken (antonym)", "whole / unbroken"], ["happy (synonym)", "glad / pleased"], ["worst (antonym)", "best"], ["joined (antonym)", "left"], ["later (antonym)", "earlier"], ["rose (antonym)", "fell / dropped"], ["proud (antonym)", "ashamed / humble"]],
    passageB: { title: "Passage B · Read the passage and answer Questions 5–7",
      text: "In March 2026, Green Leaf High School in Rajshahi started a rooftop garden. The idea came from the school’s eco club, which has 35 members. The club used old plastic drums and broken buckets as pots, so the garden cost very little. A local agriculture officer trained the members on how to make compost from vegetable peels.\n\nThe students now grow tomatoes, spinach, chillies and mint. In the first season they harvested about 60 kilograms of vegetables. Some of the produce was used in the school’s midday meal, and the rest was sold to teachers. The money is kept in a fund to buy seeds for the next season. The club plans to share its method with two neighbouring schools next year." },
    table: [["(a) Month and year the garden started", "March 2026"], ["(b) Number of eco club members", "35"], ["(c) Things used as pots", "Old plastic drums and broken buckets"], ["(d) Person who trained the members", "A local agriculture officer"], ["(e) Amount harvested in the first season", "About 60 kilograms of vegetables"]],
    summary: "The eco club of Green Leaf High School set up a low-cost rooftop garden using waste containers and home-made compost. It produced about 60 kg of vegetables in its first season for the school meal and for sale, and the club will share its method with nearby schools.",
    match: { rows: [["(a) The eco club used old drums", "(i) to buy seeds for the next season."], ["(b) The agriculture officer showed them", "(ii) as pots for the plants."], ["(c) Some vegetables were used", "(iii) how to make compost."], ["(d) The money is saved", "(iv) in the school’s midday meal."], ["", "(v) to build a new classroom."]],
      key: ["(ii)", "(iii)", "(iv)", "(i)"] },
    jumbled: { lines: ["(a) The crow saw a pitcher with a little water at the bottom.", "(b) At last the crow drank the water and flew away happily.", "(c) Once a thirsty crow was flying in search of water.", "(d) It could not reach the water with its beak.", "(e) The water rose slowly to the top.", "(f) Then it dropped pebbles into the pitcher one by one."],
      key: "c → a → d → f → e → b" },
    box: { words: ["a", "an", "the", "in", "on", "at", "but", "because", "with", "for"],
      text: "Last winter we went on (a) _____ picnic to Lalbagh Fort. We started (b) _____ 8 a.m. (c) _____ a hired bus. It was (d) _____ old bus, (e) _____ the driver was very careful. We stayed there (f) _____ four hours. We were happy (g) _____ the weather was pleasant. (h) _____ fort was built (i) _____ the Mughal period. We came back home (j) _____ many happy memories.",
      key: ["a", "at", "on", "an", "but", "for", "because", "The", "in", "with"] },
    substitution: { rows: [["The farmers", "obeys", "in the field from morning till evening."], ["Bees", "help", "honey from flowers."], ["My little brother", "work", "to school every day."], ["A good student", "collect", "his teachers."], ["Our teachers", "goes", "us to learn new things."]],
      key: ["The farmers work in the field from morning till evening.", "Bees collect honey from flowers.", "My little brother goes to school every day.", "A good student obeys his teachers.", "Our teachers help us to learn new things."] },
    verbs: { text: "Bangladesh (a) _____ (be) a land of rivers. Most people here (b) _____ (depend) on agriculture. Last year heavy rain (c) _____ (cause) floods in many districts. Thousands of families (d) _____ (lose) their homes. The government and many volunteers (e) _____ (come) forward to help them. When I (f) _____ (visit) a shelter, a little girl (g) _____ (cry) for her lost goat. Now the water (h) _____ (go) down. The farmers (i) _____ (begin) to plant rice again. We hope they (j) _____ (get) a good harvest.",
      key: ["is", "depend", "caused", "lost", "came", "visited", "was crying", "has gone", "have begun", "will get"] },
    transform: [
      ["She sings a song. (Make it passive.)", "A song is sung by her."],
      ["The boy is very weak. He cannot walk. (Join using “too … to”.)", "The boy is too weak to walk."],
      ["He said, “I am busy.” (Change the narration.)", "He said that he was busy."],
      ["Rice is the staple food of Bangladesh. (Make it interrogative.)", "Isn’t rice the staple food of Bangladesh?"],
      ["Dhaka is the largest city in Bangladesh. (Use the comparative degree.)", "Dhaka is larger than any other city in Bangladesh."],
      ["Do not waste time. (Make it affirmative.)", "Use your time properly. / Avoid wasting time."],
      ["What a beautiful flower it is! (Make it assertive.)", "It is a very beautiful flower."],
      ["As he was ill, he could not come. (Make it simple.)", "Being ill, he could not come."],
      ["Everybody loves a good boy. (Make it negative.)", "Nobody hates a good boy. / There is nobody who does not love a good boy."],
      ["He is honest. He is poor. (Join with “though”.)", "Though he is poor, he is honest."]
    ],
    punctuation: { text: "on sunday our teacher mr karim took us to the national museum in dhaka we saw old coins clothes and weapons have you ever visited the museum asked my friend",
      key: "On Sunday our teacher, Mr Karim, took us to the National Museum in Dhaka. We saw old coins, clothes and weapons. “Have you ever visited the museum?” asked my friend.\n\nAward 0.5 for each necessary capital letter or punctuation mark placed correctly, up to a maximum of 5 marks." },
    letter: { q: "Write a letter to your friend telling him or her about your preparation for the scholarship examination.",
      a: "Mirpur, Dhaka\n10 December 2026\n\nDear Tania,\n\nI hope you are well. I am writing to tell you how I am preparing for the scholarship examination next month.\n\nI study for about six hours a day. I start early in the morning with mathematics because my mind is fresh then. In the afternoon I revise science and Bangladesh and Global Studies. Every evening I solve one model test paper within the set time. This helps me manage time and find my weak points. My English teacher checks my compositions twice a week.\n\nI also take short breaks, sleep well and play badminton in the evening to keep fit. Please write to me about your preparation too.\n\nYours ever,\nNabila" },
    story: { prompt: "It was a stormy evening. Mitu was coming home from her aunt’s house when she saw an old man sitting under a tree, shivering in the rain. His bag had fallen into the mud…",
      a: "A Shelter in the Storm\n\nMitu ran to the old man and picked up his bag. He told her that he had come to the village to see his grandson, but he had lost his way in the rain. Mitu gave him her umbrella and took him to her house, which was only a few minutes away.\n\nHer mother gave the old man a dry towel and hot tea. Mitu’s father asked the name of his grandson and recognised it at once. The boy was their neighbour’s son. When the rain stopped, Mitu and her father walked the old man to his grandson’s house.\n\nThe family was very happy to see him safe. The old man blessed Mitu and said, “Kindness is the best shelter.” Mitu felt that the stormy evening had become the brightest evening of her life." },
    composition: { topic: "The Importance of Reading Books",
      a: "Books are the best friends of a person. A good book gives us knowledge, pleasure and new ideas at the same time.\n\nTextbooks help us pass examinations, but other books open the window to the wider world. Through stories we can travel to distant countries, and through biographies we can learn how great people overcame difficulties. Books on science explain how things work and make us curious.\n\nReading also improves our language. When we read regularly, we learn new words and better ways of expressing ideas. It increases our concentration and helps us think deeply. A reader can judge information better and is not easily misled.\n\nToday many students spend hours on mobile phones and read very little. We should build a habit of reading at least a few pages every day. Schools can set up libraries and organise reading competitions.\n\nIn conclusion, reading books makes a person wise and thoughtful. A nation that reads more becomes a developed nation." }
  });

  const set3 = paper(3, {
    passageA: { title: "Passage A · Read the passage and answer Questions 1–4",
      text: "Shirin’s grandmother has a small sewing machine that is older than Shirin’s mother. For years she made clothes for the whole family on it. When her eyesight became weak, the machine was put away in a dusty corner.\n\nDuring the summer holidays Shirin decided to learn sewing. At first her grandmother laughed and said that young people today only buy readymade clothes. But Shirin was serious. She cleaned the machine, oiled it and asked her grandmother to guide her. Her grandmother could not see the needle clearly, but she remembered every step. She explained how to measure, cut and join the pieces of cloth.\n\nShirin made many mistakes. Once she sewed a sleeve upside down, and both of them laughed for a long time. After three weeks she finished a simple kurta for her little brother. He wore it proudly on Eid day. Her grandmother said that the old machine had come back to life, and so had she." },
    choices: [
      choice("How old is the sewing machine?", ["It is new", "It is older than Shirin’s mother", "It is three weeks old", "It is as old as Shirin"], 1, "The first sentence tells us."),
      choice("Why was the machine put away?", ["It was broken", "The grandmother’s eyesight became weak", "Nobody liked it", "Shirin’s mother sold it"], 1, "She could no longer see well."),
      choice("When did Shirin decide to learn sewing?", ["During Eid", "During the summer holidays", "After her exams", "On her birthday"], 1, "It was during the summer holidays."),
      choice("Why did the grandmother laugh at first?", ["She thought Shirin was not serious", "The machine was dirty", "Shirin sewed a sleeve upside down", "She did not like kurtas"], 0, "She believed young people only buy readymade clothes."),
      choice("What did Shirin do to the machine first?", ["She sold it", "She painted it", "She cleaned and oiled it", "She took it to a shop"], 2, "She cleaned and oiled it."),
      choice("How did the grandmother help Shirin?", ["By sewing for her", "By explaining every step", "By buying cloth", "By threading the needle"], 1, "She remembered every step and explained it."),
      choice("“Guide” in the second paragraph means —", ["follow", "show the way", "punish", "forget"], 1, "To guide is to show someone how to do something."),
      choice("What mistake did Shirin make once?", ["She broke the needle", "She sewed a sleeve upside down", "She cut her finger", "She lost the cloth"], 1, "Both of them laughed at it."),
      choice("For whom did Shirin make the kurta?", ["Her grandmother", "Her mother", "Her little brother", "Herself"], 2, "Her little brother wore it on Eid day."),
      choice("What does “and so had she” mean in the last sentence?", ["The grandmother also felt alive again", "The grandmother bought a new machine", "Shirin became tired", "The machine stopped working"], 0, "Teaching Shirin gave the grandmother new joy.")
    ],
    questions: [
      ["Why did the sewing machine lie in a dusty corner for a long time?", "Shirin’s grandmother could not use it because her eyesight had become weak (1), and nobody else in the family sewed (1)."],
      ["How did Shirin prove that she was serious about learning?", "She cleaned and oiled the old machine (1) and asked her grandmother to guide her step by step (1)."],
      ["How did the grandmother teach without seeing clearly?", "She remembered every step from experience (1) and explained how to measure, cut and join the cloth (1)."],
      ["What does the story tell us about learning from elders?", "Elders have valuable skills and experience (1); learning from them also brings families closer and makes elders feel valued (1)."]
    ],
    truth: [
      ["Shirin’s mother made clothes on the old machine.", "F — Shirin’s grandmother made clothes on it."],
      ["Shirin oiled the machine before using it.", "T"],
      ["The grandmother could see the needle clearly.", "F — She could not see it clearly."],
      ["Shirin finished the kurta after three weeks.", "T"],
      ["Shirin’s brother refused to wear the kurta.", "F — He wore it proudly on Eid day."]
    ],
    words: [["small (antonym)", "big / large"], ["weak (antonym)", "strong"], ["dusty (antonym)", "clean"], ["decided (synonym)", "determined / resolved"], ["serious (antonym)", "casual / playful"], ["remembered (antonym)", "forgot"], ["mistakes (synonym)", "errors"], ["simple (antonym)", "complex / difficult"], ["proudly (synonym)", "with pride"], ["finished (synonym)", "completed"]],
    passageB: { title: "Passage B · Read the passage and answer Questions 5–7",
      text: "Cox’s Bazar has one of the longest natural sea beaches in the world. It stretches for about 120 kilometres along the Bay of Bengal. Every year lakhs of tourists visit it, especially between November and March, when the sea is calm.\n\nThe beach is also important for wildlife. Olive ridley turtles come to lay eggs on quiet parts of the beach at night. Bright lights, noise and plastic waste make it difficult for them. In 2025, a group of local volunteers began patrolling a five-kilometre stretch during the nesting season. They protected more than 3,000 eggs and released the baby turtles into the sea. The volunteers ask tourists to keep the beach clean and to avoid shining lights near nests." },
    table: [["(a) Length of the beach", "About 120 kilometres"], ["(b) Best months for tourists", "November to March"], ["(c) Animal that lays eggs on the beach", "Olive ridley turtles"], ["(d) Year the volunteers began patrolling", "2025"], ["(e) Number of eggs protected", "More than 3,000"]],
    summary: "Cox’s Bazar beach, about 120 km long, attracts many tourists and is also a nesting place for olive ridley turtles. Since 2025, local volunteers have protected thousands of turtle eggs and urge tourists to keep the beach clean and dark near nests.",
    match: { rows: [["(a) Tourists visit mostly", "(i) make nesting difficult for turtles."], ["(b) Lights, noise and plastic", "(ii) between November and March."], ["(c) The volunteers released", "(iii) to keep the beach clean."], ["(d) Tourists are requested", "(iv) the baby turtles into the sea."], ["", "(v) to build hotels on the beach."]],
      key: ["(ii)", "(i)", "(iv)", "(iii)"] },
    jumbled: { lines: ["(a) The farmer told his sons that he had hidden a treasure in the field.", "(b) They found no treasure, but the field gave a rich harvest.", "(c) An old farmer had three lazy sons.", "(d) After his death, the sons dug the whole field.", "(e) Then they understood that hard work was the real treasure.", "(f) Before dying, he called them to his bed."],
      key: "c → f → a → d → b → e" },
    box: { words: ["a", "an", "the", "of", "to", "from", "and", "so", "since", "by"],
      text: "Kamal is (a) _____ honest boy. He reads in class eight (b) _____ he is the captain (c) _____ his class. He comes to school (d) _____ bicycle. He has been riding it (e) _____ last year. His house is far (f) _____ the school, (g) _____ he leaves home early. He gives (h) _____ helping hand to anyone in need. He wants (i) _____ be a doctor. (j) _____ teachers love him very much.",
      key: ["an", "and", "of", "by", "since", "from", "so", "a", "to", "The"] },
    substitution: { rows: [["The sun", "is", "the national fruit of Bangladesh."], ["The jackfruit", "rises", "in the east."], ["Water", "boils", "the capital of Bangladesh."], ["Dhaka", "lay", "at 100 degrees Celsius."], ["Hens", "is", "eggs."]],
      key: ["The sun rises in the east.", "The jackfruit is the national fruit of Bangladesh.", "Water boils at 100 degrees Celsius.", "Dhaka is the capital of Bangladesh.", "Hens lay eggs."] },
    verbs: { text: "Honesty (a) _____ (be) the best policy. An honest man (b) _____ (never tell) a lie. Long ago a woodcutter (c) _____ (live) in a village. One day while he (d) _____ (cut) wood, his axe (e) _____ (fall) into the river. He (f) _____ (begin) to cry. An angel appeared and (g) _____ (offer) him a golden axe, but he refused it. The angel was pleased because he (h) _____ (not tell) a lie. Since then, people (i) _____ (tell) this story to children. It teaches us (j) _____ (be) honest.",
      key: ["is", "never tells", "lived", "was cutting", "fell", "began", "offered", "had not told", "have told", "to be"] },
    transform: [
      ["The teacher punished the boy. (Make it passive.)", "The boy was punished by the teacher."],
      ["He is so tired that he cannot walk. (Use “too … to”.)", "He is too tired to walk."],
      ["She said to me, “Where do you live?” (Change the narration.)", "She asked me where I lived."],
      ["No other student in the class is as tall as Rahim. (Make it superlative.)", "Rahim is the tallest student in the class."],
      ["He is always late. (Make it negative.)", "He is never in time / never punctual."],
      ["Who does not love flowers? (Make it assertive.)", "Everybody loves flowers."],
      ["If you work hard, you will succeed. (Use “unless”.)", "Unless you work hard, you will not succeed."],
      ["I saw a bird. It was singing. (Make it simple.)", "I saw a bird singing."],
      ["Open the window. (Make it passive.)", "Let the window be opened."],
      ["The girl is very clever. (Make it exclamatory.)", "How clever the girl is!"]
    ],
    punctuation: { text: "rina said to her mother may i go to the fair today her mother replied yes but come back before evening",
      key: "Rina said to her mother, “May I go to the fair today?” Her mother replied, “Yes, but come back before evening.”\n\nAward 0.5 for each necessary capital letter or punctuation mark placed correctly, up to a maximum of 5 marks." },
    letter: { q: "Write an application to the Headmaster of your school asking for a seat in the school hostel.",
      a: "15 December 2026\nThe Headmaster\nSonali Model High School\nBogura\n\nSubject: Application for a seat in the school hostel.\n\nSir,\nI beg to state that I am a student of Class Eight of your school. My home is in a remote village about 25 kilometres from the school. I have to spend nearly three hours every day travelling by bus and on foot, so I am often late and tired in class. This is harming my studies, especially before the scholarship examination.\n\nI therefore pray that you would kindly allot me a seat in the school hostel from January. I promise to obey all the rules of the hostel.\n\nYours obediently,\nMd. Arif Hossain\nClass: Eight, Roll: 7" },
    story: { prompt: "Rakib found a wallet on the school field. It had a lot of money and an identity card in it. His friend Jibon said, “Let’s keep it. Nobody saw us.”…",
      a: "The Real Reward\n\nRakib looked at the identity card. It belonged to Mr Haque, the school guard. Rakib knew that the guard earned very little and had a sick daughter. He told Jibon that keeping the wallet would be stealing, even if nobody had seen them.\n\nJibon felt ashamed. Together they went to the head teacher’s office and handed over the wallet. The head teacher sent for Mr Haque, who had been searching the field in tears. The money was for his daughter’s medicine. When he got the wallet back, he thanked the boys again and again.\n\nAt the assembly the next day, the head teacher praised Rakib and Jibon for their honesty. Jibon whispered to Rakib, “Today I have learnt that honesty brings more happiness than money.”" },
    composition: { topic: "Your Favourite Teacher",
      a: "Teachers build the future of a nation. Among all my teachers, Mr Nurul Islam, who teaches us mathematics, is my favourite.\n\nHe is about fifty years old and always neatly dressed. He comes to class on time and never wastes a minute. What I like most is his way of teaching. He explains every problem with examples from daily life. When we calculate profit, he talks about the shop near our school; when we learn areas, he measures the classroom floor with us.\n\nHe is very patient. If a student does not understand something, he explains it again without getting angry. He also takes extra classes for weak students free of charge. He encourages us to ask questions and says that there is no shame in making mistakes.\n\nOutside the classroom, he is the leader of our science club. He also teaches us to be honest and punctual.\n\nBecause of him, mathematics has become my favourite subject. I respect him deeply and want to be a good teacher like him one day." }
  });

  const set4 = paper(4, {
    passageA: { title: "Passage A · Read the passage and answer Questions 1–4",
      text: "Jamal was a fisherman’s son from Bhola. When he was in class seven, a strong cyclone hit the coast. The night before it struck, the radio announced danger signal number ten. Jamal’s father did not want to leave their boat and house, but Jamal remembered what his teacher had said about warning signals.\n\nHe convinced his father to go to the cyclone shelter. On the way, he knocked on the doors of three neighbours and helped an old woman carry her bag. By midnight the shelter was full of people, cattle and goats. Outside, the wind roared like a wild animal.\n\nIn the morning they found that their house had been badly damaged and the boat had been washed away. But everyone in their neighbourhood was alive. A few months later, an NGO gave Jamal’s father a new boat. The union chairman gave Jamal a certificate for his courage. Jamal now tells his friends, “A warning is useful only if we act on it.”" },
    choices: [
      choice("Where was Jamal from?", ["Bhola", "Barishal", "Khulna", "Sylhet"], 0, "He was a fisherman’s son from Bhola."),
      choice("How did the family learn about the cyclone?", ["From a neighbour", "From the radio", "From the newspaper", "From the teacher"], 1, "The radio announced the danger signal."),
      choice("Which danger signal was announced?", ["Number three", "Number seven", "Number ten", "Number one"], 2, "Danger signal number ten."),
      choice("Why did Jamal’s father not want to leave?", ["He was ill", "He did not want to leave the boat and house", "The shelter was far", "He did not hear the radio"], 1, "He did not want to leave their property."),
      choice("What helped Jamal decide to go to the shelter?", ["His teacher’s lesson about signals", "A film", "His mother’s order", "The union chairman"], 0, "He remembered what his teacher had said."),
      choice("“Convinced” in the second paragraph means —", ["forced", "persuaded", "forgot", "refused"], 1, "To convince is to persuade someone."),
      choice("How many neighbours did Jamal warn?", ["One", "Two", "Three", "Ten"], 2, "He knocked on three neighbours’ doors."),
      choice("The wind “roared like a wild animal” — this shows the wind was —", ["gentle", "very strong and loud", "cold", "silent"], 1, "Roaring suggests great force and noise."),
      choice("What happened to the family’s boat?", ["It was sold", "It was washed away", "It was safe", "It was repaired"], 1, "The cyclone washed it away."),
      choice("What did Jamal receive from the union chairman?", ["A boat", "Money", "A certificate", "A radio"], 2, "He got a certificate for his courage.")
    ],
    questions: [
      ["Why was Jamal’s father unwilling to go to the shelter?", "He did not want to leave their boat and house (1), which were their only means of living and their home (1)."],
      ["How did Jamal help others on the way to the shelter?", "He knocked on three neighbours’ doors to warn them (1) and helped an old woman carry her bag (1)."],
      ["What loss did the family suffer, and what was the good news?", "Their house was badly damaged and their boat was washed away (1), but everyone in the neighbourhood survived (1)."],
      ["Explain Jamal’s words: “A warning is useful only if we act on it.”", "A warning gives us time to save our lives (1); but if we ignore it and stay at home, it cannot protect us (1)."]
    ],
    truth: [
      ["Jamal was in class eight when the cyclone hit.", "F — He was in class seven."],
      ["The shelter was full of people and animals by midnight.", "T"],
      ["Jamal’s house was not damaged at all.", "F — It was badly damaged."],
      ["Everyone in the neighbourhood survived.", "T"],
      ["The union chairman gave Jamal’s father a new boat.", "F — An NGO gave him the boat; the chairman gave Jamal a certificate."]
    ],
    words: [["strong (antonym)", "weak"], ["danger (synonym)", "threat / risk"], ["remembered (synonym)", "recalled"], ["old (antonym)", "young"], ["full (antonym)", "empty"], ["wild (antonym)", "tame"], ["damaged (synonym)", "harmed / ruined"], ["alive (antonym)", "dead"], ["courage (synonym)", "bravery"], ["useful (antonym)", "useless"]],
    passageB: { title: "Passage B · Read the passage and answer Questions 5–7",
      text: "The Padma Bridge was inaugurated on 25 June 2022. It is 6.15 kilometres long and has two levels. Vehicles travel on the upper level, while trains use the lower level. The bridge connects Mawa in Munshiganj with Janjira in Shariatpur.\n\nBefore the bridge, people from the south-western districts had to cross the river by ferry or launch. The journey to Dhaka often took six to eight hours, and in bad weather ferries sometimes stopped running. Now a bus can cross the river in less than ten minutes. Traders can send fish, vegetables and fruit to the capital quickly, so the products stay fresh. Experts believe the bridge will help the economy of about 21 districts." },
    table: [["(a) Date the bridge was inaugurated", "25 June 2022"], ["(b) Length of the bridge", "6.15 kilometres"], ["(c) Users of the lower level", "Trains"], ["(d) Two places the bridge connects", "Mawa (Munshiganj) and Janjira (Shariatpur)"], ["(e) Time a bus now takes to cross", "Less than ten minutes"]],
    summary: "The two-level Padma Bridge, opened in 2022, links Mawa and Janjira for road and rail traffic. It has cut a long, weather-dependent ferry journey to a few minutes, helping traders send fresh goods to Dhaka and boosting the economy of around 21 districts.",
    match: { rows: [["(a) Vehicles travel", "(i) by ferry or launch."], ["(b) Earlier people crossed the river", "(ii) on the upper level."], ["(c) In bad weather ferries", "(iii) stay fresh when they reach Dhaka."], ["(d) Fish and vegetables now", "(iv) sometimes stopped running."], ["", "(v) are grown on the bridge."]],
      key: ["(ii)", "(i)", "(iv)", "(iii)"] },
    jumbled: { lines: ["(a) The mouse ran over the sleeping lion and woke him up.", "(b) The mouse heard the lion roar and cut the net with its teeth.", "(c) A lion was sleeping in the forest.", "(d) The lion caught the mouse but let it go when it begged.", "(e) The lion thanked the little mouse for saving his life.", "(f) Some days later the lion was caught in a hunter’s net."],
      key: "c → a → d → f → b → e" },
    box: { words: ["a", "the", "into", "of", "for", "but", "although", "with", "on", "an"],
      text: "Our school has (a) _____ big library. It is (b) _____ the second floor. There are about five thousand books (c) _____ different subjects. (d) _____ librarian is very helpful. We can borrow books (e) _____ one week. (f) _____ the room is small, it is always neat. Students come in (g) _____ their library cards. One day I found (h) _____ old book about the Liberation War. I put it (i) _____ my bag carefully. I wanted to read it at home, (j) _____ I returned it on time.",
      key: ["a", "on", "of", "The", "for", "Although", "with", "an", "into", "but"] },
    substitution: { rows: [["The Sundarbans", "is", "on the bank of the Buriganga."], ["Dhaka", "is", "the national bird of Bangladesh."], ["The magpie robin", "stands", "the largest mangrove forest in the world."], ["Students", "are", "the national poet of Bangladesh."], ["Kazi Nazrul Islam", "is", "the future of the nation."]],
      key: ["The Sundarbans is the largest mangrove forest in the world.", "Dhaka stands on the bank of the Buriganga.", "The magpie robin is the national bird of Bangladesh.", "Students are the future of the nation.", "Kazi Nazrul Islam is the national poet of Bangladesh."] },
    verbs: { text: "Mobile phones (a) _____ (change) our lives a lot. Nowadays almost every family (b) _____ (have) one. Ten years ago my grandfather (c) _____ (not know) how to use a smartphone. Last month my sister (d) _____ (teach) him to make video calls. Now he (e) _____ (talk) to my uncle in Malaysia every Friday. While he (f) _____ (talk) yesterday, the connection suddenly (g) _____ (break). He laughed and said that technology (h) _____ (need) patience. However, too much use of phones (i) _____ (harm) our eyes. We should use them (j) _____ (learn) and communicate.",
      key: ["have changed", "has", "did not know", "taught", "talks", "was talking", "broke", "needs", "harms", "to learn"] },
    transform: [
      ["People speak English all over the world. (Make it passive.)", "English is spoken all over the world."],
      ["She is very poor. She cannot buy a book. (Join using “so … that”.)", "She is so poor that she cannot buy a book."],
      ["He said, “I will help you.” (Change the narration.)", "He said that he would help me."],
      ["Rana is the best player in the team. (Make it positive.)", "No other player in the team is as good as Rana."],
      ["She is clever. She is hardworking. (Join with “not only … but also”.)", "She is not only clever but also hardworking."],
      ["We must respect our parents. (Make it interrogative.)", "Mustn’t we respect our parents?"],
      ["How sweet the song is! (Make it assertive.)", "The song is very sweet."],
      ["He was too ill to attend school. (Make it complex.)", "He was so ill that he could not attend school."],
      ["Only Karim answered the question. (Make it negative.)", "None but Karim answered the question."],
      ["May Allah bless you. (Make it assertive.)", "I pray that Allah may bless you."]
    ],
    punctuation: { text: "dr salma khan is a famous doctor in chattogram she works at the medical college hospital what a kind person she is",
      key: "Dr Salma Khan is a famous doctor in Chattogram. She works at the Medical College Hospital. What a kind person she is!\n\nAward 0.5 for each necessary capital letter or punctuation mark placed correctly, up to a maximum of 5 marks." },
    letter: { q: "Write an email to your father describing a recent study tour that your school arranged.",
      a: "To: father@example.com\nSubject: Our study tour to Paharpur\n\nDear Abbu,\n\nAssalamu alaikum. I hope you and Ammu are well. Last Thursday our school arranged a study tour to the Paharpur Buddhist Vihara in Naogaon, and I want to tell you about it.\n\nWe left school at 6 a.m. by two buses. Our history teacher explained that the vihara was built in the eighth century and is a UNESCO World Heritage Site. We saw the huge terracotta plaques and the small museum. I made notes and took photographs for my project.\n\nWe had lunch under the trees and returned in the evening. The trip taught me more history than many classes. I will show you the photos when I come home.\n\nYour loving son,\nTanvir" },
    story: { prompt: "On the day of the final match, Sohel, the best player of the school team, twisted his ankle. The coach looked at the small, quiet boy who always sat on the bench…",
      a: "The Boy on the Bench\n\nThe coach called the quiet boy, Arif, and asked if he was ready to play. Arif had practised every afternoon but had never played a real match. His hands were shaking, but he nodded.\n\nIn the first half the other team scored a goal. Arif made two mistakes and wanted to hide. Then he heard Sohel shouting from the side, “Play your game, Arif! You know every move.” Arif took a deep breath. He began to pass the ball carefully and run into empty spaces, just as he had done in practice.\n\nWith five minutes left, Arif received the ball near the goal and kicked it into the corner of the net. The match ended in a draw, and his team won on penalties. Everyone lifted Arif onto their shoulders. That day the school learnt that hard work in silence is never wasted." },
    composition: { topic: "Digital Bangladesh and Students",
      a: "Technology has changed the way we live, work and learn. Bangladesh has made great progress in using digital technology, and students are among its biggest users.\n\nToday students can find information on any topic within seconds. Online classes, educational videos and digital textbooks help us learn even when we are at home. Many schools now have multimedia classrooms where teachers show pictures and animations to explain difficult lessons. Students in villages can also apply for admission and see their results online.\n\nDigital skills also open new opportunities. Students who learn computer programming, graphic design or typing can do useful work in the future. Some young people already earn money through freelancing.\n\nHowever, technology has dangers too. Too much time on social media wastes time and harms our eyes and sleep. False news and online bullying can confuse and hurt people. Therefore, students should use the internet wisely, check information and protect their personal data.\n\nIn conclusion, if students use technology carefully and for learning, they can lead the country towards a smart and developed future." }
  });

  const set5 = paper(5, {
    passageA: { title: "Passage A · Read the passage and answer Questions 1–4",
      text: "Begum Rokeya was born in 1880 in Pairaband, a village in Rangpur. At that time girls were not allowed to go to school, and many people thought that education was not necessary for women. Rokeya’s elder brother secretly taught her English and Bangla at night by candlelight.\n\nAfter her marriage, her husband encouraged her to read and write. She wrote stories, essays and novels in which she asked people to think about the rights of women. Her famous work “Sultana’s Dream” imagines a land where women run the country with science and wisdom.\n\nIn 1911 she started a school for girls in Kolkata with only eight students. She went from house to house to persuade parents to send their daughters. Many people criticised her, but she did not give up. She died in 1932. Today 9 December is observed as Rokeya Day in Bangladesh to remember her contribution to women’s education." },
    choices: [
      choice("Where was Begum Rokeya born?", ["In Kolkata", "In Pairaband, Rangpur", "In Dhaka", "In Bogura"], 1, "She was born in Pairaband in Rangpur."),
      choice("In which year was she born?", ["1880", "1911", "1932", "1900"], 0, "She was born in 1880."),
      choice("Who taught her secretly?", ["Her husband", "Her elder brother", "Her mother", "A teacher"], 1, "Her elder brother taught her at night."),
      choice("Why did her brother teach her at night?", ["The day was too hot", "Girls’ education was not accepted then", "He worked in the day", "She went to school in the day"], 1, "Girls were not allowed to go to school."),
      choice("What did her husband do?", ["He stopped her writing", "He encouraged her to read and write", "He opened a school", "He wrote novels"], 1, "He encouraged her."),
      choice("“Sultana’s Dream” imagines a land where —", ["men rule by force", "women run the country with science and wisdom", "there are no schools", "everyone is poor"], 1, "That is the idea of the book."),
      choice("How many students did her school start with?", ["Five", "Eight", "Eighty", "Eleven"], 1, "It started with only eight students."),
      choice("“Persuade” in the third paragraph means —", ["force", "convince", "punish", "ignore"], 1, "To persuade is to convince."),
      choice("When did she die?", ["1911", "1880", "1932", "1971"], 2, "She died in 1932."),
      choice("Why is 9 December observed as Rokeya Day?", ["It is her wedding day", "To remember her contribution to women’s education", "It is the day her school opened", "It is a national holiday for students"], 1, "The passage gives this reason.")
    ],
    questions: [
      ["What was the condition of women’s education when Rokeya was a child?", "Girls were not allowed to go to school (1), and many people thought women did not need education (1)."],
      ["How did Rokeya use her writing for social change?", "She wrote stories, essays and novels (1) that made people think about the rights of women (1)."],
      ["What difficulties did she face in running her school, and how did she overcome them?", "Parents were unwilling and people criticised her (1); she went from house to house to persuade parents and never gave up (1)."],
      ["Which two qualities of Begum Rokeya do you admire most? Why?", "Any two qualities with a reason, e.g. courage — she worked despite criticism (1); determination — she started with only eight students and continued (1)."]
    ],
    truth: [
      ["Rokeya’s father taught her English.", "F — Her elder brother taught her."],
      ["Her husband supported her writing.", "T"],
      ["Her school started in Dhaka.", "F — It started in Kolkata."],
      ["She persuaded parents by visiting their homes.", "T"],
      ["Rokeya Day is observed on 9 December.", "T"]
    ],
    words: [["allowed (antonym)", "forbidden / prohibited"], ["necessary (antonym)", "unnecessary"], ["secretly (antonym)", "openly"], ["encouraged (antonym)", "discouraged"], ["famous (synonym)", "well-known / renowned"], ["wisdom (synonym)", "knowledge / good sense"], ["started (synonym)", "began"], ["criticised (antonym)", "praised"], ["give up (synonym)", "quit / stop trying"], ["remember (antonym)", "forget"]],
    passageB: { title: "Passage B · Read the passage and answer Questions 5–7",
      text: "Dengue is a disease spread by the Aedes mosquito. In Bangladesh it is most common between June and October, when rain leaves water standing in many places. The Aedes mosquito usually bites during the day and breeds in clean, still water.\n\nSymptoms include high fever, severe headache, pain behind the eyes and body aches. Doctors advise patients to drink plenty of fluids and take rest. Painkillers such as aspirin should not be taken without a doctor’s advice. To prevent dengue, people should not let water collect in flower pots, tyres or plastic containers for more than three days. Using mosquito nets, even during daytime sleep, also gives protection." },
    table: [["(a) Mosquito that spreads dengue", "The Aedes mosquito"], ["(b) Months when dengue is most common", "June to October"], ["(c) Time of day the mosquito usually bites", "During the day / daytime"], ["(d) Two symptoms of dengue", "Any two: high fever, severe headache, pain behind the eyes, body aches"], ["(e) Maximum days water should be left standing", "Three days"]],
    summary: "Dengue, spread by the day-biting Aedes mosquito, is common in Bangladesh during the rainy months. It causes high fever and pain; patients need fluids, rest and medical advice. Removing standing water and using mosquito nets help prevent it.",
    match: { rows: [["(a) The Aedes mosquito breeds", "(i) without a doctor’s advice."], ["(b) Patients should drink", "(ii) in clean, still water."], ["(c) Aspirin should not be taken", "(iii) even during daytime sleep."], ["(d) Mosquito nets should be used", "(iv) plenty of fluids."], ["", "(v) only in winter."]],
      key: ["(ii)", "(iv)", "(i)", "(iii)"] },
    jumbled: { lines: ["(a) The shepherd boy cried, “Wolf! Wolf!” to play a joke.", "(b) One day a wolf really came.", "(c) A shepherd boy used to graze sheep near a village.", "(d) This time nobody came, and the wolf killed many sheep.", "(e) The villagers ran to help him but found no wolf.", "(f) The boy cried for help again."],
      key: "c → a → e → b → f → d" },
    box: { words: ["an", "the", "at", "for", "with", "and", "after", "in", "of", "who"],
      text: "Hasan is (a) _____ early riser. He gets up (b) _____ dawn every day. (c) _____ saying his prayers, he goes for a walk (d) _____ his father. He believes that walking is good (e) _____ health. He studies (f) _____ the morning (g) _____ goes to school at nine. He is one (h) _____ the best students in his class. He helps his classmates (i) _____ are weak in English. (j) _____ teachers are proud of him.",
      key: ["an", "at", "After", "with", "for", "in", "and", "of", "who", "The"] },
    substitution: { rows: [["Bees", "wash", "our hands before meals."], ["We should", "gives", "us light and heat."], ["The sun", "make", "honey."], ["A cow", "flows", "milk."], ["The river Jamuna", "gives", "through Bangladesh."]],
      key: ["Bees make honey.", "We should wash our hands before meals.", "The sun gives us light and heat.", "A cow gives milk.", "The river Jamuna flows through Bangladesh."] },
    verbs: { text: "Every year 21 February (a) _____ (observe) as International Mother Language Day. On this day in 1952, many students (b) _____ (lose) their lives for our mother tongue. Since then the day (c) _____ (become) a symbol of love for language. Early in the morning, people (d) _____ (walk) barefoot to the Shaheed Minar. Last year I (e) _____ (go) there with my parents. While we (f) _____ (place) flowers, a song (g) _____ (play) on the loudspeaker. I felt that I (h) _____ (never forget) that moment. We should try (i) _____ (speak) our language correctly. We must also (j) _____ (respect) other languages.",
      key: ["is observed", "lost", "has become", "walk", "went", "were placing", "was playing", "would never forget", "to speak", "respect"] },
    transform: [
      ["They are building a new bridge. (Make it passive.)", "A new bridge is being built by them."],
      ["The teacher said to us, “Do not make a noise.” (Change the narration.)", "The teacher told us not to make a noise."],
      ["Iron is more useful than any other metal. (Make it superlative.)", "Iron is the most useful of all metals."],
      ["He is rich. He is not happy. (Join with “but”.)", "He is rich but not happy."],
      ["She could not come because of illness. (Make it complex.)", "She could not come because she was ill."],
      ["Everybody wishes to be happy. (Make it interrogative.)", "Who does not wish to be happy?"],
      ["It is a very sad news. (Correct the sentence.)", "It is very sad news."],
      ["Work hard or you will fail. (Use “if”.)", "If you do not work hard, you will fail."],
      ["The baby cried. It was hungry. (Join using a participle.)", "Being hungry, the baby cried."],
      ["What a lovely view it is! (Make it assertive.)", "It is a very lovely view."]
    ],
    punctuation: { text: "my uncle lives in sylhet he has a tea garden near srimangal last year i spent the eid holidays there it was wonderful",
      key: "My uncle lives in Sylhet. He has a tea garden near Srimangal. Last year I spent the Eid holidays there. It was wonderful.\n\nAward 0.5 for each necessary capital letter or punctuation mark placed correctly, up to a maximum of 5 marks." },
    letter: { q: "Write a letter to the editor of a daily newspaper about the need to keep your town free from mosquitoes during the rainy season.",
      a: "20 June 2026\nThe Editor\nThe Daily Sangbad\nDhaka\n\nSubject: Need for action against mosquitoes in Narayanganj\n\nSir,\nI would be grateful if you published the following letter in your esteemed daily.\n\nEvery rainy season, mosquitoes spread dengue in our town. Drains are blocked, and rainwater collects in empty plots, old tyres and plastic containers. Many children have already been admitted to hospital with high fever this month.\n\nThe city corporation should clean the drains regularly and spray medicine in all areas. Citizens should also remove standing water from their homes every three days. Schools can organise awareness campaigns.\n\nI hope the authorities will take quick steps to protect us.\n\nYours faithfully,\nSabrina Akter\nChashara, Narayanganj" },
    story: { prompt: "Nadia’s class had planted a mango sapling on the school ground. One morning they found that a goat had eaten most of its leaves…",
      a: "The Little Tree That Lived\n\nNadia’s friends were upset. Some said it was useless to try again. But Nadia noticed that the stem was still green. She told her class that a living stem could grow new leaves if they cared for it.\n\nThe students made a fence of bamboo sticks around the sapling. They took turns watering it every morning and put dry leaves around its roots. Nadia also talked to the guard, who promised to keep goats away from the ground.\n\nAfter three weeks, tiny new leaves appeared. The whole class cheered. By the end of the year, the sapling was taller than Nadia. The head teacher named it “the class eight tree”. Nadia learnt that patience and care can bring back what seems to be lost." },
    composition: { topic: "Bangladesh — The Land of Rivers",
      a: "Bangladesh is called a land of rivers. About seven hundred rivers, including their branches, flow across the country. The Padma, the Meghna and the Jamuna are among the largest.\n\nRivers are closely connected with our life. They bring fertile soil that helps farmers grow rice, jute and vegetables. Fishermen depend on rivers for their living, and fish is an important part of our food. Boats, launches and ships carry people and goods from one place to another at low cost.\n\nRivers are also part of our culture. Many of our folk songs, such as bhatiali, are about boatmen and rivers. Boat races are held in many districts during the rainy season.\n\nHowever, rivers also cause problems. Floods and river erosion destroy homes and crops every year. Many rivers are becoming narrow and polluted because of waste and illegal occupation.\n\nWe must protect our rivers by stopping pollution and illegal occupation and by dredging them regularly. If our rivers live, Bangladesh will live." }
  });

  return [set2, set3, set4, set5];
})();

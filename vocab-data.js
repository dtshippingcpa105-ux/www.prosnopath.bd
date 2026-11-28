// শব্দভান্ডার: [ইংরেজি শব্দ, পদ, বাংলা অর্থ, উদাহরণ বাক্য, সমার্থক শব্দ]
// পদ: n = noun (বিশেষ্য), v = verb (ক্রিয়া), adj = adjective (বিশেষণ), adv = adverb (ক্রিয়াবিশেষণ)
const VOCAB_TOPICS = [
  {
    id: "school", name: "স্কুল ও পড়াশোনা", words: [
      ["achieve", "v", "অর্জন করা", "She worked hard to achieve good marks.", "attain"],
      ["attend", "v", "উপস্থিত থাকা", "All students must attend the morning assembly.", "be present"],
      ["curious", "adj", "কৌতূহলী", "A curious student always asks questions.", "inquisitive"],
      ["diligent", "adj", "পরিশ্রমী", "Rafi is a diligent student.", "hardworking"],
      ["examine", "v", "পরীক্ষা করা", "The teacher examined our answer scripts.", "inspect"],
      ["explain", "v", "ব্যাখ্যা করা", "Please explain the meaning of this word.", "describe"],
      ["knowledge", "n", "জ্ঞান", "Books are a great source of knowledge.", "learning"],
      ["library", "n", "গ্রন্থাগার", "We borrow books from the school library.", ""],
      ["memorize", "v", "মুখস্থ করা", "Do not just memorize; try to understand.", "learn by heart"],
      ["patient", "adj", "ধৈর্যশীল", "Our teacher is patient with weak students.", "calm"],
      ["punctual", "adj", "সময়নিষ্ঠ", "A punctual student is never late for class.", "on time"],
      ["revise", "v", "পুনরায় পড়া, ঝালাই করা", "I revise my lessons every night.", "review"],
      ["solve", "v", "সমাধান করা", "Can you solve this math problem?", "work out"],
      ["subject", "n", "বিষয়", "Science is my favourite subject.", "topic"],
      ["syllabus", "n", "পাঠ্যসূচি", "The syllabus for the exam is very long.", "curriculum"],
      ["intelligent", "adj", "বুদ্ধিমান", "He is an intelligent boy.", "clever"],
      ["discipline", "n", "শৃঙ্খলা", "Discipline is the key to success.", "self-control"],
      ["improve", "v", "উন্নতি করা", "Reading daily will improve your English.", "develop"],
      ["instruction", "n", "নির্দেশনা", "Read the instructions carefully before answering.", "direction"],
      ["progress", "n", "অগ্রগতি", "Your progress in mathematics is good.", "improvement"]
    ]
  },
  {
    id: "daily", name: "দৈনন্দিন জীবন", words: [
      ["neighbour", "n", "প্রতিবেশী", "Our neighbour helped us during the flood.", ""],
      ["borrow", "v", "ধার নেওয়া", "May I borrow your pen?", ""],
      ["purchase", "v", "কেনা", "My father purchased a new bicycle.", "buy"],
      ["cheap", "adj", "সস্তা", "Vegetables are cheap in winter.", "inexpensive"],
      ["expensive", "adj", "দামি", "This phone is too expensive for me.", "costly"],
      ["crowded", "adj", "ভিড়পূর্ণ", "The bus was very crowded this morning.", "packed"],
      ["journey", "n", "যাত্রা, ভ্রমণ", "We enjoyed our train journey to Sylhet.", "trip"],
      ["habit", "n", "অভ্যাস", "Getting up early is a good habit.", "practice"],
      ["guest", "n", "অতিথি", "We welcomed the guests with sweets.", "visitor"],
      ["polite", "adj", "ভদ্র, বিনয়ী", "Always be polite to elders.", "courteous"],
      ["arrange", "v", "সাজানো, ব্যবস্থা করা", "We arranged a party for Grandma.", "organize"],
      ["daily", "adj", "দৈনিক", "Reading the newspaper is my daily habit.", "everyday"],
      ["festival", "n", "উৎসব", "Pohela Boishakh is a colourful festival.", "celebration"],
      ["market", "n", "বাজার", "Mother goes to the market every Friday.", "bazaar"],
      ["prepare", "v", "প্রস্তুত করা", "Mother is preparing breakfast.", "make ready"],
      ["receive", "v", "গ্রহণ করা, পাওয়া", "I received a letter from my uncle.", "get"],
      ["village", "n", "গ্রাম", "My grandparents live in a small village.", ""],
      ["vehicle", "n", "যানবাহন", "Too many vehicles cause traffic jams.", ""],
      ["occupation", "n", "পেশা", "Farming is the main occupation of villagers.", "profession"],
      ["recipe", "n", "রান্নার প্রণালি", "This is my mother's recipe for pitha.", ""]
    ]
  },
  {
    id: "nature", name: "প্রকৃতি ও পরিবেশ", words: [
      ["environment", "n", "পরিবেশ", "We must keep our environment clean.", "surroundings"],
      ["pollution", "n", "দূষণ", "Air pollution is harmful to health.", "contamination"],
      ["flood", "n", "বন্যা", "The flood damaged many houses.", "deluge"],
      ["drought", "n", "খরা", "Crops die during a drought.", "dry spell"],
      ["cyclone", "n", "ঘূর্ণিঝড়", "A cyclone hit the coastal area last night.", "storm"],
      ["harvest", "n", "ফসল কাটা", "Farmers are busy during the harvest.", "crop"],
      ["forest", "n", "বন, অরণ্য", "The Sundarbans is the largest mangrove forest.", "woods"],
      ["protect", "v", "রক্ষা করা", "We should protect wild animals.", "save"],
      ["plant", "v", "রোপণ করা", "Let us plant a tree on our birthday.", "sow"],
      ["season", "n", "ঋতু", "Bangladesh has six seasons.", ""],
      ["climate", "n", "জলবায়ু", "Climate change affects farmers.", "weather pattern"],
      ["coast", "n", "উপকূল", "Cox's Bazar is on the coast of the Bay of Bengal.", "shore"],
      ["soil", "n", "মাটি", "This soil is good for growing rice.", "earth"],
      ["wildlife", "n", "বন্যপ্রাণী", "The forest is full of wildlife.", ""],
      ["destroy", "v", "ধ্বংস করা", "Fire can destroy a forest quickly.", "ruin"],
      ["recycle", "v", "পুনর্ব্যবহার করা", "We can recycle paper and plastic.", "reuse"],
      ["scenery", "n", "প্রাকৃতিক দৃশ্য", "The scenery of the hills is beautiful.", "landscape"],
      ["shelter", "n", "আশ্রয়", "People took shelter in the cyclone centre.", "refuge"],
      ["rainfall", "n", "বৃষ্টিপাত", "Sylhet gets heavy rainfall every year.", "rain"],
      ["natural", "adj", "প্রাকৃতিক", "Gas is a natural resource of our country.", ""]
    ]
  },
  {
    id: "character", name: "অনুভূতি ও চরিত্র", words: [
      ["honest", "adj", "সৎ", "An honest man never tells lies.", "truthful"],
      ["brave", "adj", "সাহসী", "The brave boy saved the drowning child.", "courageous"],
      ["kind", "adj", "দয়ালু", "Be kind to animals.", "caring"],
      ["proud", "adj", "গর্বিত", "We are proud of our language martyrs.", ""],
      ["anxious", "adj", "উদ্বিগ্ন", "She was anxious before the exam.", "worried"],
      ["grateful", "adj", "কৃতজ্ঞ", "I am grateful to my teachers.", "thankful"],
      ["generous", "adj", "উদার", "The generous man gave food to the poor.", "giving"],
      ["humble", "adj", "নম্র, বিনয়ী", "Great people are often humble.", "modest"],
      ["lazy", "adj", "অলস", "A lazy person cannot succeed.", "idle"],
      ["confident", "adj", "আত্মবিশ্বাসী", "Practice makes you confident.", "sure"],
      ["courage", "n", "সাহস", "It takes courage to speak the truth.", "bravery"],
      ["respect", "v", "সম্মান করা", "We should respect our parents.", "honour"],
      ["forgive", "v", "ক্ষমা করা", "Please forgive me for my mistake.", "pardon"],
      ["sincere", "adj", "আন্তরিক", "He is sincere in his work.", "genuine"],
      ["cruel", "adj", "নিষ্ঠুর", "It is cruel to beat a dog.", "heartless"],
      ["delighted", "adj", "আনন্দিত", "I was delighted to get the prize.", "very happy"],
      ["helpful", "adj", "সাহায্যকারী", "Our neighbours are very helpful.", "supportive"],
      ["jealous", "adj", "ঈর্ষান্বিত", "Do not be jealous of others' success.", "envious"],
      ["obedient", "adj", "বাধ্য", "An obedient child listens to parents.", "dutiful"],
      ["patriot", "n", "দেশপ্রেমিক", "A patriot loves his country.", ""]
    ]
  },
  {
    id: "health", name: "স্বাস্থ্য ও শরীর", words: [
      ["healthy", "adj", "সুস্থ, স্বাস্থ্যকর", "Fruits are healthy food.", "fit"],
      ["disease", "n", "রোগ", "Dirty water spreads disease.", "illness"],
      ["exercise", "n", "ব্যায়াম", "Regular exercise keeps us fit.", "workout"],
      ["medicine", "n", "ওষুধ", "Take this medicine after meals.", "drug"],
      ["nutrition", "n", "পুষ্টি", "Good nutrition helps children grow.", "nourishment"],
      ["balanced", "adj", "সুষম", "We need a balanced diet.", ""],
      ["cure", "v", "নিরাময় করা", "Doctors try to cure patients.", "heal"],
      ["prevent", "v", "প্রতিরোধ করা", "Washing hands helps prevent disease.", "stop"],
      ["hygiene", "n", "স্বাস্থ্যবিধি, পরিচ্ছন্নতা", "Personal hygiene is very important.", "cleanliness"],
      ["injury", "n", "আঘাত", "He got an injury while playing football.", "wound"],
      ["patient", "n", "রোগী", "The patient is resting in the hospital.", ""],
      ["recover", "v", "সেরে ওঠা", "She recovered from fever quickly.", "get well"],
      ["symptom", "n", "রোগের লক্ষণ", "Fever is a symptom of dengue.", "sign"],
      ["vaccine", "n", "টিকা", "Every child should get the measles vaccine.", ""],
      ["weak", "adj", "দুর্বল", "He felt weak after the illness.", "feeble"],
      ["strength", "n", "শক্তি", "Good food gives us strength.", "power"],
      ["breathe", "v", "শ্বাস নেওয়া", "We breathe in oxygen.", ""],
      ["digest", "v", "হজম করা", "Rice is easy to digest.", ""],
      ["sleep", "n", "ঘুম", "Children need eight to ten hours of sleep.", "rest"],
      ["fresh", "adj", "তাজা", "Eat fresh fruits and vegetables.", "new"]
    ]
  }
];

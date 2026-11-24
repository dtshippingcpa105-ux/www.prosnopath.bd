# প্রশ্নপাঠ

পঞ্চম শ্রেণি থেকে এইচএসসি পর্যন্ত বাংলা অনুশীলনভান্ডার। প্রশ্নব্যাংক, কুইজ ও সার্চ একই প্রশ্নভান্ডার ব্যবহার করে। সাইটটি স্ট্যাটিক HTML, CSS ও JavaScript দিয়ে তৈরি। লোকাল প্রিভিউয়ের জন্য Node.js দরকার।

## বর্তমান অবস্থা

| অংশ | আগের অবস্থা | এখন |
| --- | --- | --- |
| প্রশ্নব্যাংক | ৩টি শ্রেণি-গ্রুপে ২৪টি MCQ ও ৯টি সমাধানবিহীন লিখিত প্রশ্ন | ৬টি শ্রেণি-গ্রুপে ৪২টি শ্রেণি–বিষয় জুটির ৪৬টি সেট, ১৭১টি ব্যাখ্যাসহ MCQ এবং ৬৩টি নমুনা সমাধানসহ লিখিত প্রশ্ন |
| কুইজ | পেজ ছিল, চালানোর স্ক্রিপ্ট ছিল না | প্রত্যেক MCQ সেটে কুইজ, প্রতি প্রশ্নে ৩০ সেকেন্ড বা সময়সীমা ছাড়া অনুশীলন, বাদ দেওয়া, স্কোর ও উত্তর পর্যালোচনা |
| পাঠ্যবই | লিংকের ডেটা ছিল, দেখার পেজ ছিল না | NCTB-এর শ্রেণিভিত্তিক সরকারি তালিকা এবং ২০২৪–২০২৫-এর বিদ্যমান সংগ্রহের ৭৬৪টি আলাদা আর্কাইভ রেকর্ড |
| সার্চ | ফলাফল পেজ অনুপস্থিত ছিল | শ্রেণি, বিষয়, অধ্যায়, প্রশ্নের লেখা ও আর্কাইভের বইয়ের নাম দিয়ে খোঁজা যায় |
| অধ্যায়ভিত্তিক নোট ও প্রশ্নপত্র | নির্বাচিত অধ্যায়ের অনুশীলনী প্রিন্ট করা যেত | চার বিষয়ে আটটি নোট। প্রশ্ন বাছাই, নিজের লিখিত প্রশ্ন, পূর্ণমান এবং আলাদা প্রশ্নপত্র ও উত্তরমালা প্রিন্ট/PDF |
| অভিভাবক সহায়তা | আলাদা নির্দেশিকা ছিল না | অভিভাবক কর্নারে ছয়টি নির্দেশিকা ও সাত দিনের কাজের পরিকল্পনা |

প্রশ্নভান্ডারে তালিকাভুক্ত ৪২টি শ্রেণি–বিষয় জুটির প্রতিটিতে অন্তত একটি অনুশীলন সেট আছে। সেটগুলো নির্বাচিত বিষয়ের প্রাথমিক অনুশীলন। পূর্ণ পাঠ্যসূচি, ধর্মভিত্তিক আলাদা অধ্যায় এবং সব বিভাগের জন্য আরও সেট দরকার। আগের নমুনা পরীক্ষার রুটিনের দাবিটি প্রকাশ্য পেজ থেকে সরানো হয়েছে। বোর্ডের সংবাদ প্রকাশের সময় উৎস ও তারিখ দিন।

## লোকাল প্রিভিউ

প্রকল্পের ফোল্ডারে চালান।

```powershell
node preview.mjs
```

ব্রাউজারে [লোকাল প্রিভিউ](http://127.0.0.1:4173/) খুলুন। ৪১৭৩ পোর্ট ব্যবহৃত হলে `node preview.mjs 4174` চালাতে পারেন। অনুশীলনীর পেজ থেকে **প্রিন্ট / PDF** বেছে নিলে ব্রাউজারের প্রিন্ট ডায়ালগে PDF হিসেবে সংরক্ষণের বিকল্প পাবেন। সেই প্রিন্টে উত্তর ও ব্যাখ্যা ঢেকে রাখা হয়।

## WordPress ও গবেষণা

- পরীক্ষামূলক WordPress প্যাকেজ ও সেটআপ নির্দেশনা [WordPress ফোল্ডারে](wordpress/README.md)।
- অনলাইন প্রশ্নপত্র তৈরির তুলনা, বাস্তবায়িত কাজ ও পরবর্তী অগ্রাধিকার [গবেষণার নথিতে](research-and-roadmap.md)।

## কনটেন্ট ও সেটিংস

- `data.js`-এ `SUBJECTS_BY_CLASS` অনুসারে `QUESTION_BANK`-এর `শ্রেণি-id|বিষয়-id` এন্ট্রিতে সেট যোগ করুন। MCQ-এর `answer` শূন্য থেকে গোনা অপশন সূচক। `explain`-এ ব্যাখ্যা এবং লিখিত প্রশ্নের `solution`-এ নমুনা উত্তর দিন। নতুন সেট প্রশ্নব্যাংক, সার্চ ও কুইজে স্বয়ংক্রিয়ভাবে আসবে।
- `study-data.js`-এ প্রথম আটটি নোট, উদাহরণ, MCQ, লিখিত সমাধান ও নম্বর বণ্টন আছে। নোটের প্রশ্নগুলো বিদ্যমান অধ্যায়ের প্রশ্নের সঙ্গে যুক্ত হয়। সম্পাদকীয় যাচাইয়ের আগে এগুলো নিজস্ব অনুশীলনী হিসেবে দেখানো হচ্ছে।
- `textbooks.html`-এ সরকারি উৎস পরিবর্তন করুন। `textbook-links.js`-এ পুরোনো সংগ্রহ রাখা হয়েছে। সংরক্ষিত প্রতিটি PDF-এর প্রাপ্যতা আলাদাভাবে যাচাই করা হয়নি। নতুন লিংক যোগ করার সময় সঠিক শিক্ষাবর্ষ, শ্রেণি, সংস্করণ ও ফাইল মিলিয়ে নিন।
- প্রশ্নপাঠের প্রকাশ্য ইমেইল নির্ধারিত হলে `data.js`-এ `SITE.email` বসান। তখন মতামত পেজ পাঠকের ইমেইল অ্যাপে খসড়া খুলতে পারবে। বর্তমান পেজে খসড়া কপি বা ডাউনলোড করা যায়।
- হোমপেজের আপডেট `index.html`-এ সম্পাদনা করা যায়। নেভিগেশন বা ফুটারে পরিবর্তন হলে বারোটি HTML পেজে একই পরিবর্তন প্রয়োগ করুন।
- প্রশ্নপাঠের মূল লোগো `assets/logo.png`-তে আছে। পেজের জন্য ছোট সংস্করণ `assets/brand.png` এবং ব্রাউজার ট্যাবের আইকন `assets/favicon.png`।

## প্রকাশের সময়

1. আসল ডোমেইন ও HTTPS-সহ স্ট্যাটিক হোস্ট নির্ধারণ করুন। HTML পেজগুলো, `data.js`, `textbook-links.js` ও `assets/` একই প্রকাশ ফোল্ডারে রাখুন। `preview.mjs` লোকাল ব্যবহারের জন্য।
2. হোস্টে `index.html`-কে প্রথম পেজ এবং `404.html`-কে HTTP 404 পেজ করুন। হোস্ট যদি অজানা সাবপাথের ঠিকানাতেই 404 পেজ দেখায়, 404-এর লিংকগুলো প্রকাশ ফোল্ডারের বেস ঠিকানা অনুযায়ী সেট করুন।
3. ডোমেইন জানা গেলে প্রকাশ্য পেজের canonical URL, sitemap এবং সোশ্যাল শেয়ার ছবির URL যোগ করুন। হোস্টিংয়ে দর্শকের অনুরোধের লগ বা বিশ্লেষণ চালু করলে গোপনীয়তার বর্ণনা সেই অনুযায়ী আপডেট করুন।
4. বাকি অধ্যায় ও বোর্ডভিত্তিক প্রশ্নপত্র প্রকাশের জন্য পাঠ্যসূচি অনুযায়ী যাচাই করা কনটেন্ট এবং প্রকাশের অনুমতি আছে এমন উৎস যোগ করুন। পুরোনো আর্কাইভের যেসব লিংক জনসাধারণের জন্য কাজ করে সেগুলো উৎসের সঙ্গে মিলিয়ে নিন।
5. প্রকাশের পর HTTPS ঠিকানায় হোম, শ্রেণির লিংক, সার্চ, কুইজ, সরকারি বইয়ের উৎস, ৪০৪ ও মতামতের ইমেইল খোলা যাচাই করুন। এই ফোল্ডারে লোকাল পরিবর্তন করা হয়েছে, কোনো ডোমেইনে প্রকাশ করা হয়নি।

## পেজের থিম ও ছবি

শিক্ষক কর্নারে শ্রেণিকক্ষের বোর্ড, অভিভাবক কর্নারে শেখার অগ্রগতি, প্রশ্নব্যাংকে ফাইল কার্ড, নোটে রেখাটানা খাতা, প্রশ্নপত্রে খসড়ার ডেস্ক, কুইজে সময়ের ডায়াল এবং পাঠ্যবইয়ে বুকশেলফের নকশা আছে। পেজের থিম `assets/page-themes.css`-এ।

দুটি ছবিই বিল্ট-ইন ImageGen দিয়ে তৈরি করে ওয়েবের জন্য JPEG-এ ছোট করা হয়েছে। বোর্ডের বাংলা বাণী পেজের পাঠ্য হিসেবে বসানো হয়েছে।

### `assets/teacher-board.jpg`

> Photorealistic natural editorial web asset for a Bengali learning website. A large traditional dark forest-green classroom chalkboard with subtly cleaned chalk smudges, straight-on at eye level, very dark matte green center and narrow worn wooden frame but no desk foreground. Soft morning window light brushes upper right edge; an understated holder with two chalk pieces along the bottom edge. Classroom warmth. Keep the central 75% completely open, uniformly dark, and usable for a live Bengali quote overlaid in HTML. Wide landscape framing, edges extend naturally for mobile crops. No people, no chalk lettering, no characters, no text, no logos or watermarks.

### `assets/parent-learning.jpg`

> Photorealistic natural editorial photograph for a Bangladeshi education site, calm and encouraging. A Bangladeshi mother and her early-teen daughter sit next to each other at a modest wooden dining table in a lived-in home, quietly reading an open notebook together. The daughter points at one line and the mother listens with a relaxed supportive smile. Natural window light on the right, soft cream walls and sage details, warm amber sunlight. Medium-wide composition with both faces in the middle, hands naturally posed on the desk. A little breathing room above and around to crop for an illustrated panel. Everyday clothing, documentary realism, no visible text, no logos or watermarks, no school trophies. Landscape.

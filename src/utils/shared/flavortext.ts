export const flavorText = {
  header: {
    cooked: [
      "attendance might be cooked",
      "aint nobody savin you",
      "bro is donating tuition fees",
      "academic comeback? unlikely",
      "rest in peace (your grades)",
      "yea blud, 10gpa this sem fs",
    ],
    danger: [
      "living on the edge",
      "one sick leave away from disaster",
      "calculated risks (you are bad at math)",
      "clinging to 75% for dear life",
    ],
    safe: [
      "academic weapon detected",
      "bro lives in the library",
      "okay einstein, chill",
      "we making it out of srm with this one",
    ],
  },
  marks: {
    cooked: [
      "absolute academic disaster",
      "your gpa is in the trenches",
      "bro is allergic to studying",
      "see you in the supplementaries",
      "actually zero brain activity",
    ],
    danger: [
      "borderline fumbling",
      "locking in is no longer optional",
      "barely surviving the internal",
      "one bad paper from ggs",
    ],
    safe: [
      "insane academic aura",
      "professor's favorite target",
      "blud definitely has the question bank",
      "copied know? dont lie",
    ],
  },
  badges: {
    low: ["cooked", "ggwp", "fumbled", "skill issue", "holy moly"],
    mid: ["mid", "sus", "borderline", "lock in"],
    high: ["goated", "w", "academic weapon", "too ez"],
  },
  freeTime: [
    "touch grass",
    "go gym",
    "existential dread",
    "nap time",
    "freedom (404)",
  ],
  timetable: [
    "your schedule is looking tight.",
    "another day, another set of bunkers.",
    "may your classes be short and attendance high.",
    "the grind doesn't stop, but you can.",
  ],
  loading: [
    "stealing your data hehe ;)...",
    "fighting zoho for your attendance...",
    "waking up the hamsters...",
    "kicking your other session out...",
    "decrypting your academic downfall...",
  ],
};

export const getRandomRoast = (category: "cooked" | "danger" | "safe") => {
  const roasts = flavorText.marks[category];
  return roasts[Math.floor(Math.random() * roasts.length)];
};

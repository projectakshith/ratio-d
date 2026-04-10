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
    neutral: [
      "waiting for your downfall",
      "calm before the storm",
      "aint no way you got nothing yet",
      "suspiciously quiet records",
    ],
    impossible: [
      "O is officially a dream now",
      "bro lost too many, A+ is the ceiling",
      "cooked internals, aim for A blud",
      "you fumbled the O, lock in for A+",
      "100/100 is not for everyone clearly",
    ],
    lostO: [
      "O is cooked, aim for A+",
      "fumbled the O, lock in for A+",
      "O dream is dead, A+ is the move",
      "bye bye O grade, hello A+",
    ],
    lostAPlus: [
      "A+ is a dream now, get A",
      "fumbled A+ asw? aim for A",
      "A+ is cooked, focus on A",
      "locking in for A now, A+ is gone",
    ],
    achievable: [
      "O is still on the table, lock in",
      "don't lose more, keep the O dream alive",
      "A+ is easy if you don't fumble now",
      "you're on track for a goated grade",
      "insane internals, just don't sleep in sem",
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

export const getRandomRoast = (
  category: "cooked" | "danger" | "safe" | "neutral",
  section: "header" | "marks" = "marks"
) => {
  const sectionData = (flavorText as any)[section] || flavorText.marks;
  const roasts = sectionData[category] || sectionData.neutral || sectionData.cooked;
  return roasts[Math.floor(Math.random() * roasts.length)];
};

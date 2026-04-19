export const flavorText = {
  header: {
    cooked: [
      "attendance is straight up cooked",
      "aint nobody savin you from this",
      "bro is just donating tuition fees at this point",
      "academic comeback? maybe in another life",
      "rest in peace to your grades",
      "yea blud, 10gpa is a myth for you",
    ],
    danger: [
      "living life on the edge",
      "one sick leave and it's over",
      "calculated risks but you're failing math",
      "clinging to 75% like a lifeline",
    ],
    safe: [
      "straight up academic weapon",
      "bro definitely lives in the library",
      "okay einstein, we get it",
      "we making it out of srm with ease",
    ],
  },
  marks: {
    cooked: [
      "this is an absolute disaster blud",
      "your gpa is officially in the trenches",
      "bro is allergic to opening a book",
      "see you in the supps, no cap",
      "actual zero brain activity detected",
      "straight to supplementaries, do not pass go",
      "academic career speedrun (any%)",
    ],
    danger: [
      "you're borderline fumbling the bag",
      "locking in is no longer a choice",
      "barely surviving the internal grind",
      "one bad paper and it's ggs",
      "clinging to passing marks for dear life",
    ],
    safe: [
      "internals are chill, just don't ghost",
      "you're safe here, focus on other subs",
      "heavenly marks, stop overthinking",
      "all safe, just don't fumbled the sem",
      "insane academic aura you got there",
      "professor's favorite student fs",
      "blud definitely has the leaks",
      "copied know? don't even lie",
    ],
    neutral: [
      "just the calm before the storm",
      "waiting for the downfall or the glow up",
      "aint no way you got zero marks yet",
      "suspiciously quiet records here",
    ],
    lostO: [
      "O is cooked blud, target A+ now",
      "fumbled the O, lock in for A+ immediately",
      "O dream is dead, A+ is the move",
      "bye bye O grade, hello A+",
      "no more O for you, focus on A+ maybe?",
    ],
    lostAPlus: [
      "A+ is a distant memory, get that A",
      "fumbled A+ asw? aim for A",
      "A+ is cooked, focus on A",
      "locking in for A now, A+ is gone",
      "bro really fumbled the A+, just get A",
    ],
    achievable: [
      "{grade} is still on the table, don't throw",
      "don't lose more, keep the {grade} dream alive",
      "{grade} is light work if you don't fumble",
      "on track for a straight up goated grade",
      "insane internals, just don't sleep in sem",
      "you're actually doing good, keep it up",
      "maintaining the {grade} like a pro",
    ],
    razor: [
      "you're literally on the razor's edge",
      "one mistake and your {grade} is dust",
      "requires insane precision now, good luck",
      "peak insanity, you need every mark left",
      "literally fighting for that {grade} now",
    ],
    capped: [
      "internals capped, sem gotta be crazy",
      "reachable with finals but internals won't cut it",
      "impossible via internals alone, lock in",
    ],
  },
  badges: {
    low: ["cooked", "ggwp", "fumbled", "skill issue", "holy moly"],
    mid: ["mid", "sus", "borderline", "lock in"],
    high: ["goated", "w", "academic weapon", "too ez"],
  },
  freeTime: [
    "go touch some grass",
    "hit the gym maybe?",
    "existential dread kicking in",
    "actual nap time",
    "freedom.exe not found",
  ],
  timetable: [
    "your schedule is looking tight asf.",
    "another day, another set of bunkers.",
    "may your classes be short and attendance high.",
    "the grind doesn't stop, but you can.",
  ],
  welcomes: [
    "back for more disappointment?",
    "academic comeback starts now (unlikely).",
    "zoho's favorite victim is back.",
    "don't worry, srm is just a 4 year trial.",
    "checking your downfall again?",
    "ready to fumble another day?",
    "still not dropped out? impressive.",
    "your attendance called, it's crying.",
    "back to the trenches, i see.",
    "hope you brought some brain cells today.",
    "the library is that way, Ein-stein.",
    "zoho missed you. just kidding.",
  ],
  ascii: [
    "(¬‿¬)",
    "( ͡° ͜ʖ ͡°)",
    "¯\\_(ツ)_/¯",
    "ʕ•ᴥ•ʔ",
    "(ᵔᴥ•ᵔ)",
    "( •_•)",
    "( -_•) ┳━┳",
    "(⌐■_■)",
  ],
  loading: [
    "stealing your data for the vibes ;)...",
    "fighting zoho bosses for your data...",
    "waking up the campus hamsters...",
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

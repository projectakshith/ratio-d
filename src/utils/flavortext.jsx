export const getRandomRoast = (category) => {
  const roasts = flavorText[category];
  return roasts[Math.floor(Math.random() * roasts.length)];
};

export const flavorText = {
  header: {
    cooked: [
      "attendance might be cooked",
      "aint nobody savin you",
      "bro is donating tuition fees",
      "academic comeback? unlikely",
      "rest in peace (your grades)",
      "yea blud, 10gpa this sem fs"
    ],
    danger: [
      "living on the edge",
      "one sick leave away from disaster",
      "calculated risks (you are bad at math)",
      "clinging to 75% for dear life"
    ],
    safe: [
      "academic weapon detected",
      "bro lives in the library",
      "okay einstein, chill",
      "we making it out of srm with this one"
    ]
  },


  badges: {
    low: ["cooked", "ggwp", "fumbled", "skill issue", "holy moly"],
    mid: ["mid", "sus", "borderline", "lock in"],
    high: ["goated", "w", "academic weapon", "too ez"]
  },


  freeTime: [
    "touch grass",
    "go gym",
    "existential dread",
    "nap time",
    "freedom (404)"
  ],


  loading: [
    "stealing your data hehe ;)...",
    "fighting zoho for your attendance...",
    "waking up the hamsters...",
    "kicking your other session out...",
    "decrypting your academic downfall..."
  ]
};

export const getAttendanceStatus = (pct) => {
  if (pct < 75) return 'cooked';
  if (pct < 85) return 'danger';
  return 'safe';
};
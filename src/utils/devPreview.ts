/**
 * TEMPORARY local preview bypass — set to `false` before shipping / committing for real use.
 * When true: skips login, onboarding, and backend refresh; seeds mock academia data.
 */
export const DEV_SKIP_AUTH = true;

export const DEV_PREVIEW_DATA = {
  success: true,
  profile: {
    name: "Arthur Morgan",
    regNo: "RA000000000",
    batch: "2024",
    dept: "CSE",
    semester: "6",
    section: "A",
    cgpa: "8.50",
  },
  dayOrder: "1",
  attendance: [
    {
      code: "CSE301",
      course: "Algorithms",
      category: "Theory",
      conducted: 40,
      absent: 4,
      present: 36,
      percent: 90,
      title: "Algorithms",
    },
    {
      code: "CSE302",
      course: "Databases",
      category: "Theory",
      conducted: 38,
      absent: 6,
      present: 32,
      percent: 84.2,
      title: "Databases",
    },
    {
      code: "CSE303",
      course: "Networks Lab",
      category: "Practical",
      conducted: 20,
      absent: 1,
      present: 19,
      percent: 95,
      title: "Networks Lab",
    },
  ],
  marks: [
    {
      courseCode: "CSE301",
      courseTitle: "Algorithms",
      percentage: 82,
      totalMax: 100,
      totalObtained: 82,
    },
    {
      courseCode: "CSE302",
      courseTitle: "Databases",
      percentage: 76,
      totalMax: 100,
      totalObtained: 76,
    },
  ],
  schedule: {
    "Day 1": {
      "08:00-08:50": {
        course: "Algorithms",
        room: "TP1201",
        faculty: "Prof. Dutch",
        slot: "A",
        time: "08:00-08:50",
        code: "CSE301",
        type: "theory",
      },
      "09:00-09:50": {
        course: "Databases",
        room: "TP1304",
        faculty: "Prof. Hosea",
        slot: "B",
        time: "09:00-09:50",
        code: "CSE302",
        type: "theory",
      },
      "14:00-15:40": {
        course: "Networks Lab",
        room: "LAB-2",
        faculty: "Prof. Lenny",
        slot: "P1",
        time: "14:00-15:40",
        code: "CSE303",
        type: "lab",
      },
    },
  },
  courses: {},
};

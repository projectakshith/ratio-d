export interface StudentProfile {
  name: string;
  regNo?: string;
  batch?: string;
  dept?: string;
  semester?: string;
  section?: string;
  photo?: string;
}

export interface AttendanceRecord {
  code: string;
  course: string;
  category: string;
  conducted: number;
  absent: number;
  present: number;
  percent: number;
  title?: string;
  required?: number;
  displayName?: string;
}

export interface ScheduleSlot {
  course: string;
  room: string;
  faculty: string;
  slot: string;
  time: string;
  code?: string;
  courseCode?: string;
  courseTitle?: string;
  name?: string;
  id?: string;
  type?: string;
  isCustom?: boolean;
  isCurrent?: boolean;
  startMinutes?: number;
  endMinutes?: number;
}

export interface DaySchedule {
  [timeRange: string]: ScheduleSlot;
}

export interface ScheduleData {
  [dayKey: string]: DaySchedule;
}

export interface MarksRecord {
  course: string;
  assessments: {
    title: string;
    marks: string;
    total: string;
    got?: number;
    max?: number;
  }[];
  id?: number;
  code?: string;
  title?: string;
  type?: string;
  totalGot?: number;
  totalMax?: number;
  percentage?: number;
  isNA?: boolean;
  score?: number;
  testName?: string;
  displayScore?: string;
  max?: number;
  status?: string;
  badge?: string;
}

export interface CalendarEvent {
  date: string;
  day: string;
  order: string;
  description: string;
  type: string;
  dateObj?: Date;
  dayOrder?: string;
}

export interface AcademiaData {
  profile: StudentProfile;
  attendance: AttendanceRecord[];
  schedule: ScheduleData;
  marks: MarksRecord[];
  dayOrder?: string;
  calendarData?: CalendarEvent[];
  effectiveDayOrder?: string;
  effectiveSchedule?: ScheduleData;
  timetable?: ScheduleData;
  time_table?: ScheduleData;
}

export interface CalendarSlot {
  type: "padding" | "day";
  key: string;
  day?: number;
  dateObj?: Date;
  isSelected?: boolean;
  isToday?: boolean;
  isPast?: boolean;
  isDayHoliday?: boolean;
  dayOrder?: string | null;
  isDayExam?: boolean;
}

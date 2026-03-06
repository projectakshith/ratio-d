export interface StudentProfile {
  name: string;
  regNo?: string;
  batch?: string;
  dept?: string;
  semester?: string;
  section?: string;
  photo?: string;
  cgpa?: string;
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
  credits?: string;
}

export interface DaySchedule {
  [timeRange: string]: ScheduleSlot;
}

export interface ScheduleData {
  [dayKey: string]: DaySchedule;
}

export interface Assessment {
  title: string;
  marks: string;
  total: string;
  got?: number;
  max?: number;
}

export interface MarksRecord {
  course: string;
  assessments: Assessment[];
  id?: number;
  code?: string;
  title?: string;
  courseTitle?: string;
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

export interface Course {
  code: string;
  name: string;
  credits: string;
  type: string;
  faculty: string;
  room: string;
  slot: string;
}

export interface AcademiaData {
  profile: StudentProfile;
  attendance: AttendanceRecord[];
  schedule: ScheduleData;
  marks: MarksRecord[];
  courses?: Record<string, Course>;
  slots?: Record<string, any>;
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

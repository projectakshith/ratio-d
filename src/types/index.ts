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
}

export interface ScheduleSlot {
  course: string;
  room: string;
  faculty: string;
  slot: string;
  time?: string;
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
  }[];
}

export interface CalendarEvent {
  date: string;
  day: string;
  order: string;
  description: string;
  type: string;
  dateObj?: Date;
}

export interface AcademiaData {
  profile: StudentProfile;
  attendance: AttendanceRecord[];
  schedule: ScheduleData;
  marks: MarksRecord[];
  dayOrder?: string;
}

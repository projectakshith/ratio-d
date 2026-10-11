export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
export type MealType = "breakfast" | "lunch" | "snacks" | "dinner";

export interface MealTiming {
  start: string;
  end: string;
  label: string;
}

export interface DayMenu {
  meals: Record<MealType, string[]>;
}

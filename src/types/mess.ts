export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
export type MealType = "breakfast" | "lunch" | "snacks" | "dinner";
export type MealStatus = "upcoming" | "now" | "completed";

export interface MealTiming {
  start: string;
  end: string;
  label: string;
}

export interface DayMenu {
  meals: Record<MealType, string[]>;
}

export interface FoodItemRating {
  itemId: string;
  item: string;
  likes: number;
  dislikes: number;
  totalVotes: number;
  likePercentage: number | null;
  userVote: "like" | "dislike" | null;
}

export interface MealRatings {
  meal: MealType;
  items: FoodItemRating[];
}

export interface VotePayload {
  date: string;
  day: DayOfWeek;
  meal: MealType;
  itemId: string;
  vote: "like" | "dislike";
  regNo: string;
}

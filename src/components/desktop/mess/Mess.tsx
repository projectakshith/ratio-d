"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { fetchWithLoadBalancer } from "@/utils/backendProxy";
import { MEAL_TIMINGS, WEEKLY_MENU, getItemId } from "@/data/messMenu";
import { DayOfWeek, MealType } from "@/types/mess";
import { ThumbsUp, ThumbsDown, Coffee, Utensils, CupSoda, ChefHat } from "lucide-react";
import { format } from "date-fns";

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MEALS = [
  { id: "breakfast", label: "Breakfast", icon: Coffee },
  { id: "lunch", label: "Lunch", icon: Utensils },
  { id: "snacks", label: "Snacks", icon: CupSoda },
  { id: "dinner", label: "Dinner", icon: ChefHat },
];

const getFoodEmoji = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("bread") || n.includes("pav")) return "🍞";
  if (n.includes("butter")) return "🧈";
  if (n.includes("jam")) return "🍓";
  if (n.includes("egg") || n.includes("omlet")) return "🥚";
  if (n.includes("milk") || n.includes("tea") || n.includes("coffee")) return "☕";
  if (n.includes("chicken")) return "🍗";
  if (n.includes("mutton") || n.includes("meat")) return "🍖";
  if (n.includes("fish")) return "🐟";
  if (n.includes("rice") || n.includes("pulao") || n.includes("briyani") || n.includes("bath")) return "🍚";
  if (n.includes("dosa") || n.includes("idly") || n.includes("pongal") || n.includes("uthappam")) return "🥞";
  if (n.includes("chapathi") || n.includes("paratha") || n.includes("poori") || n.includes("luchi")) return "🫓";
  if (n.includes("salad")) return "🥗";
  if (n.includes("fruit") || n.includes("banana")) return "🍌";
  if (n.includes("ice cream") || n.includes("sweet") || n.includes("halwa") || n.includes("jamun") || n.includes("payasam")) return "🍨";
  if (n.includes("juice")) return "🥤";
  if (n.includes("dal") || n.includes("sambar") || n.includes("rasam") || n.includes("kuruma")) return "🍲";
  if (n.includes("chips") || n.includes("fryums")) return "🥨";
  return "🍛";
};

interface RatingItem {
  upvotes: number;
  downvotes: number;
  userVote?: "up" | "down";
}

interface RatingsResponse {
  [meal: string]: {
    [itemId: string]: RatingItem;
  };
}

export default function Mess() {
  const { userData } = useApp();
  const regNo = userData?.profile?.regNo;

  const [selectedDay, setSelectedDay] = useState<string>(() => {
    return DAYS[new Date().getDay()];
  });

  const [selectedMeal, setSelectedMeal] = useState<string>(() => {
    const minutes = new Date().getHours() * 60 + new Date().getMinutes();
    if (minutes < 9 * 60) return "breakfast";
    if (minutes < 13 * 60 + 30) return "lunch";
    if (minutes < 17 * 60 + 30) return "snacks";
    if (minutes < 21 * 60) return "dinner";
    return "breakfast";
  });

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [ratings, setRatings] = useState<RatingsResponse>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleDaySelect = (dayIndex: number) => {
    const today = new Date();
    const currentDayIndex = today.getDay();
    const diff = dayIndex - currentDayIndex;
    const newDate = new Date(today);
    newDate.setDate(today.getDate() + diff);

    setSelectedDay(DAYS[dayIndex]);
    setSelectedDate(newDate);
  };

  const fetchRatings = async (date: Date, day: string) => {
    if (!regNo) return;
    setLoading(true);
    setError(null);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const jwt = localStorage.getItem("ratio_jwt") || "";
      const res = await fetchWithLoadBalancer(
        `/api/mess/ratings?date=${dateStr}&day=${day}`,
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      if (!res.ok) throw new Error("Failed to fetch ratings");
      const data = await res.json();

      const newRatings: RatingsResponse = {};

      if (data.ratings) {
        data.ratings.forEach((r: any) => {
          if (!newRatings[r.meal]) newRatings[r.meal] = {};
          newRatings[r.meal][r.item_id] = {
            upvotes: r.upvotes || 0,
            downvotes: r.downvotes || 0,
          };
        });
      }

      if (data.user_votes) {
        data.user_votes.forEach((v: any) => {
          if (newRatings[v.meal] && newRatings[v.meal][v.item_id]) {
            newRatings[v.meal][v.item_id].userVote = v.vote === "like" ? "up" : "down";
          }
        });
      }

      setRatings(newRatings);
    } catch (err) {
      setError("Unable to load ratings. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    const loadRatings = async () => {
      if (!regNo) return;
      setLoading(true);
      setError(null);
      try {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const jwt = localStorage.getItem("ratio_jwt") || "";
        const res = await fetchWithLoadBalancer(
          `/api/mess/ratings?date=${dateStr}&day=${selectedDay}`,
          { headers: { Authorization: `Bearer ${jwt}` }, signal: controller.signal }
        );
        if (!res.ok) throw new Error("Failed to fetch ratings");
        const data = await res.json();

        const newRatings: RatingsResponse = {};

        if (data.ratings) {
          data.ratings.forEach((r: any) => {
            if (!newRatings[r.meal]) newRatings[r.meal] = {};
            newRatings[r.meal][r.item_id] = {
              upvotes: r.upvotes || 0,
              downvotes: r.downvotes || 0,
            };
          });
        }

        if (data.user_votes) {
          data.user_votes.forEach((v: any) => {
            if (newRatings[v.meal] && newRatings[v.meal][v.item_id]) {
              newRatings[v.meal][v.item_id].userVote = v.vote === "like" ? "up" : "down";
            }
          });
        }

        setRatings(newRatings);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setError("Unable to load ratings. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadRatings();
    return () => controller.abort();
  }, [selectedDay, selectedDate, regNo]);

  const handleVote = async (meal: string, item: string, type: "up" | "down") => {
    if (!regNo) return;

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const itemId = getItemId(selectedDay as DayOfWeek, meal as MealType, item);
    const currentVote = ratings[meal]?.[itemId]?.userVote;
    const isRemovingVote = currentVote === type;

    // Optimistic update
    setRatings(prev => {
      const mealData = prev[meal] || {};
      const itemData = mealData[itemId] || { upvotes: 0, downvotes: 0 };

      let newUpvotes = itemData.upvotes;
      let newDownvotes = itemData.downvotes;

      if (currentVote === "up") newUpvotes--;
      if (currentVote === "down") newDownvotes--;

      if (!isRemovingVote) {
        if (type === "up") newUpvotes++;
        if (type === "down") newDownvotes++;
      }

      return {
        ...prev,
        [meal]: {
          ...mealData,
          [itemId]: {
            ...itemData,
            upvotes: newUpvotes,
            downvotes: newDownvotes,
            userVote: isRemovingVote ? undefined : type,
          }
        }
      };
    });

    try {
      const jwt = localStorage.getItem("ratio_jwt") || "";
      let res;

      if (isRemovingVote) {
        res = await fetchWithLoadBalancer(`/api/mess/vote`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
          body: JSON.stringify({ date: dateStr, meal, item_id: itemId })
        });
      } else {
        const backendVote = type === "up" ? "like" : "dislike";
        res = await fetchWithLoadBalancer(`/api/mess/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
          body: JSON.stringify({ date: dateStr, day: selectedDay, meal, item_id: itemId, vote: backendVote })
        });
      }

      if (!res.ok) throw new Error("Vote failed");
    } catch (err) {
      console.error("Vote failed, reverting", err);
      // Revert optimistic update
      fetchRatings(selectedDate, selectedDay);
    }
  };

  const meals = WEEKLY_MENU[selectedDay as keyof typeof WEEKLY_MENU]?.meals || {};

  return (
    <div className="flex flex-col h-full w-full bg-theme-bg overflow-y-auto">
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-8">

        {/* Header */}
        <div className="flex flex-col">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-theme-text tracking-tight">Mess Menu</h1>
        </div>

        {/* Navigation Section */}
        <div className="space-y-4">
          {/* Day Selector */}
          <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {DAYS.map((day, index) => {
              const isSelected = selectedDay === day;
              return (
                <button
                  key={day}
                  onClick={() => handleDaySelect(index)}
                  title={`Select ${day}`}
                  aria-label={`Select ${day}`}
                  className={`min-w-[56px] h-10 px-4 flex-shrink-0 rounded-full font-bold transition-all duration-200 text-xs tracking-wider uppercase
                    ${isSelected
                      ? 'bg-theme-highlight text-white shadow-md transform scale-105'
                      : 'bg-theme-surface text-theme-muted hover:bg-theme-card hover:text-theme-text border border-theme-border/50'
                    }
                  `}
                >
                  {day.substring(0, 3)}
                </button>
              );
            })}
          </div>

          {/* Meal Selector - Premium Segmented Control */}
          <div className="flex bg-theme-surface border border-theme-border/60 rounded-xl p-1.5 shadow-sm">
            {MEALS.map((meal) => {
              const isSelected = selectedMeal === meal.id;
              const Icon = meal.icon;
              return (
                <button
                  key={meal.id}
                  onClick={() => setSelectedMeal(meal.id)}
                  title={`View ${meal.label}`}
                  aria-label={`Select ${meal.label}`}
                  className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center space-x-2
                    ${isSelected
                      ? 'bg-theme-highlight text-white shadow-sm'
                      : 'text-theme-muted hover:text-theme-text hover:bg-theme-bg'
                    }
                  `}
                >
                  <Icon size={16} className={isSelected ? 'text-white' : 'opacity-70'} />
                  <span className="hidden sm:inline capitalize tracking-wide">{meal.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Meal Content */}
        <div className="flex flex-col pt-2 pb-12">
          {Object.entries(meals)
            .filter(([meal]) => meal === selectedMeal)
            .map(([meal, items]) => {

            return (
              <div key={meal} className="flex flex-col animate-in fade-in duration-300">
                {/* Meal Header */}
                <div className="mb-5 flex items-center space-x-4 px-1">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-theme-text capitalize tracking-tight">
                    {meal}
                  </h2>
                  <span className="text-xs sm:text-sm font-semibold text-theme-muted bg-theme-surface px-3 py-1 rounded-full border border-theme-border/40">
                    {MEAL_TIMINGS[meal as keyof typeof MEAL_TIMINGS]?.start} – {MEAL_TIMINGS[meal as keyof typeof MEAL_TIMINGS]?.end}
                  </span>
                </div>

                {/* Food List Container */}
                <div className="bg-theme-surface border border-theme-border/50 rounded-2xl overflow-hidden shadow-sm">
                  {loading ? (
                    <div className="p-4 space-y-4">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex justify-between items-center animate-pulse py-2">
                          <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 bg-theme-border/50 rounded-full"></div>
                            <div className="space-y-2">
                              <div className="h-4 w-32 bg-theme-border/50 rounded"></div>
                              <div className="h-3 w-20 bg-theme-border/30 rounded"></div>
                            </div>
                          </div>
                          <div className="h-9 w-24 bg-theme-border/50 rounded-xl"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ul className="divide-y divide-theme-border/40">
                      {items.map(item => {
                        const itemId = getItemId(selectedDay as DayOfWeek, meal as MealType, item);
                        const itemRating = ratings[meal]?.[itemId] || { upvotes: 0, downvotes: 0 };

                        return (
                          <li key={item} className="flex justify-between items-center py-4 px-5 hover:bg-theme-card/30 transition-colors group">

                            {/* Food Details */}
                            <div className="flex items-start space-x-4 pr-4">
                              <span className="text-xl leading-none mt-0.5 opacity-90 select-none">
                                {getFoodEmoji(item)}
                              </span>
                              <div className="flex flex-col">
                                <span className="text-theme-text font-semibold text-[15px] sm:text-base tracking-tight leading-tight">
                                  {item}
                                </span>
                                <span className="text-xs sm:text-[13px] mt-1 text-theme-muted font-medium">
                                  {itemRating.upvotes > 0 || itemRating.downvotes > 0
                                    ? <><span className="text-green-500/90">{itemRating.upvotes} liked</span> <span className="opacity-40 px-1">•</span> <span className="text-red-500/90">{itemRating.downvotes} disliked</span></>
                                    : "No ratings yet"}
                                </span>
                              </div>
                            </div>

                            {/* Voting Controls */}
                            <div className="flex items-center space-x-1 bg-theme-bg/60 p-1.5 rounded-xl border border-theme-border/40 shadow-sm shrink-0 transition-opacity">
                              <button
                                onClick={() => handleVote(meal, item, "up")}
                                title={`Like ${item}`}
                                aria-label={`Like ${item}`}
                                className={`px-2.5 py-1.5 rounded-lg transition-all duration-200 flex items-center space-x-1.5
                                  ${itemRating.userVote === 'up'
                                    ? 'bg-green-500/20 text-green-500 shadow-sm'
                                    : 'text-theme-muted hover:bg-theme-border hover:text-theme-text'
                                  }
                                `}
                              >
                                <ThumbsUp size={16} className={itemRating.userVote === 'up' ? 'fill-current' : ''} />
                                <span className="text-sm font-bold">{itemRating.upvotes}</span>
                              </button>

                              <div className="w-[1px] h-5 bg-theme-border/40"></div>

                              <button
                                onClick={() => handleVote(meal, item, "down")}
                                title={`Dislike ${item}`}
                                aria-label={`Dislike ${item}`}
                                className={`px-2.5 py-1.5 rounded-lg transition-all duration-200 flex items-center space-x-1.5
                                  ${itemRating.userVote === 'down'
                                    ? 'bg-red-500/20 text-red-500 shadow-sm'
                                    : 'text-theme-muted hover:bg-theme-border hover:text-theme-text'
                                  }
                                `}
                              >
                                <ThumbsDown size={16} className={itemRating.userVote === 'down' ? 'fill-current' : ''} />
                                <span className="text-sm font-bold">{itemRating.downvotes}</span>
                              </button>
                            </div>

                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

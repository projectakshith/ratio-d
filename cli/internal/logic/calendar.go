package logic

import (
	"strconv"
	"strings"
	"time"

	"ratiod/internal/api"
	"ratiod/internal/data"
)

// CalendarDay holds display info for a single day in the calendar grid.
type CalendarDay struct {
	Date        time.Time
	DayOfMonth  int
	DayOrder    string // "1"-"5" or "-"
	Description string
	IsHoliday   bool
	IsToday     bool
	IsWeekend   bool
}

// GetCalendarMonth returns a grid of CalendarDay for a given year/month.
func GetCalendarMonth(year int, month time.Month) []CalendarDay {
	events := data.GetEventsForMonth(year, month)

	// Build a date→event map.
	eventMap := make(map[string]api.CalendarEvent)
	for _, ev := range events {
		eventMap[ev.Date] = ev
	}

	daysInMonth := time.Date(year, month+1, 0, 0, 0, 0, 0, time.Local).Day()
	today := time.Now()

	var days []CalendarDay
	for d := 1; d <= daysInMonth; d++ {
		date := time.Date(year, month, d, 0, 0, 0, 0, time.Local)
		dateStr := date.Format("02 Jan 2006")

		day := CalendarDay{
			Date:       date,
			DayOfMonth: d,
			DayOrder:   "-",
			IsToday:    date.Day() == today.Day() && date.Month() == today.Month() && date.Year() == today.Year(),
			IsWeekend:  date.Weekday() == time.Saturday || date.Weekday() == time.Sunday,
		}

		if ev, ok := eventMap[dateStr]; ok {
			day.DayOrder = ev.Order
			day.Description = ev.Description
			day.IsHoliday = ev.Order == "-" || strings.Contains(strings.ToLower(ev.Description), "holiday")
		}

		days = append(days, day)
	}

	return days
}

// GetTodayInfo returns the current day order and whether it's a holiday.
func GetTodayInfo() (dayOrder int, isHoliday bool, description string) {
	ev := data.GetTodayEvent()
	if ev == nil {
		return 0, true, "no calendar data"
	}

	if ev.Order == "-" || strings.Contains(strings.ToLower(ev.Description), "holiday") {
		return 0, true, ev.Description
	}

	do, err := strconv.Atoi(ev.Order)
	if err != nil {
		return 0, true, ev.Description
	}
	return do, false, ev.Description
}

// GetNextWorkingDay returns the next working day order from calendar data.
func GetNextWorkingDay() (dayOrder int, dateStr string) {
	events := data.GetCalendarEvents()
	now := time.Now()
	tomorrow := now.AddDate(0, 0, 1).Truncate(24 * time.Hour)

	for _, ev := range events {
		t, err := time.Parse("02 Jan 2006", ev.Date)
		if err != nil {
			continue
		}
		if t.Before(tomorrow) {
			continue
		}
		if ev.Order != "-" {
			do, err := strconv.Atoi(ev.Order)
			if err == nil {
				return do, ev.Date
			}
		}
	}
	return 0, ""
}

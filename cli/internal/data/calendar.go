package data

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"ratiod/internal/api"
)

//go:embed calendar_data.json
var calendarJSON []byte

var calendarEvents []api.CalendarEvent

func init() {
	if err := json.Unmarshal(calendarJSON, &calendarEvents); err != nil {
		panic(fmt.Sprintf("failed to parse embedded calendar_data.json: %v", err))
	}
}

// GetCalendarEvents returns all academic calendar events.
func GetCalendarEvents() []api.CalendarEvent {
	return calendarEvents
}

// GetEventForDate returns the calendar event for a given date, if any.
// dateStr format: "02 Jan 2006" (e.g., "19 Jul 2026")
func GetEventForDate(dateStr string) *api.CalendarEvent {
	for i := range calendarEvents {
		if calendarEvents[i].Date == dateStr {
			return &calendarEvents[i]
		}
	}
	return nil
}

// GetTodayEvent returns today's calendar event.
func GetTodayEvent() *api.CalendarEvent {
	now := time.Now()
	dateStr := now.Format("02 Jan 2006")
	return GetEventForDate(dateStr)
}

// GetTodayDayOrder returns the day order for today, or "-" if holiday.
func GetTodayDayOrder() string {
	ev := GetTodayEvent()
	if ev == nil {
		return "-"
	}
	return ev.Order
}

// IsHoliday checks if the given date's description indicates a holiday.
func IsHoliday(dateStr string) bool {
	ev := GetEventForDate(dateStr)
	if ev == nil {
		return false
	}
	return ev.Order == "-" || strings.Contains(strings.ToLower(ev.Description), "holiday")
}

// GetEventsForMonth returns all events for a given year and month (1-12).
func GetEventsForMonth(year int, month time.Month) []api.CalendarEvent {
	var result []api.CalendarEvent
	for _, ev := range calendarEvents {
		t, err := time.Parse("02 Jan 2006", ev.Date)
		if err != nil {
			continue
		}
		if t.Year() == year && t.Month() == month {
			result = append(result, ev)
		}
	}
	return result
}

// GetUpcomingEvents returns the next N events from today.
func GetUpcomingEvents(n int) []api.CalendarEvent {
	now := time.Now().Truncate(24 * time.Hour)
	var result []api.CalendarEvent
	for _, ev := range calendarEvents {
		t, err := time.Parse("02 Jan 2006", ev.Date)
		if err != nil {
			continue
		}
		if !t.Before(now) && ev.Order != "-" {
			continue // skip regular days; we want notable events
		}
		if !t.Before(now) {
			result = append(result, ev)
			if len(result) >= n {
				break
			}
		}
	}
	// If we didn't find enough holidays/notable events, include all upcoming
	if len(result) < n {
		result = nil
		for _, ev := range calendarEvents {
			t, err := time.Parse("02 Jan 2006", ev.Date)
			if err != nil {
				continue
			}
			if !t.Before(now) {
				result = append(result, ev)
				if len(result) >= n {
					break
				}
			}
		}
	}
	return result
}

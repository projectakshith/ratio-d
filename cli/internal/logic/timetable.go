package logic

import (
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"

	"ratiod/internal/api"
)

// ScheduleSlot represents a single processed timetable slot.
type ScheduleSlot struct {
	Code         string
	Name         string
	Room         string
	Faculty      string
	Time         string
	Start        string
	End          string
	MinutesStart int
	MinutesEnd   int
	SlotCode     string
	Type         string // "theory", "lab", "break"
	IsCurrent    bool
}

// ProcessSchedule returns sorted schedule slots for a given day order.
func ProcessSchedule(schedule map[string]map[string]api.SlotInfo, dayOrder int, courseNames map[string]string) []ScheduleSlot {
	dayKey := fmt.Sprintf("Day %d", dayOrder)
	daySlots, ok := schedule[dayKey]
	if !ok {
		return nil
	}

	var raw []ScheduleSlot
	for _, slot := range daySlots {
		timeStr := slot.Time
		parts := strings.SplitN(timeStr, " - ", 2)
		startStr := timeStr
		endStr := timeStr
		if len(parts) == 2 {
			startStr = strings.TrimSpace(parts[0])
			endStr = strings.TrimSpace(parts[1])
		}

		name := slot.Course
		if name == "" {
			name = courseNames[strings.TrimSpace(slot.Code)]
		}
		if name == "" {
			name = slot.Code
		}

		isLab := strings.Contains(strings.ToUpper(slot.Slot), "P") ||
			strings.EqualFold(slot.Type, "lab") ||
			strings.EqualFold(slot.Type, "practical")

		slotType := "theory"
		if isLab {
			slotType = "lab"
		}

		raw = append(raw, ScheduleSlot{
			Code:         GetTimetableAcronym(name),
			Name:         strings.ToLower(name),
			Room:         slot.Room,
			Faculty:      slot.Faculty,
			Time:         timeStr,
			Start:        startStr,
			End:          endStr,
			MinutesStart: ParseTime(startStr),
			MinutesEnd:   ParseTime(endStr),
			SlotCode:     slot.Slot,
			Type:         slotType,
		})
	}

	// Sort by start time.
	sort.Slice(raw, func(i, j int) bool {
		return raw[i].MinutesStart < raw[j].MinutesStart
	})

	// Insert breaks between non-adjacent slots.
	var result []ScheduleSlot
	for i, slot := range raw {
		result = append(result, slot)
		if i < len(raw)-1 {
			next := raw[i+1]
			if next.MinutesStart > slot.MinutesEnd {
				gap := next.MinutesStart - slot.MinutesEnd
				title := "short break"
				if gap >= 40 {
					title = "lunch break"
				}
				result = append(result, ScheduleSlot{
					Name:  title,
					Type:  "break",
					Start: slot.End,
					End:   next.Start,
					Time:  fmt.Sprintf("%s - %s", slot.End, next.Start),
				})
			}
		}
	}

	// Mark the current slot if viewing today.
	now := time.Now()
	nowMinutes := now.Hour()*60 + now.Minute()
	for i := range result {
		if result[i].Type == "break" {
			continue
		}
		if nowMinutes >= result[i].MinutesStart && nowMinutes < result[i].MinutesEnd {
			result[i].IsCurrent = true
		}
	}

	return result
}

// DayOverview holds summary info about a day's schedule.
type DayOverview struct {
	Start string
	End   string
	Count int
}

// GetDayOverview returns start time, end time, and class count for a day.
func GetDayOverview(slots []ScheduleSlot) DayOverview {
	var classes []ScheduleSlot
	for _, s := range slots {
		if s.Type != "break" {
			classes = append(classes, s)
		}
	}
	if len(classes) == 0 {
		return DayOverview{Start: "--", End: "--", Count: 0}
	}
	return DayOverview{
		Start: classes[0].Start,
		End:   classes[len(classes)-1].End,
		Count: len(classes),
	}
}

// ParseTime converts "08:00" to minutes since midnight.
// Hours < 7 are treated as PM (e.g., 1:00 → 13:00).
func ParseTime(s string) int {
	s = strings.TrimSpace(s)
	parts := strings.SplitN(s, ":", 2)
	if len(parts) != 2 {
		return 0
	}
	h, err := strconv.Atoi(parts[0])
	if err != nil {
		return 0
	}
	m, err := strconv.Atoi(parts[1])
	if err != nil {
		return 0
	}
	if h < 7 {
		h += 12
	}
	return h*60 + m
}

// GetTimetableAcronym returns a short acronym for a course name.
func GetTimetableAcronym(name string) string {
	if name == "" {
		return ""
	}
	lower := strings.ToLower(strings.TrimSpace(name))

	knownAcronyms := map[string]string{
		"database": "dbms", "operating system": "os",
		"machine learning": "ml", "artificial intelligence": "ai",
		"internet of things": "iot", "design thinking": "dtm",
		"data structure": "dsa", "object oriented": "oops",
	}
	for key, acr := range knownAcronyms {
		if strings.Contains(lower, key) {
			return acr
		}
	}

	if len(lower) <= 4 {
		return lower
	}

	skipWords := map[string]bool{
		"and": true, "of": true, "to": true, "in": true,
		"for": true, "with": true, "a": true, "an": true, "the": true,
	}

	parts := strings.Fields(lower)
	var filtered []string
	for _, w := range parts {
		if !skipWords[w] && len(w) > 0 {
			filtered = append(filtered, w)
		}
	}

	if len(filtered) == 1 {
		if len(filtered[0]) <= 5 {
			return filtered[0]
		}
		return filtered[0][:4]
	}

	acr := ""
	for _, w := range filtered {
		if len(w) > 0 {
			acr += string(w[0])
		}
	}
	if len(acr) > 5 {
		acr = acr[:5]
	}
	return acr
}

// BuildCourseNameMap creates a code→name map from attendance records.
func BuildCourseNameMap(attendance []api.AttendanceRecord) map[string]string {
	m := make(map[string]string)
	for _, a := range attendance {
		m[strings.TrimSpace(a.Code)] = a.Title
	}
	return m
}

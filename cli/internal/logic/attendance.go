package logic

import (
	"fmt"
	"math"
	"sort"
	"strings"

	"ratiod/internal/api"
)

// ProcessedAttendance is an enriched attendance record for display.
type ProcessedAttendance struct {
	Code       string
	Title      string
	Category   string
	Slot       string
	Percent    float64
	Conducted  int
	Present    int
	Absent     int
	Status     string // "safe", "danger", "cooked"
	IsPractical bool
	SkipInfo   string // e.g. "can skip 3" or "attend 5 to reach 75%"
}

// ProcessAttendance enriches and sorts raw attendance records.
func ProcessAttendance(raw []api.AttendanceRecord) []ProcessedAttendance {
	var result []ProcessedAttendance

	for _, r := range raw {
		present := r.Conducted - r.Absent
		isPractical := strings.EqualFold(r.Category, "practical") ||
			strings.HasPrefix(strings.ToUpper(r.Slot), "P") ||
			strings.HasPrefix(strings.ToUpper(r.Slot), "L")

		status := "safe"
		if r.Percent < 75 {
			status = "cooked"
		} else if r.Percent < 85 {
			status = "danger"
		}

		skipInfo := computeSkipInfo(present, r.Conducted, r.Percent)

		result = append(result, ProcessedAttendance{
			Code:        r.Code,
			Title:       r.Title,
			Category:    r.Category,
			Slot:        r.Slot,
			Percent:     r.Percent,
			Conducted:   r.Conducted,
			Present:     present,
			Absent:      r.Absent,
			Status:      status,
			IsPractical: isPractical,
			SkipInfo:    skipInfo,
		})
	}

	// Sort by percentage ascending (worst first), matching the web UI.
	sort.Slice(result, func(i, j int) bool {
		return result[i].Percent < result[j].Percent
	})

	return result
}

// OverallStats holds aggregate attendance statistics.
type OverallStats struct {
	Percentage float64
	Conducted  int
	Present    int
	Status     string
}

// GetOverallStats computes aggregate attendance across all subjects.
func GetOverallStats(records []ProcessedAttendance) OverallStats {
	totalConducted := 0
	totalPresent := 0
	for _, r := range records {
		totalConducted += r.Conducted
		totalPresent += r.Present
	}

	pct := float64(0)
	if totalConducted > 0 {
		pct = float64(totalPresent) / float64(totalConducted) * 100
	}

	status := "safe"
	if pct < 75 {
		status = "cooked"
	} else if pct < 85 {
		status = "danger"
	}

	return OverallStats{
		Percentage: math.Round(pct*100) / 100,
		Conducted:  totalConducted,
		Present:    totalPresent,
		Status:     status,
	}
}

// GetCritical returns only subjects below 75% attendance.
func GetCritical(records []ProcessedAttendance) []ProcessedAttendance {
	var result []ProcessedAttendance
	for _, r := range records {
		if r.Percent < 75 {
			result = append(result, r)
		}
	}
	return result
}

// computeSkipInfo calculates how many classes can be skipped or need attending.
func computeSkipInfo(present, conducted int, percent float64) string {
	if conducted == 0 {
		return "no data"
	}

	if percent >= 75 {
		// How many can be skipped while staying ≥75%?
		canSkip := 0
		p, c := present, conducted
		for {
			c++
			newPct := float64(p) / float64(c) * 100
			if newPct < 75 {
				break
			}
			canSkip++
		}
		if canSkip > 0 {
			return fmt.Sprintf("can skip %d", canSkip)
		}
		return "can't skip any"
	}

	// Below 75%: how many consecutive classes to reach 75%?
	need := 0
	p, c := present, conducted
	for {
		p++
		c++
		need++
		newPct := float64(p) / float64(c) * 100
		if newPct >= 75 {
			break
		}
		if need > 500 {
			return "severely cooked"
		}
	}
	return fmt.Sprintf("attend %d to reach 75%%", need)
}

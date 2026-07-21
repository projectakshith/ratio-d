package logic

import (
	"fmt"
	"math"
	"sort"
	"strconv"
	"strings"

	"ratiod/internal/api"
)

// GradePoints maps letter grades to their numeric values.
var GradePoints = map[string]float64{
	"O":  10,
	"A+": 9,
	"A":  8,
	"B+": 7,
	"B":  6,
	"C":  5,
	"F":  0,
}

// GetGrade converts a total score (out of 100) to a letter grade.
func GetGrade(score float64) string {
	switch {
	case score >= 91:
		return "O"
	case score >= 81:
		return "A+"
	case score >= 71:
		return "A"
	case score >= 61:
		return "B+"
	case score >= 56:
		return "B"
	case score >= 50:
		return "C"
	default:
		return "F"
	}
}

// ProcessedMarks is an enriched marks record for display.
type ProcessedMarks struct {
	CourseCode    string
	CourseName   string
	Type         string
	IsPractical  bool
	Assessments  []ProcessedAssessment
	TotalGot     float64
	TotalMax     float64
	Percentage   float64
	BestGrade    string
	Status       string // "good", "ok", "cooked"
}

// ProcessedAssessment is a single enriched assessment.
type ProcessedAssessment struct {
	Title string
	Got   float64
	Max   float64
	Lost  float64
}

// ProcessMarks enriches raw marks with course names, percentages, and grades.
func ProcessMarks(raw []api.MarksRecord, attendance []api.AttendanceRecord) []ProcessedMarks {
	// Build a course code → title map from attendance
	courseNames := make(map[string]string)
	for _, a := range attendance {
		courseNames[strings.TrimSpace(a.Code)] = a.Title
	}

	var result []ProcessedMarks

	for _, r := range raw {
		code := strings.TrimSpace(r.CourseCode)
		name := courseNames[code]
		if name == "" {
			name = code
		}

		isPractical := isPracticalType(r.Type, code)

		var assessments []ProcessedAssessment
		totalGot := float64(0)
		totalMax := float64(0)

		for _, a := range r.Assessments {
			got, _ := strconv.ParseFloat(strings.TrimSpace(a.Marks), 64)
			max, _ := strconv.ParseFloat(strings.TrimSpace(a.Total), 64)
			lost := math.Max(0, max-got)

			assessments = append(assessments, ProcessedAssessment{
				Title: a.Title,
				Got:   got,
				Max:   max,
				Lost:  lost,
			})
			totalGot += got
			totalMax += max
		}

		pct := float64(0)
		if totalMax > 0 {
			pct = totalGot / totalMax * 100
		}

		bestGrade := CalculateBestGrade(totalGot, 60, 40)

		status := "good"
		if pct < 50 {
			status = "cooked"
		} else if pct < 70 {
			status = "ok"
		}

		result = append(result, ProcessedMarks{
			CourseCode:  code,
			CourseName:  name,
			Type:        r.Type,
			IsPractical: isPractical,
			Assessments: assessments,
			TotalGot:    math.Round(totalGot*100) / 100,
			TotalMax:    math.Round(totalMax*100) / 100,
			Percentage:  math.Round(pct*100) / 100,
			BestGrade:   bestGrade,
			Status:      status,
		})
	}

	// Sort by percentage ascending (weakest first)
	sort.Slice(result, func(i, j int) bool {
		return result[i].Percentage < result[j].Percentage
	})

	return result
}

// CalculateBestGrade determines the best achievable grade given current internals.
func CalculateBestGrade(currentInternals, totalInternalMax, semMax float64) string {
	lostInternals := math.Max(0, totalInternalMax-currentInternals)
	maxPossibleTotal := 100 - lostInternals

	grades := []struct {
		Label string
		Min   float64
	}{
		{"O", 91}, {"A+", 81}, {"A", 71}, {"B+", 61}, {"B", 56}, {"C", 50},
	}

	for _, g := range grades {
		if maxPossibleTotal >= g.Min {
			semNeeded := g.Min - currentInternals
			if semNeeded <= semMax && semNeeded >= 0 {
				return g.Label
			}
		}
	}
	return "F"
}

// GetMarksAcronym returns a short acronym for a course name.
func GetMarksAcronym(name string) string {
	if name == "" {
		return ""
	}
	lower := strings.ToLower(strings.TrimSpace(name))

	// Special cases
	knownAcronyms := map[string]string{
		"internet of things": "iot", "design thinking": "dtm",
		"database": "dbms", "operating system": "os",
		"machine learning": "ml", "artificial intelligence": "ai",
		"data structure": "dsa",
	}
	for key, acr := range knownAcronyms {
		if strings.Contains(lower, key) {
			return acr
		}
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

	if len(filtered) == 1 && len(filtered[0]) <= 5 {
		return filtered[0]
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

// MarksOverview is a summary of all marks.
type MarksOverview struct {
	TotalGot  float64
	TotalMax  float64
	Average   float64
	BestSub   string
	WorstSub  string
}

// GetMarksOverview computes aggregate marks stats.
func GetMarksOverview(processed []ProcessedMarks) MarksOverview {
	totalGot := float64(0)
	totalMax := float64(0)
	bestPct := float64(-1)
	worstPct := float64(101)
	bestSub := ""
	worstSub := ""

	for _, m := range processed {
		totalGot += m.TotalGot
		totalMax += m.TotalMax
		if m.Percentage > bestPct {
			bestPct = m.Percentage
			bestSub = m.CourseName
		}
		if m.Percentage < worstPct {
			worstPct = m.Percentage
			worstSub = m.CourseName
		}
	}

	avg := float64(0)
	if totalMax > 0 {
		avg = totalGot / totalMax * 100
	}

	return MarksOverview{
		TotalGot: math.Round(totalGot*100) / 100,
		TotalMax: math.Round(totalMax*100) / 100,
		Average:  math.Round(avg*100) / 100,
		BestSub:  bestSub,
		WorstSub: worstSub,
	}
}

func isPracticalType(typ, code string) bool {
	lower := strings.ToLower(typ)
	codeLower := strings.ToLower(code)
	return strings.Contains(lower, "practical") ||
		strings.Contains(lower, "lab") ||
		strings.Contains(lower, "project") ||
		strings.Contains(codeLower, "-p")
}

// FormatMarks returns a display string for marks like "45/50".
func FormatMarks(got, max float64) string {
	return fmt.Sprintf("%g/%g", got, max)
}

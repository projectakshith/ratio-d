package tui

import (
	"fmt"
	"strings"

	"ratiod/internal/api"
	"ratiod/internal/logic"
	"ratiod/internal/style"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

// ProfileViewModel displays the full student profile card.
type ProfileViewModel struct {
	profile api.Profile
	width   int
	height  int
}

// NewProfileView creates the profile view from session data.
func NewProfileView(profile api.Profile) ProfileViewModel {
	return ProfileViewModel{profile: profile}
}

func (m ProfileViewModel) Update(msg tea.Msg) (ProfileViewModel, tea.Cmd) {
	if msg, ok := msg.(tea.WindowSizeMsg); ok {
		m.width = msg.Width
		m.height = msg.Height
	}
	return m, nil
}

func (m ProfileViewModel) View() string {
	p := m.profile
	w := m.width - 4
	if w < 40 {
		w = 40
	}

	titleStyle := lipgloss.NewStyle().
		Bold(true).
		Foreground(style.ColorPrimary).
		MarginBottom(1)

	labelStyle := lipgloss.NewStyle().
		Foreground(style.ColorMuted).
		Width(18).
		Align(lipgloss.Right).
		PaddingRight(2)

	valueStyle := lipgloss.NewStyle().
		Foreground(style.ColorText).
		Bold(true)

	row := func(label, value string) string {
		return labelStyle.Render(label) + valueStyle.Render(value)
	}

	// Name header
	nameStyle := lipgloss.NewStyle().
		Bold(true).
		Foreground(style.ColorText).
		MarginBottom(1)

	regStyle := lipgloss.NewStyle().
		Foreground(style.ColorPrimary).
		Bold(true)

	header := nameStyle.Render(strings.ToUpper(p.Name)) + "\n" +
		regStyle.Render(p.RegNo)

	// Info rows
	info := strings.Join([]string{
		row("PROGRAM", p.Program),
		row("DEPARTMENT", p.Dept),
		row("SECTION", p.Section),
		row("SEMESTER", p.Semester),
		row("BATCH", p.Batch),
		row("MOBILE", p.Mobile),
	}, "\n")

	content := lipgloss.JoinVertical(lipgloss.Left,
		titleStyle.Render("  PROFILE"),
		"",
		style.Card.Width(min(60, w)).Render(
			lipgloss.JoinVertical(lipgloss.Left, header, "", info),
		),
	)

	return content
}

// ─── Dashboard View ─────────────────────────────────────

// DashboardViewModel is the main dashboard with overview cards.
type DashboardViewModel struct {
	profile    api.Profile
	attendance []logic.ProcessedAttendance
	marks      []logic.ProcessedMarks
	schedule   []logic.ScheduleSlot
	dayOrder   int
	isHoliday  bool
	dayDesc    string
	width      int
	height     int
}

// NewDashboardView creates the dashboard view from session data.
func NewDashboardView(
	profile api.Profile,
	rawAtt []api.AttendanceRecord,
	rawMarks []api.MarksRecord,
	sched map[string]map[string]api.SlotInfo,
	courseNames map[string]string,
) DashboardViewModel {
	att := logic.ProcessAttendance(rawAtt)
	marks := logic.ProcessMarks(rawMarks, rawAtt)

	dayOrder, isHoliday, dayDesc := logic.GetTodayInfo()

	var schedule []logic.ScheduleSlot
	if !isHoliday && dayOrder > 0 {
		schedule = logic.ProcessSchedule(sched, dayOrder, courseNames)
	}

	return DashboardViewModel{
		profile:    profile,
		attendance: att,
		marks:      marks,
		schedule:   schedule,
		dayOrder:   dayOrder,
		isHoliday:  isHoliday,
		dayDesc:    dayDesc,
	}
}

func (m DashboardViewModel) Update(msg tea.Msg) (DashboardViewModel, tea.Cmd) {
	if msg, ok := msg.(tea.WindowSizeMsg); ok {
		m.width = msg.Width
		m.height = msg.Height
	}
	return m, nil
}

func (m DashboardViewModel) View() string {
	w := m.width - 4
	if w < 60 {
		w = 60
	}
	halfW := (w - 3) / 2
	if halfW < 30 {
		halfW = 30
	}

	// ─── Welcome ──────────────────────────────────
	name := strings.ToLower(strings.SplitN(m.profile.Name, " ", 2)[0])
	if name == "" {
		name = "student"
	}
	welcome := lipgloss.NewStyle().Bold(true).Foreground(style.ColorText).
		Render(fmt.Sprintf("  welcome back, %s.", name))

	logo := style.RenderLogoSmall()

	header := lipgloss.JoinHorizontal(lipgloss.Top,
		welcome,
		strings.Repeat(" ", max(1, w-lipgloss.Width(welcome)-lipgloss.Width(logo)-4)),
		logo,
	)

	// ─── Profile card ─────────────────────────────
	profileCard := style.Card.Width(halfW).Render(
		lipgloss.JoinVertical(lipgloss.Left,
			lipgloss.NewStyle().Bold(true).Foreground(style.ColorPrimary).Render("PROFILE"),
			"",
			lipgloss.NewStyle().Foreground(style.ColorText).Bold(true).Render(m.profile.RegNo),
			lipgloss.NewStyle().Foreground(style.ColorMuted).Render(
				fmt.Sprintf("%s · %s · Sem %s · Batch %s",
					m.profile.Program, m.profile.Dept, m.profile.Semester, m.profile.Batch)),
			lipgloss.NewStyle().Foreground(style.ColorMuted).Render("Section "+m.profile.Section),
		),
	)

	// ─── Schedule card ────────────────────────────
	var schedContent string
	if m.isHoliday {
		schedContent = lipgloss.NewStyle().Foreground(style.ColorPrimary).Bold(true).
			Render("🎉 " + m.dayDesc)
	} else if len(m.schedule) == 0 {
		schedContent = lipgloss.NewStyle().Foreground(style.ColorMuted).Render("no classes today")
	} else {
		var lines []string
		for _, slot := range m.schedule {
			timeStr := slot.Start
			if timeStr == "" {
				timeStr = "  "
			}
			if slot.Type == "break" {
				line := lipgloss.NewStyle().Foreground(style.ColorSubtle).
					Render(fmt.Sprintf("  %s  ☕ %s", timeStr, slot.Name))
				lines = append(lines, line)
			} else {
				nameColor := style.ColorText
				if slot.Type == "lab" {
					nameColor = style.ColorBlue
				}
				if slot.IsCurrent {
					nameColor = style.ColorPrimary
				}
				line := fmt.Sprintf("  %s  %s  %s",
					lipgloss.NewStyle().Foreground(style.ColorMuted).Width(5).Render(timeStr),
					lipgloss.NewStyle().Foreground(nameColor).Bold(true).Width(16).Render(truncate(slot.Name, 16)),
					lipgloss.NewStyle().Foreground(style.ColorSubtle).Render(slot.Room),
				)
				lines = append(lines, line)
			}
		}
		schedContent = strings.Join(lines, "\n")
	}

	dayTitle := "TODAY"
	if !m.isHoliday && m.dayOrder > 0 {
		dayTitle = fmt.Sprintf("TODAY · DAY %d", m.dayOrder)
	}

	schedCard := style.Card.Width(halfW).Render(
		lipgloss.JoinVertical(lipgloss.Left,
			lipgloss.NewStyle().Bold(true).Foreground(style.ColorPrimary).Render(dayTitle),
			"",
			schedContent,
		),
	)

	// ─── Attendance overview ──────────────────────
	stats := logic.GetOverallStats(m.attendance)
	attBar := style.RenderProgressBar(stats.Percentage, 25, style.StatusColor(stats.Percentage))
	attOverview := fmt.Sprintf("  Overall: %s %s  %s",
		lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color(string(style.StatusColor(stats.Percentage)))).
			Render(fmt.Sprintf("%.1f%%", stats.Percentage)),
		attBar,
		lipgloss.NewStyle().Foreground(style.ColorMuted).Render(strings.ToUpper(stats.Status)),
	)

	// Critical subjects
	critical := logic.GetCritical(m.attendance)
	var critLines string
	if len(critical) > 0 {
		var cl []string
		for _, c := range critical {
			cl = append(cl, fmt.Sprintf("  %s %s %s",
				lipgloss.NewStyle().Foreground(style.ColorCooked).Render("●"),
				lipgloss.NewStyle().Foreground(style.ColorCooked).Bold(true).Width(16).Render(truncate(c.Title, 16)),
				lipgloss.NewStyle().Foreground(style.ColorCooked).Render(fmt.Sprintf("%.0f%%", c.Percent)),
			))
		}
		critLines = "\n" + strings.Join(cl, "\n")
	}

	attCard := style.Card.Width(halfW).Render(
		lipgloss.JoinVertical(lipgloss.Left,
			lipgloss.NewStyle().Bold(true).Foreground(style.ColorPrimary).Render("ATTENDANCE"),
			"",
			attOverview,
			critLines,
		),
	)

	// ─── Marks overview ──────────────────────────
	marksOverview := logic.GetMarksOverview(m.marks)
	var marksLines []string
	displayed := 0
	for _, mk := range m.marks {
		if displayed >= 5 {
			break
		}
		nameStr := lipgloss.NewStyle().Foreground(style.ColorText).Width(16).
			Render(truncate(mk.CourseName, 16))
		marksStr := lipgloss.NewStyle().Foreground(style.ColorMuted).
			Render(logic.FormatMarks(mk.TotalGot, mk.TotalMax))
		gradeStr := lipgloss.NewStyle().Bold(true).Foreground(style.ColorPrimary).
			Render(mk.BestGrade)
		marksLines = append(marksLines, fmt.Sprintf("  %s  %s  Best: %s", nameStr, marksStr, gradeStr))
		displayed++
	}

	marksCard := style.Card.Width(halfW).Render(
		lipgloss.JoinVertical(lipgloss.Left,
			lipgloss.NewStyle().Bold(true).Foreground(style.ColorPrimary).Render("MARKS"),
			lipgloss.NewStyle().Foreground(style.ColorMuted).
				Render(fmt.Sprintf("  avg: %.1f%%", marksOverview.Average)),
			"",
			strings.Join(marksLines, "\n"),
		),
	)

	// ─── Layout ───────────────────────────────────
	topRow := lipgloss.JoinHorizontal(lipgloss.Top, profileCard, " ", schedCard)
	bottomRow := lipgloss.JoinHorizontal(lipgloss.Top, attCard, " ", marksCard)

	return lipgloss.JoinVertical(lipgloss.Left,
		header,
		"",
		topRow,
		"",
		bottomRow,
	)
}

func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-1] + "…"
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

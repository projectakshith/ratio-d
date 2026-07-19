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

// TimetableViewModel displays the timetable for a given day order.
type TimetableViewModel struct {
	schedule    map[string]map[string]api.SlotInfo
	courseNames map[string]string
	activeDay   int
	dayOrder    int
	isHoliday   bool
	dayDesc     string
	slots       []logic.ScheduleSlot
	width       int
	height      int
}

// NewTimetableView creates the timetable view.
func NewTimetableView(
	sched map[string]map[string]api.SlotInfo,
	courseNames map[string]string,
) TimetableViewModel {
	dayOrder, isHoliday, dayDesc := logic.GetTodayInfo()
	activeDay := dayOrder
	if isHoliday {
		// Default to Day 1 if today is a holiday.
		nextDay, _ := logic.GetNextWorkingDay()
		if nextDay > 0 {
			activeDay = nextDay
		} else {
			activeDay = 1
		}
	}

	slots := logic.ProcessSchedule(sched, activeDay, courseNames)

	return TimetableViewModel{
		schedule:    sched,
		courseNames: courseNames,
		activeDay:   activeDay,
		dayOrder:    dayOrder,
		isHoliday:   isHoliday,
		dayDesc:     dayDesc,
		slots:       slots,
	}
}

func (m TimetableViewModel) Update(msg tea.Msg) (TimetableViewModel, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
	case tea.KeyMsg:
		switch msg.String() {
		case "l", "right":
			if m.activeDay < 5 {
				m.activeDay++
				m.slots = logic.ProcessSchedule(m.schedule, m.activeDay, m.courseNames)
			}
		case "h", "left":
			if m.activeDay > 1 {
				m.activeDay--
				m.slots = logic.ProcessSchedule(m.schedule, m.activeDay, m.courseNames)
			}
		case "1", "2", "3", "4", "5":
			m.activeDay = int(msg.String()[0] - '0')
			m.slots = logic.ProcessSchedule(m.schedule, m.activeDay, m.courseNames)
		}
	}
	return m, nil
}

func (m TimetableViewModel) View() string {
	w := m.width - 4
	if w < 60 {
		w = 60
	}

	// Title
	title := lipgloss.NewStyle().Bold(true).Foreground(style.ColorPrimary).
		Render("  TIMETABLE")

	// Day selector tabs
	var dayTabs []string
	for d := 1; d <= 5; d++ {
		label := fmt.Sprintf(" Day %d ", d)
		if d == m.activeDay {
			dayTabs = append(dayTabs, style.TabActive.Render(label))
		} else {
			dayTabs = append(dayTabs, style.TabInactive.Render(label))
		}
	}
	daySel := "  " + strings.Join(dayTabs, " ")

	// Today indicator
	todayHint := ""
	if !m.isHoliday && m.activeDay == m.dayOrder {
		todayHint = lipgloss.NewStyle().Foreground(style.ColorPrimary).
			Render("  ● today")
	} else if m.isHoliday {
		todayHint = lipgloss.NewStyle().Foreground(style.ColorOrange).
			Render(fmt.Sprintf("  today: %s", m.dayDesc))
	}

	// Overview
	overview := logic.GetDayOverview(m.slots)
	overviewText := ""
	if overview.Count > 0 {
		overviewText = lipgloss.NewStyle().Foreground(style.ColorMuted).
			Render(fmt.Sprintf("  %d classes · %s to %s", overview.Count, overview.Start, overview.End))
	}

	// Schedule table
	var rows []string
	if len(m.slots) == 0 {
		rows = append(rows, lipgloss.NewStyle().Foreground(style.ColorMuted).
			Render("  no classes scheduled"))
	} else {
		timeW := 14
		nameW := 24
		roomW := 12
		facultyW := 18
		typeW := 8

		headerRow := fmt.Sprintf("  %s %s %s %s %s",
			lipgloss.NewStyle().Foreground(style.ColorMuted).Bold(true).Width(timeW).Render("TIME"),
			lipgloss.NewStyle().Foreground(style.ColorMuted).Bold(true).Width(nameW).Render("COURSE"),
			lipgloss.NewStyle().Foreground(style.ColorMuted).Bold(true).Width(roomW).Render("ROOM"),
			lipgloss.NewStyle().Foreground(style.ColorMuted).Bold(true).Width(facultyW).Render("FACULTY"),
			lipgloss.NewStyle().Foreground(style.ColorMuted).Bold(true).Width(typeW).Render("TYPE"),
		)
		rows = append(rows, headerRow)

		sep := lipgloss.NewStyle().Foreground(style.ColorSubtle).
			Render("  " + strings.Repeat("─", timeW+nameW+roomW+facultyW+typeW+4))
		rows = append(rows, sep)

		for _, slot := range m.slots {
			if slot.Type == "break" {
				breakIcon := "☕"
				if strings.Contains(slot.Name, "lunch") {
					breakIcon = "🍔"
				}
				breakLine := fmt.Sprintf("  %s %s",
					lipgloss.NewStyle().Foreground(style.ColorSubtle).Width(timeW).Render(slot.Time),
					lipgloss.NewStyle().Foreground(style.ColorSubtle).Italic(true).Render(breakIcon+" "+slot.Name),
				)
				rows = append(rows, breakLine)
				continue
			}

			nameColor := style.ColorText
			typeColor := style.ColorMuted
			timeColor := style.ColorMuted
			if slot.Type == "lab" {
				nameColor = style.ColorBlue
				typeColor = style.ColorBlue
			}
			if slot.IsCurrent {
				nameColor = style.ColorPrimary
				timeColor = style.ColorPrimary
			}

			row := fmt.Sprintf("  %s %s %s %s %s",
				lipgloss.NewStyle().Foreground(timeColor).Width(timeW).Render(slot.Time),
				lipgloss.NewStyle().Foreground(nameColor).Bold(true).Width(nameW).Render(truncate(slot.Name, nameW)),
				lipgloss.NewStyle().Foreground(style.ColorMuted).Width(roomW).Render(slot.Room),
				lipgloss.NewStyle().Foreground(style.ColorSubtle).Width(facultyW).Render(truncate(slot.Faculty, facultyW)),
				lipgloss.NewStyle().Foreground(typeColor).Bold(true).Width(typeW).Render(strings.ToUpper(slot.Type)),
			)

			if slot.IsCurrent {
				row = lipgloss.NewStyle().
					Background(lipgloss.Color("#1a2e0a")).
					Render(row)
			}

			rows = append(rows, row)
		}
	}

	navHint := lipgloss.NewStyle().Foreground(style.ColorSubtle).
		Render("\n  ←→/hl switch day · 1-5 jump to day")

	return lipgloss.JoinVertical(lipgloss.Left,
		title,
		daySel,
		todayHint,
		overviewText,
		"",
		strings.Join(rows, "\n"),
		navHint,
	)
}

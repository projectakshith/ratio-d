package tui

import (
	"fmt"
	"strings"
	"time"

	"ratiod/internal/logic"
	"ratiod/internal/style"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

// CalendarViewModel displays the academic calendar month grid.
type CalendarViewModel struct {
	year   int
	month  time.Month
	days   []logic.CalendarDay
	width  int
	height int
}

// NewCalendarView creates the calendar view for the current month.
func NewCalendarView() CalendarViewModel {
	now := time.Now()
	days := logic.GetCalendarMonth(now.Year(), now.Month())
	return CalendarViewModel{
		year:  now.Year(),
		month: now.Month(),
		days:  days,
	}
}

func (m CalendarViewModel) Update(msg tea.Msg) (CalendarViewModel, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
	case tea.KeyMsg:
		switch msg.String() {
		case "l", "right":
			m.nextMonth()
		case "h", "left":
			m.prevMonth()
		}
	}
	return m, nil
}

func (m *CalendarViewModel) nextMonth() {
	if m.month == 12 {
		m.month = 1
		m.year++
	} else {
		m.month++
	}
	m.days = logic.GetCalendarMonth(m.year, m.month)
}

func (m *CalendarViewModel) prevMonth() {
	if m.month == 1 {
		m.month = 12
		m.year--
	} else {
		m.month--
	}
	m.days = logic.GetCalendarMonth(m.year, m.month)
}

func (m CalendarViewModel) View() string {
	w := m.width - 4
	if w < 60 {
		w = 60
	}

	// Title
	title := lipgloss.NewStyle().Bold(true).Foreground(style.ColorPrimary).
		Render("  CALENDAR")

	// Month/year header
	monthName := fmt.Sprintf("  ◀  %s %d  ▶", m.month.String(), m.year)
	monthHeader := lipgloss.NewStyle().Bold(true).Foreground(style.ColorText).Render(monthName)

	// Day headers
	dayNames := []string{"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"}
	cellW := 10
	var headerCells []string
	for _, d := range dayNames {
		headerCells = append(headerCells,
			lipgloss.NewStyle().
				Foreground(style.ColorMuted).
				Bold(true).
				Width(cellW).
				Align(lipgloss.Center).
				Render(d),
		)
	}
	dayHeader := "  " + strings.Join(headerCells, "")

	// Build the grid
	firstDay := time.Date(m.year, m.month, 1, 0, 0, 0, 0, time.Local)
	weekday := int(firstDay.Weekday())
	if weekday == 0 {
		weekday = 7
	}
	weekday-- // Monday = 0

	var rows []string
	var currentRow []string

	// Pad initial empty cells
	for i := 0; i < weekday; i++ {
		currentRow = append(currentRow, lipgloss.NewStyle().Width(cellW).Render(""))
	}

	for _, day := range m.days {
		cell := m.renderCell(day, cellW)
		currentRow = append(currentRow, cell)

		if len(currentRow) == 7 {
			rows = append(rows, "  "+strings.Join(currentRow, ""))
			currentRow = nil
		}
	}

	// Pad remaining cells
	if len(currentRow) > 0 {
		for len(currentRow) < 7 {
			currentRow = append(currentRow, lipgloss.NewStyle().Width(cellW).Render(""))
		}
		rows = append(rows, "  "+strings.Join(currentRow, ""))
	}

	// Legend
	legend := fmt.Sprintf("  %s working  %s holiday  %s today",
		lipgloss.NewStyle().Foreground(style.ColorPrimary).Render("●"),
		lipgloss.NewStyle().Foreground(style.ColorCooked).Render("●"),
		lipgloss.NewStyle().Foreground(style.ColorText).Background(style.ColorPrimary).Render(" ● "),
	)

	// Upcoming events
	upcoming := m.renderUpcoming()

	navHint := lipgloss.NewStyle().Foreground(style.ColorSubtle).
		Render("\n  ←→/hl switch month")

	return lipgloss.JoinVertical(lipgloss.Left,
		title,
		monthHeader,
		"",
		dayHeader,
		lipgloss.NewStyle().Foreground(style.ColorSubtle).
			Render("  "+strings.Repeat("─", min(7*cellW, w-2))),
		strings.Join(rows, "\n"),
		"",
		legend,
		upcoming,
		navHint,
	)
}

func (m CalendarViewModel) renderCell(day logic.CalendarDay, cellW int) string {
	dayNum := fmt.Sprintf("%2d", day.DayOfMonth)
	orderStr := ""
	if day.DayOrder != "-" && day.DayOrder != "" {
		orderStr = "·" + day.DayOrder
	}

	label := dayNum + orderStr

	s := lipgloss.NewStyle().Width(cellW).Align(lipgloss.Center)

	if day.IsToday {
		return s.
			Bold(true).
			Foreground(style.ColorBg).
			Background(style.ColorPrimary).
			Render(label)
	}
	if day.IsHoliday || day.IsWeekend {
		return s.
			Foreground(style.ColorCooked).
			Render(label)
	}
	if day.DayOrder != "-" && day.DayOrder != "" {
		return s.
			Foreground(style.ColorText).
			Render(label)
	}
	return s.
		Foreground(style.ColorSubtle).
		Render(label)
}

func (m CalendarViewModel) renderUpcoming() string {
	var notable []logic.CalendarDay
	now := time.Now()
	for _, d := range m.days {
		if d.Date.Before(now) {
			continue
		}
		if d.IsHoliday && d.Description != "" && !d.IsWeekend {
			notable = append(notable, d)
		}
	}

	if len(notable) == 0 {
		return ""
	}

	var lines []string
	lines = append(lines, lipgloss.NewStyle().Bold(true).Foreground(style.ColorPrimary).
		Render("\n  UPCOMING"))

	for i, d := range notable {
		if i >= 5 {
			break
		}
		lines = append(lines, fmt.Sprintf("  %s  %s",
			lipgloss.NewStyle().Foreground(style.ColorMuted).Render(d.Date.Format("02 Jan")),
			lipgloss.NewStyle().Foreground(style.ColorOrange).Render(d.Description),
		))
	}
	return strings.Join(lines, "\n")
}

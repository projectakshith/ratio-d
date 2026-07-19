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

// AttendanceViewModel displays the full attendance table.
type AttendanceViewModel struct {
	records  []logic.ProcessedAttendance
	stats    logic.OverallStats
	scroll   int
	width    int
	height   int
}

// NewAttendanceView creates the attendance view from raw data.
func NewAttendanceView(raw []api.AttendanceRecord) AttendanceViewModel {
	records := logic.ProcessAttendance(raw)
	stats := logic.GetOverallStats(records)
	return AttendanceViewModel{records: records, stats: stats}
}

func (m AttendanceViewModel) Update(msg tea.Msg) (AttendanceViewModel, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
	case tea.KeyMsg:
		switch msg.String() {
		case "j", "down":
			maxScroll := len(m.records) - m.visibleRows()
			if maxScroll < 0 {
				maxScroll = 0
			}
			if m.scroll < maxScroll {
				m.scroll++
			}
		case "k", "up":
			if m.scroll > 0 {
				m.scroll--
			}
		}
	}
	return m, nil
}

func (m AttendanceViewModel) visibleRows() int {
	rows := m.height - 12 // header + tab bar + margins
	if rows < 3 {
		rows = 3
	}
	return rows
}

func (m AttendanceViewModel) View() string {
	w := m.width - 4
	if w < 60 {
		w = 60
	}

	// Header
	title := lipgloss.NewStyle().Bold(true).Foreground(style.ColorPrimary).
		Render("  ATTENDANCE")

	overallColor := style.StatusColor(m.stats.Percentage)
	bar := style.RenderProgressBar(m.stats.Percentage, 20, overallColor)
	overall := fmt.Sprintf("  Overall: %s %s  (%d/%d)",
		lipgloss.NewStyle().Bold(true).Foreground(overallColor).
			Render(fmt.Sprintf("%.1f%%", m.stats.Percentage)),
		bar,
		m.stats.Present, m.stats.Conducted,
	)

	// Table header
	codeW := 12
	titleW := 22
	catW := 10
	pctW := 7
	barW := 18
	statusW := 8
	skipW := 20

	headerRow := fmt.Sprintf("  %s %s %s %s %s %s %s",
		lipgloss.NewStyle().Foreground(style.ColorMuted).Bold(true).Width(codeW).Render("CODE"),
		lipgloss.NewStyle().Foreground(style.ColorMuted).Bold(true).Width(titleW).Render("SUBJECT"),
		lipgloss.NewStyle().Foreground(style.ColorMuted).Bold(true).Width(catW).Render("TYPE"),
		lipgloss.NewStyle().Foreground(style.ColorMuted).Bold(true).Width(pctW).Render("%"),
		lipgloss.NewStyle().Foreground(style.ColorMuted).Bold(true).Width(barW).Render("PROGRESS"),
		lipgloss.NewStyle().Foreground(style.ColorMuted).Bold(true).Width(statusW).Render("STATUS"),
		lipgloss.NewStyle().Foreground(style.ColorMuted).Bold(true).Width(skipW).Render("INFO"),
	)

	separator := lipgloss.NewStyle().Foreground(style.ColorSubtle).
		Render("  " + strings.Repeat("─", min(w-2, codeW+titleW+catW+pctW+barW+statusW+skipW+12)))

	// Data rows
	visibleEnd := m.scroll + m.visibleRows()
	if visibleEnd > len(m.records) {
		visibleEnd = len(m.records)
	}

	var rows []string
	for i := m.scroll; i < visibleEnd; i++ {
		r := m.records[i]
		color := style.StatusColor(r.Percent)

		pctText := fmt.Sprintf("%.0f%%", r.Percent)
		bar := style.RenderProgressBar(r.Percent, barW-2, color)

		statusText := strings.ToUpper(r.Status)
		statusStyle := lipgloss.NewStyle().Bold(true).Foreground(color)

		catText := r.Category
		catColor := style.ColorMuted
		if r.IsPractical {
			catColor = style.ColorBlue
		}

		row := fmt.Sprintf("  %s %s %s %s %s %s %s",
			lipgloss.NewStyle().Foreground(color).Bold(true).Width(codeW).Render(r.Code),
			lipgloss.NewStyle().Foreground(style.ColorText).Width(titleW).Render(truncate(r.Title, titleW)),
			lipgloss.NewStyle().Foreground(catColor).Width(catW).Render(truncate(catText, catW)),
			lipgloss.NewStyle().Foreground(color).Bold(true).Width(pctW).Render(pctText),
			lipgloss.NewStyle().Width(barW).Render(bar),
			statusStyle.Width(statusW).Render(statusText),
			lipgloss.NewStyle().Foreground(style.ColorMuted).Width(skipW).Render(r.SkipInfo),
		)
		rows = append(rows, row)
	}

	// Scroll indicator
	scrollHint := ""
	if len(m.records) > m.visibleRows() {
		scrollHint = lipgloss.NewStyle().Foreground(style.ColorSubtle).
			Render(fmt.Sprintf("\n  ↑↓/jk to scroll (%d/%d)", m.scroll+1, len(m.records)))
	}

	return lipgloss.JoinVertical(lipgloss.Left,
		title,
		overall,
		"",
		headerRow,
		separator,
		strings.Join(rows, "\n"),
		scrollHint,
	)
}

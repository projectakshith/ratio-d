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

// MarksViewModel displays marks with per-subject breakdown.
type MarksViewModel struct {
	records  []logic.ProcessedMarks
	overview logic.MarksOverview
	scroll   int
	width    int
	height   int
}

// NewMarksView creates the marks view from raw data.
func NewMarksView(rawMarks []api.MarksRecord, rawAtt []api.AttendanceRecord) MarksViewModel {
	records := logic.ProcessMarks(rawMarks, rawAtt)
	overview := logic.GetMarksOverview(records)
	return MarksViewModel{records: records, overview: overview}
}

func (m MarksViewModel) Update(msg tea.Msg) (MarksViewModel, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
	case tea.KeyMsg:
		switch msg.String() {
		case "j", "down":
			maxScroll := len(m.records) - m.visibleCards()
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

func (m MarksViewModel) visibleCards() int {
	cards := (m.height - 8) / 6 // each card ~6 lines
	if cards < 2 {
		cards = 2
	}
	return cards
}

func (m MarksViewModel) View() string {
	w := m.width - 4
	if w < 60 {
		w = 60
	}

	// Header
	title := lipgloss.NewStyle().Bold(true).Foreground(style.ColorPrimary).
		Render("  MARKS")

	avgColor := style.ColorPrimary
	if m.overview.Average < 50 {
		avgColor = style.ColorCooked
	} else if m.overview.Average < 70 {
		avgColor = style.ColorOrange
	}

	stats := fmt.Sprintf("  Average: %s  |  Total: %s",
		lipgloss.NewStyle().Bold(true).Foreground(avgColor).
			Render(fmt.Sprintf("%.1f%%", m.overview.Average)),
		lipgloss.NewStyle().Foreground(style.ColorMuted).
			Render(logic.FormatMarks(m.overview.TotalGot, m.overview.TotalMax)),
	)

	// Subject cards
	visibleEnd := m.scroll + m.visibleCards()
	if visibleEnd > len(m.records) {
		visibleEnd = len(m.records)
	}

	var cards []string
	for i := m.scroll; i < visibleEnd; i++ {
		mk := m.records[i]
		cards = append(cards, m.renderSubjectCard(mk, w))
	}

	// Scroll indicator
	scrollHint := ""
	if len(m.records) > m.visibleCards() {
		scrollHint = lipgloss.NewStyle().Foreground(style.ColorSubtle).
			Render(fmt.Sprintf("\n  ↑↓/jk to scroll (%d/%d)", m.scroll+1, len(m.records)))
	}

	return lipgloss.JoinVertical(lipgloss.Left,
		title,
		stats,
		"",
		strings.Join(cards, "\n"),
		scrollHint,
	)
}

func (m MarksViewModel) renderSubjectCard(mk logic.ProcessedMarks, maxW int) string {
	cardW := min(maxW-2, 90)

	// Card border color based on status
	borderColor := style.ColorSafe
	if mk.Status == "cooked" {
		borderColor = style.ColorCooked
	} else if mk.IsPractical {
		borderColor = style.ColorBlue
	}

	cardStyle := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(borderColor).
		Padding(0, 2).
		Width(cardW)

	// Header line: code + name + total marks + best grade
	nameColor := style.ColorText
	if mk.Status == "cooked" {
		nameColor = style.ColorCooked
	} else if mk.IsPractical {
		nameColor = style.ColorBlue
	}

	headerLeft := fmt.Sprintf("%s  %s",
		lipgloss.NewStyle().Bold(true).Foreground(nameColor).
			Render(mk.CourseCode),
		lipgloss.NewStyle().Foreground(style.ColorMuted).
			Render(truncate(mk.CourseName, 30)),
	)

	headerRight := fmt.Sprintf("%s  Best: %s",
		lipgloss.NewStyle().Foreground(style.ColorText).Bold(true).
			Render(logic.FormatMarks(mk.TotalGot, mk.TotalMax)),
		lipgloss.NewStyle().Bold(true).Foreground(style.ColorPrimary).
			Render(mk.BestGrade),
	)

	header := fmt.Sprintf("%s%s%s",
		headerLeft,
		strings.Repeat(" ", max(1, cardW-lipgloss.Width(headerLeft)-lipgloss.Width(headerRight)-6)),
		headerRight,
	)

	// Assessment boxes inline
	var assessBoxes []string
	for _, a := range mk.Assessments {
		boxColor := style.ColorSafe
		if a.Max > 0 {
			pct := a.Got / a.Max * 100
			if pct < 50 {
				boxColor = style.ColorCooked
			} else if pct < 70 {
				boxColor = style.ColorOrange
			}
		}

		box := fmt.Sprintf("%s %s/%s",
			lipgloss.NewStyle().Foreground(style.ColorMuted).Render(a.Title),
			lipgloss.NewStyle().Bold(true).Foreground(boxColor).Render(fmt.Sprintf("%g", a.Got)),
			lipgloss.NewStyle().Foreground(style.ColorSubtle).Render(fmt.Sprintf("%g", a.Max)),
		)

		if a.Lost > 0 {
			box += lipgloss.NewStyle().Foreground(style.ColorCooked).
				Render(fmt.Sprintf(" (-%g)", a.Lost))
		}

		assessBoxes = append(assessBoxes, box)
	}

	assessLine := "  " + strings.Join(assessBoxes, "  │  ")

	// Progress bar
	bar := style.RenderProgressBar(mk.Percentage, 30, borderColor)
	pctLine := fmt.Sprintf("  %s %s",
		bar,
		lipgloss.NewStyle().Foreground(style.ColorMuted).Render(fmt.Sprintf("%.1f%%", mk.Percentage)),
	)

	return cardStyle.Render(
		lipgloss.JoinVertical(lipgloss.Left, header, assessLine, pctLine),
	)
}

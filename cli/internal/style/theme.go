package style

import "github.com/charmbracelet/lipgloss"

// ─── Colors ─────────────────────────────────────────────
// Taken from globals.css minimalist-dark theme for terminal use.
var (
	ColorPrimary   = lipgloss.Color("#85a818")
	ColorSecondary = lipgloss.Color("#FF4D4D")
	ColorAccent    = lipgloss.Color("#8A2BE2")
	ColorBg        = lipgloss.Color("#111111")
	ColorText      = lipgloss.Color("#FFFFFF")
	ColorMuted     = lipgloss.Color("#777777")
	ColorSubtle    = lipgloss.Color("#444444")
	ColorBlue      = lipgloss.Color("#0EA5E9")
	ColorOrange    = lipgloss.Color("#F97316")
	ColorPurple    = lipgloss.Color("#8b5cf6")

	// Semantic attendance status
	ColorSafe   = lipgloss.Color("#85a818")
	ColorDanger = lipgloss.Color("#F97316")
	ColorCooked = lipgloss.Color("#FF4D4D")
)

// ─── Reusable Styles ────────────────────────────────────

// Bold header text in primary green.
var Header = lipgloss.NewStyle().
	Bold(true).
	Foreground(ColorPrimary).
	MarginBottom(1)

// Page title — large, bold, uppercase.
var Title = lipgloss.NewStyle().
	Bold(true).
	Foreground(ColorText).
	MarginBottom(1)

// Subtle muted text.
var Muted = lipgloss.NewStyle().
	Foreground(ColorMuted)

// Subtle dimmed text.
var Subtle = lipgloss.NewStyle().
	Foreground(ColorSubtle)

// Regular body text.
var Body = lipgloss.NewStyle().
	Foreground(ColorText)

// Bold accent text for highlights.
var Accent = lipgloss.NewStyle().
	Bold(true).
	Foreground(ColorPrimary)

// Error text in red.
var ErrorText = lipgloss.NewStyle().
	Bold(true).
	Foreground(ColorSecondary)

// ─── Cards / Boxes ──────────────────────────────────────

// A bordered card/box with rounded corners.
var Card = lipgloss.NewStyle().
	Border(lipgloss.RoundedBorder()).
	BorderForeground(ColorSubtle).
	Padding(1, 2)

// A card with green (safe) border.
var CardSafe = lipgloss.NewStyle().
	Border(lipgloss.RoundedBorder()).
	BorderForeground(ColorSafe).
	Padding(1, 2)

// A card with orange (danger) border.
var CardDanger = lipgloss.NewStyle().
	Border(lipgloss.RoundedBorder()).
	BorderForeground(ColorDanger).
	Padding(1, 2)

// A card with red (cooked) border.
var CardCooked = lipgloss.NewStyle().
	Border(lipgloss.RoundedBorder()).
	BorderForeground(ColorCooked).
	Padding(1, 2)

// A card with blue (lab/practical) border.
var CardLab = lipgloss.NewStyle().
	Border(lipgloss.RoundedBorder()).
	BorderForeground(ColorBlue).
	Padding(1, 2)

// ─── Tab Bar ────────────────────────────────────────────

// Active tab styling.
var TabActive = lipgloss.NewStyle().
	Bold(true).
	Foreground(ColorBg).
	Background(ColorPrimary).
	Padding(0, 2)

// Inactive tab styling.
var TabInactive = lipgloss.NewStyle().
	Foreground(ColorMuted).
	Padding(0, 2)

// Tab bar container.
var TabBar = lipgloss.NewStyle().
	Border(lipgloss.NormalBorder(), true, false, false, false).
	BorderForeground(ColorSubtle).
	PaddingTop(0).
	MarginTop(1)

// ─── Progress Bar ───────────────────────────────────────

// RenderProgressBar returns a text-based progress bar.
// width is in characters, percent is 0-100.
func RenderProgressBar(percent float64, width int, color lipgloss.Color) string {
	if width < 3 {
		width = 3
	}
	filled := int(percent / 100 * float64(width))
	if filled > width {
		filled = width
	}
	if filled < 0 {
		filled = 0
	}
	empty := width - filled

	filledStyle := lipgloss.NewStyle().Foreground(color)
	emptyStyle := lipgloss.NewStyle().Foreground(ColorSubtle)

	bar := ""
	for i := 0; i < filled; i++ {
		bar += filledStyle.Render("█")
	}
	for i := 0; i < empty; i++ {
		bar += emptyStyle.Render("░")
	}
	return bar
}

// StatusColor returns the lipgloss.Color for a given attendance percentage.
func StatusColor(percent float64) lipgloss.Color {
	if percent < 75 {
		return ColorCooked
	}
	if percent < 85 {
		return ColorDanger
	}
	return ColorSafe
}

// StatusLabel returns a text label for a given attendance percentage.
func StatusLabel(percent float64) string {
	if percent < 75 {
		return "COOKED"
	}
	if percent < 85 {
		return "DANGER"
	}
	return "SAFE"
}

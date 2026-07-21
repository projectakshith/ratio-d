package style

import "github.com/charmbracelet/lipgloss"

// ASCII art logo for Ratio-D, colored with a green-to-purple gradient.
const logoRaw = `
 ██████   █████  ████████ ██  ██████       ██████  
 ██   ██ ██   ██    ██    ██ ██    ██      ██   ██ 
 ██████  ███████    ██    ██ ██    ██ ████ ██   ██ 
 ██   ██ ██   ██    ██    ██ ██    ██      ██   ██ 
 ██   ██ ██   ██    ██    ██  ██████       ██████  
`

// Gradient colors for each row of the logo (green → purple).
var logoGradient = []lipgloss.Color{
	lipgloss.Color("#85a818"),
	lipgloss.Color("#7a9c2e"),
	lipgloss.Color("#6f9044"),
	lipgloss.Color("#8b5cf6"),
	lipgloss.Color("#8A2BE2"),
}

// RenderLogo returns the styled ASCII art logo.
func RenderLogo() string {
	lines := splitLines(logoRaw)
	var rendered string

	colorIdx := 0
	for _, line := range lines {
		if len(line) == 0 {
			continue
		}
		color := logoGradient[colorIdx%len(logoGradient)]
		style := lipgloss.NewStyle().Foreground(color).Bold(true)
		rendered += style.Render(line) + "\n"
		colorIdx++
	}

	return rendered
}

// RenderLogoPlain returns the logo without color gradient.
func RenderLogoPlain() string {
	lines := splitLines(logoRaw)
	var rendered string
	style := lipgloss.NewStyle().Bold(true)
	for _, line := range lines {
		if len(line) == 0 {
			continue
		}
		rendered += style.Render(line) + "\n"
	}
	return rendered
}

// RenderLogoSmall returns a compact single-line styled logo.
func RenderLogoSmall() string {
	return lipgloss.NewStyle().
		Bold(true).
		Foreground(ColorPrimary).
		Render("ratio-d")
}

// RenderTagline returns the styled tagline under the logo.
func RenderTagline() string {
	return lipgloss.NewStyle().
		Foreground(ColorMuted).
		Italic(true).
		Render("  terminal for the academia streets")
}

// RenderTaglinePlain returns the tagline without color.
func RenderTaglinePlain() string {
	return lipgloss.NewStyle().
		Italic(true).
		Render("  terminal for the academia streets")
}

func splitLines(s string) []string {
	var lines []string
	start := 0
	for i := 0; i < len(s); i++ {
		if s[i] == '\n' {
			lines = append(lines, s[start:i])
			start = i + 1
		}
	}
	if start < len(s) {
		lines = append(lines, s[start:])
	}
	return lines
}

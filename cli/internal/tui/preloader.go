package tui

import (
	"fmt"

	"ratiod/internal/style"

	"github.com/charmbracelet/bubbles/spinner"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

// PreloaderModel shows a full-screen loading spinner with the logo.
type PreloaderModel struct {
	spinner spinner.Model
	status  string
	width   int
	height  int
}

// NewPreloader creates a new preloader with a custom status message.
func NewPreloader(status string) PreloaderModel {
	s := spinner.New()
	s.Spinner = spinner.Dot
	s.Style = lipgloss.NewStyle().Foreground(style.ColorPrimary)
	return PreloaderModel{
		spinner: s,
		status:  status,
	}
}

func (m PreloaderModel) Init() tea.Cmd {
	return m.spinner.Tick
}

func (m PreloaderModel) Update(msg tea.Msg) (PreloaderModel, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
	case spinner.TickMsg:
		var cmd tea.Cmd
		m.spinner, cmd = m.spinner.Update(msg)
		return m, cmd
	}
	return m, nil
}

func (m PreloaderModel) View() string {
	logo := style.RenderLogo()
	tagline := style.RenderTagline()
	spinnerLine := fmt.Sprintf("\n  %s %s\n",
		m.spinner.View(),
		lipgloss.NewStyle().Foreground(style.ColorMuted).Render(m.status),
	)

	content := logo + tagline + spinnerLine

	// Center vertically and horizontally.
	contentStyle := lipgloss.NewStyle().
		Width(m.width).
		Height(m.height).
		Align(lipgloss.Center, lipgloss.Center)

	return contentStyle.Render(content)
}

// SetStatus updates the preloader's status text.
func (m *PreloaderModel) SetStatus(s string) {
	m.status = s
}

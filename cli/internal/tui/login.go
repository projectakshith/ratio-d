package tui

import (
	"fmt"
	"strings"

	"ratiod/internal/style"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

const (
	fieldUsername = iota
	fieldPassword
	fieldCaptcha
)

// LoginModel is the interactive login form.
type LoginModel struct {
	inputs       []textinput.Model
	focusedField int
	err          string
	width        int
	height       int

	// CAPTCHA state
	captchaMode    bool
	captchaImage   string
	captchaCdigest string
}

// NewLogin creates a new login form model.
func NewLogin() LoginModel {
	usernameInput := textinput.New()
	usernameInput.Placeholder = "ra2211003010xxx"
	usernameInput.Focus()
	usernameInput.CharLimit = 100
	usernameInput.Width = 36

	passwordInput := textinput.New()
	passwordInput.Placeholder = "password"
	passwordInput.EchoMode = textinput.EchoPassword
	passwordInput.EchoCharacter = '•'
	passwordInput.CharLimit = 256
	passwordInput.Width = 36

	captchaInput := textinput.New()
	captchaInput.Placeholder = "captcha text"
	captchaInput.CharLimit = 20
	captchaInput.Width = 36

	return LoginModel{
		inputs:       []textinput.Model{usernameInput, passwordInput, captchaInput},
		focusedField: fieldUsername,
	}
}

func (m LoginModel) Init() tea.Cmd {
	return textinput.Blink
}

// LoginSubmitMsg is sent when the user submits the login form.
type LoginSubmitMsg struct {
	Username string
	Password string
	Captcha  string
	Cdigest  string
}

func (m LoginModel) Update(msg tea.Msg) (LoginModel, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height

	case tea.KeyMsg:
		switch msg.String() {
		case "tab", "down":
			m.focusedField = m.nextField()
			return m, m.updateFocus()
		case "shift+tab", "up":
			m.focusedField = m.prevField()
			return m, m.updateFocus()
		case "enter":
			if m.isLastField() {
				return m, m.submit()
			}
			m.focusedField = m.nextField()
			return m, m.updateFocus()
		}
	}

	// Update the focused input.
	var cmd tea.Cmd
	m.inputs[m.focusedField], cmd = m.inputs[m.focusedField].Update(msg)
	return m, cmd
}

func (m LoginModel) View() string {
	logo := style.RenderLogoPlain()
	tagline := style.RenderTaglinePlain()

	formTitle := lipgloss.NewStyle().
		Bold(true).
		MarginTop(1).
		Render("  LOGIN")

	usernameLabel := m.labelStyle(fieldUsername).Render("  USERNAME")
	passwordLabel := m.labelStyle(fieldPassword).Render("  PASSWORD")

	form := fmt.Sprintf(
		"%s\n%s\n  %s\n\n%s\n  %s",
		formTitle,
		usernameLabel,
		m.inputs[fieldUsername].View(),
		passwordLabel,
		m.inputs[fieldPassword].View(),
	)

	if m.captchaMode {
		captchaLabel := m.labelStyle(fieldCaptcha).Render("  CAPTCHA")
		captchaHint := lipgloss.NewStyle().
			Render(fmt.Sprintf("  Open: %s", m.captchaImage))
		form += fmt.Sprintf("\n\n%s\n%s\n  %s", captchaHint, captchaLabel, m.inputs[fieldCaptcha].View())
	}

	var errMsg string
	if m.err != "" {
		errMsg = "\n" + lipgloss.NewStyle().Bold(true).Render("  ✗ "+m.err)
	}

	hint := lipgloss.NewStyle().
		Render("\n  tab/↑↓ navigate • enter submit • ctrl+c quit")

	content := logo + tagline + "\n" + form + errMsg + hint

	return lipgloss.NewStyle().
		Width(m.width).
		Height(m.height).
		Align(lipgloss.Center, lipgloss.Center).
		Render(content)
}

// SetError sets an error message to display.
func (m *LoginModel) SetError(err string) {
	m.err = err
}

// SetCaptcha puts the form into CAPTCHA mode.
func (m *LoginModel) SetCaptcha(image, cdigest string) {
	m.captchaMode = true
	m.captchaImage = image
	m.captchaCdigest = cdigest
	m.inputs[fieldCaptcha].Focus()
	m.focusedField = fieldCaptcha
}

func (m LoginModel) submit() tea.Cmd {
	username := strings.TrimSpace(m.inputs[fieldUsername].Value())
	password := m.inputs[fieldPassword].Value()
	captcha := strings.TrimSpace(m.inputs[fieldCaptcha].Value())

	if username == "" || password == "" {
		return nil
	}

	return func() tea.Msg {
		return LoginSubmitMsg{
			Username: username,
			Password: password,
			Captcha:  captcha,
			Cdigest:  m.captchaCdigest,
		}
	}
}

func (m LoginModel) nextField() int {
	maxField := fieldPassword
	if m.captchaMode {
		maxField = fieldCaptcha
	}
	next := m.focusedField + 1
	if next > maxField {
		next = maxField
	}
	return next
}

func (m LoginModel) prevField() int {
	prev := m.focusedField - 1
	if prev < 0 {
		prev = 0
	}
	return prev
}

func (m LoginModel) isLastField() bool {
	if m.captchaMode {
		return m.focusedField == fieldCaptcha
	}
	return m.focusedField == fieldPassword
}

func (m LoginModel) updateFocus() tea.Cmd {
	var cmds []tea.Cmd
	for i := range m.inputs {
		if i == m.focusedField {
			cmds = append(cmds, m.inputs[i].Focus())
		} else {
			m.inputs[i].Blur()
		}
	}
	return tea.Batch(cmds...)
}

func (m LoginModel) labelStyle(field int) lipgloss.Style {
	base := lipgloss.NewStyle().Bold(true).MarginTop(1)
	if field == m.focusedField {
		return base.Underline(true)
	}
	return base
}

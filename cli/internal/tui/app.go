package tui

import (
	"fmt"
	"strings"

	"ratiod/internal/api"
	"ratiod/internal/store"
	"ratiod/internal/style"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

type activeTab int

const (
	tabDashboard activeTab = iota
	tabAttendance
	tabMarks
	tabTimetable
	tabCalendar
	tabProfile
)

// MainAppModel manages the tab navigation and encapsulates all sub-views.
type MainAppModel struct {
	client     *api.Client
	session    *store.Session
	currentTab activeTab
	width      int
	height     int

	// Sub-models
	dashboard  DashboardViewModel
	attendance AttendanceViewModel
	marks      MarksViewModel
	timetable  TimetableViewModel
	calendar   CalendarViewModel
	profile    ProfileViewModel
}

// NewMainApp creates the main application container.
func NewMainApp(client *api.Client, session *store.Session) MainAppModel {
	courseNames := make(map[string]string)
	for _, a := range session.Attendance {
		courseNames[strings.TrimSpace(a.Code)] = a.Title
	}

	return MainAppModel{
		client:     client,
		session:    session,
		currentTab: tabDashboard,
		dashboard:  NewDashboardView(session.Profile, session.Attendance, session.Marks, session.Schedule, courseNames),
		attendance: NewAttendanceView(session.Attendance),
		marks:      NewMarksView(session.Marks, session.Attendance),
		timetable:  NewTimetableView(session.Schedule, courseNames),
		calendar:   NewCalendarView(),
		profile:    NewProfileView(session.Profile),
	}
}

func (m MainAppModel) Init() tea.Cmd {
	return nil
}

func (m MainAppModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		m.updateSubmodelSizes(msg)

	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "q":
			return m, tea.Quit
		case "tab":
			m.currentTab = (m.currentTab + 1) % 6
			return m, nil
		case "shift+tab":
			if m.currentTab == 0 {
				m.currentTab = 5
			} else {
				m.currentTab--
			}
			return m, nil
		}
	}


	var cmd tea.Cmd
	switch m.currentTab {
	case tabDashboard:
		m.dashboard, cmd = m.dashboard.Update(msg)
	case tabAttendance:
		m.attendance, cmd = m.attendance.Update(msg)
	case tabMarks:
		m.marks, cmd = m.marks.Update(msg)
	case tabTimetable:
		m.timetable, cmd = m.timetable.Update(msg)
	case tabCalendar:
		m.calendar, cmd = m.calendar.Update(msg)
	case tabProfile:
		m.profile, cmd = m.profile.Update(msg)
	}

	return m, cmd
}

func (m MainAppModel) View() string {
	var body string
	switch m.currentTab {
	case tabDashboard:
		body = m.dashboard.View()
	case tabAttendance:
		body = m.attendance.View()
	case tabMarks:
		body = m.marks.View()
	case tabTimetable:
		body = m.timetable.View()
	case tabCalendar:
		body = m.calendar.View()
	case tabProfile:
		body = m.profile.View()
	}

	// Styled top tab bar
	tabs := []string{"dash", "attendance", "marks", "timetable", "calendar", "profile"}
	var renderedTabs []string
	for i, t := range tabs {
		label := fmt.Sprintf(" %s ", t)
		if activeTab(i) == m.currentTab {
			renderedTabs = append(renderedTabs, style.TabActive.Render(label))
		} else {
			renderedTabs = append(renderedTabs, style.TabInactive.Render(label))
		}
	}

	tabBar := style.TabBar.Render(" " + strings.Join(renderedTabs, " "))

	footer := lipgloss.NewStyle().
		Foreground(style.ColorSubtle).
		Render(fmt.Sprintf("\n  tab navigation · q/ctrl+c quit · ratiod v2.0.0 (%s)", m.session.Username))

	return lipgloss.JoinVertical(lipgloss.Left,
		tabBar,
		"",
		body,
		footer,
	)
}

func (m *MainAppModel) updateSubmodelSizes(msg tea.WindowSizeMsg) {
	// Subtract header/footer heights from nested viewports
	msg.Height -= 6
	m.dashboard.width = msg.Width
	m.dashboard.height = msg.Height
	m.attendance.width = msg.Width
	m.attendance.height = msg.Height
	m.marks.width = msg.Width
	m.marks.height = msg.Height
	m.timetable.width = msg.Width
	m.timetable.height = msg.Height
	m.calendar.width = msg.Width
	m.calendar.height = msg.Height
	m.profile.width = msg.Width
	m.profile.height = msg.Height
}

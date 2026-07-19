package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	"ratiod/internal/api"
	"ratiod/internal/store"
	"ratiod/internal/tui"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/log"
	"github.com/spf13/cobra"
)

var (
	verbose    bool
	backendURL string
	logger     *log.Logger
)

// RootCmd represents the base command when called without any subcommands.
var RootCmd = &cobra.Command{
	Use:   "ratiod",
	Short: "Ratio-D CLI: Academia client in your terminal",
	Long:  `A clean, animated terminal user interface (TUI) client for SRM Academia.`,
	Run: func(cmd *cobra.Command, args []string) {
		setupLogger()

		client := api.NewClient(backendURL, logger)

		// Check if we have an existing session
		session, err := store.Load()
		if err != nil {
			if logger != nil {
				logger.Error("Failed to load session", "error", err)
			}
		}

		if session == nil {
			runLoginAndApp(client, tui.NewLogin())
			return
		}

		// Existing session found, launch full app
		appModel := tui.NewMainApp(client, session)
		p := tea.NewProgram(appModel, tea.WithAltScreen())
		if _, err := p.Run(); err != nil {
			fmt.Printf("Error running application: %v\n", err)
			os.Exit(1)
		}
	},
}

func Execute() {
	if err := RootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}

func init() {
	RootCmd.PersistentFlags().BoolVarP(&verbose, "verbose", "v", false, "enable verbose debug logging to file")
	RootCmd.PersistentFlags().StringVar(&backendURL, "backend", "", "override backend URL")

	// Add subcommands for specific CLI targets
	RootCmd.AddCommand(logoutCmd)
	RootCmd.AddCommand(versionCmd)
}

func setupLogger() {
	if !verbose {
		return
	}

	configDir := store.ConfigDir()
	_ = os.MkdirAll(configDir, 0700)
	logFile := filepath.Join(configDir, "debug.log")

	f, err := os.OpenFile(logFile, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0600)
	if err != nil {
		fmt.Printf("Could not open log file: %v\n", err)
		return
	}

	logger = log.NewWithOptions(f, log.Options{
		ReportTimestamp: true,
		ReportCaller:    true,
		Level:           log.DebugLevel,
	})
	logger.Debug("Logger initialized")
}

// ─── LOGIN FLOW WRAPPER ───────────────────────────────────

type loginState int

const (
	stateInput loginState = iota
	stateLoading
	stateFinished
)

type loginWrapperModel struct {
	state      loginState
	loginModel tui.LoginModel
	preloader  tui.PreloaderModel
	client     *api.Client
	err        error
	response   *api.LoginResponse
	username   string
	password   string
}

func (m loginWrapperModel) Init() tea.Cmd {
	return m.loginModel.Init()
}

type loginResultMsg struct {
	resp *api.LoginResponse
	err  error
}

func (m loginWrapperModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmd tea.Cmd

	switch m.state {
	case stateInput:
		var newLogin tui.LoginModel
		newLogin, cmd = m.loginModel.Update(msg)
		m.loginModel = newLogin

		// If user hit submit, switch to loading and fire request
		if submitMsg, ok := msg.(tui.LoginSubmitMsg); ok {
			m.state = stateLoading
			m.username = submitMsg.Username
			m.password = submitMsg.Password
			m.preloader = tui.NewPreloader("Logging into Academia...")
			return m, tea.Batch(
				m.preloader.Init(),
				func() tea.Msg {
					resp, err := m.client.Login(submitMsg.Username, submitMsg.Password, submitMsg.Captcha, submitMsg.Cdigest)
					return loginResultMsg{resp: resp, err: err}
				},
			)
		}

	case stateLoading:
		m.preloader, cmd = m.preloader.Update(msg)

		if res, ok := msg.(loginResultMsg); ok {
			if res.err != nil {
				// Check for CAPTCHA
				if capErr, ok := res.err.(*api.CaptchaError); ok {
					m.state = stateInput
					m.loginModel.SetCaptcha(capErr.Image, capErr.Cdigest)
					m.loginModel.SetError(capErr.Message)
					return m, nil
				}
				m.state = stateInput
				m.loginModel.SetError(res.err.Error())
				return m, nil
			}

			// Login success! Save session and exit to dashboard
			m.state = stateFinished
			m.response = res.resp
			session := store.FromLoginResponse(m.username, m.password, res.resp)
			_ = store.Save(session)

			return m, tea.Quit
		}
	}

	return m, cmd
}

func (m loginWrapperModel) View() string {
	if m.state == stateLoading {
		return m.preloader.View()
	}
	return m.loginModel.View()
}

func runLoginAndApp(client *api.Client, initialLogin tui.LoginModel) {
	wrapper := loginWrapperModel{
		state:      stateInput,
		loginModel: initialLogin,
		client:     client,
	}

	p := tea.NewProgram(wrapper, tea.WithAltScreen())
	m, err := p.Run()
	if err != nil {
		fmt.Printf("Login execution error: %v\n", err)
		os.Exit(1)
	}

	finalWrapper, ok := m.(loginWrapperModel)
	if !ok || finalWrapper.response == nil {
		// Cancelled or failed login
		return
	}

	// Login succeeded, launch main app with the new session
	session := store.FromLoginResponse(finalWrapper.username, finalWrapper.password, finalWrapper.response)
	appModel := tui.NewMainApp(client, session)
	p2 := tea.NewProgram(appModel, tea.WithAltScreen())
	if _, err := p2.Run(); err != nil {
		fmt.Printf("Error running application: %v\n", err)
		os.Exit(1)
	}
}

// ─── LOGOUT COMMAND ───────────────────────────────────────

var logoutCmd = &cobra.Command{
	Use:   "logout",
	Short: "Clear stored session",
	Run: func(cmd *cobra.Command, args []string) {
		err := store.Clear()
		if err != nil {
			fmt.Printf("Error clearing session: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("Session cleared successfully.")
	},
}

// ─── VERSION COMMAND ──────────────────────────────────────

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Show version info",
	Run: func(cmd *cobra.Command, args []string) {
		client := api.NewClient(backendURL, nil)
		v, err := client.GetVersion()
		if err != nil {
			v = "unknown (backend unreachable)"
		}
		fmt.Println("Ratio-D CLI: v2.0.0")
		fmt.Printf("Ratio-D Backend: %s\n", v)
	},
}

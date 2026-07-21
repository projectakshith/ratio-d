package store

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"

	"ratiod/internal/api"
)

const sessionFileName = "session.json"

// Session holds all cached user data between CLI runs.
type Session struct {
	Username   string                                `json:"username"`
	Password   string                                `json:"password,omitempty"`
	Cookies    map[string]string                     `json:"cookies"`
	Profile    api.Profile                           `json:"profile"`
	Attendance []api.AttendanceRecord                `json:"attendance"`
	Marks      []api.MarksRecord                     `json:"marks"`
	Schedule   map[string]map[string]api.SlotInfo    `json:"schedule"`
	Courses    map[string]api.CourseInfo              `json:"courses"`
}

// ConfigDir returns the path to ~/.config/ratiod/ (or AppData on Windows).
func ConfigDir() string {
	if runtime.GOOS == "windows" {
		appData := os.Getenv("APPDATA")
		if appData != "" {
			return filepath.Join(appData, "ratiod")
		}
	}
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".config", "ratiod")
}

// sessionPath returns the full path to the session file.
func sessionPath() string {
	return filepath.Join(ConfigDir(), sessionFileName)
}

// deriveKey derives a 32-byte AES key from a machine-specific seed.
func deriveKey() []byte {
	hostname, _ := os.Hostname()
	home, _ := os.UserHomeDir()
	seed := fmt.Sprintf("ratiod:%s:%s:v1", hostname, home)
	hash := sha256.Sum256([]byte(seed))
	return hash[:]
}

// Save encrypts and writes the session to disk.
func Save(s *Session) error {
	dir := ConfigDir()
	if err := os.MkdirAll(dir, 0700); err != nil {
		return fmt.Errorf("create config dir: %w", err)
	}

	plaintext, err := json.Marshal(s)
	if err != nil {
		return fmt.Errorf("marshal session: %w", err)
	}

	key := deriveKey()
	block, err := aes.NewCipher(key)
	if err != nil {
		return fmt.Errorf("create cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return fmt.Errorf("create gcm: %w", err)
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return fmt.Errorf("generate nonce: %w", err)
	}

	ciphertext := gcm.Seal(nonce, nonce, plaintext, nil)
	if err := os.WriteFile(sessionPath(), ciphertext, 0600); err != nil {
		return fmt.Errorf("write session file: %w", err)
	}
	return nil
}

// Load decrypts and reads the session from disk.
// Returns nil, nil if no session file exists.
func Load() (*Session, error) {
	data, err := os.ReadFile(sessionPath())
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("read session file: %w", err)
	}

	key := deriveKey()
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("create cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("create gcm: %w", err)
	}

	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return nil, fmt.Errorf("session file too short")
	}

	nonce, ciphertext := data[:nonceSize], data[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		// Corrupted or key changed — treat as no session
		return nil, nil
	}

	var s Session
	if err := json.Unmarshal(plaintext, &s); err != nil {
		return nil, fmt.Errorf("unmarshal session: %w", err)
	}
	return &s, nil
}

// Clear deletes the session file from disk.
func Clear() error {
	err := os.Remove(sessionPath())
	if err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("remove session file: %w", err)
	}
	return nil
}

// Exists returns true if a session file is present on disk.
func Exists() bool {
	_, err := os.Stat(sessionPath())
	return err == nil
}

// FromLoginResponse creates a Session from an API login response.
func FromLoginResponse(username, password string, resp *api.LoginResponse) *Session {
	return &Session{
		Username:   username,
		Password:   password,
		Cookies:    resp.Cookies,
		Profile:    resp.Profile,
		Attendance: resp.Attendance,
		Marks:      resp.Marks,
		Schedule:   resp.Schedule,
		Courses:    resp.Courses,
	}
}

// ApplyRefresh updates the session with refreshed data.
func (s *Session) ApplyRefresh(resp *api.RefreshResponse) {
	s.Attendance = resp.Attendance
	s.Marks = resp.Marks
	s.Cookies = resp.Cookies
}

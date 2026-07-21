package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/charmbracelet/log"
)

// Client communicates with the Ratio-D backend.
type Client struct {
	BaseURL    string
	HMACSecret string
	DevMode    bool
	HTTPClient *http.Client
	Logger     *log.Logger
}

// NewClient creates a new API client.
func NewClient(baseURL string, logger *log.Logger) *Client {
	if baseURL == "" {
		baseURL = os.Getenv("RATIOD_BACKEND_URL")
	}
	if baseURL == "" {
		baseURL = "http://localhost:8000"
	}

	secret := os.Getenv("RATIOD_HMAC_SECRET")
	devMode := os.Getenv("RATIOD_DEV") == "1" || os.Getenv("RATIOD_DEV") == "true"

	return &Client{
		BaseURL:    baseURL,
		HMACSecret: secret,
		DevMode:    devMode,
		HTTPClient: &http.Client{Timeout: 30 * time.Second},
		Logger:     logger,
	}
}

// Login calls POST /login with the given credentials.
func (c *Client) Login(username, password, captcha, cdigest string) (*LoginResponse, error) {
	req := LoginRequest{
		Username: username,
		Password: password,
		Captcha:  captcha,
		Cdigest:  cdigest,
	}
	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("marshal login request: %w", err)
	}

	resp, err := c.doPost("/login", body)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	if resp.StatusCode == 401 {
		// Check if it's a CAPTCHA challenge
		var captchaErr CaptchaRequiredError
		if json.Unmarshal(respBody, &captchaErr) == nil && captchaErr.Type == "CAPTCHA_REQUIRED" {
			return nil, &CaptchaError{CaptchaRequiredError: captchaErr}
		}
		return nil, fmt.Errorf("invalid credentials")
	}

	if resp.StatusCode != 200 {
		var apiErr APIError
		json.Unmarshal(respBody, &apiErr)
		return nil, fmt.Errorf("login failed (HTTP %d): %v", resp.StatusCode, apiErr.Detail)
	}

	var result LoginResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("decode login response: %w", err)
	}
	return &result, nil
}

// Refresh calls POST /refresh with stored cookies.
func (c *Client) Refresh(username, password string, cookies map[string]string) (*RefreshResponse, error) {
	req := RefreshRequest{
		Username: username,
		Password: password,
		Cookies:  cookies,
	}
	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("marshal refresh request: %w", err)
	}

	resp, err := c.doPost("/refresh", body)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	if resp.StatusCode == 401 {
		var apiErr APIError
		json.Unmarshal(respBody, &apiErr)
		// Check for SESSION_EXPIRED
		if detail, ok := apiErr.Detail.(map[string]interface{}); ok {
			if t, ok := detail["type"].(string); ok && t == "SESSION_EXPIRED" {
				return nil, fmt.Errorf("session expired, please login again")
			}
		}
		return nil, fmt.Errorf("authentication failed")
	}

	if resp.StatusCode != 200 {
		var apiErr APIError
		json.Unmarshal(respBody, &apiErr)
		return nil, fmt.Errorf("refresh failed (HTTP %d): %v", resp.StatusCode, apiErr.Detail)
	}

	var result RefreshResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("decode refresh response: %w", err)
	}
	return &result, nil
}

// GetVersion calls GET /version.
func (c *Client) GetVersion() (string, error) {
	resp, err := c.HTTPClient.Get(c.BaseURL + "/version")
	if err != nil {
		return "", fmt.Errorf("get version: %w", err)
	}
	defer resp.Body.Close()

	var result VersionResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("decode version: %w", err)
	}
	return result.Version, nil
}

// doPost sends a signed POST request to the backend.
func (c *Client) doPost(endpoint string, body []byte) (*http.Response, error) {
	url := c.BaseURL + endpoint

	if c.Logger != nil {
		c.Logger.Debug("POST request", "url", url, "body_len", len(body))
	}

	req, err := http.NewRequest("POST", url, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	// Sign request unless in dev mode
	if !c.DevMode && c.HMACSecret != "" {
		sig := SignRequest(body, c.HMACSecret)
		req.Header.Set("X-Ratio-Sig", sig)
		if c.Logger != nil {
			c.Logger.Debug("request signed", "sig_prefix", sig[:20]+"...")
		}
	}

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request to %s failed: %w", endpoint, err)
	}
	return resp, nil
}

// CaptchaError wraps a CAPTCHA challenge response for typed error handling.
type CaptchaError struct {
	CaptchaRequiredError
}

func (e *CaptchaError) Error() string {
	return fmt.Sprintf("captcha required: %s", e.Message)
}

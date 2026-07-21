package api

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"
)

// SignRequest generates the X-Ratio-Sig header value.
// Format: t={unix_timestamp},v1={hmac_sha256(secret, "{timestamp}.{sha256(body)}")}
// This matches the backend's verify_request() in main.py.
func SignRequest(body []byte, secret string) string {
	timestamp := time.Now().Unix()

	// SHA-256 hash of the body
	bodyHashRaw := sha256.Sum256(body)
	bodyHash := hex.EncodeToString(bodyHashRaw[:])

	// HMAC-SHA256 of "{timestamp}.{body_hash}" using the secret
	message := fmt.Sprintf("%d.%s", timestamp, bodyHash)
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(message))
	sig := hex.EncodeToString(mac.Sum(nil))

	return fmt.Sprintf("t=%d,v1=%s", timestamp, sig)
}

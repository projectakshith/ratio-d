package api

// LoginRequest matches the backend's LoginCredentials schema.
type LoginRequest struct {
	Username string            `json:"username"`
	Password string            `json:"password"`
	Cookies  map[string]string `json:"cookies,omitempty"`
	Captcha  string            `json:"captcha,omitempty"`
	Cdigest  string            `json:"cdigest,omitempty"`
}

// RefreshRequest matches the backend's Credentials schema.
type RefreshRequest struct {
	Username string            `json:"username"`
	Password string            `json:"password,omitempty"`
	Cookies  map[string]string `json:"cookies,omitempty"`
	Captcha  string            `json:"captcha,omitempty"`
	Cdigest  string            `json:"cdigest,omitempty"`
}

// LoginResponse is the full response from POST /login.
type LoginResponse struct {
	Success    bool                           `json:"success"`
	Profile    Profile                        `json:"profile"`
	Attendance []AttendanceRecord             `json:"attendance"`
	Marks      []MarksRecord                  `json:"marks"`
	Schedule   map[string]map[string]SlotInfo `json:"schedule"`
	Courses    map[string]CourseInfo           `json:"courses"`
	Cookies    map[string]string              `json:"cookies"`
}

// RefreshResponse is the response from POST /refresh.
type RefreshResponse struct {
	Success    bool               `json:"success"`
	Attendance []AttendanceRecord `json:"attendance"`
	Marks      []MarksRecord      `json:"marks"`
	Cookies    map[string]string  `json:"cookies"`
}

// VersionResponse is the response from GET /version.
type VersionResponse struct {
	Version string `json:"version"`
}

// Profile holds student profile data.
type Profile struct {
	Name     string `json:"name"`
	RegNo    string `json:"regNo"`
	Batch    string `json:"batch"`
	Semester string `json:"semester"`
	Dept     string `json:"dept"`
	Section  string `json:"section"`
	Mobile   string `json:"mobile"`
	Program  string `json:"program"`
}

// AttendanceRecord is a single subject's attendance.
type AttendanceRecord struct {
	Code      string  `json:"code"`
	Title     string  `json:"title"`
	Category  string  `json:"category"`
	Slot      string  `json:"slot"`
	Conducted int     `json:"conducted"`
	Absent    int     `json:"absent"`
	Percent   float64 `json:"percent"`
}

// MarksRecord is a single subject's marks data.
type MarksRecord struct {
	CourseCode    string       `json:"courseCode"`
	Type          string       `json:"type"`
	Performance   string       `json:"performance"`
	Assessments   []Assessment `json:"assessments"`
	TotalMarkGot  *float64     `json:"totalMarkGot"`
	TotalMaxMarks *float64     `json:"totalMaxMarks"`
}

// Assessment is a single assessment entry within a subject.
type Assessment struct {
	Title string `json:"title"`
	Marks string `json:"marks"`
	Total string `json:"total"`
}

// SlotInfo represents a single slot in the timetable schedule.
type SlotInfo struct {
	Slot    string `json:"slot"`
	Course  string `json:"course"`
	Code    string `json:"code"`
	Type    string `json:"type"`
	RawType string `json:"raw_type"`
	Room    string `json:"room"`
	Faculty string `json:"faculty"`
	Time    string `json:"time"`
}

// CourseInfo represents a course from the course map.
type CourseInfo struct {
	Code    string `json:"code"`
	Name    string `json:"name"`
	Credits string `json:"credits"`
	RawType string `json:"raw_type"`
	Faculty string `json:"faculty"`
	Room    string `json:"room"`
	Slot    string `json:"slot"`
	Type    string `json:"type"`
}

// CalendarEvent is one entry from the academic calendar JSON.
type CalendarEvent struct {
	Date        string `json:"date"`
	Day         string `json:"day"`
	Description string `json:"description"`
	Order       string `json:"order"`
}

// CaptchaRequiredError is returned when the backend demands a CAPTCHA.
type CaptchaRequiredError struct {
	Type    string `json:"type"`
	Message string `json:"message"`
	Cdigest string `json:"cdigest"`
	Image   string `json:"image"`
}

// APIError represents a generic backend error.
type APIError struct {
	Detail interface{} `json:"detail"`
}

use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde_json::json;

pub type AppResult<T> = Result<T, AppError>;

// Client-facing error taxonomy; every variant maps to an HTTP status.
#[derive(Debug, Clone, thiserror::Error)]
pub enum AppError {
    #[error("invalid image: {0}")]
    InvalidImage(String),

    #[error("image must be exactly {expected_w}x{expected_h}, got {got_w}x{got_h}")]
    InvalidDimensions {
        expected_w: u32,
        expected_h: u32,
        got_w: u32,
        got_h: u32,
    },

    #[error("request body too large")]
    PayloadTooLarge,

    #[error("server is overloaded, retry later")]
    QueueFull,

    #[error("inference backend unavailable: {0}")]
    Backend(String),

    #[error("request timed out")]
    Timeout,
}

impl AppError {
    fn status(&self) -> StatusCode {
        match self {
            Self::InvalidImage(_) | Self::InvalidDimensions { .. } => StatusCode::BAD_REQUEST,
            Self::PayloadTooLarge => StatusCode::PAYLOAD_TOO_LARGE,
            Self::QueueFull => StatusCode::TOO_MANY_REQUESTS,
            Self::Backend(_) => StatusCode::SERVICE_UNAVAILABLE,
            Self::Timeout => StatusCode::GATEWAY_TIMEOUT,
        }
    }
}

impl IntoResponse for AppError {
    // Full detail stays in logs; clients get the sanitized message only.
    fn into_response(self) -> Response {
        // Full detail stays in server logs; clients get a sanitized message.
        tracing::warn!(error = %self, status = %self.status(), "request rejected");
        let body = Json(json!({ "error": self.to_string() }));
        (self.status(), body).into_response()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::StatusCode;

    #[test]
    fn status_mapping() {
        assert_eq!(
            AppError::InvalidImage("x".into()).status(),
            StatusCode::BAD_REQUEST
        );
        assert_eq!(
            AppError::InvalidDimensions {
                expected_w: 175,
                expected_h: 45,
                got_w: 10,
                got_h: 10
            }
            .status(),
            StatusCode::BAD_REQUEST
        );
        assert_eq!(AppError::PayloadTooLarge.status(), StatusCode::PAYLOAD_TOO_LARGE);
        assert_eq!(AppError::QueueFull.status(), StatusCode::TOO_MANY_REQUESTS);
        assert_eq!(AppError::Backend("e".into()).status(), StatusCode::SERVICE_UNAVAILABLE);
        assert_eq!(AppError::Timeout.status(), StatusCode::GATEWAY_TIMEOUT);
    }

    #[test]
    fn dimension_error_is_explicit() {
        let e = AppError::InvalidDimensions {
            expected_w: 175,
            expected_h: 45,
            got_w: 300,
            got_h: 100,
        };
        assert_eq!(e.to_string(), "image must be exactly 175x45, got 300x100");
    }
}

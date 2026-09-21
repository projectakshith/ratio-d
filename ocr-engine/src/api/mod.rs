// HTTP layer: routes, API-key auth middleware, shared state.

pub mod health;
pub mod metrics;
pub mod predict;

use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use std::time::Duration;

use axum::body::Body;
use axum::extract::{DefaultBodyLimit, Request, State};
use axum::http::StatusCode;
use axum::middleware::{self, Next};
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use axum::{Json, Router};
use metrics_exporter_prometheus::PrometheusHandle;
use serde_json::json;

use crate::batching::batcher::BatcherHandle;

#[derive(Clone)]
pub struct AppState {
    pub batcher: BatcherHandle,
    pub ready: Arc<AtomicBool>,
    pub prometheus: PrometheusHandle,
    pub api_key: Option<Arc<String>>,
    pub max_image_bytes: usize,
    pub request_timeout: Duration,
}

// Constant-time compare so key checks don't leak content via timing.
fn ct_eq(a: &[u8], b: &[u8]) -> bool {
    if a.len() != b.len() {
        return false;
    }
    let mut diff = 0u8;
    for (x, y) in a.iter().zip(b.iter()) {
        diff |= x ^ y;
    }
    diff == 0
}

async fn require_api_key(
    State(state): State<AppState>,
    req: Request<Body>,
    next: Next,
) -> Response {
    match &state.api_key {
        None => next.run(req).await,
        Some(expected) => {
            let provided = req
                .headers()
                .get("x-api-key")
                .and_then(|v| v.to_str().ok());
            if provided.is_some_and(|k| ct_eq(k.as_bytes(), expected.as_bytes())) {
                next.run(req).await
            } else {
                tracing::warn!("request rejected: missing or invalid API key");
                (
                    StatusCode::UNAUTHORIZED,
                    Json(json!({ "error": "missing or invalid API key" })),
                )
                    .into_response()
            }
        }
    }
}

async fn track_request(req: Request<Body>, next: Next) -> Response {
    let started = std::time::Instant::now();
    let res = next.run(req).await;
    ::metrics::histogram!("tinyocr_request_seconds").record(started.elapsed().as_secs_f64());
    res
}

pub fn build_router(state: AppState, request_timeout: Duration) -> Router {
    // Auth + timeout only on /predict; health/ready/metrics stay open on the trusted network.
    let predict = Router::new()
        .route("/predict", post(predict::predict))
        .layer(middleware::from_fn_with_state(
            state.clone(),
            require_api_key,
        ))
        .layer(middleware::from_fn(track_request))
        .layer(tower_http::timeout::TimeoutLayer::with_status_code(
            StatusCode::GATEWAY_TIMEOUT,
            request_timeout,
        ));

    Router::new()
        .route("/health", get(health::health))
        .route("/ready", get(health::ready))
        .route("/metrics", get(metrics::metrics))
        .merge(predict)
        .layer(DefaultBodyLimit::max(state.max_image_bytes.saturating_mul(2)))
        .layer(tower_http::trace::TraceLayer::new_for_http())
        .with_state(state)
}

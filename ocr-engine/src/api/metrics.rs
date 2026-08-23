// GET /metrics: Prometheus exposition; percentiles via histogram_quantile().

use axum::extract::State;
use axum::http::{header, StatusCode};
use axum::response::{IntoResponse, Response};

use crate::api::AppState;

pub async fn metrics(State(state): State<AppState>) -> Response {
    (
        StatusCode::OK,
        [(
            header::CONTENT_TYPE,
            "text/plain; version=0.0.4; charset=utf-8",
        )],
        state.prometheus.render(),
    )
        .into_response()
}

use std::time::Instant;

use axum::body::Body;
use axum::extract::{FromRequest, Multipart, Request, State};
use axum::Json;
use serde::Serialize;
use ::metrics::{counter, histogram};

use crate::api::AppState;
use crate::batching::batcher::InferenceRequest;
use crate::error::AppError;

#[derive(Serialize)]
pub struct PredictResponse {
    pub text: String,
}

const MULTIPART_FILE_FIELDS: &[&str] = &["image", "file", "captcha", "payload"];

// POST /predict: raw image bytes or multipart upload -> {"text": "..."}
pub async fn predict(
    State(state): State<AppState>,
    req: Request<Body>,
) -> Result<Json<PredictResponse>, AppError> {
    counter!("tinyocr_requests_total").increment(1);
    let t_total = Instant::now();

    let result = handle(state, req).await;
    match &result {
        Ok(_) => counter!("tinyocr_requests_success").increment(1),
        Err(_) => counter!("tinyocr_requests_failed").increment(1),
    }
    tracing::debug!(elapsed_ms = t_total.elapsed().as_millis() as u64, "predict done");

    result.map(|text| Json(PredictResponse { text }))
}

async fn handle(state: AppState, req: Request<Body>) -> Result<String, AppError> {
    let content_type = req
        .headers()
        .get(axum::http::header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .unwrap_or_default()
        .to_ascii_lowercase();

    let raw = if content_type.starts_with("multipart/form-data") {
        multipart_payload(req, state.max_image_bytes).await?
    } else {
        raw_body(req, state.max_image_bytes).await?
    };

    let t_pre = Instant::now();
    let tensor = crate::preprocessing::image::preprocess(&raw)?;
    histogram!("tinyocr_preprocess_seconds").record(t_pre.elapsed().as_secs_f64());

    let (respond_to, rx) = tokio::sync::oneshot::channel();
    state.batcher.try_send(InferenceRequest {
        tensor,
        enqueued_at: Instant::now(),
        respond_to,
    })?;

    // Covers queue wait + inference; the outer TimeoutLayer is a safety net.
    let reply = tokio::time::timeout(state.request_timeout, rx)
        .await
        .map_err(|_| AppError::Timeout)?
        .map_err(|_| AppError::Backend("inference worker dropped the reply".into()))??;

    Ok(reply)
}

async fn raw_body(req: Request<Body>, max_bytes: usize) -> Result<Vec<u8>, AppError> {
    // Read one extra byte so overflow is detectable.
    let bytes = axum::body::to_bytes(req.into_body(), max_bytes + 1)
        .await
        .map_err(|_| AppError::PayloadTooLarge)?;
    if bytes.len() > max_bytes {
        return Err(AppError::PayloadTooLarge);
    }
    Ok(bytes.to_vec())
}

async fn multipart_payload(req: Request<Body>, max_bytes: usize) -> Result<Vec<u8>, AppError> {
    let mut multipart = Multipart::from_request(req, &())
        .await
        .map_err(|e| AppError::InvalidImage(format!("malformed multipart request ({e})")))?;

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| AppError::InvalidImage(format!("malformed multipart request ({e})")))?
    {
        let named_file = field.name().is_some_and(|n| MULTIPART_FILE_FIELDS.contains(&n));
        let typed_image = field
            .content_type()
            .is_some_and(|ct| ct.to_ascii_lowercase().starts_with("image/"));
        let has_filename = field.file_name().is_some();

        if !(named_file || typed_image || has_filename) {
            continue;
        }

        let bytes = field
            .bytes()
            .await
            .map_err(|e| AppError::InvalidImage(format!("failed to read upload ({e})")))?;
        if bytes.len() > max_bytes {
            return Err(AppError::PayloadTooLarge);
        }
        return Ok(bytes.to_vec());
    }

    Err(AppError::InvalidImage(
        "no image file found in multipart payload".into(),
    ))
}

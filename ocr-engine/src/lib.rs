// High-throughput CAPTCHA OCR inference service: HTTP -> preprocess -> batching -> ONNX Runtime -> greedy CTC.

pub mod api;
pub mod batching;
pub mod config;
pub mod decoding;
pub mod error;
pub mod inference;
pub mod preprocessing;

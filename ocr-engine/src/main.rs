use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use std::time::{Duration, Instant};

use tinyocr::api;
use tinyocr::batching::batcher::{spawn_batcher, BatcherConfig};
use tinyocr::config::Config;
use tinyocr::decoding::ctc_greedy::GreedyCtcDecoder;

fn init_tracing() {
    let filter = tracing_subscriber::EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info,tower_http=warn,hyper=warn"));
    tracing_subscriber::fmt()
        .with_env_filter(filter)
        .with_target(false)
        .compact()
        .init();
}

fn parse_args() -> Option<String> {
    let mut args = std::env::args().skip(1);
    while let Some(arg) = args.next() {
        if arg == "--config" {
            return args.next();
        }
    }
    None
}

fn install_metrics() -> metrics_exporter_prometheus::PrometheusHandle {
    use metrics_exporter_prometheus::{Matcher, PrometheusBuilder};

    const SECONDS: [f64; 14] = [
        0.000_05, 0.000_1, 0.000_25, 0.000_5, 0.001, 0.002_5, 0.005, 0.01, 0.025, 0.05, 0.1,
        0.25, 0.5, 1.0,
    ];

    let latency_metrics = [
        "tinyocr_request_seconds",
        "tinyocr_inference_seconds",
        "tinyocr_queue_wait_seconds",
        "tinyocr_preprocess_seconds",
        "tinyocr_decode_seconds",
    ];
    let builder = latency_metrics
        .iter()
        .try_fold(PrometheusBuilder::new(), |b, m| {
            b.set_buckets_for_metric(Matcher::Prefix((*m).to_string()), &SECONDS)
        })
        .expect("valid histogram buckets");
    let builder = builder
        .set_buckets_for_metric(
            Matcher::Prefix("tinyocr_batch_size".to_string()),
            &[1.0, 2.0, 4.0, 8.0, 12.0, 16.0, 24.0, 32.0],
        )
        .expect("valid histogram buckets");
    builder.install_recorder().expect("metrics recorder")
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    init_tracing();

    let cfg = Config::load(parse_args().as_deref().map(std::path::Path::new))?;
    let prometheus = install_metrics();

    // Model + backend load exactly once.
    let t_init = Instant::now();
    let mut backend = tinyocr::inference::create_backend(&cfg)?;
    let device = backend.describe();
    backend.warmup()?;
    tracing::info!(
        warmup_ms = t_init.elapsed().as_millis() as u64,
        "backend warmup complete"
    );

    let decoder = Arc::new(GreedyCtcDecoder::new(
        tinyocr::decoding::ctc_greedy::Vocab::load(&cfg.vocab_path)?,
    ));

    let (batcher, worker) = spawn_batcher(
        BatcherConfig {
            max_batch: cfg.max_batch,
            max_wait_us: cfg.max_wait_us,
        },
        cfg.max_queue,
        backend,
        Arc::clone(&decoder),
    );

    let state = api::AppState {
        batcher: batcher.clone(),
        ready: Arc::new(AtomicBool::new(true)),
        prometheus: prometheus.clone(),
        api_key: cfg.api_key.as_ref().map(|k| Arc::new(k.clone())),
        max_image_bytes: cfg.max_image_bytes,
        request_timeout: Duration::from_millis(cfg.request_timeout_ms),
    };
    let app = api::build_router(state, Duration::from_millis(cfg.request_timeout_ms * 2));

    let addr = cfg.addr();
    let listener = tokio::net::TcpListener::bind(&addr).await?;

    tracing::info!(
        server_addr = %addr,
        backend = %device,
        model = %cfg.model_path.display(),
        vocab = %cfg.vocab_path.display(),
        max_batch = cfg.max_batch,
        max_wait_us = cfg.max_wait_us,
        max_queue = cfg.max_queue,
        request_timeout_ms = cfg.request_timeout_ms,
        auth = cfg.api_key.is_some(),
        "TinyOCR inference server started"
    );

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    drop(batcher); // close queue so the worker drains and exits
    _ = worker.await;
    tracing::info!("shutdown complete");
    Ok(())
}

async fn shutdown_signal() {
    let ctrl_c = tokio::signal::ctrl_c();
    #[cfg(unix)]
    {
        let mut term =
            tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
                .expect("install SIGTERM handler");
        tokio::select! {
            _ = ctrl_c => {},
            _ = term.recv() => {},
        }
    }
    #[cfg(not(unix))]
    {
        _ = ctrl_c.await;
    }
    tracing::info!("shutdown signal received");
}

// Dynamic batching worker: collect until max_batch or max_wait, ONE inference call per batch.

use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use metrics::{gauge, histogram};
use tokio::sync::{mpsc, oneshot};
use tokio::task::JoinHandle;

use crate::decoding::ctc_greedy::GreedyCtcDecoder;
use crate::error::AppError;
use crate::inference::buffers::BatchAssembler;
use crate::inference::engine::InferenceBackend;

pub struct InferenceRequest {
    pub tensor: Vec<f32>,
    pub enqueued_at: Instant,
    pub respond_to: oneshot::Sender<Result<String, AppError>>,
}

#[derive(Clone)]
pub struct BatcherHandle {
    tx: mpsc::Sender<InferenceRequest>,
}

impl BatcherHandle {
    // try_send => bounded queue; Full maps to HTTP 429 upstream.
    pub fn try_send(&self, req: InferenceRequest) -> Result<(), AppError> {
        self.tx.try_send(req).map_err(|e| match e {
            mpsc::error::TrySendError::Full(_) => AppError::QueueFull,
            mpsc::error::TrySendError::Closed(_) => {
                AppError::Backend("inference worker unavailable".into())
            }
        })
    }

    pub fn queue_depth(&self) -> usize {
        self.tx.capacity()
    }

    pub fn queue_capacity(&self) -> usize {
        self.tx.max_capacity()
    }
}

pub struct BatcherConfig {
    pub max_batch: usize,
    pub max_wait_us: u64,
}

pub fn spawn_batcher(
    cfg: BatcherConfig,
    max_queue: usize,
    backend: Box<dyn InferenceBackend>,
    decoder: Arc<GreedyCtcDecoder>,
) -> (BatcherHandle, JoinHandle<()>) {
    let (tx, rx) = mpsc::channel(max_queue);
    let handle = BatcherHandle { tx };
    let task = tokio::spawn(run_worker(cfg, rx, backend, decoder));
    (handle, task)
}

async fn run_worker(
    cfg: BatcherConfig,
    mut rx: mpsc::Receiver<InferenceRequest>,
    backend: Box<dyn InferenceBackend>,
    decoder: Arc<GreedyCtcDecoder>,
) {
    let backend = Arc::new(Mutex::new(backend));
    let mut assembler = BatchAssembler::new(cfg.max_batch);
    let max_wait = Duration::from_micros(cfg.max_wait_us);

    while let Some(first) = rx.recv().await {
        let batch_deadline = Instant::now() + max_wait;

        assembler.reset();
        record_queue_wait(&first);
        assembler.push(&first.tensor);
        let mut pending: Vec<InferenceRequest> = Vec::with_capacity(cfg.max_batch);
        pending.push(first);

        while pending.len() < cfg.max_batch {
            match tokio::time::timeout_at(batch_deadline.into(), rx.recv()).await {
                Ok(Some(req)) => {
                    record_queue_wait(&req);
                    assembler.push(&req.tensor);
                    pending.push(req);
                }
                _ => break,
            }
        }

        let batch_size = pending.len();
        histogram!("tinyocr_batch_size").record(batch_size as f64);
        gauge!("tinyocr_queue_depth").set(rx.capacity() as f64);
        tracing::debug!(batch_size, "dispatching batch");

        let input = assembler.as_slice().to_vec();
        let t_infer = Instant::now();
        let backend = Arc::clone(&backend);
        let result = tokio::task::spawn_blocking(move || {
            let mut guard = backend
                .lock()
                .unwrap_or_else(std::sync::PoisonError::into_inner);
            guard.infer(&input, batch_size)
        })
        .await;

        histogram!("tinyocr_inference_seconds")
            .record(t_infer.elapsed().as_secs_f64());

        match result {
            Ok(Ok(logits)) => {
                let expected = batch_size
                    * crate::decoding::ctc_greedy::TIMESTEPS
                    * crate::decoding::ctc_greedy::NUM_CLASSES;
                if logits.len() != expected {
                    reply_all(
                        pending,
                        Err(AppError::Backend(format!(
                            "model returned {} floats, expected {expected}",
                            logits.len()
                        ))),
                    );
                    continue;
                }
                let t_dec = Instant::now();
                let texts = decoder.decode_batch(
                    &logits,
                    batch_size,
                    crate::decoding::ctc_greedy::NUM_CLASSES,
                );
                histogram!("tinyocr_decode_seconds").record(t_dec.elapsed().as_secs_f64());
                for (req, text) in pending.into_iter().zip(texts) {
                    let _ = req.respond_to.send(Ok(text));
                }
            }
            Ok(Err(e)) => {
                tracing::error!(error = ?e, "inference failed for batch of {batch_size}");
                reply_all(pending, Err(AppError::Backend(format!("inference failed: {e}"))));
            }
            Err(join_err) => {
                tracing::error!(error = ?join_err, "blocking infer task panicked");
                reply_all(pending, Err(AppError::Backend("inference worker panicked".into())));
            }
        }
    }
    tracing::info!("batching worker exiting");
}

fn reply_all(pending: Vec<InferenceRequest>, result: Result<String, AppError>) {
    for req in pending {
        let _ = req.respond_to.send(result.clone());
    }
}

#[inline]
fn record_queue_wait(req: &InferenceRequest) {
    histogram!("tinyocr_queue_wait_seconds")
        .record(req.enqueued_at.elapsed().as_secs_f64());
}

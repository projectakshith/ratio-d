// ONNX Runtime session wrapper; created once at startup and reused.
// CUDA EP uses error_on_failure so init failures are never hidden.

use std::path::Path;
use std::sync::Once;

use ort::ep::ExecutionProviderDispatch;
use ort::inputs;
use ort::session::{builder::GraphOptimizationLevel, Session};
use ort::value::TensorRef;

use super::engine::InferenceBackend;
use crate::preprocessing::image::{IMG_H, IMG_W};

static ORT_INIT: Once = Once::new();

macro_rules! ort {
    ($e:expr) => {
        $e.map_err(|e| anyhow::anyhow!("onnxruntime: {e}"))?
    };
}

fn ensure_ort_init(eps: Vec<ExecutionProviderDispatch>) {
    ORT_INIT.call_once(|| {
        if eps.is_empty() {
            ort::init().commit();
        } else {
            ort::init().with_execution_providers(eps).commit();
        }
    });
}

pub struct OrtBackend {
    session: Session,
    label: String,
}

impl OrtBackend {
    fn build(
        model_path: &Path,
        label: String,
        eps: Vec<ExecutionProviderDispatch>,
    ) -> anyhow::Result<Self> {
        ensure_ort_init(eps);

        let mut builder = ort!(Session::builder());
        builder = ort!(builder.with_optimization_level(GraphOptimizationLevel::Level3));
        let session = ort!(builder.commit_from_file(model_path));

        let input = session
            .inputs()
            .first()
            .ok_or_else(|| anyhow::anyhow!("model has no inputs"))?;
        let output = session
            .outputs()
            .first()
            .ok_or_else(|| anyhow::anyhow!("model has no outputs"))?;
        tracing::debug!(input = %input.name(), output = %output.name(), "onnx io resolved");

        Ok(Self { session, label })
    }

    pub fn new_cpu(model_path: &Path) -> anyhow::Result<Self> {
        Self::build(model_path, "onnxruntime-cpu".into(), Vec::new())
    }

    #[cfg(feature = "cuda")]
    pub fn new_cuda(model_path: &Path) -> anyhow::Result<Self> {
        use ort::ep::cuda::ConvAlgorithmSearch;
        use ort::ep::CUDA;

        // Heuristic skips cudnn's slow exhaustive algo search on first runs.
        let ep = CUDA::default()
            .with_device_id(0)
            .with_conv_algorithm_search(ConvAlgorithmSearch::Heuristic)
            .with_conv_max_workspace(true)
            .build()
            .error_on_failure();

        Self::build(model_path, "onnxruntime-cuda".into(), vec![ep])
    }
}

impl InferenceBackend for OrtBackend {
    fn infer(&mut self, batch: &[f32], batch_size: usize) -> anyhow::Result<Vec<f32>> {
        anyhow::ensure!(
            batch_size > 0 && batch.len() == batch_size * IMG_H as usize * IMG_W as usize,
            "input size mismatch: {} floats for batch {batch_size}",
            batch.len()
        );

        let input = ort!(TensorRef::from_array_view((
            vec![batch_size as i64, 1, IMG_H as i64, IMG_W as i64],
            batch
        )));

        let outputs = ort!(self.session.run(inputs![input]));
        let (_, data) = ort!(outputs["logits"].try_extract_tensor::<f32>());
        Ok(data.to_vec())
    }

    fn describe(&self) -> String {
        self.label.clone()
    }
}

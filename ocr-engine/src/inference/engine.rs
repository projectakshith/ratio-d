// Backend-agnostic inference boundary; TensorRT can slot in behind this trait.

use crate::config::{BackendKind, Config};

pub trait InferenceBackend: Send {
    fn infer(&mut self, batch: &[f32], batch_size: usize) -> anyhow::Result<Vec<f32>>;

    fn describe(&self) -> String;

    fn warmup(&mut self) -> anyhow::Result<()> {
        let zeros = vec![0.0_f32; crate::preprocessing::image::INPUT_LEN];
        self.infer(&zeros, 1)?;
        Ok(())
    }
}

pub fn create_backend(cfg: &Config) -> anyhow::Result<Box<dyn InferenceBackend>> {
    match cfg.backend {
        BackendKind::Cuda => {
            #[cfg(feature = "cuda")]
            {
                Ok(Box::new(super::session::OrtBackend::new_cuda(&cfg.model_path)?))
            }
            #[cfg(not(feature = "cuda"))]
            {
                let _ = cfg;
                Err(anyhow::anyhow!(
                    "backend = \"cuda\" requested but this binary was built without CUDA support; \
                     rebuild with `--features cuda` or set backend = \"cpu\""
                ))
            }
        }
        BackendKind::Cpu => Ok(Box::new(super::session::OrtBackend::new_cpu(&cfg.model_path)?)),
    }
}

use std::path::{Path, PathBuf};

use serde::Deserialize;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum BackendKind {
    Cuda,
    Cpu,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(default)]
pub struct Config {
    pub host: String,
    pub port: u16,
    pub backend: BackendKind,
    pub model_path: PathBuf,
    pub vocab_path: PathBuf,
    pub max_batch: usize,
    pub max_wait_us: u64,
    pub max_queue: usize,
    pub request_timeout_ms: u64,
    pub max_image_bytes: usize,
    pub api_key: Option<String>,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            host: "0.0.0.0".into(),
            port: 8080,
            backend: BackendKind::Cpu,
            model_path: PathBuf::from("./model/captcha_crnn.onnx"),
            vocab_path: PathBuf::from("./model/vocab.json"),
            max_batch: 16,
            max_wait_us: 500,
            max_queue: 512,
            request_timeout_ms: 1000,
            max_image_bytes: 1_048_576,
            api_key: None,
        }
    }
}

impl Config {
    // Loads configs/production.toml (or TINYOCR_CONFIG / --config), then applies TINYOCR_* env overrides.
    pub fn load(path: Option<&Path>) -> anyhow::Result<Self> {
        let path = path
            .map(Path::to_path_buf)
            .or_else(|| std::env::var_os("TINYOCR_CONFIG").map(PathBuf::from))
            .unwrap_or_else(|| PathBuf::from("configs/production.toml"));

        let mut cfg: Config = if path.exists() {
            let raw = std::fs::read_to_string(&path)?;
            toml::from_str(&raw)
                .map_err(|e| anyhow::anyhow!("invalid config {}: {e}", path.display()))?
        } else {
            tracing::warn!(path = %path.display(), "config file not found, using defaults");
            Config::default()
        };
        cfg.apply_env_overrides();
        cfg.validate()?;
        Ok(cfg)
    }

    fn apply_env_overrides(&mut self) {
        let env = |k: &str| std::env::var(k).ok().filter(|v| !v.is_empty());
        macro_rules! set {
            ($field:ident, $var:literal) => {
                if let Some(v) = env($var) {
                    match v.parse() {
                        Ok(parsed) => self.$field = parsed,
                        Err(_) => tracing::warn!(value = %v, var = $var, "ignoring unparseable override"),
                    }
                }
            };
        }
        set!(host, "TINYOCR_HOST");
        set!(port, "TINYOCR_PORT");
        set!(max_batch, "TINYOCR_MAX_BATCH");
        set!(max_wait_us, "TINYOCR_MAX_WAIT_US");
        set!(max_queue, "TINYOCR_MAX_QUEUE");
        set!(request_timeout_ms, "TINYOCR_REQUEST_TIMEOUT_MS");
        set!(max_image_bytes, "TINYOCR_MAX_IMAGE_BYTES");
        if let Some(v) = env("TINYOCR_BACKEND") {
            match v.to_ascii_lowercase().as_str() {
                "cuda" => self.backend = BackendKind::Cuda,
                "cpu" => self.backend = BackendKind::Cpu,
                other => tracing::warn!(value = %other, "ignoring invalid TINYOCR_BACKEND"),
            }
        }
        if let Some(v) = env("TINYOCR_MODEL_PATH") {
            self.model_path = PathBuf::from(v);
        }
        if let Some(v) = env("TINYOCR_VOCAB_PATH") {
            self.vocab_path = PathBuf::from(v);
        }
        if let Some(v) = env("TINYOCR_API_KEY") {
            self.api_key = Some(v);
        }
    }

    fn validate(&self) -> anyhow::Result<()> {
        anyhow::ensure!(
            (1..=256).contains(&self.max_batch),
            "max_batch must be in 1..=256, got {}",
            self.max_batch
        );
        anyhow::ensure!(
            self.max_queue >= self.max_batch,
            "max_queue ({}) must be >= max_batch ({})",
            self.max_queue,
            self.max_batch
        );
        anyhow::ensure!(
            self.request_timeout_ms >= 1 && self.request_timeout_ms <= 60_000,
            "request_timeout_ms out of range"
        );
        Ok(())
    }

    pub fn addr(&self) -> String {
        format!("{}:{}", self.host, self.port)
    }
}

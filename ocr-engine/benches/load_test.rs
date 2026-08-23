//! HTTP load tester: `cargo bench --bench load_test -- --url http://127.0.0.1:8080 --concurrency 32 --duration-secs 10 --data data/student_portal --json`

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};

use clap::Parser;
use image::{ImageBuffer, Luma};
use rand::RngExt;

#[derive(Parser, Debug)]
#[command(about = "TinyOCR load tester")]
struct Args {
    /// Base URL of the inference server.
    #[arg(long, default_value = "http://127.0.0.1:8080")]
    url: String,

    /// Concurrent in-flight workers.
    #[arg(long, default_value_t = 32)]
    concurrency: usize,

    /// Total requests to send (0 = run for --duration-secs instead).
    #[arg(long, default_value_t = 0)]
    n: u64,

    /// Seconds to run when --n is 0.
    #[arg(long, default_value_t = 10)]
    duration_secs: u64,

    /// Directory of CAPTCHA images to cycle through (falls back to one
    /// synthetic image).
    #[arg(long)]
    data: Option<PathBuf>,

    /// Max images to preload from --data.
    #[arg(long, default_value_t = 256)]
    max_images: usize,

    /// API key if the server requires one.
    #[arg(long)]
    api_key: Option<String>,

    #[arg(long, default_value_t = 5000)]
    timeout_ms: u64,

    /// Warmup requests before measuring.
    #[arg(long, default_value_t = 25)]
    warmup: usize,

    /// Emit a single JSON result line instead of a human table.
    #[arg(long)]
    json: bool,
}

struct Payloads {
    images: Vec<Vec<u8>>,
}

impl Payloads {
    fn load(dir: Option<&PathBuf>, max_images: usize) -> Self {
        let mut images = Vec::new();
        if let Some(dir) = dir {
            let mut files: Vec<PathBuf> = std::fs::read_dir(dir)
                .map(|rd| {
                    rd.flatten()
                        .map(|e| e.path())
                        .filter(|p| {
                            p.extension()
                                .is_some_and(|x| x.eq_ignore_ascii_case("png"))
                        })
                        .collect()
                })
                .unwrap_or_default();
            files.truncate(max_images);
            for f in files {
                if let Ok(b) = std::fs::read(&f) {
                    images.push(b);
                }
            }
        }
        if images.is_empty() {
            // Synthetic valid 175x45 grayscale PNG.
            let mut rng = rand::rng();
            let img = ImageBuffer::from_fn(175, 45, |_, _| Luma([rng.random_range(0..=255)]));
            let mut buf = std::io::Cursor::new(Vec::new());
            image::DynamicImage::ImageLuma8(img)
                .write_to(&mut buf, image::ImageFormat::Png)
                .expect("encode synthetic png");
            images.push(buf.into_inner());
        }
        Self { images }
    }

    fn next(&self, i: usize) -> &[u8] {
        &self.images[i % self.images.len()]
    }
}

#[derive(Default)]
struct TaskStats {
    latencies_ms: Vec<f64>,
    statuses: HashMap<u16, u64>,
    errors: u64,
    ok: u64,
}

#[tokio::main(flavor = "multi_thread")]
async fn main() {
    let args = Args::parse();
    let payloads = Arc::new(Payloads::load(args.data.as_ref(), args.max_images));

    let client = Arc::new(
        reqwest::Client::builder()
            .pool_max_idle_per_host(args.concurrency)
            .timeout(Duration::from_millis(args.timeout_ms))
            .build()
            .expect("client"),
    );
    let url = format!("{}/predict", args.url.trim_end_matches('/'));
    let counter = Arc::new(AtomicUsize::new(0));

    // ---- warmup -------------------------------------------------------------
    for _ in 0..args.warmup {
        let _ = send_one(&client, &url, &payloads, &counter, &args.api_key).await;
    }

    // ---- measured phase -----------------------------------------------------
    let deadline = Instant::now() + Duration::from_secs(args.duration_secs);
    let per_worker = if args.n > 0 {
        args.n / args.concurrency.max(1) as u64
    } else {
        u64::MAX
    };

    let started = Instant::now();
    let mut handles = Vec::with_capacity(args.concurrency);
    for _ in 0..args.concurrency {
        let client = Arc::clone(&client);
        let url = url.clone();
        let payloads = Arc::clone(&payloads);
        let counter = Arc::clone(&counter);
        let api_key = args.api_key.clone();
        handles.push(tokio::spawn(async move {
            let mut stats = TaskStats::default();
            let mut done: u64 = 0;
            while done < per_worker && Instant::now() < deadline {
                match send_one(&client, &url, &payloads, &counter, &api_key).await {
                    Ok((status, ms)) => {
                        stats.latencies_ms.push(ms);
                        *stats.statuses.entry(status).or_insert(0) += 1;
                        if (200..300).contains(&status) {
                            stats.ok += 1;
                        } else {
                            stats.errors += 1;
                        }
                    }
                    Err(_) => stats.errors += 1,
                }
                done += 1;
            }
            stats
        }));
    }

    let mut total = TaskStats::default();
    for h in handles {
        let s = h.await.expect("worker task");
        total.latencies_ms.extend(s.latencies_ms);
        total.errors += s.errors;
        total.ok += s.ok;
        for (k, v) in s.statuses {
            *total.statuses.entry(k).or_insert(0) += v;
        }
    }
    let elapsed = started.elapsed().as_secs_f64().max(1e-9);

    total.latencies_ms.sort_by(|a, b| a.partial_cmp(b).unwrap());
    let pct = |p: f64| -> f64 {
        if total.latencies_ms.is_empty() {
            return 0.0;
        }
        let idx = ((p / 100.0) * (total.latencies_ms.len() - 1) as f64).round() as usize;
        total.latencies_ms[idx]
    };
    let mean = if total.latencies_ms.is_empty() {
        0.0
    } else {
        total.latencies_ms.iter().sum::<f64>() / total.latencies_ms.len() as f64
    };
    let rps = (total.ok + total.errors) as f64 / elapsed;

    if args.json {
        println!(
            "{}",
            serde_json::json!({
                "concurrency": args.concurrency,
                "requests": total.ok + total.errors,
                "ok": total.ok,
                "errors": total.errors,
                "elapsed_s": elapsed,
                "rps": rps,
                "mean_ms": mean,
                "p50_ms": pct(50.0),
                "p95_ms": pct(95.0),
                "p99_ms": pct(99.0),
                "max_ms": total.latencies_ms.last().copied().unwrap_or(0.0),
                "statuses": total.statuses,
            })
        );
    } else {
        println!("concurrency={} requests={} ok={} err={}", args.concurrency, total.ok + total.errors, total.ok, total.errors);
        println!("rps={rps:.1} mean={mean:.2}ms");
        println!(
            "p50={:.2}ms p95={:.2}ms p99={:.2}ms max={:.2}ms",
            pct(50.0),
            pct(95.0),
            pct(99.0),
            total.latencies_ms.last().copied().unwrap_or(0.0)
        );
        println!("statuses: {:?}", total.statuses);
    }
}

type SendResult = Result<(u16, f64), reqwest::Error>;

async fn send_one(
    client: &reqwest::Client,
    url: &str,
    payloads: &Payloads,
    counter: &AtomicUsize,
    api_key: &Option<String>,
) -> SendResult {
    let idx = counter.fetch_add(1, Ordering::Relaxed);
    let body = payloads.next(idx).to_vec();

    let mut req = client
        .post(url)
        .header(reqwest::header::CONTENT_TYPE, "image/png");
    if let Some(key) = api_key {
        req = req.header("x-api-key", key);
    }

    let t0 = Instant::now();
    let resp = req.body(body).send().await?;
    let status = resp.status().as_u16();
    // Drain body to reuse the connection.
    let _ = resp.bytes().await?;
    Ok((status, t0.elapsed().as_secs_f64() * 1000.0))
}

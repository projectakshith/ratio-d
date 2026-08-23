//! Golden parity tests against artifacts produced by `scripts/export_onnx.py`:
//!
//! 1. Rust preprocessing of the golden images must reproduce the exact f32
//!    bytes PyTorch's validation transform produced (`input.bin`).
//! 2. The Rust greedy decoder applied to ONNX Runtime CPU logits must
//!    reproduce the Python greedy predictions exactly.
//! 3. Hand-crafted decoder vectors (blanks/repeats) round-trip identically.

use std::path::PathBuf;
use std::sync::OnceLock;

use serde_json::Value;
use tinyocr::decoding::ctc_greedy::{GreedyCtcDecoder, Vocab};
use tinyocr::preprocessing::image;

fn golden_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tests/golden")
}

fn meta() -> &'static Value {
    static META: OnceLock<Value> = OnceLock::new();
    META.get_or_init(|| {
        let raw = std::fs::read_to_string(golden_dir().join("meta.json")).unwrap();
        serde_json::from_str(&raw).unwrap()
    })
}

fn read_f32(name: &str) -> Vec<f32> {
    let bytes = std::fs::read(golden_dir().join(name)).unwrap();
    assert_eq!(bytes.len() % 4, 0);
    bytes
        .chunks_exact(4)
        .map(|c| f32::from_le_bytes([c[0], c[1], c[2], c[3]]))
        .collect()
}

fn decoder() -> GreedyCtcDecoder {
    GreedyCtcDecoder::new(
        Vocab::from_vocab_string("0123456789abcdefghijklmnopqrstuvwxyz", 0).unwrap(),
    )
}

#[test]
fn preprocessing_matches_pytorch_bit_exact() {
    let m = meta();
    let batch = m["batch"].as_u64().unwrap() as usize;
    assert_eq!(batch, m["images"].as_array().unwrap().len());

    let mut all = Vec::with_capacity(batch * image::INPUT_LEN);
    for name in m["images"].as_array().unwrap() {
        // Repo root (crate manifest dir) contains data/student_portal.
        let img_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("data/student_portal")
            .join(name.as_str().unwrap());
        let bytes = std::fs::read(&img_path)
            .unwrap_or_else(|e| panic!("missing test image {}: {e}", img_path.display()));
        let tensor = image::preprocess(&bytes).expect("golden image should preprocess");
        all.extend(tensor);
    }

    let expected = read_f32("input.bin");
    assert_eq!(all.len(), expected.len());
    for (i, (got, want)) in all.iter().zip(expected.iter()).enumerate() {
        assert_eq!(
            got.to_bits(),
            want.to_bits(),
            "bit-exact mismatch at element {i} (got {got}, want {want})"
        );
    }
}

#[test]
fn greedy_decode_matches_onnx_cpu_predictions() {
    let m = meta();
    let logits = read_f32("logits.bin");
    let d = decoder();
    let got = d.decode_batch(&logits, m["batch"].as_u64().unwrap() as usize, 37);

    let expected: Vec<String> = m["greedy_texts"]
        .as_array()
        .unwrap()
        .iter()
        .map(|v| v.as_str().unwrap().to_string())
        .collect();
    assert_eq!(got, expected, "decoder diverges from Python greedy output");
}

#[test]
fn greedy_predictions_match_filename_labels() {
    let m = meta();
    let logits = read_f32("logits.bin");
    let d = decoder();
    let got = d.decode_batch(&logits, m["batch"].as_u64().unwrap() as usize, 37);
    let labels: Vec<String> = m["labels"]
        .as_array()
        .unwrap()
        .iter()
        .map(|v| v.as_str().unwrap().to_lowercase())
        .collect();
    assert_eq!(got, labels);
}

#[test]
fn decoder_vectors_match_python() {
    let raw =
        std::fs::read_to_string(golden_dir().join("decode_vectors.json")).unwrap();
    let vectors: Value = serde_json::from_str(&raw).unwrap();
    let d = decoder();

    for (name, case) in vectors.as_object().unwrap() {
        let logits: Vec<f32> = case["logits"]
            .as_array()
            .unwrap()
            .iter()
            .flat_map(|row| {
                row.as_array()
                    .unwrap()
                    .iter()
                    .map(|v| v.as_f64().unwrap() as f32)
                    .collect::<Vec<_>>()
            })
            .collect();
        let expected = case["greedy_text"].as_str().unwrap();
        let got = d.decode_row(&logits, 37);
        assert_eq!(got, expected, "decoder vector {name} mismatch");
    }
}

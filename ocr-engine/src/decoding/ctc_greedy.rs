use std::path::Path;
use std::sync::Arc;

use serde::Deserialize;

use crate::error::AppError;

#[derive(Debug, Deserialize)]
struct VocabFile {
    vocab: String,
    blank_idx: usize,
}

// Class 0 is blank; class i > 0 maps to chars[i - 1].
#[derive(Debug, Clone)]
pub struct Vocab {
    chars: Vec<u8>,
    pub blank_idx: usize,
}

impl Vocab {
    pub fn from_vocab_string(vocab: &str, blank_idx: usize) -> Result<Self, AppError> {
        if blank_idx > 0 {
            return Err(AppError::Backend(format!(
                "unsupported blank_idx {blank_idx} (decoder assumes 0)"
            )));
        }
        Ok(Self {
            chars: vocab.bytes().collect(),
            blank_idx,
        })
    }

    // vocab.json: {"vocab": "0123456789abcdefghijklmnopqrstuvwxyz", "blank_idx": 0}
    pub fn load(path: &Path) -> Result<Self, AppError> {
        let raw = std::fs::read(path)
            .map_err(|e| AppError::Backend(format!("cannot read vocab {}: {e}", path.display())))?;
        let file: VocabFile = serde_json::from_slice(&raw)
            .map_err(|e| AppError::Backend(format!("invalid vocab file: {e}")))?;
        Self::from_vocab_string(&file.vocab, file.blank_idx)
    }

    #[inline]
    fn char_for(&self, class: usize) -> Option<u8> {
        if class == self.blank_idx {
            None
        } else {
            self.chars.get(class - 1).copied()
        }
    }
}

#[derive(Debug, Clone)]
pub struct GreedyCtcDecoder {
    vocab: Arc<Vocab>,
}

impl GreedyCtcDecoder {
    pub fn new(vocab: Vocab) -> Self {
        Self {
            vocab: Arc::new(vocab),
        }
    }

    // Decodes one [T][C] row-major logit block; ties resolve to lowest class index.
    #[inline]
    pub fn decode_row(&self, logits: &[f32], num_classes: usize) -> String {
        debug_assert!(num_classes > 0 && logits.len().is_multiple_of(num_classes));
        let timesteps = logits.len() / num_classes;
        let mut out = String::with_capacity(timesteps.min(16));
        let mut prev_class = self.vocab.blank_idx;

        for t in 0..timesteps {
            let row = &logits[t * num_classes..(t + 1) * num_classes];
            let mut best = 0usize;
            let mut best_val = f32::NEG_INFINITY;
            for (c, &v) in row.iter().enumerate() {
                if v > best_val {
                    best_val = v;
                    best = c;
                }
            }
            if best != prev_class && best != self.vocab.blank_idx
                && let Some(ch) = self.vocab.char_for(best) {
                    out.push(char::from(ch));
                }
            prev_class = best;
        }
        out
    }

    // Decodes an interleaved [B*T*C] batch.
    pub fn decode_batch(&self, logits: &[f32], batch: usize, num_classes: usize) -> Vec<String> {
        let stride = logits.len() / batch.max(1);
        (0..batch)
            .map(|b| self.decode_row(&logits[b * stride..(b + 1) * stride], num_classes))
            .collect()
    }
}

pub const NUM_CLASSES: usize = 37;
pub const TIMESTEPS: usize = 44;

#[cfg(test)]
mod tests {
    use super::*;

    fn decoder() -> GreedyCtcDecoder {
        GreedyCtcDecoder::new(
            Vocab::from_vocab_string("0123456789abcdefghijklmnopqrstuvwxyz", 0).unwrap(),
        )
    }

    fn one_hot(classes: &[usize]) -> Vec<f32> {
        let mut v = vec![0.0_f32; classes.len() * NUM_CLASSES];
        for (t, &c) in classes.iter().enumerate() {
            v[t * NUM_CLASSES + c] = 1.0;
        }
        v
    }

    #[test]
    fn basic_decode() {
        let d = decoder();
        // blank 'a' 'a' blank '7' -> collapse -> "a7"
        assert_eq!(d.decode_row(&one_hot(&[0, 11, 11, 0, 8]), NUM_CLASSES), "a7");
    }

    #[test]
    fn leading_and_trailing_blanks_dropped() {
        let d = decoder();
        assert_eq!(d.decode_row(&one_hot(&[0, 0, 12, 0]), NUM_CLASSES), "b");
    }

    #[test]
    fn separated_repeats_survive() {
        let d = decoder();
        assert_eq!(d.decode_row(&one_hot(&[36, 36]), NUM_CLASSES), "z");
        assert_eq!(d.decode_row(&one_hot(&[36, 0, 36]), NUM_CLASSES), "zz");
    }

    #[test]
    fn all_blank_is_empty_string() {
        let d = decoder();
        assert_eq!(d.decode_row(&one_hot(&[0; TIMESTEPS]), NUM_CLASSES), "");
    }

    #[test]
    fn empty_logits_is_empty_string() {
        let d = decoder();
        assert_eq!(d.decode_row(&[], NUM_CLASSES), "");
    }

    #[test]
    fn argmax_takes_lowest_index_on_tie() {
        let d = decoder();
        let v = vec![0.0_f32; TIMESTEPS * NUM_CLASSES];
        assert_eq!(d.decode_row(&v, NUM_CLASSES), "");
    }

    #[test]
    fn batch_decoding_slices_correctly() {
        let d = decoder();
        let a = one_hot(&[1, 2, 0]); // "01"
        let b = one_hot(&[11, 0, 13]); // "ac"
        let mut all = a.clone();
        all.extend_from_slice(&b);
        assert_eq!(d.decode_batch(&all, 2, NUM_CLASSES), vec!["01".to_string(), "ac".to_string()]);
    }
}

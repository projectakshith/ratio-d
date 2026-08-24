// Reusable contiguous batch buffer; one allocation reused across batches.

use crate::preprocessing::image::INPUT_LEN;

pub struct BatchAssembler {
    buf: Vec<f32>,
    len: usize,
}

impl BatchAssembler {
    pub fn new(max_batch: usize) -> Self {
        Self {
            buf: vec![0.0; max_batch * INPUT_LEN],
            len: 0,
        }
    }

    #[inline]
    pub fn reset(&mut self) {
        self.len = 0;
    }

    #[inline]
    pub fn push(&mut self, tensor: &[f32]) {
        debug_assert_eq!(tensor.len(), INPUT_LEN);
        let end = self.len + tensor.len();
        self.buf[self.len..end].copy_from_slice(tensor);
        self.len = end;
    }

    #[inline]
    pub const fn len(&self) -> usize {
        self.len / INPUT_LEN
    }

    #[inline]
    pub const fn is_empty(&self) -> bool {
        self.len == 0
    }

    #[inline]
    pub fn as_slice(&self) -> &[f32] {
        &self.buf[..self.len]
    }

    #[inline]
    pub const fn capacity(&self) -> usize {
        self.buf.len() / INPUT_LEN
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn assembles_contiguous_batch() {
        let mut b = BatchAssembler::new(4);
        assert!(b.is_empty());
        let t1: Vec<f32> = (0..INPUT_LEN).map(|i| i as f32).collect();
        let t2 = vec![1.5_f32; INPUT_LEN];
        b.push(&t1);
        b.push(&t2);
        assert_eq!(b.len(), 2);
        assert_eq!(b.as_slice().len(), 2 * INPUT_LEN);
        assert_eq!(&b.as_slice()[INPUT_LEN..INPUT_LEN + 3], &[1.5, 1.5, 1.5]);
        b.reset();
        b.push(&t2);
        assert_eq!(b.len(), 1);
        assert_eq!(b.as_slice()[0], 1.5);
    }
}

// Replicates the PyTorch validation transform exactly:
// decode -> PIL grayscale (ITU-R 601-2) -> validate 175x45 -> /255 -> (x-0.5)/0.5.
// No resize, no augmentations.

use crate::error::AppError;

pub const IMG_W: u32 = 175;
pub const IMG_H: u32 = 45;
pub const INPUT_LEN: usize = (IMG_W * IMG_H) as usize;

// PIL convert("L") fixed-point luma; reduces to identity for gray pixels.
#[inline]
fn pil_luma(r: u8, g: u8, b: u8) -> u8 {
    ((u32::from(r) * 19_595 + u32::from(g) * 38_470 + u32::from(b) * 7_471 + 0x8000) >> 16) as u8
}

pub fn preprocess(bytes: &[u8]) -> Result<Vec<f32>, AppError> {
    preprocess_with_dims(bytes).map(|(t, _, _)| t)
}

pub fn preprocess_with_dims(bytes: &[u8]) -> Result<(Vec<f32>, u32, u32), AppError> {
    if bytes.is_empty() {
        return Err(AppError::InvalidImage("empty request body".into()));
    }

    let img = image::load_from_memory(bytes)
        .map_err(|e| AppError::InvalidImage(format!("unsupported or corrupt image ({e})")))?;

    let (w, h) = (img.width(), img.height());
    if w != IMG_W || h != IMG_H {
        return Err(AppError::InvalidDimensions {
            expected_w: IMG_W,
            expected_h: IMG_H,
            got_w: w,
            got_h: h,
        });
    }

    let rgb = img.to_rgb8();
    let pixels = rgb.as_raw();

    // Same float op order as ToTensor() + Normalize(0.5, 0.5).
    let mut out = Vec::with_capacity(INPUT_LEN);
    for px in pixels.chunks_exact(3) {
        let x = f32::from(pil_luma(px[0], px[1], px[2])) / 255.0;
        out.push((x - 0.5) / 0.5);
    }
    debug_assert_eq!(out.len(), INPUT_LEN);
    Ok((out, w, h))
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{DynamicImage, ImageBuffer, Luma, Rgb};

    fn png_bytes(img: &DynamicImage) -> Vec<u8> {
        let mut buf = std::io::Cursor::new(Vec::new());
        img.write_to(&mut buf, image::ImageFormat::Png).unwrap();
        buf.into_inner()
    }

    #[test]
    fn luma_matches_pil_formula() {
        assert_eq!(pil_luma(255, 0, 0), 76);
        assert_eq!(pil_luma(0, 255, 0), 150);
        assert_eq!(pil_luma(0, 0, 255), 29);
        assert_eq!(pil_luma(255, 255, 255), 255);
        assert_eq!(pil_luma(0, 0, 0), 0);
        assert_eq!(pil_luma(100, 100, 100), 100);
    }

    #[test]
    fn normalizes_to_expected_range() {
        let img = DynamicImage::ImageLuma8(ImageBuffer::from_pixel(IMG_W, IMG_H, Luma([255])));
        let t = preprocess(&png_bytes(&img)).unwrap();
        assert_eq!(t.len(), INPUT_LEN);
        assert!((t[0] - 1.0).abs() < 1e-6);

        let img = DynamicImage::ImageLuma8(ImageBuffer::from_pixel(IMG_W, IMG_H, Luma([127])));
        let v = preprocess(&png_bytes(&img)).unwrap()[0];
        let expect = (f32::from(127u8) / 255.0 - 0.5) / 0.5;
        assert!((v - expect).abs() < 1e-6);
    }

    #[test]
    fn color_grayscale_matches_gray_source() {
        let gray = DynamicImage::ImageLuma8(ImageBuffer::from_pixel(IMG_W, IMG_H, Luma([90])));
        let rgb = DynamicImage::ImageRgb8(ImageBuffer::from_pixel(IMG_W, IMG_H, Rgb([90, 90, 90])));
        assert_eq!(
            preprocess(&png_bytes(&gray)).unwrap(),
            preprocess(&png_bytes(&rgb)).unwrap()
        );
    }

    #[test]
    fn rejects_wrong_dimensions() {
        let img = DynamicImage::ImageLuma8(ImageBuffer::from_pixel(64, 32, Luma([0])));
        let err = preprocess(&png_bytes(&img)).unwrap_err();
        assert!(matches!(
            err,
            AppError::InvalidDimensions { got_w: 64, got_h: 32, .. }
        ));
    }

    #[test]
    fn rejects_garbage() {
        assert!(preprocess(b"not an image").is_err());
        assert!(preprocess(b"").is_err());
    }
}

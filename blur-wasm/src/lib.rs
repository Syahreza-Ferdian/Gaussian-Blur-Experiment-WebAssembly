use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn gaussian_blur_wasm(
    data: &[u8],
    width: usize,
    height: usize,
    radius: usize,
    sigma: f32,
) -> Vec<u8> {
    let mut tmp = vec![0f32; data.len()];
    let mut output = vec![0u8; data.len()];

    // buat kernel 1D
    let mut kernel = Vec::with_capacity(2 * radius + 1);
    let mut sum = 0.0;
    for i in -(radius as isize)..=(radius as isize) {
        let g = (-((i * i) as f32) / (2.0 * sigma * sigma)).exp();
        kernel.push(g);
        sum += g;
    }
    for v in kernel.iter_mut() {
        *v /= sum;
    }

    // helper index
    let idx = |x: usize, y: usize| (y * width + x) * 4;

    // Pass 1: horizontal
    for y in 0..height {
        for x in 0..width {
            let mut r = 0.0;
            let mut g = 0.0;
            let mut b = 0.0;
            let mut a = 0.0;
            for k in -(radius as isize)..=(radius as isize) {
                let xx = (x as isize + k).clamp(0, (width - 1) as isize) as usize;
                let i = idx(xx, y);
                let w = kernel[(k + radius as isize) as usize];
                r += data[i] as f32 * w;
                g += data[i + 1] as f32 * w;
                b += data[i + 2] as f32 * w;
                a += data[i + 3] as f32 * w;
            }
            let o = idx(x, y);
            tmp[o] = r;
            tmp[o + 1] = g;
            tmp[o + 2] = b;
            tmp[o + 3] = a;
        }
    }

    // Pass 2: vertical
    for y in 0..height {
        for x in 0..width {
            let mut r = 0.0;
            let mut g = 0.0;
            let mut b = 0.0;
            let mut a = 0.0;
            for k in -(radius as isize)..=(radius as isize) {
                let yy = (y as isize + k).clamp(0, (height - 1) as isize) as usize;
                let i = idx(x, yy);
                let w = kernel[(k + radius as isize) as usize];
                r += tmp[i] * w;
                g += tmp[i + 1] * w;
                b += tmp[i + 2] * w;
                a += tmp[i + 3] * w;
            }
            let o = idx(x, y);
            output[o] = r as u8;
            output[o + 1] = g as u8;
            output[o + 2] = b as u8;
            output[o + 3] = a as u8;
        }
    }

    output
}

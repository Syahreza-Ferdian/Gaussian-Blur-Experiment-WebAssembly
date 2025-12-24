import initWasm, { gaussian_blur_wasm } from "./wasm/blur_wasm.js";

let wasmReady = false;

self.onmessage = async (e) => {
  const { imageData, radius, sigma } = e.data;

  if (!wasmReady) {
    await initWasm();
    wasmReady = true;
  }

  const { data, width, height } = imageData;

  const output = gaussian_blur_wasm(data, width, height, radius, sigma);

  self.postMessage(
    new ImageData(new Uint8ClampedArray(output), width, height),
    [output.buffer]
  );
};

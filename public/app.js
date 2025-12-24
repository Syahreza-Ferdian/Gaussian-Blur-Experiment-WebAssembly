const fileInput = document.getElementById("file-input");
const radiusSlider = document.getElementById("radius-slider");
const radiusValue = document.getElementById("radius-value");
const radiusNumber = document.getElementById("radius-number");
const applyBlurBtn = document.getElementById("apply-blur-btn");
const canvasOriginal = document.getElementById("canvas-original");
const ctxOriginal = canvasOriginal.getContext("2d");
const canvasBlurred = document.getElementById("canvas-blurred");
const ctxBlurred = canvasBlurred.getContext("2d");

let originalImage = null;
let isBlurring = false;

const blurWorker = new Worker("./blur.worker.js", { type: "module" });
let imageResolution = null;
let imageName = null;

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    canvasOriginal.width = img.width;
    canvasOriginal.height = img.height;
    ctxOriginal.drawImage(img, 0, 0);

    canvasBlurred.width = img.width;
    canvasBlurred.height = img.height;

    originalImage = img;

    imageResolution = `${img.width}x${img.height}`;
    imageName = file.name;
  };

  img.src = URL.createObjectURL(file);
});

radiusSlider.addEventListener("input", () => {
  const radius = parseInt(radiusSlider.value);
  radiusNumber.value = radius;
  radiusValue.textContent = radius;
});

radiusNumber.addEventListener("input", () => {
  const radius = parseInt(radiusNumber.value) || 0;
  radiusSlider.value = radius;
  radiusValue.textContent = radius;
});

applyBlurBtn.addEventListener("click", () => {
  const radius = parseInt(radiusSlider.value);
  if (!originalImage || isBlurring) return;

  applyBlur(radius);
});

async function applyBlur(radius) {
  if (!originalImage || isBlurring) return;
  isBlurring = true;

  applyBlurBtn.disabled = true;
  applyBlurBtn.textContent = "Processing...";

  ctxOriginal.drawImage(originalImage, 0, 0);
  const imageData = ctxOriginal.getImageData(
    0,
    0,
    canvasOriginal.width,
    canvasOriginal.height,
    {
      willReadFrequently: true,
    }
  );

  let sigma = radius / 3;
  if (sigma <= 0) sigma = 0.5;

  const start = performance.now();

  blurWorker.postMessage(
    {
      imageData: imageData,
      radius: radius,
      sigma: sigma,
    },
    [imageData.data.buffer]
  );

  blurWorker.onmessage = (e) => {
    const output = e.data;
    const duration = performance.now() - start;

    ctxBlurred.putImageData(output, 0, 0);

    fetch("/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "wasm-worker",
        radius,
        imageName,
        imageResolution,
        sigma: sigma.toFixed(2),
        duration: duration.toFixed(2),
      }),
    });

    isBlurring = false;
    applyBlurBtn.disabled = false;
    applyBlurBtn.textContent = "Apply Blur";
  };

  blurWorker.onerror = (e) => {
    console.error("Terjadi error pada worker:", e.message);

    isBlurring = false;
    applyBlurBtn.disabled = false;
    applyBlurBtn.textContent = "Apply Blur";
  };
}

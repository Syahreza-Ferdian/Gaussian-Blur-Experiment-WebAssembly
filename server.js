const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3001;

app.use(express.static("public"));
app.use(express.json());

const csvPath = path.join(__dirname, "results_wasm_2.csv");

if (!fs.existsSync(csvPath) || fs.statSync(csvPath).size === 0) {
  fs.writeFileSync(
    csvPath,
    "timestamp,mode,imageName,imageResolution,sigma,radius,duration\n"
  );
}

app.post("/log", (req, res) => {
  const { mode, imageName, imageResolution, sigma, radius, duration } =
    req.body;

  const timestamp = new Date().toISOString();

  const line = `${timestamp},${mode},${imageName},${imageResolution},${sigma},${radius},${duration}\n`;

  fs.appendFileSync(csvPath, line);

  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

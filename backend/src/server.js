import "dotenv/config";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { app } = require("../../functions/index.js");

const port = Number(process.env.PORT || 3001);

app.listen(port, () => {
  console.log(`Ajuma AI API listening locally on http://localhost:${port}`);
  console.log("Using the same Express app exported by functions/index.js.");
});

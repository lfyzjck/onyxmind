import path from "node:path";
import { fileURLToPath } from "node:url";
import createJiti from "jiti";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jiti = createJiti(__filename);

export function loadTsModule(relativePath) {
  return jiti(path.resolve(__dirname, "../..", relativePath));
}

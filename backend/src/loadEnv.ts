import path from "node:path";
import dotenv from "dotenv";

/** Load `.env` from the backend root (not dependent on `process.cwd()`). */
dotenv.config({ path: path.join(__dirname, "..", ".env"), quiet: true });

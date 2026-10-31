import { readFileSync } from "node:fs";
import { parseAgentTools } from "./review-inputs.ts";

const definitionPath = process.argv[2] ?? "";
let definition: string;
try {
  definition = readFileSync(definitionPath, "utf8");
} catch (error) {
  const reason = error instanceof Error ? error.message : String(error);
  process.stderr.write(
    `::error::${definitionPath} cannot be read. The system reported: ${reason}\n`,
  );
  process.exit(1);
}
const tools = parseAgentTools(definition, definitionPath);
if (!tools.ok) {
  process.stderr.write(`::error::${tools.failure}\n`);
  process.exit(1);
}
process.stdout.write(tools.value);

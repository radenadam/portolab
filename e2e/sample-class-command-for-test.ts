import { sampleClass } from "../server/sample-class.ts";
import { sampleMomentForTest } from "../app/features/sample-class/sample-prices-for-test.server.ts";

// Recorded closes need their own moment even when the browser suite runs in a later semester.
await sampleClass(process.env, () => sampleMomentForTest);

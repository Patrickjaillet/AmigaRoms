import { z } from "zod";

const CliOptionsSchema = z.object({
  platform: z.string().optional(),
  dryRun: z.boolean().default(false),
  forceFullReindex: z.boolean().default(false),
});

export type CliOptions = z.infer<typeof CliOptionsSchema>;

export function parseCliArgs(argv: readonly string[]): CliOptions {
  const raw: Record<string, unknown> = { dryRun: false, forceFullReindex: false };

  for (const arg of argv) {
    if (arg === "--dry-run") {
      raw.dryRun = true;
    } else if (arg === "--force-full-reindex") {
      raw.forceFullReindex = true;
    } else if (arg.startsWith("--platform=")) {
      const value = arg.slice("--platform=".length);
      if (value.length === 0) {
        throw new Error("--platform requires a non-empty value, e.g. --platform=amiga");
      }
      raw.platform = value;
    }
  }

  return CliOptionsSchema.parse(raw);
}

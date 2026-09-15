import { describe, expect, it } from "vitest";
import { parseCliArgs } from "../../scripts/lib/cli.js";

describe("parseCliArgs", () => {
  it("defaults to no platform filter and both flags false", () => {
    expect(parseCliArgs([])).toEqual({ dryRun: false, forceFullReindex: false });
  });

  it("parses --platform=<id>", () => {
    expect(parseCliArgs(["--platform=amiga"])).toMatchObject({ platform: "amiga" });
  });

  it("parses --dry-run and --force-full-reindex flags", () => {
    expect(parseCliArgs(["--dry-run", "--force-full-reindex"])).toEqual({
      dryRun: true,
      forceFullReindex: true,
    });
  });

  it("throws on an empty --platform= value", () => {
    expect(() => parseCliArgs(["--platform="])).toThrow();
  });

  it("ignores unknown flags", () => {
    expect(parseCliArgs(["--unknown-flag"])).toEqual({ dryRun: false, forceFullReindex: false });
  });
});

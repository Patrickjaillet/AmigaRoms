import { createHash } from "node:crypto";

export function buildRomEntryId(archiveIdentifier: string, fileName: string): string {
  return createHash("sha1").update(`${archiveIdentifier}:${fileName}`).digest("hex").slice(0, 16);
}

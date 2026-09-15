import { z } from "zod";

export const PlatformConfigSchema = z.object({
  platformId: z.string().regex(/^[a-z0-9-]+$/, "platformId must be kebab-case"),
  displayName: z.string(),
  archiveCollections: z.array(z.string()).min(1),
  allowedExtensions: z.array(z.string()).min(1),
});

export type PlatformConfig = z.infer<typeof PlatformConfigSchema>;

export const PLATFORMS: readonly PlatformConfig[] = [
  {
    platformId: "amiga",
    displayName: "Commodore Amiga",
    archiveCollections: ["softwarelibrary_amiga", "amigaromsdisks"],
    allowedExtensions: ["adf", "lha", "zip"],
  },
] as const;

export function validatePlatformsConfig(platforms: readonly PlatformConfig[] = PLATFORMS): void {
  const seen = new Set<string>();
  for (const platform of platforms) {
    const result = PlatformConfigSchema.safeParse(platform);
    if (!result.success) {
      const issues = result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      throw new Error(`Invalid platform config for "${platform.platformId}": ${issues}`);
    }
    if (seen.has(platform.platformId)) {
      throw new Error(`Duplicate platformId in platforms.config.ts: "${platform.platformId}"`);
    }
    seen.add(platform.platformId);
  }
}

export function getPlatformConfig(platformId: string): PlatformConfig | undefined {
  return PLATFORMS.find((platform) => platform.platformId === platformId);
}

import { z } from 'zod'

/**
 * Asset Schemas for Risk Legacy Game
 *
 * These schemas validate YAML assets during build-time conversion and runtime loading.
 * All assets follow a common pattern with namespace, imgPath, and type-specific data.
 */

// ============================================================================
// Base Schema - Common to all card types
// ============================================================================

const BaseCardSchema = z.object({
  namespace: z.string().min(1, 'Namespace is required'),
  imgPath: z.string().optional(),
  cardBack: z.string().optional(),
  qty: z.number().int().positive().optional().default(1),
})

// ============================================================================
// Faction Schema
// ============================================================================

export const FactionDataSchema = z.object({
  troop_img: z.string(),
  three_img: z.string(),
  hq_img: z.string(),
  name: z.string(),
})

export const FactionSchema = BaseCardSchema.extend({
  data: FactionDataSchema,
})

export type Faction = z.infer<typeof FactionSchema>
export type FactionData = z.infer<typeof FactionDataSchema>

// ============================================================================
// Power Schema
// ============================================================================

export const PowerDataSchema = z.object({
  description: z.string(),
  type: z.enum([
    'starter',
    'unlocked',
    'evolved',
    'mission',
    'missio', // Typo in some cards, but we accept it
    'weakness',
    'knockout',
    'missile',
  ]).default('starter'),
  faction: z.string().optional(), // Which faction this power belongs to
  conditions: z.string().optional(), // When this power can be used
})

export const PowerSchema = BaseCardSchema.extend({
  data: PowerDataSchema,
})

export type Power = z.infer<typeof PowerSchema>
export type PowerData = z.infer<typeof PowerDataSchema>

// ============================================================================
// Territory Card Schema
// ============================================================================

export const TerritoryDataSchema = z.object({
  value: z.number().int().min(1).max(4), // Territory card value (1-4)
  continent: z.enum([
    'north_america',
    'south_america',
    'europe',
    'africa',
    'asia',
    'australia',
    'None', // Special territories (e.g., alien island)
  ]),
  population: z.number().int().optional(), // Added via stickers
  hasCity: z.boolean().optional(),
  cityName: z.string().optional(),
})

export const TerritorySchema = BaseCardSchema.extend({
  data: TerritoryDataSchema,
})

export type Territory = z.infer<typeof TerritorySchema>
export type TerritoryData = z.infer<typeof TerritoryDataSchema>

// ============================================================================
// Scar Schema (negative effects on factions)
// ============================================================================

export const ScarDataSchema = z.object({
  tokenImg: z.string().optional(), // Token image if scar is placed on faction card
  folder: z.string().optional(), // Organization folder (e.g., "Game Won", "Held On")
  description: z.string().optional(), // Effect description
  effect: z.string().optional(), // Machine-readable effect code
})

export const ScarSchema = BaseCardSchema.extend({
  data: ScarDataSchema.optional(),
})

export type Scar = z.infer<typeof ScarSchema>
export type ScarData = z.infer<typeof ScarDataSchema>

// ============================================================================
// Sticker Schema (positive board modifications)
// ============================================================================

export const StickerDataSchema = z.object({
  folder: z.string().optional(), // Organization folder
  type: z.enum([
    'city',
    'resource',
    'victory',
    'world_capital',
    'fortification',
    'custom',
  ]).optional(),
  value: z.number().int().optional(), // Resource value for resource stickers
  name: z.string().optional(), // City name for city stickers
  effect: z.string().optional(), // Machine-readable effect
})

export const StickerSchema = BaseCardSchema.extend({
  data: StickerDataSchema.optional(),
})

export type Sticker = z.infer<typeof StickerSchema>
export type StickerData = z.infer<typeof StickerDataSchema>

// ============================================================================
// Mission Schema (secret objectives)
// ============================================================================

export const MissionDataSchema = z.object({
  description: z.string().optional(), // Mission objective text
  condition: z.string().optional(), // Machine-readable completion condition
  private: z.boolean().optional().default(false), // Is this a private mission?
})

export const MissionSchema = BaseCardSchema.extend({
  data: MissionDataSchema.optional(),
})

export type Mission = z.infer<typeof MissionSchema>
export type MissionData = z.infer<typeof MissionDataSchema>

// ============================================================================
// Event Schema (event cards)
// ============================================================================

export const EventDataSchema = z.object({
  description: z.string().optional(), // Event text
  effect: z.string().optional(), // Machine-readable effect
  timing: z.enum(['turn_start', 'combat', 'recruit', 'maneuver', 'any']).optional(),
})

export const EventSchema = BaseCardSchema.extend({
  data: EventDataSchema.optional(),
})

export type Event = z.infer<typeof EventSchema>
export type EventData = z.infer<typeof EventDataSchema>

// ============================================================================
// Pack Schema - Collection of assets by unlock pack
// ============================================================================

export const PackSchema = z.object({
  name: z.string(),
  factions: z.array(FactionSchema).default([]),
  powers: z.array(PowerSchema).default([]),
  territories: z.array(TerritorySchema).default([]),
  scars: z.array(ScarSchema).default([]),
  stickers: z.array(StickerSchema).default([]),
  missions: z.array(MissionSchema).default([]),
  events: z.array(EventSchema).default([]),
})

export type Pack = z.infer<typeof PackSchema>

// ============================================================================
// Asset Collection Schema - All packs combined
// ============================================================================

export const AssetCollectionSchema = z.object({
  version: z.string(),
  packs: z.record(z.string(), PackSchema), // key = pack name, value = pack data
  metadata: z.object({
    buildTime: z.string(),
    sourceDirectory: z.string(),
  }),
})

export type AssetCollection = z.infer<typeof AssetCollectionSchema>

// ============================================================================
// Helper functions for schema validation
// ============================================================================

/**
 * Validate a single card of any type
 */
export function validateCard(
  cardType: string,
  data: unknown
): Faction | Power | Territory | Scar | Sticker | Mission | Event {
  switch (cardType) {
    case 'factions':
      return FactionSchema.parse(data)
    case 'powers':
      return PowerSchema.parse(data)
    case 'territories':
      return TerritorySchema.parse(data)
    case 'scars':
      return ScarSchema.parse(data)
    case 'stickersheet':
    case 'stickers':
      return StickerSchema.parse(data)
    case 'missions':
      return MissionSchema.parse(data)
    case 'events':
      return EventSchema.parse(data)
    default:
      throw new Error(`Unknown card type: ${cardType}`)
  }
}

/**
 * Safely validate a card with detailed error messages
 */
export function safeValidateCard(
  cardType: string,
  data: unknown,
  sourcePath: string
): { success: true; data: any } | { success: false; error: string } {
  try {
    const validated = validateCard(cardType, data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((issue) =>
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ')
      return {
        success: false,
        error: `Validation failed for ${sourcePath}: ${issues}`,
      }
    }
    return {
      success: false,
      error: `Validation failed for ${sourcePath}: ${error}`,
    }
  }
}

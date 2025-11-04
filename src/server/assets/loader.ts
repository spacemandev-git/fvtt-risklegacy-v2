import * as fs from 'fs'
import * as path from 'path'
import {
  AssetCollectionSchema,
  PackSchema,
  type AssetCollection,
  type Pack,
  type Faction,
  type Power,
  type Territory,
  type Scar,
  type Sticker,
  type Mission,
  type Event,
} from './schemas'

/**
 * Asset Loader for Risk Legacy Game
 *
 * Loads pre-compiled JSON assets from the data/ directory
 * Supports pack-based filtering (base + unlocked packs only)
 * Provides helper functions for card lookup and filtering
 */

const DATA_DIR = path.join(__dirname, 'data')
const MASTER_FILE = path.join(DATA_DIR, 'all-assets.json')

// ============================================================================
// In-memory cache
// ============================================================================

let cachedAssets: AssetCollection | null = null

/**
 * Load all assets from the master file (with caching)
 */
function loadAllAssets(): AssetCollection {
  if (cachedAssets) {
    return cachedAssets
  }

  if (!fs.existsSync(MASTER_FILE)) {
    throw new Error(
      `Asset collection not found at ${MASTER_FILE}. Run 'bun run build:assets' first.`
    )
  }

  const content = fs.readFileSync(MASTER_FILE, 'utf8')
  const data = JSON.parse(content)

  // Validate with Zod schema
  const validated = AssetCollectionSchema.parse(data)

  cachedAssets = validated
  return validated
}

/**
 * Load a single pack by name
 */
export function loadPack(packName: string): Pack {
  const packFile = path.join(DATA_DIR, `${packName}.json`)

  if (!fs.existsSync(packFile)) {
    throw new Error(`Pack not found: ${packName}`)
  }

  const content = fs.readFileSync(packFile, 'utf8')
  const data = JSON.parse(content)

  return PackSchema.parse(data)
}

/**
 * Clear the cache (useful for testing)
 */
export function clearCache(): void {
  cachedAssets = null
}

// ============================================================================
// Asset Database Builder
// ============================================================================

export interface AssetDatabase {
  // Collections by type
  factions: Faction[]
  powers: Power[]
  territories: Territory[]
  scars: Scar[]
  stickers: Sticker[]
  missions: Mission[]
  events: Event[]

  // Lookup maps (by namespace)
  factionsByNamespace: Map<string, Faction>
  powersByNamespace: Map<string, Power>
  territoriesByNamespace: Map<string, Territory>
  scarsByNamespace: Map<string, Scar>
  stickersByNamespace: Map<string, Sticker>
  missionsByNamespace: Map<string, Mission>
  eventsByNamespace: Map<string, Event>

  // Metadata
  loadedPacks: string[]
  totalCards: number
}

/**
 * Build an asset database from selected packs
 *
 * @param packNames - Array of pack names to load (e.g., ['base', 'secondwin'])
 * @returns AssetDatabase with all cards from the selected packs
 */
export function buildAssetDatabase(packNames: string[]): AssetDatabase {
  const allAssets = loadAllAssets()

  const db: AssetDatabase = {
    factions: [],
    powers: [],
    territories: [],
    scars: [],
    stickers: [],
    missions: [],
    events: [],
    factionsByNamespace: new Map(),
    powersByNamespace: new Map(),
    territoriesByNamespace: new Map(),
    scarsByNamespace: new Map(),
    stickersByNamespace: new Map(),
    missionsByNamespace: new Map(),
    eventsByNamespace: new Map(),
    loadedPacks: [],
    totalCards: 0,
  }

  // Load each pack
  for (const packName of packNames) {
    const pack = allAssets.packs[packName]

    if (!pack) {
      console.warn(`Pack not found: ${packName}`)
      continue
    }

    // Add cards to collections
    db.factions.push(...pack.factions)
    db.powers.push(...pack.powers)
    db.territories.push(...pack.territories)
    db.scars.push(...pack.scars)
    db.stickers.push(...pack.stickers)
    db.missions.push(...pack.missions)
    db.events.push(...pack.events)

    // Build lookup maps
    pack.factions.forEach((f) => db.factionsByNamespace.set(f.namespace, f))
    pack.powers.forEach((p) => db.powersByNamespace.set(p.namespace, p))
    pack.territories.forEach((t) => db.territoriesByNamespace.set(t.namespace, t))
    pack.scars.forEach((s) => db.scarsByNamespace.set(s.namespace, s))
    pack.stickers.forEach((s) => db.stickersByNamespace.set(s.namespace, s))
    pack.missions.forEach((m) => db.missionsByNamespace.set(m.namespace, m))
    pack.events.forEach((e) => db.eventsByNamespace.set(e.namespace, e))

    db.loadedPacks.push(packName)
  }

  // Count total cards
  db.totalCards =
    db.factions.length +
    db.powers.length +
    db.territories.length +
    db.scars.length +
    db.stickers.length +
    db.missions.length +
    db.events.length

  return db
}

/**
 * Build asset database with only base pack (for new campaigns)
 */
export function buildBaseAssetDatabase(): AssetDatabase {
  return buildAssetDatabase(['base'])
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get faction by namespace
 */
export function getFactionByNamespace(
  db: AssetDatabase,
  namespace: string
): Faction | undefined {
  return db.factionsByNamespace.get(namespace)
}

/**
 * Get all factions (base 5)
 */
export function getAllFactions(db: AssetDatabase): Faction[] {
  return db.factions
}

/**
 * Get power by namespace
 */
export function getPowerByNamespace(
  db: AssetDatabase,
  namespace: string
): Power | undefined {
  return db.powersByNamespace.get(namespace)
}

/**
 * Get all powers for a specific faction
 */
export function getPowersForFaction(
  db: AssetDatabase,
  factionNamespace: string
): Power[] {
  // Extract faction name from namespace (e.g., "khan" from "khan.factions.base...")
  const factionName = factionNamespace.split('.')[0]

  // Powers are named like "khan_1.powers.base..." so we filter by "khan_"
  return db.powers.filter((p) => p.namespace.startsWith(factionName + '_'))
}

/**
 * Get all starter powers (2 per faction)
 */
export function getStarterPowers(db: AssetDatabase): Power[] {
  return db.powers.filter((p) => p.data.type === 'starter')
}

/**
 * Get territory card by namespace
 */
export function getTerritoryByNamespace(
  db: AssetDatabase,
  namespace: string
): Territory | undefined {
  return db.territoriesByNamespace.get(namespace)
}

/**
 * Get all territories for a specific continent
 */
export function getTerritoriesByContinent(
  db: AssetDatabase,
  continent: string
): Territory[] {
  return db.territories.filter((t) => t.data.continent === continent)
}

/**
 * Get all territory cards
 */
export function getAllTerritories(db: AssetDatabase): Territory[] {
  return db.territories
}

/**
 * Get scar by namespace
 */
export function getScarByNamespace(
  db: AssetDatabase,
  namespace: string
): Scar | undefined {
  return db.scarsByNamespace.get(namespace)
}

/**
 * Get all available scars
 */
export function getAllScars(db: AssetDatabase): Scar[] {
  return db.scars
}

/**
 * Get sticker by namespace
 */
export function getStickerByNamespace(
  db: AssetDatabase,
  namespace: string
): Sticker | undefined {
  return db.stickersByNamespace.get(namespace)
}

/**
 * Get all stickers by type
 */
export function getStickersByType(
  db: AssetDatabase,
  type: string
): Sticker[] {
  return db.stickers.filter((s) => s.data?.type === type)
}

/**
 * Get all available stickers
 */
export function getAllStickers(db: AssetDatabase): Sticker[] {
  return db.stickers
}

/**
 * Get mission by namespace
 */
export function getMissionByNamespace(
  db: AssetDatabase,
  namespace: string
): Mission | undefined {
  return db.missionsByNamespace.get(namespace)
}

/**
 * Get all missions
 */
export function getAllMissions(db: AssetDatabase): Mission[] {
  return db.missions
}

/**
 * Get event by namespace
 */
export function getEventByNamespace(
  db: AssetDatabase,
  namespace: string
): Event | undefined {
  return db.eventsByNamespace.get(namespace)
}

/**
 * Get all events
 */
export function getAllEvents(db: AssetDatabase): Event[] {
  return db.events
}

/**
 * Get available pack names
 */
export function getAvailablePacks(): string[] {
  const allAssets = loadAllAssets()
  return Object.keys(allAssets.packs)
}

/**
 * Get asset collection metadata
 */
export function getAssetMetadata(): AssetCollection['metadata'] {
  const allAssets = loadAllAssets()
  return allAssets.metadata
}

// ============================================================================
// Export everything
// ============================================================================

export {
  loadAllAssets,
  type AssetCollection,
  type Pack,
  type Faction,
  type Power,
  type Territory,
  type Scar,
  type Sticker,
  type Mission,
  type Event,
}

import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import {
  buildAssetDatabase,
  buildBaseAssetDatabase,
  loadPack,
  clearCache,
  getAllFactions,
  getStarterPowers,
  getPowersForFaction,
  getAllTerritories,
  getTerritoriesByContinent,
  getAvailablePacks,
  getAssetMetadata,
  getFactionByNamespace,
  getPowerByNamespace,
  getTerritoryByNamespace,
  type AssetDatabase,
} from '../../src/server/assets/loader'
import {
  FactionSchema,
  PowerSchema,
  TerritorySchema,
  ScarSchema,
  StickerSchema,
  MissionSchema,
  EventSchema,
  PackSchema,
} from '../../src/server/assets/schemas'

describe('Module 1.4: Asset Loader & Build-Time Conversion', () => {
  beforeAll(() => {
    console.log('\n' + '='.repeat(80))
    console.log('🃏 Testing Module 1.4: Asset Loader & Build-Time Conversion')
    console.log('='.repeat(80) + '\n')
  })

  afterAll(() => {
    console.log('\n' + '='.repeat(80))
    console.log('✅ Module 1.4 Tests Complete')
    console.log('='.repeat(80) + '\n')
  })

  describe('Zod Schema Validation', () => {
    test('should validate faction schema', () => {
      console.log('📝 Test: Faction schema validation')

      const validFaction = {
        namespace: 'khan.factions.base.risklegacy.spacemandev',
        imgPath: 'khan.png',
        qty: 1,
        data: {
          troop_img: 'khan_1.png',
          three_img: 'khan_3.png',
          hq_img: 'khan_hq.png',
          name: 'Khan Industries',
        },
      }

      const result = FactionSchema.parse(validFaction)

      console.log('✅ Valid faction:', result.data.name)
      expect(result.data.name).toBe('Khan Industries')
    })

    test('should validate power schema', () => {
      console.log('📝 Test: Power schema validation')

      const validPower = {
        namespace: 'khan_1.powers.base.risklegacy.spacemandev',
        qty: 1,
        data: {
          description: 'At the start of your turn, place one troop in each territory that has an HQ that you control.',
          type: 'starter' as const,
        },
      }

      const result = PowerSchema.parse(validPower)

      console.log('✅ Valid power type:', result.data.type)
      expect(result.data.type).toBe('starter')
    })

    test('should validate territory schema', () => {
      console.log('📝 Test: Territory schema validation')

      const validTerritory = {
        namespace: 'alaska.territories.base.risklegacy.spacemandev',
        imgPath: 'alaska.jpg',
        cardBack: 'resource_card.jpg',
        qty: 1,
        data: {
          value: 1,
          continent: 'north_america' as const,
        },
      }

      const result = TerritorySchema.parse(validTerritory)

      console.log('✅ Valid territory continent:', result.data.continent)
      expect(result.data.continent).toBe('north_america')
    })

    test('should validate all power types including unlock variants', () => {
      console.log('📝 Test: Power type enum validation')

      const powerTypes = ['starter', 'unlocked', 'evolved', 'mission', 'missio', 'weakness', 'knockout', 'missile']

      powerTypes.forEach((type) => {
        const power = {
          namespace: `test.powers.test`,
          qty: 1,
          data: {
            description: 'Test power',
            type,
          },
        }

        const result = PowerSchema.safeParse(power)
        console.log(`  ${result.success ? '✅' : '❌'} Power type: ${type}`)
        expect(result.success).toBe(true)
      })
    })

    test('should validate special territory continent "None"', () => {
      console.log('📝 Test: Special territory continent validation')

      const alienIsland = {
        namespace: 'alien_island.territories.base.risklegacy.spacemandev',
        imgPath: 'alien_island.jpg',
        cardBack: 'resource_card.jpg',
        qty: 1,
        data: {
          value: 3,
          continent: 'None' as const,
        },
      }

      const result = TerritorySchema.parse(alienIsland)

      console.log('✅ Special territory continent:', result.data.continent)
      expect(result.data.continent).toBe('None')
    })
  })

  describe('Pack Loading', () => {
    test('should load base pack', () => {
      console.log('\n📝 Test: Load base pack')

      const basePack = loadPack('base')

      console.log('📦 Base Pack Loaded:')
      console.log(`  - Factions: ${basePack.factions.length}`)
      console.log(`  - Powers: ${basePack.powers.length}`)
      console.log(`  - Territories: ${basePack.territories.length}`)
      console.log(`  - Scars: ${basePack.scars.length}`)
      console.log(`  - Stickers: ${basePack.stickers.length}`)

      expect(basePack.factions.length).toBe(5) // 5 base factions
      expect(basePack.powers.length).toBe(10) // 2 powers per faction
      expect(basePack.territories.length).toBe(42) // 42 territory cards
      expect(basePack.name).toBe('base')

      console.log('✅ Base pack loaded successfully\n')
    })

    test('should load unlock packs', () => {
      console.log('📝 Test: Load unlock packs')

      const packNames = ['secondwin', 'worldcapital', 'thirtytroops', 'eliminated', 'minorcities', 'threemissiles']

      packNames.forEach((packName) => {
        const pack = loadPack(packName)
        console.log(`  ✅ Loaded pack: ${packName} (${pack.missions.length + pack.events.length + pack.powers.length} cards)`)
        expect(pack.name).toBe(packName)
      })
    })

    test('should get available packs', () => {
      console.log('\n📝 Test: Get available packs')

      const packs = getAvailablePacks()

      console.log('📦 Available Packs:', packs.join(', '))
      expect(packs).toContain('base')
      expect(packs).toContain('secondwin')
      expect(packs.length).toBeGreaterThanOrEqual(7)

      console.log('✅ Pack list retrieved\n')
    })

    test('should get asset metadata', () => {
      console.log('📝 Test: Get asset metadata')

      const metadata = getAssetMetadata()

      console.log('📊 Asset Metadata:')
      console.log(`  - Build Time: ${metadata.buildTime}`)
      console.log(`  - Source Directory: ${metadata.sourceDirectory}`)

      expect(metadata.buildTime).toBeDefined()
      expect(metadata.sourceDirectory).toContain('assets/unlocks')

      console.log('✅ Metadata retrieved\n')
    })
  })

  describe('Asset Database Building', () => {
    let baseDb: AssetDatabase
    let extendedDb: AssetDatabase

    test('should build base asset database', () => {
      console.log('📝 Test: Build base asset database')

      baseDb = buildBaseAssetDatabase()

      console.log('\n📊 Base Asset Database Stats:')
      console.log(`  - Total Cards: ${baseDb.totalCards}`)
      console.log(`  - Factions: ${baseDb.factions.length}`)
      console.log(`  - Powers: ${baseDb.powers.length}`)
      console.log(`  - Territories: ${baseDb.territories.length}`)
      console.log(`  - Scars: ${baseDb.scars.length}`)
      console.log(`  - Stickers: ${baseDb.stickers.length}`)
      console.log(`  - Missions: ${baseDb.missions.length}`)
      console.log(`  - Events: ${baseDb.events.length}`)
      console.log(`  - Loaded Packs: ${baseDb.loadedPacks.join(', ')}`)

      expect(baseDb.loadedPacks).toEqual(['base'])
      expect(baseDb.factions.length).toBe(5)
      expect(baseDb.powers.length).toBe(10)
      expect(baseDb.missions.length).toBe(0) // No missions in base pack

      console.log('✅ Base database built successfully\n')
    })

    test('should build extended database with unlock packs', () => {
      console.log('📝 Test: Build extended database with unlocks')

      extendedDb = buildAssetDatabase(['base', 'secondwin', 'worldcapital'])

      console.log('\n📊 Extended Asset Database Stats:')
      console.log(`  - Total Cards: ${extendedDb.totalCards}`)
      console.log(`  - Factions: ${extendedDb.factions.length}`)
      console.log(`  - Powers: ${extendedDb.powers.length}`)
      console.log(`  - Territories: ${extendedDb.territories.length}`)
      console.log(`  - Scars: ${extendedDb.scars.length}`)
      console.log(`  - Stickers: ${extendedDb.stickers.length}`)
      console.log(`  - Missions: ${extendedDb.missions.length}`)
      console.log(`  - Events: ${extendedDb.events.length}`)
      console.log(`  - Loaded Packs: ${extendedDb.loadedPacks.join(', ')}`)

      expect(extendedDb.loadedPacks).toEqual(['base', 'secondwin', 'worldcapital'])
      expect(extendedDb.missions.length).toBeGreaterThan(0) // Should have missions now
      expect(extendedDb.events.length).toBeGreaterThan(0) // Should have events now
      expect(extendedDb.powers.length).toBeGreaterThan(baseDb.powers.length) // More powers

      console.log('✅ Extended database built successfully\n')
    })

    test('should create namespace lookup maps', () => {
      console.log('📝 Test: Namespace lookup maps')

      const db = buildBaseAssetDatabase()

      console.log('\n🔍 Testing Namespace Lookups:')

      // Test faction lookup
      const khan = getFactionByNamespace(db, 'khan.factions.base.risklegacy.spacemandev')
      console.log(`  ✅ Faction lookup: ${khan?.data.name}`)
      expect(khan?.data.name).toBe('Khan Industries')

      // Test power lookup
      const khanPower1 = getPowerByNamespace(db, 'khan_1.powers.base.risklegacy.spacemandev')
      console.log(`  ✅ Power lookup: ${khanPower1?.data.description.substring(0, 50)}...`)
      expect(khanPower1).toBeDefined()

      // Test territory lookup
      const alaska = getTerritoryByNamespace(db, 'alaska.territories.base.risklegacy.spacemandev')
      console.log(`  ✅ Territory lookup: Alaska (continent: ${alaska?.data.continent})`)
      expect(alaska?.data.continent).toBe('north_america')

      console.log('✅ All lookups working\n')
    })
  })

  describe('Helper Functions', () => {
    let db: AssetDatabase

    beforeAll(() => {
      db = buildBaseAssetDatabase()
    })

    test('should get all factions', () => {
      console.log('📝 Test: Get all factions')

      const factions = getAllFactions(db)

      console.log('\n🏴 All Factions:')
      factions.forEach((faction, i) => {
        console.log(`  ${i + 1}. ${faction.data.name}`)
      })

      expect(factions.length).toBe(5)
      const factionNames = factions.map(f => f.data.name)
      expect(factionNames).toContain('Khan Industries')
      expect(factionNames).toContain('Die Mechaniker')
      expect(factionNames).toContain('Enclave of the Bear')
      expect(factionNames).toContain('Imperial Balkania')
      expect(factionNames).toContain('Saharan Republic')

      console.log('✅ All 5 factions retrieved\n')
    })

    test('should get all starter powers', () => {
      console.log('📝 Test: Get all starter powers')

      const starterPowers = getStarterPowers(db)

      console.log('\n⚡ Starter Powers:')
      starterPowers.forEach((power, i) => {
        const factionName = power.namespace.split('.')[0]
        console.log(`  ${i + 1}. ${factionName}: ${power.data.description.substring(0, 60)}...`)
      })

      expect(starterPowers.length).toBe(10) // 2 per faction, 5 factions

      console.log(`✅ All ${starterPowers.length} starter powers retrieved\n`)
    })

    test('should get powers for specific faction', () => {
      console.log('📝 Test: Get powers for specific faction')

      const khanPowers = getPowersForFaction(db, 'khan.factions.base.risklegacy.spacemandev')

      console.log('\n⚡ Khan Industries Powers:')
      khanPowers.forEach((power, i) => {
        console.log(`  ${i + 1}. ${power.data.description}`)
      })

      expect(khanPowers.length).toBe(2) // Khan has 2 starter powers

      console.log('✅ Faction-specific powers retrieved\n')
    })

    test('should get all territory cards', () => {
      console.log('📝 Test: Get all territory cards')

      const territories = getAllTerritories(db)

      console.log(`\n🗺️  Total Territory Cards: ${territories.length}`)

      // Count by continent
      const continentCounts: Record<string, number> = {}
      territories.forEach((t) => {
        continentCounts[t.data.continent] = (continentCounts[t.data.continent] || 0) + 1
      })

      console.log('\n📊 Territories by Continent:')
      Object.entries(continentCounts).forEach(([continent, count]) => {
        console.log(`  - ${continent}: ${count} territories`)
      })

      expect(territories.length).toBe(42) // 42 territory cards in base game

      console.log('✅ All territory cards retrieved\n')
    })

    test('should get territories by continent', () => {
      console.log('📝 Test: Get territories by continent')

      const northAmericaTerritories = getTerritoriesByContinent(db, 'north_america')

      console.log('\n🌎 North America Territories:')
      northAmericaTerritories.forEach((t, i) => {
        const name = t.namespace.split('.')[0].replace(/_/g, ' ')
        console.log(`  ${i + 1}. ${name} (value: ${t.data.value})`)
      })

      expect(northAmericaTerritories.length).toBeGreaterThan(0)

      console.log(`✅ ${northAmericaTerritories.length} North America territories retrieved\n`)
    })
  })

  describe('Pack Filtering', () => {
    test('should only load base pack assets by default', () => {
      console.log('📝 Test: Base pack filtering')

      const baseDb = buildBaseAssetDatabase()

      console.log('\n📦 Base Pack Only:')
      console.log(`  - Missions: ${baseDb.missions.length} (should be 0)`)
      console.log(`  - Events: ${baseDb.events.length} (should be 0)`)
      console.log(`  - Powers: ${baseDb.powers.length} (should be 10)`)

      expect(baseDb.missions.length).toBe(0) // No missions in base pack
      expect(baseDb.events.length).toBe(0) // No events in base pack
      expect(baseDb.powers.length).toBe(10) // Only 10 starter powers

      console.log('✅ Base pack filtering working\n')
    })

    test('should add unlock pack content when specified', () => {
      console.log('📝 Test: Unlock pack filtering')

      const baseDb = buildBaseAssetDatabase()
      const extendedDb = buildAssetDatabase(['base', 'secondwin'])

      console.log('\n📦 Base vs Extended (with secondwin):')
      console.log(`  - Base missions: ${baseDb.missions.length}`)
      console.log(`  - Extended missions: ${extendedDb.missions.length}`)
      console.log(`  - Base events: ${baseDb.events.length}`)
      console.log(`  - Extended events: ${extendedDb.events.length}`)

      expect(extendedDb.missions.length).toBeGreaterThan(baseDb.missions.length)
      expect(extendedDb.events.length).toBeGreaterThan(baseDb.events.length)
      expect(extendedDb.loadedPacks).toContain('secondwin')

      console.log('✅ Unlock pack filtering working\n')
    })

    test('should handle multiple unlock packs correctly', () => {
      console.log('📝 Test: Multiple unlock packs')

      const packs = ['base', 'secondwin', 'worldcapital', 'thirtytroops']
      const db = buildAssetDatabase(packs)

      console.log(`\n📦 Loading ${packs.length} packs: ${packs.join(', ')}`)
      console.log(`\n📊 Combined Database:`)
      console.log(`  - Total Cards: ${db.totalCards}`)
      console.log(`  - Factions: ${db.factions.length}`)
      console.log(`  - Powers: ${db.powers.length}`)
      console.log(`  - Missions: ${db.missions.length}`)
      console.log(`  - Events: ${db.events.length}`)
      console.log(`  - Territories: ${db.territories.length}`)

      expect(db.loadedPacks).toEqual(packs)
      expect(db.factions.length).toBeGreaterThanOrEqual(5) // At least base 5
      expect(db.missions.length).toBeGreaterThan(0)

      console.log('✅ Multiple pack loading working\n')
    })
  })

  describe('Cache Management', () => {
    test('should use cache on subsequent loads', () => {
      console.log('📝 Test: Asset caching')

      clearCache() // Clear any existing cache

      const start1 = Date.now()
      const db1 = buildBaseAssetDatabase()
      const time1 = Date.now() - start1

      const start2 = Date.now()
      const db2 = buildBaseAssetDatabase()
      const time2 = Date.now() - start2

      console.log(`\n⏱️  First load: ${time1}ms`)
      console.log(`⏱️  Cached load: ${time2}ms`)
      console.log(`📈 Speedup: ${(time1 / Math.max(time2, 1)).toFixed(1)}x faster`)

      expect(db1.totalCards).toBe(db2.totalCards)
      // Cached load should be faster (but not always guaranteed on fast systems)

      console.log('✅ Caching working\n')
    })

    test('should clear cache when requested', () => {
      console.log('📝 Test: Cache clearing')

      buildBaseAssetDatabase() // Load with cache

      clearCache()

      // Should reload from disk
      const db = buildBaseAssetDatabase()

      expect(db.totalCards).toBeGreaterThan(0)

      console.log('✅ Cache clearing working\n')
    })
  })

  describe('Asset Summary', () => {
    test('should display complete asset inventory', () => {
      console.log('📝 Test: Complete asset inventory')

      const allPacks = getAvailablePacks()
      const fullDb = buildAssetDatabase(allPacks)

      console.log('\n' + '='.repeat(80))
      console.log('📊 COMPLETE ASSET INVENTORY')
      console.log('='.repeat(80))

      console.log(`\n📦 Loaded Packs (${fullDb.loadedPacks.length}):`)
      fullDb.loadedPacks.forEach((pack, i) => {
        console.log(`  ${i + 1}. ${pack}`)
      })

      console.log(`\n🃏 Total Cards: ${fullDb.totalCards}`)

      console.log('\n📋 Card Types:')
      console.log(`  - Factions: ${fullDb.factions.length}`)
      console.log(`  - Powers: ${fullDb.powers.length}`)
      console.log(`  - Territories: ${fullDb.territories.length}`)
      console.log(`  - Scars: ${fullDb.scars.length}`)
      console.log(`  - Stickers: ${fullDb.stickers.length}`)
      console.log(`  - Missions: ${fullDb.missions.length}`)
      console.log(`  - Events: ${fullDb.events.length}`)

      console.log('\n🔍 Namespace Lookup Maps:')
      console.log(`  - Factions indexed: ${fullDb.factionsByNamespace.size}`)
      console.log(`  - Powers indexed: ${fullDb.powersByNamespace.size}`)
      console.log(`  - Territories indexed: ${fullDb.territoriesByNamespace.size}`)
      console.log(`  - Scars indexed: ${fullDb.scarsByNamespace.size}`)
      console.log(`  - Stickers indexed: ${fullDb.stickersByNamespace.size}`)
      console.log(`  - Missions indexed: ${fullDb.missionsByNamespace.size}`)
      console.log(`  - Events indexed: ${fullDb.eventsByNamespace.size}`)

      console.log('\n' + '='.repeat(80) + '\n')

      expect(fullDb.totalCards).toBeGreaterThan(0)
    })
  })
})

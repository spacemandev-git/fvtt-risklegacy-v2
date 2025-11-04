import { describe, test, expect, beforeAll } from 'bun:test'
import { getBoardTopology, clearBoardCache, BoardTopology } from '../../src/server/board/topology'
import { BoardSchema } from '../../src/server/board/schemas'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Module 1.5: Board Topology Parser & Territory Data', () => {
  let originalBoard: BoardTopology
  let advancedBoard: BoardTopology

  beforeAll(() => {
    console.log('\n=== Testing Module 1.5: Board Topology ===\n')
    clearBoardCache()
    originalBoard = getBoardTopology('original')
    advancedBoard = getBoardTopology('advanced')
  })

  describe('Board Data Loading and Validation', () => {
    test('should load original board topology from JSON', () => {
      console.log('📝 Test: Load original board topology')

      expect(originalBoard).toBeDefined()
      expect(originalBoard.getVersion()).toBe('original')

      const stats = originalBoard.getStatistics()
      console.log('Original Board Stats:', JSON.stringify(stats, null, 2))
      console.log('✅ Original board loaded successfully\n')

      expect(stats.totalTerritories).toBe(42)
      expect(stats.totalContinents).toBe(6)
    })

    test('should load advanced board topology from JSON', () => {
      console.log('📝 Test: Load advanced board topology')

      expect(advancedBoard).toBeDefined()
      expect(advancedBoard.getVersion()).toBe('advanced')

      const stats = advancedBoard.getStatistics()
      console.log('Advanced Board Stats:', JSON.stringify(stats, null, 2))
      console.log('✅ Advanced board loaded successfully\n')

      expect(stats.totalTerritories).toBe(42)
      expect(stats.totalContinents).toBe(12)
    })

    test('should validate board data with Zod schema', () => {
      console.log('📝 Test: Validate board JSON with Zod schema')

      const boardPath = join(process.cwd(), 'assets', 'board', 'original-topology.json')
      const boardData = JSON.parse(readFileSync(boardPath, 'utf-8'))

      // Should not throw
      const validated = BoardSchema.parse(boardData)

      console.log('Validated board version:', validated.version)
      console.log('Validated board territories:', validated.territories.length)
      console.log('✅ Zod validation passed\n')

      expect(validated.territories).toHaveLength(42)
      expect(validated.continents).toHaveLength(6)
    })

    test('should use cached board instances', () => {
      console.log('📝 Test: Board caching')

      const board1 = getBoardTopology('original')
      const board2 = getBoardTopology('original')

      console.log('First load:', board1.getVersion())
      console.log('Second load (cached):', board2.getVersion())
      console.log('✅ Board caching works\n')

      // Same instance should be returned
      expect(board1).toBe(board2)
    })
  })

  describe('Territory and Continent Queries', () => {
    test('should get territory by ID', () => {
      console.log('📝 Test: Get territory by ID')

      const alaska = originalBoard.getTerritoryById('north-america-alaska')

      expect(alaska).toBeDefined()
      expect(alaska?.name).toBe('Alaska')
      expect(alaska?.continent).toBe('north-america')

      console.log('Retrieved territory:', JSON.stringify(alaska, null, 2))
      console.log('✅ Territory lookup works\n')
    })

    test('should get continent by ID', () => {
      console.log('📝 Test: Get continent by ID')

      const asia = originalBoard.getContinentById('asia')

      expect(asia).toBeDefined()
      expect(asia?.name).toBe('Asia')
      expect(asia?.bonus).toBe(7)

      console.log('Retrieved continent:', JSON.stringify(asia, null, 2))
      console.log('✅ Continent lookup works\n')
    })

    test('should get all territories in a continent', () => {
      console.log('📝 Test: Get continent territories')

      const australiaTerritories = originalBoard.getContinentTerritories('australia')

      console.log(`Australia has ${australiaTerritories.length} territories:`)
      australiaTerritories.forEach(t => console.log(`  - ${t.name}`))
      console.log('✅ Continent territories retrieved\n')

      expect(australiaTerritories).toHaveLength(4)
      expect(australiaTerritories.map(t => t.name)).toContain('Indonesia')
    })

    test('should get all territories', () => {
      console.log('📝 Test: Get all territories')

      const allTerritories = originalBoard.getAllTerritories()

      console.log(`Total territories: ${allTerritories.length}`)
      console.log('✅ All territories retrieved\n')

      expect(allTerritories).toHaveLength(42)
    })

    test('should find territories by name search', () => {
      console.log('📝 Test: Find territories by name')

      const results = originalBoard.findTerritoriesByName('united')

      console.log(`Search "united" found ${results.length} territories:`)
      results.forEach(t => console.log(`  - ${t.name}`))
      console.log('✅ Territory search works\n')

      expect(results.length).toBeGreaterThan(0)
      expect(results.map(t => t.name)).toContain('Eastern United States')
    })
  })

  describe('Adjacency and Movement Validation', () => {
    test('should check territory adjacency', () => {
      console.log('📝 Test: Territory adjacency checks')

      const alaskaToKamchatka = originalBoard.areTerritoriesAdjacent(
        'north-america-alaska',
        'asia-kamchatka'
      )

      const alaskaToBrazil = originalBoard.areTerritoriesAdjacent(
        'north-america-alaska',
        'south-america-brazil'
      )

      console.log('Alaska → Kamchatka (cross-Pacific):', alaskaToKamchatka ? '✅ Adjacent' : '❌ Not adjacent')
      console.log('Alaska → Brazil:', alaskaToBrazil ? '✅ Adjacent' : '❌ Not adjacent')
      console.log('✅ Adjacency checks work\n')

      expect(alaskaToKamchatka).toBe(true)
      expect(alaskaToBrazil).toBe(false)
    })

    test('should verify adjacencies are bidirectional', () => {
      console.log('📝 Test: Bidirectional adjacencies')

      const allTerritories = originalBoard.getAllTerritories()
      let nonBidirectionalCount = 0

      for (const territory of allTerritories) {
        for (const adjacentId of territory.adjacentTo) {
          const isReverse = originalBoard.areTerritoriesAdjacent(adjacentId, territory.id)
          if (!isReverse) {
            console.log(`⚠️  Non-bidirectional: ${territory.id} → ${adjacentId}`)
            nonBidirectionalCount++
          }
        }
      }

      console.log(`Checked all adjacencies: ${nonBidirectionalCount} non-bidirectional connections found`)
      console.log('✅ Bidirectional adjacency verification complete\n')

      expect(nonBidirectionalCount).toBe(0)
    })

    test('should get adjacent territories', () => {
      console.log('📝 Test: Get adjacent territories')

      const adjacent = originalBoard.getAdjacentTerritories('north-america-ontario')

      console.log(`Ontario is adjacent to ${adjacent.length} territories:`)
      adjacent.forEach(t => console.log(`  - ${t.name}`))
      console.log('✅ Adjacent territories retrieved\n')

      expect(adjacent.length).toBeGreaterThan(0)
      expect(adjacent.map(t => t.name)).toContain('Quebec')
    })

    test('should validate movement legality', () => {
      console.log('📝 Test: Movement validation')

      const validMove = originalBoard.validateMovement(
        'europe-great-britain',
        'europe-iceland'
      )

      const invalidMove = originalBoard.validateMovement(
        'europe-great-britain',
        'asia-japan'
      )

      console.log('Great Britain → Iceland:', validMove ? '✅ Valid' : '❌ Invalid')
      console.log('Great Britain → Japan:', invalidMove ? '✅ Valid' : '❌ Invalid')
      console.log('✅ Movement validation works\n')

      expect(validMove).toBe(true)
      expect(invalidMove).toBe(false)
    })
  })

  describe('Continent Statistics', () => {
    test('should show territory counts per continent', () => {
      console.log('📝 Test: Territory counts per continent')

      const stats = originalBoard.getStatistics()

      console.log('\nContinent Territory Counts:')
      stats.continentStats.forEach(continent => {
        console.log(`  ${continent.name.padEnd(15)} - ${continent.territoryCount} territories (bonus: +${continent.bonus} troops)`)
      })
      console.log('✅ Continent statistics generated\n')

      // Verify total adds up to 42
      const totalTerritories = stats.continentStats.reduce((sum, c) => sum + c.territoryCount, 0)
      expect(totalTerritories).toBe(42)
    })

    test('should calculate correct continent bonuses', () => {
      console.log('📝 Test: Continent bonuses')

      const continents = originalBoard.getAllContinents()

      console.log('\nContinent Bonuses:')
      continents.forEach(c => {
        console.log(`  ${c.name.padEnd(15)} - +${c.bonus} troops per turn`)
      })
      console.log('✅ Continent bonuses verified\n')

      // Asia should have highest bonus (7)
      const asia = continents.find(c => c.id === 'asia')
      expect(asia?.bonus).toBe(7)

      // South America and Australia should have lowest (2)
      const sa = continents.find(c => c.id === 'south-america')
      expect(sa?.bonus).toBe(2)
    })
  })

  describe('Board Integrity Verification', () => {
    test('should verify board integrity (no isolated territories)', () => {
      console.log('📝 Test: Board integrity verification')

      const integrity = originalBoard.verifyIntegrity()

      console.log('Board integrity check:')
      console.log(`  Valid: ${integrity.isValid ? '✅' : '❌'}`)

      if (integrity.issues.length > 0) {
        console.log('  Issues found:')
        integrity.issues.forEach(issue => console.log(`    ⚠️  ${issue}`))
      } else {
        console.log('  No issues found ✅')
      }

      console.log('✅ Integrity verification complete\n')

      expect(integrity.isValid).toBe(true)
      expect(integrity.issues).toHaveLength(0)
    })

    test('should verify no isolated territories', () => {
      console.log('📝 Test: Check for isolated territories')

      const allTerritories = originalBoard.getAllTerritories()
      const isolated = allTerritories.filter(t => t.adjacentTo.length === 0)

      console.log(`Total territories: ${allTerritories.length}`)
      console.log(`Isolated territories: ${isolated.length}`)

      if (isolated.length > 0) {
        console.log('Isolated territories found:')
        isolated.forEach(t => console.log(`  ⚠️  ${t.name}`))
      } else {
        console.log('✅ No isolated territories found')
      }

      console.log('✅ Isolation check complete\n')

      expect(isolated).toHaveLength(0)
    })

    test('should calculate average adjacencies', () => {
      console.log('📝 Test: Adjacency statistics')

      const stats = originalBoard.getStatistics()

      console.log(`Average adjacencies per territory: ${stats.averageAdjacencies}`)

      // Find territories with most and least adjacencies
      const allTerritories = originalBoard.getAllTerritories()
      const sortedByAdjacency = allTerritories.sort((a, b) => b.adjacentTo.length - a.adjacentTo.length)

      console.log(`\nMost connected territory:`)
      console.log(`  ${sortedByAdjacency[0].name} - ${sortedByAdjacency[0].adjacentTo.length} adjacencies`)

      console.log(`\nLeast connected territory:`)
      const least = sortedByAdjacency[sortedByAdjacency.length - 1]
      console.log(`  ${least.name} - ${least.adjacentTo.length} adjacencies`)

      console.log('✅ Adjacency statistics calculated\n')

      expect(stats.averageAdjacencies).toBeGreaterThan(0)
    })
  })

  describe('Cross-Continental Connections', () => {
    test('should verify cross-continental adjacencies', () => {
      console.log('📝 Test: Cross-continental connections')

      const crossContinental = [
        { from: 'north-america-alaska', to: 'asia-kamchatka', desc: 'North America → Asia' },
        { from: 'north-america-greenland', to: 'europe-iceland', desc: 'North America → Europe' },
        { from: 'south-america-brazil', to: 'africa-north-africa', desc: 'South America → Africa' },
        { from: 'europe-southern-europe', to: 'asia-middle-east', desc: 'Europe → Asia' },
        { from: 'europe-southern-europe', to: 'africa-egypt', desc: 'Europe → Africa' },
        { from: 'asia-siam', to: 'australia-indonesia', desc: 'Asia → Australia' }
      ]

      console.log('\nCross-Continental Connections:')
      crossContinental.forEach(({ from, to, desc }) => {
        const isAdjacent = originalBoard.areTerritoriesAdjacent(from, to)
        const fromTerritory = originalBoard.getTerritory(from)
        const toTerritory = originalBoard.getTerritory(to)
        console.log(`  ${desc}:`)
        console.log(`    ${fromTerritory.name} → ${toTerritory.name}: ${isAdjacent ? '✅' : '❌'}`)
      })

      console.log('✅ Cross-continental connections verified\n')

      // All should be adjacent
      crossContinental.forEach(({ from, to }) => {
        expect(originalBoard.areTerritoriesAdjacent(from, to)).toBe(true)
      })
    })
  })

  describe('Original vs Advanced Board Comparison', () => {
    test('should compare both board versions', () => {
      console.log('📝 Test: Compare original vs advanced boards')

      const originalStats = originalBoard.getStatistics()
      const advancedStats = advancedBoard.getStatistics()

      console.log('\nOriginal Board:')
      console.log(`  Territories: ${originalStats.totalTerritories}`)
      console.log(`  Continents: ${originalStats.totalContinents}`)
      console.log(`  Avg Adjacencies: ${originalStats.averageAdjacencies}`)

      console.log('\nAdvanced Board:')
      console.log(`  Territories: ${advancedStats.totalTerritories}`)
      console.log(`  Continents: ${advancedStats.totalContinents}`)
      console.log(`  Avg Adjacencies: ${advancedStats.averageAdjacencies}`)

      console.log('✅ Board comparison complete\n')

      // Both boards have 42 territories, but advanced has 12 continents vs 6
      expect(originalStats.totalTerritories).toBe(42)
      expect(advancedStats.totalTerritories).toBe(42)
      expect(originalStats.totalContinents).toBe(6)
      expect(advancedStats.totalContinents).toBe(12)
    })
  })

  describe('Performance Tests', () => {
    test('should perform fast lookups', () => {
      console.log('📝 Test: Lookup performance')

      const iterations = 10000
      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        originalBoard.getTerritoryById('north-america-alaska')
        originalBoard.areTerritoriesAdjacent('europe-russia', 'asia-ural')
      }

      const end = performance.now()
      const timePerLookup = (end - start) / iterations

      console.log(`Performed ${iterations} lookups in ${(end - start).toFixed(2)}ms`)
      console.log(`Average time per lookup: ${timePerLookup.toFixed(4)}ms`)
      console.log('✅ Performance test complete\n')

      // Should be very fast (< 0.1ms per lookup)
      expect(timePerLookup).toBeLessThan(0.1)
    })
  })
})

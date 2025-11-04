import { readFileSync } from 'fs'
import { join } from 'path'
import { Board, BoardSchema, Territory, Continent } from './schemas'

/**
 * Board topology loader and utilities
 * Provides fast lookups for territory data, adjacencies, and movement validation
 */
export class BoardTopology {
  private board: Board
  private territoryMap: Map<string, Territory>
  private continentMap: Map<string, Continent>
  private adjacencyCache: Map<string, Set<string>>

  constructor(board: Board) {
    this.board = board
    this.territoryMap = new Map()
    this.continentMap = new Map()
    this.adjacencyCache = new Map()

    this.initialize()
  }

  /**
   * Initialize internal data structures for fast lookups
   */
  private initialize(): void {
    // Build territory map
    for (const territory of this.board.territories) {
      this.territoryMap.set(territory.id, territory)

      // Build adjacency cache
      this.adjacencyCache.set(territory.id, new Set(territory.adjacentTo))
    }

    // Build continent map
    for (const continent of this.board.continents) {
      this.continentMap.set(continent.id, continent)
    }

    // Validate adjacencies are bidirectional
    this.validateBidirectionalAdjacencies()
  }

  /**
   * Validate that all adjacencies are bidirectional
   * (if A is adjacent to B, then B must be adjacent to A)
   */
  private validateBidirectionalAdjacencies(): void {
    for (const territory of this.board.territories) {
      for (const adjacentId of territory.adjacentTo) {
        const adjacent = this.territoryMap.get(adjacentId)
        if (!adjacent) {
          throw new Error(`Territory ${territory.id} references non-existent adjacent territory ${adjacentId}`)
        }

        if (!adjacent.adjacentTo.includes(territory.id)) {
          console.warn(
            `Warning: Adjacency not bidirectional: ${territory.id} -> ${adjacentId}, ` +
            `but ${adjacentId} does not list ${territory.id} as adjacent`
          )
        }
      }
    }
  }

  /**
   * Get territory by ID
   */
  getTerritoryById(id: string): Territory | undefined {
    return this.territoryMap.get(id)
  }

  /**
   * Get territory by ID (throws if not found)
   */
  getTerritory(id: string): Territory {
    const territory = this.territoryMap.get(id)
    if (!territory) {
      throw new Error(`Territory not found: ${id}`)
    }
    return territory
  }

  /**
   * Get continent by ID
   */
  getContinentById(id: string): Continent | undefined {
    return this.continentMap.get(id)
  }

  /**
   * Get continent by ID (throws if not found)
   */
  getContinent(id: string): Continent {
    const continent = this.continentMap.get(id)
    if (!continent) {
      throw new Error(`Continent not found: ${id}`)
    }
    return continent
  }

  /**
   * Get all territories in a continent
   */
  getContinentTerritories(continentId: string): Territory[] {
    const continent = this.getContinent(continentId)
    return continent.territories.map(id => this.getTerritory(id))
  }


  /**
   * Check if two territories are adjacent (share a border)
   */
  areTerritoriesAdjacent(territoryId1: string, territoryId2: string): boolean {
    const adjacencies = this.adjacencyCache.get(territoryId1)
    if (!adjacencies) {
      return false
    }
    return adjacencies.has(territoryId2)
  }

  /**
   * Validate if movement from one territory to another is legal
   * (territories must be adjacent)
   */
  validateMovement(fromId: string, toId: string): boolean {
    // Territories must exist
    const from = this.getTerritoryById(fromId)
    const to = this.getTerritoryById(toId)

    if (!from || !to) {
      return false
    }

    // Must be adjacent
    return this.areTerritoriesAdjacent(fromId, toId)
  }

  /**
   * Get all territories adjacent to a given territory
   */
  getAdjacentTerritories(territoryId: string): Territory[] {
    const territory = this.getTerritory(territoryId)
    return territory.adjacentTo.map(id => this.getTerritory(id))
  }


  /**
   * Get all territories
   */
  getAllTerritories(): Territory[] {
    return this.board.territories
  }

  /**
   * Get all continents
   */
  getAllContinents(): Continent[] {
    return this.board.continents
  }

  /**
   * Get board metadata
   */
  getMetadata() {
    return this.board.metadata
  }

  /**
   * Get board version
   */
  getVersion(): 'original' | 'advanced' {
    return this.board.version
  }


  /**
   * Find territories by name (case-insensitive partial match)
   */
  findTerritoriesByName(searchTerm: string): Territory[] {
    const lowerSearch = searchTerm.toLowerCase()
    return this.board.territories.filter(t =>
      t.name.toLowerCase().includes(lowerSearch)
    )
  }

  /**
   * Get board statistics
   */
  getStatistics() {
    const continentStats = this.board.continents.map(continent => ({
      id: continent.id,
      name: continent.name,
      territoryCount: continent.territories.length,
      bonus: continent.bonus
    }))

    return {
      version: this.board.version,
      totalTerritories: this.board.territories.length,
      totalContinents: this.board.continents.length,
      continentStats,
      averageAdjacencies: this.calculateAverageAdjacencies()
    }
  }

  /**
   * Calculate average number of adjacencies per territory
   */
  private calculateAverageAdjacencies(): number {
    const total = this.board.territories.reduce(
      (sum, t) => sum + t.adjacentTo.length,
      0
    )
    return Math.round((total / this.board.territories.length) * 10) / 10
  }

  /**
   * Verify board integrity (no isolated territories)
   */
  verifyIntegrity(): { isValid: boolean; issues: string[] } {
    const issues: string[] = []

    // Check for isolated territories (no adjacencies)
    const isolated = this.board.territories.filter(t => t.adjacentTo.length === 0)
    if (isolated.length > 0) {
      issues.push(`Found ${isolated.length} isolated territories: ${isolated.map(t => t.name).join(', ')}`)
    }

    // Check all territory references are valid
    for (const territory of this.board.territories) {
      for (const adjacentId of territory.adjacentTo) {
        if (!this.territoryMap.has(adjacentId)) {
          issues.push(`Territory ${territory.id} references non-existent territory ${adjacentId}`)
        }
      }
    }

    // Check continent territory references are valid
    for (const continent of this.board.continents) {
      for (const territoryId of continent.territories) {
        const territory = this.territoryMap.get(territoryId)
        if (!territory) {
          issues.push(`Continent ${continent.id} references non-existent territory ${territoryId}`)
        } else if (territory.continent !== continent.id) {
          issues.push(
            `Territory ${territoryId} continent mismatch: ` +
            `in continent list for ${continent.id} but territory says ${territory.continent}`
          )
        }
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    }
  }
}

/**
 * Load board topology from JSON file
 */
export function loadBoardTopology(version: 'original' | 'advanced' = 'original'): BoardTopology {
  const boardPath = join(process.cwd(), 'assets', 'board', `${version}-topology.json`)

  try {
    const boardData = JSON.parse(readFileSync(boardPath, 'utf-8'))
    const board = BoardSchema.parse(boardData)

    return new BoardTopology(board)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load board topology from ${boardPath}: ${error.message}`)
    }
    throw error
  }
}

/**
 * Singleton instances for cached board topologies
 */
let cachedOriginalBoard: BoardTopology | null = null
let cachedAdvancedBoard: BoardTopology | null = null

/**
 * Get cached board topology (loads on first access)
 */
export function getBoardTopology(version: 'original' | 'advanced' = 'original'): BoardTopology {
  if (version === 'original') {
    if (!cachedOriginalBoard) {
      cachedOriginalBoard = loadBoardTopology('original')
    }
    return cachedOriginalBoard
  } else {
    if (!cachedAdvancedBoard) {
      cachedAdvancedBoard = loadBoardTopology('advanced')
    }
    return cachedAdvancedBoard
  }
}

/**
 * Clear cached board topologies (useful for testing)
 */
export function clearBoardCache(): void {
  cachedOriginalBoard = null
  cachedAdvancedBoard = null
}

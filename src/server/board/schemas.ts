import { z } from 'zod'

/**
 * Schema for a territory on the game board
 */
export const TerritorySchema = z.object({
  id: z.string(), // Unique identifier (e.g., "north-america-alaska")
  name: z.string(), // Display name (e.g., "Alaska")
  continent: z.string(), // Continent ID
  adjacentTo: z.array(z.string()), // Array of territory IDs this territory borders
  population: z.number().optional(), // Population value (if any) - used for troop calculation from cities
  coordinates: z.object({ // Approximate center coordinates for visual rendering
    x: z.number(),
    y: z.number()
  }).optional()
})

export type Territory = z.infer<typeof TerritorySchema>

/**
 * Schema for a continent on the game board
 */
export const ContinentSchema = z.object({
  id: z.string(), // Unique identifier (e.g., "north-america")
  name: z.string(), // Display name (e.g., "North America")
  bonus: z.number(), // Troop recruitment bonus for controlling all territories
  color: z.string(), // Hex color code for visual display
  territories: z.array(z.string()) // Array of territory IDs in this continent
})

export type Continent = z.infer<typeof ContinentSchema>

/**
 * Schema for the complete game board
 */
export const BoardSchema = z.object({
  version: z.enum(['original', 'advanced']), // Board version
  territories: z.array(TerritorySchema), // All territories on the board
  continents: z.array(ContinentSchema), // All continents on the board
  metadata: z.object({
    description: z.string(),
    totalTerritories: z.number(),
    lastUpdated: z.string()
  })
})

export type Board = z.infer<typeof BoardSchema>

/**
 * Adjacency validation result
 */
export const AdjacencyResultSchema = z.object({
  isAdjacent: z.boolean(),
  fromTerritory: z.string(),
  toTerritory: z.string()
})

export type AdjacencyResult = z.infer<typeof AdjacencyResultSchema>

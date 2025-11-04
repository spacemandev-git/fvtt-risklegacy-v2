#!/usr/bin/env bun

import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'
import {
  PackSchema,
  AssetCollectionSchema,
  safeValidateCard,
  type Pack,
  type AssetCollection,
} from '../src/server/assets/schemas'

/**
 * Build-Time Asset Converter
 *
 * Converts YAML assets from assets/unlocks/ to JSON files in src/server/assets/data/
 * - Validates all cards with Zod schemas
 * - Organizes by pack and card type
 * - Preserves quantities for duplicate cards
 * - Skips .js files and non-asset files
 */

const ASSETS_DIR = path.join(process.cwd(), 'assets', 'unlocks')
const OUTPUT_DIR = path.join(process.cwd(), 'src', 'server', 'assets', 'data')

// Valid card types that we want to process
const VALID_CARD_TYPES = [
  'factions',
  'powers',
  'territories',
  'scars',
  'stickersheet',
  'missions',
  'events',
]

// Files/folders to skip
const SKIP_PATTERNS = [
  'init.js',
  'macros',
  '.DS_Store',
  'unlocks.yaml', // Pack metadata, not card data
]

interface ConversionStats {
  totalPacks: number
  totalCards: number
  cardsByType: Record<string, number>
  cardsByPack: Record<string, number>
  errors: string[]
  warnings: string[]
}

/**
 * Check if a path should be skipped
 */
function shouldSkip(filename: string): boolean {
  return SKIP_PATTERNS.some((pattern) => filename.includes(pattern))
}

/**
 * Parse a YAML file containing multiple documents (separated by ---)
 */
function parseYamlFile(filePath: string): any[] {
  const content = fs.readFileSync(filePath, 'utf8')

  // Parse all documents in the file
  const documents = yaml.loadAll(content)

  // Filter out null/undefined documents
  return documents.filter((doc) => doc !== null && doc !== undefined)
}

/**
 * Process a single card file (cards.yaml)
 */
function processCardFile(
  filePath: string,
  cardType: string,
  packName: string,
  stats: ConversionStats
): any[] {
  console.log(`  Processing ${cardType}...`)

  const cards: any[] = []

  try {
    const documents = parseYamlFile(filePath)

    for (const doc of documents) {
      // Validate with Zod schema
      const result = safeValidateCard(cardType, doc, filePath)

      if (result.success) {
        // Expand duplicates based on qty field
        const qty = result.data.qty || 1
        for (let i = 0; i < qty; i++) {
          cards.push(result.data)
        }

        stats.totalCards += qty
        stats.cardsByType[cardType] = (stats.cardsByType[cardType] || 0) + qty
        stats.cardsByPack[packName] = (stats.cardsByPack[packName] || 0) + qty
      } else {
        stats.errors.push(result.error)
        console.error(`    ❌ ${result.error}`)
      }
    }

    console.log(`    ✅ Loaded ${cards.length} ${cardType}`)
  } catch (error) {
    const errorMsg = `Failed to process ${filePath}: ${error}`
    stats.errors.push(errorMsg)
    console.error(`    ❌ ${errorMsg}`)
  }

  return cards
}

/**
 * Process a single pack directory
 */
function processPack(packPath: string, packName: string, stats: ConversionStats): Pack {
  console.log(`\n📦 Processing pack: ${packName}`)

  const pack: Pack = {
    name: packName,
    factions: [],
    powers: [],
    territories: [],
    scars: [],
    stickers: [],
    missions: [],
    events: [],
  }

  // Read all subdirectories (card types)
  const entries = fs.readdirSync(packPath, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (shouldSkip(entry.name)) continue

    const cardType = entry.name
    if (!VALID_CARD_TYPES.includes(cardType)) {
      stats.warnings.push(`Unknown card type in ${packName}: ${cardType}`)
      continue
    }

    // Look for cards.yaml in this directory
    const cardFilePath = path.join(packPath, cardType, 'cards.yaml')

    if (!fs.existsSync(cardFilePath)) {
      // It's okay if cards.yaml doesn't exist
      continue
    }

    // Process the card file
    const cards = processCardFile(cardFilePath, cardType, packName, stats)

    // Add to pack based on type
    const packKey = cardType === 'stickersheet' ? 'stickers' : cardType
    ;(pack as any)[packKey] = cards
  }

  stats.totalPacks++
  return pack
}

/**
 * Main conversion function
 */
function convertAssets(): ConversionStats {
  console.log('🚀 Starting asset conversion...\n')
  console.log(`Source: ${ASSETS_DIR}`)
  console.log(`Output: ${OUTPUT_DIR}\n`)

  const stats: ConversionStats = {
    totalPacks: 0,
    totalCards: 0,
    cardsByType: {},
    cardsByPack: {},
    errors: [],
    warnings: [],
  }

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  // Get all pack directories
  const packDirs = fs.readdirSync(ASSETS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => !shouldSkip(entry.name))

  const packs: Record<string, Pack> = {}

  // Process each pack
  for (const packDir of packDirs) {
    const packPath = path.join(ASSETS_DIR, packDir.name)
    const pack = processPack(packPath, packDir.name, stats)
    packs[packDir.name] = pack

    // Write individual pack file
    const packOutputPath = path.join(OUTPUT_DIR, `${packDir.name}.json`)
    fs.writeFileSync(packOutputPath, JSON.stringify(pack, null, 2), 'utf8')
    console.log(`  ✅ Written to ${packOutputPath}`)
  }

  // Create master asset collection
  const assetCollection: AssetCollection = {
    version: '1.0.0',
    packs,
    metadata: {
      buildTime: new Date().toISOString(),
      sourceDirectory: ASSETS_DIR,
    },
  }

  // Validate entire collection
  try {
    AssetCollectionSchema.parse(assetCollection)
    console.log('\n✅ Asset collection validated successfully')
  } catch (error) {
    stats.errors.push(`Asset collection validation failed: ${error}`)
    console.error('\n❌ Asset collection validation failed:', error)
  }

  // Write master collection file
  const collectionPath = path.join(OUTPUT_DIR, 'all-assets.json')
  fs.writeFileSync(
    collectionPath,
    JSON.stringify(assetCollection, null, 2),
    'utf8'
  )
  console.log(`\n✅ Master collection written to ${collectionPath}`)

  return stats
}

/**
 * Print summary statistics
 */
function printStats(stats: ConversionStats): void {
  console.log('\n' + '='.repeat(60))
  console.log('📊 CONVERSION SUMMARY')
  console.log('='.repeat(60))

  console.log(`\n✅ Total Packs: ${stats.totalPacks}`)
  console.log(`✅ Total Cards: ${stats.totalCards}`)

  console.log('\n📦 Cards by Pack:')
  for (const [pack, count] of Object.entries(stats.cardsByPack)) {
    console.log(`  ${pack}: ${count} cards`)
  }

  console.log('\n🃏 Cards by Type:')
  for (const [type, count] of Object.entries(stats.cardsByType)) {
    console.log(`  ${type}: ${count} cards`)
  }

  if (stats.warnings.length > 0) {
    console.log(`\n⚠️  Warnings (${stats.warnings.length}):`)
    stats.warnings.forEach((warning) => console.log(`  - ${warning}`))
  }

  if (stats.errors.length > 0) {
    console.log(`\n❌ Errors (${stats.errors.length}):`)
    stats.errors.forEach((error) => console.log(`  - ${error}`))
    console.log('\n⚠️  Some assets failed to convert')
    process.exit(1)
  } else {
    console.log('\n✨ All assets converted successfully!')
  }

  console.log('='.repeat(60) + '\n')
}

// ============================================================================
// Main execution
// ============================================================================

try {
  const stats = convertAssets()
  printStats(stats)
} catch (error) {
  console.error('❌ Fatal error during asset conversion:', error)
  process.exit(1)
}

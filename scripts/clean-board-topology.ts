#!/usr/bin/env bun
/**
 * Script to remove incorrect fields from board topology JSON files
 * Removes: hasRedStar, startingZone, totalRedStars
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const boardFiles = [
  'assets/board/original-topology.json',
  'assets/board/advanced-topology.json'
]

for (const file of boardFiles) {
  const filePath = join(process.cwd(), file)
  console.log(`\nCleaning ${file}...`)

  try {
    // Read the file
    const data = JSON.parse(readFileSync(filePath, 'utf-8'))

    // Remove totalRedStars from root
    delete data.totalRedStars

    // Remove hasRedStar and startingZone from all territories
    if (data.territories && Array.isArray(data.territories)) {
      data.territories = data.territories.map((territory: any) => {
        const { hasRedStar, startingZone, ...cleanTerritory } = territory
        return cleanTerritory
      })
    }

    // Write back
    writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8')

    console.log(`✅ Cleaned ${file}`)
    console.log(`   - Removed totalRedStars from root`)
    console.log(`   - Removed hasRedStar and startingZone from ${data.territories.length} territories`)
  } catch (error) {
    console.error(`❌ Error cleaning ${file}:`, error)
  }
}

console.log('\n✅ All files cleaned')

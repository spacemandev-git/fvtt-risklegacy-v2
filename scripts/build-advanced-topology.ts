#!/usr/bin/env bun
/**
 * Build the advanced board topology with 12 continents
 * Based on careful examination of assets/board/advanced.jpg
 */

const advancedTopology = {
  "version": "advanced",
  "metadata": {
    "description": "Risk Legacy Advanced Board - 12 continents with different topology",
    "totalTerritories": 42,
    "lastUpdated": "2025-11-04"
  },
  "continents": [
    {
      "id": "western-north-america",
      "name": "Western North America",
      "bonus": 3,
      "color": "#FFD700",
      "territories": [
        "western-north-america-alaska",
        "western-north-america-western-united-states",
        "western-north-america-eastern-united-states"
      ]
    },
    {
      "id": "central-north-america",
      "name": "Central North America",
      "bonus": 4,
      "color": "#90EE90",
      "territories": [
        "central-north-america-northwest-territory",
        "central-north-america-alberta",
        "central-north-america-ontario",
        "central-north-america-eastern-canada"
      ]
    },
    {
      "id": "arctic",
      "name": "Arctic",
      "bonus": 3,
      "color": "#20B2AA",
      "territories": [
        "arctic-greenland",
        "arctic-iceland",
        "arctic-scandinavia"
      ]
    },
    {
      "id": "europe",
      "name": "Europe",
      "bonus": 5,
      "color": "#B0C4DE",
      "territories": [
        "europe-great-britain",
        "europe-northern-europe",
        "europe-western-europe",
        "europe-southern-europe",
        "europe-russia"
      ]
    },
    {
      "id": "central-america",
      "name": "Central America",
      "bonus": 1,
      "color": "#FF8C00",
      "territories": [
        "central-america-central-america"
      ]
    },
    {
      "id": "south-america",
      "name": "South America",
      "bonus": 2,
      "color": "#FF8C00",
      "territories": [
        "south-america-venezuela",
        "south-america-peru",
        "south-america-brazil",
        "south-america-argentina"
      ]
    },
    {
      "id": "africa",
      "name": "Africa",
      "bonus": 3,
      "color": "#8B4513",
      "territories": [
        "africa-north-africa",
        "africa-egypt",
        "africa-east-africa",
        "africa-congo",
        "africa-south-africa",
        "africa-madagascar"
      ]
    },
    {
      "id": "northern-asia",
      "name": "Northern Asia",
      "bonus": 4,
      "color": "#98FB98",
      "territories": [
        "northern-asia-ural",
        "northern-asia-siberia",
        "northern-asia-yakutsk",
        "northern-asia-kamchatka"
      ]
    },
    {
      "id": "middle-east",
      "name": "Middle East",
      "bonus": 2,
      "color": "#90EE90",
      "territories": [
        "middle-east-middle-east",
        "middle-east-afghanistan"
      ]
    },
    {
      "id": "india",
      "name": "India",
      "bonus": 1,
      "color": "#90EE90",
      "territories": [
        "india-india"
      ]
    },
    {
      "id": "central-asia",
      "name": "Central Asia",
      "bonus": 3,
      "color": "#FF69B4",
      "territories": [
        "central-asia-mongolia",
        "central-asia-china",
        "central-asia-irkutsk"
      ]
    },
    {
      "id": "australia",
      "name": "Australia",
      "bonus": 5,
      "color": "#9370DB",
      "territories": [
        "australia-indonesia",
        "australia-new-guinea",
        "australia-western-australia",
        "australia-eastern-australia",
        "australia-siam"
      ]
    }
  ],
  "territories": [
    // Western North America
    {
      "id": "western-north-america-alaska",
      "name": "Alaska",
      "continent": "western-north-america",
      "adjacentTo": [
        "central-north-america-northwest-territory",
        "central-north-america-alberta",
        "northern-asia-kamchatka"
      ]
    },
    {
      "id": "western-north-america-western-united-states",
      "name": "Western United States",
      "continent": "western-north-america",
      "adjacentTo": [
        "central-north-america-alberta",
        "central-north-america-ontario",
        "western-north-america-eastern-united-states",
        "central-america-central-america"
      ]
    },
    {
      "id": "western-north-america-eastern-united-states",
      "name": "Eastern United States",
      "continent": "western-north-america",
      "adjacentTo": [
        "central-north-america-ontario",
        "central-north-america-eastern-canada",
        "western-north-america-western-united-states",
        "central-america-central-america"
      ]
    },

    // Central North America
    {
      "id": "central-north-america-northwest-territory",
      "name": "Northwest Territory",
      "continent": "central-north-america",
      "adjacentTo": [
        "western-north-america-alaska",
        "central-north-america-alberta",
        "central-north-america-ontario",
        "arctic-greenland"
      ]
    },
    {
      "id": "central-north-america-alberta",
      "name": "Alberta",
      "continent": "central-north-america",
      "adjacentTo": [
        "western-north-america-alaska",
        "central-north-america-northwest-territory",
        "central-north-america-ontario",
        "western-north-america-western-united-states"
      ]
    },
    {
      "id": "central-north-america-ontario",
      "name": "Ontario",
      "continent": "central-north-america",
      "adjacentTo": [
        "central-north-america-northwest-territory",
        "central-north-america-alberta",
        "central-north-america-eastern-canada",
        "arctic-greenland",
        "western-north-america-western-united-states",
        "western-north-america-eastern-united-states"
      ]
    },
    {
      "id": "central-north-america-eastern-canada",
      "name": "Eastern Canada",
      "continent": "central-north-america",
      "adjacentTo": [
        "central-north-america-ontario",
        "arctic-greenland",
        "western-north-america-eastern-united-states"
      ]
    },

    // Arctic
    {
      "id": "arctic-greenland",
      "name": "Greenland",
      "continent": "arctic",
      "adjacentTo": [
        "central-north-america-northwest-territory",
        "central-north-america-ontario",
        "central-north-america-eastern-canada",
        "arctic-iceland"
      ]
    },
    {
      "id": "arctic-iceland",
      "name": "Iceland",
      "continent": "arctic",
      "adjacentTo": [
        "arctic-greenland",
        "europe-great-britain",
        "arctic-scandinavia"
      ]
    },
    {
      "id": "arctic-scandinavia",
      "name": "Scandinavia",
      "continent": "arctic",
      "adjacentTo": [
        "arctic-iceland",
        "europe-great-britain",
        "europe-northern-europe",
        "europe-russia"
      ]
    },

    // Europe
    {
      "id": "europe-great-britain",
      "name": "Great Britain",
      "continent": "europe",
      "adjacentTo": [
        "arctic-iceland",
        "arctic-scandinavia",
        "europe-northern-europe",
        "europe-western-europe"
      ]
    },
    {
      "id": "europe-northern-europe",
      "name": "Northern Europe",
      "continent": "europe",
      "adjacentTo": [
        "europe-great-britain",
        "arctic-scandinavia",
        "europe-western-europe",
        "europe-southern-europe",
        "europe-russia"
      ]
    },
    {
      "id": "europe-western-europe",
      "name": "Western Europe",
      "continent": "europe",
      "adjacentTo": [
        "europe-great-britain",
        "europe-northern-europe",
        "europe-southern-europe",
        "africa-north-africa"
      ]
    },
    {
      "id": "europe-southern-europe",
      "name": "Southern Europe",
      "continent": "europe",
      "adjacentTo": [
        "europe-northern-europe",
        "europe-western-europe",
        "europe-russia",
        "africa-north-africa",
        "africa-egypt",
        "middle-east-middle-east"
      ]
    },
    {
      "id": "europe-russia",
      "name": "Russia",
      "continent": "europe",
      "adjacentTo": [
        "arctic-scandinavia",
        "europe-northern-europe",
        "europe-southern-europe",
        "northern-asia-ural",
        "middle-east-afghanistan",
        "middle-east-middle-east"
      ]
    },

    // Central America
    {
      "id": "central-america-central-america",
      "name": "Central America",
      "continent": "central-america",
      "adjacentTo": [
        "western-north-america-western-united-states",
        "western-north-america-eastern-united-states",
        "south-america-venezuela"
      ]
    },

    // South America
    {
      "id": "south-america-venezuela",
      "name": "Venezuela",
      "continent": "south-america",
      "adjacentTo": [
        "central-america-central-america",
        "south-america-peru",
        "south-america-brazil"
      ]
    },
    {
      "id": "south-america-peru",
      "name": "Peru",
      "continent": "south-america",
      "adjacentTo": [
        "south-america-venezuela",
        "south-america-brazil",
        "south-america-argentina"
      ]
    },
    {
      "id": "south-america-brazil",
      "name": "Brazil",
      "continent": "south-america",
      "adjacentTo": [
        "south-america-venezuela",
        "south-america-peru",
        "south-america-argentina",
        "africa-north-africa"
      ]
    },
    {
      "id": "south-america-argentina",
      "name": "Argentina",
      "continent": "south-america",
      "adjacentTo": [
        "south-america-peru",
        "south-america-brazil"
      ]
    },

    // Africa
    {
      "id": "africa-north-africa",
      "name": "North Africa",
      "continent": "africa",
      "adjacentTo": [
        "south-america-brazil",
        "europe-western-europe",
        "europe-southern-europe",
        "africa-egypt",
        "africa-east-africa",
        "africa-congo"
      ]
    },
    {
      "id": "africa-egypt",
      "name": "Egypt",
      "continent": "africa",
      "adjacentTo": [
        "europe-southern-europe",
        "africa-north-africa",
        "africa-east-africa",
        "middle-east-middle-east"
      ]
    },
    {
      "id": "africa-east-africa",
      "name": "East Africa",
      "continent": "africa",
      "adjacentTo": [
        "africa-north-africa",
        "africa-egypt",
        "africa-congo",
        "africa-south-africa",
        "africa-madagascar",
        "middle-east-middle-east"
      ]
    },
    {
      "id": "africa-congo",
      "name": "Congo",
      "continent": "africa",
      "adjacentTo": [
        "africa-north-africa",
        "africa-east-africa",
        "africa-south-africa"
      ]
    },
    {
      "id": "africa-south-africa",
      "name": "South Africa",
      "continent": "africa",
      "adjacentTo": [
        "africa-congo",
        "africa-east-africa",
        "africa-madagascar"
      ]
    },
    {
      "id": "africa-madagascar",
      "name": "Madagascar",
      "continent": "africa",
      "adjacentTo": [
        "africa-east-africa",
        "africa-south-africa"
      ]
    },

    // Northern Asia
    {
      "id": "northern-asia-ural",
      "name": "Ural",
      "continent": "northern-asia",
      "adjacentTo": [
        "europe-russia",
        "northern-asia-siberia",
        "middle-east-afghanistan",
        "central-asia-china"
      ]
    },
    {
      "id": "northern-asia-siberia",
      "name": "Siberia",
      "continent": "northern-asia",
      "adjacentTo": [
        "northern-asia-ural",
        "northern-asia-yakutsk",
        "central-asia-irkutsk",
        "central-asia-mongolia",
        "central-asia-china"
      ]
    },
    {
      "id": "northern-asia-yakutsk",
      "name": "Yakutsk",
      "continent": "northern-asia",
      "adjacentTo": [
        "northern-asia-siberia",
        "central-asia-irkutsk",
        "northern-asia-kamchatka"
      ]
    },
    {
      "id": "northern-asia-kamchatka",
      "name": "Kamchatka",
      "continent": "northern-asia",
      "adjacentTo": [
        "western-north-america-alaska",
        "northern-asia-yakutsk",
        "central-asia-irkutsk",
        "central-asia-mongolia"
      ]
    },

    // Middle East
    {
      "id": "middle-east-middle-east",
      "name": "Middle East",
      "continent": "middle-east",
      "adjacentTo": [
        "europe-southern-europe",
        "europe-russia",
        "africa-egypt",
        "africa-east-africa",
        "middle-east-afghanistan",
        "india-india"
      ]
    },
    {
      "id": "middle-east-afghanistan",
      "name": "Afghanistan",
      "continent": "middle-east",
      "adjacentTo": [
        "europe-russia",
        "northern-asia-ural",
        "central-asia-china",
        "middle-east-middle-east",
        "india-india"
      ]
    },

    // India
    {
      "id": "india-india",
      "name": "India",
      "continent": "india",
      "adjacentTo": [
        "middle-east-afghanistan",
        "central-asia-china",
        "middle-east-middle-east",
        "australia-siam"
      ]
    },

    // Central Asia
    {
      "id": "central-asia-irkutsk",
      "name": "Irkutsk",
      "continent": "central-asia",
      "adjacentTo": [
        "northern-asia-siberia",
        "northern-asia-yakutsk",
        "northern-asia-kamchatka",
        "central-asia-mongolia"
      ]
    },
    {
      "id": "central-asia-mongolia",
      "name": "Mongolia",
      "continent": "central-asia",
      "adjacentTo": [
        "northern-asia-siberia",
        "central-asia-irkutsk",
        "northern-asia-kamchatka",
        "central-asia-china"
      ]
    },
    {
      "id": "central-asia-china",
      "name": "China",
      "continent": "central-asia",
      "adjacentTo": [
        "northern-asia-ural",
        "northern-asia-siberia",
        "central-asia-mongolia",
        "middle-east-afghanistan",
        "india-india",
        "australia-siam"
      ]
    },

    // Australia
    {
      "id": "australia-siam",
      "name": "Siam",
      "continent": "australia",
      "adjacentTo": [
        "central-asia-china",
        "india-india",
        "australia-indonesia"
      ]
    },
    {
      "id": "australia-indonesia",
      "name": "Indonesia",
      "continent": "australia",
      "adjacentTo": [
        "australia-siam",
        "australia-new-guinea",
        "australia-western-australia"
      ]
    },
    {
      "id": "australia-new-guinea",
      "name": "New Guinea",
      "continent": "australia",
      "adjacentTo": [
        "australia-indonesia",
        "australia-western-australia",
        "australia-eastern-australia"
      ]
    },
    {
      "id": "australia-western-australia",
      "name": "Western Australia",
      "continent": "australia",
      "adjacentTo": [
        "australia-indonesia",
        "australia-new-guinea",
        "australia-eastern-australia"
      ]
    },
    {
      "id": "australia-eastern-australia",
      "name": "Eastern Australia",
      "continent": "australia",
      "adjacentTo": [
        "australia-new-guinea",
        "australia-western-australia"
      ]
    }
  ]
}

// Write to file
import { writeFileSync } from 'fs'
import { join } from 'path'

const filePath = join(process.cwd(), 'assets', 'board', 'advanced-topology.json')
writeFileSync(filePath, JSON.stringify(advancedTopology, null, 2) + '\n', 'utf-8')

console.log('✅ Created advanced-topology.json with 12 continents and 42 territories')

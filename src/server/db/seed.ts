/**
 * Database Seed Script
 *
 * Populates the database with sample data for development and testing.
 * Run with: bun run prisma:seed
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...\n')

  // Clean existing data
  console.log('🧹 Cleaning existing data...')
  await prisma.campaignGame.deleteMany()
  await prisma.permanentModification.deleteMany()
  await prisma.campaignUnlock.deleteMany()
  await prisma.campaignPlayer.deleteMany()
  await prisma.campaign.deleteMany()
  await prisma.user.deleteMany()
  console.log('✅ Cleaned existing data\n')

  // Create test users
  console.log('👤 Creating test users...')
  const passwordHash = await bcrypt.hash('password123', 10)

  const alice = await prisma.user.create({
    data: {
      username: 'alice',
      passwordHash,
    },
  })

  const bob = await prisma.user.create({
    data: {
      username: 'bob',
      passwordHash,
    },
  })

  const charlie = await prisma.user.create({
    data: {
      username: 'charlie',
      passwordHash,
    },
  })

  const diana = await prisma.user.create({
    data: {
      username: 'diana',
      passwordHash,
    },
  })

  console.log(`✅ Created 4 users: alice, bob, charlie, diana`)
  console.log(`   Password for all: password123\n`)

  // Create a sample campaign
  console.log('🎮 Creating sample campaign...')
  const campaign = await prisma.campaign.create({
    data: {
      name: 'Epic Risk Legacy Campaign',
      creatorId: alice.id,
      state: JSON.stringify({
        initialized: true,
        boardVersion: 'original',
        scarsApplied: [],
        stickersPlaced: [],
      }),
    },
  })
  console.log(`✅ Created campaign: "${campaign.name}"`)
  console.log(`   Campaign ID: ${campaign.id}\n`)

  // Add players to campaign
  console.log('👥 Adding players to campaign...')
  const alicePlayer = await prisma.campaignPlayer.create({
    data: {
      campaignId: campaign.id,
      userId: alice.id,
      faction: 'enclave-of-the-bear',
      stars: 2,
    },
  })

  const bobPlayer = await prisma.campaignPlayer.create({
    data: {
      campaignId: campaign.id,
      userId: bob.id,
      faction: 'imperial-balkania',
      stars: 1,
    },
  })

  const charliePlayer = await prisma.campaignPlayer.create({
    data: {
      campaignId: campaign.id,
      userId: charlie.id,
      faction: 'khan-industries',
      stars: 3,
    },
  })

  console.log(`✅ Added 3 players to campaign`)
  console.log(`   - alice (Enclave of the Bear) - 2 stars`)
  console.log(`   - bob (Imperial Balkania) - 1 star`)
  console.log(`   - charlie (Khan Industries) - 3 stars\n`)

  // Add campaign unlocks
  console.log('📦 Adding campaign unlocks...')
  const unlock1 = await prisma.campaignUnlock.create({
    data: {
      campaignId: campaign.id,
      packName: 'secondwin',
      unlockedBy: charliePlayer.userId,
    },
  })

  console.log(`✅ Unlocked pack: "secondwin"\n`)

  // Add permanent modifications
  console.log('🏙️ Adding permanent modifications...')
  const mod1 = await prisma.permanentModification.create({
    data: {
      campaignId: campaign.id,
      type: 'city',
      appliedBy: alice.id,
      gameNumber: 1,
      data: JSON.stringify({
        territoryId: 'north-america-eastern-united-states',
        cityName: 'New Alice City',
        type: 'minor',
      }),
    },
  })

  const mod2 = await prisma.permanentModification.create({
    data: {
      campaignId: campaign.id,
      type: 'scar',
      appliedBy: bob.id,
      gameNumber: 2,
      data: JSON.stringify({
        factionId: 'enclave-of-the-bear',
        scarName: 'Ammo Shortage',
        effect: 'Cannot roll more than 2 dice on attack',
      }),
    },
  })

  console.log(`✅ Added 2 permanent modifications`)
  console.log(`   - City: "New Alice City" in Eastern United States`)
  console.log(`   - Scar: "Ammo Shortage" on Enclave of the Bear\n`)

  // Add campaign games
  console.log('🎲 Adding campaign game history...')
  const game1 = await prisma.campaignGame.create({
    data: {
      campaignId: campaign.id,
      gameNumber: 1,
      winnerId: alice.id,
      completedAt: new Date('2024-01-15'),
      gameState: JSON.stringify({ finalTurnCount: 12 }),
    },
  })

  const game2 = await prisma.campaignGame.create({
    data: {
      campaignId: campaign.id,
      gameNumber: 2,
      winnerId: charlie.id,
      completedAt: new Date('2024-01-22'),
      gameState: JSON.stringify({ finalTurnCount: 15 }),
    },
  })

  console.log(`✅ Added 2 completed games`)
  console.log(`   - Game 1: Won by alice on 2024-01-15`)
  console.log(`   - Game 2: Won by charlie on 2024-01-22\n`)

  // Create a second campaign (empty, for testing)
  console.log('🎮 Creating empty campaign for testing...')
  const campaign2 = await prisma.campaign.create({
    data: {
      name: 'Fresh Campaign',
      creatorId: diana.id,
      state: JSON.stringify({ initialized: false }),
    },
  })

  await prisma.campaignPlayer.create({
    data: {
      campaignId: campaign2.id,
      userId: diana.id,
      faction: null, // Not chosen yet
      stars: 0,
    },
  })

  console.log(`✅ Created empty campaign: "${campaign2.name}"`)
  console.log(`   Creator: diana\n`)

  // Summary
  console.log('📊 Database seed complete!\n')
  console.log('Summary:')
  console.log(`  - Users: ${await prisma.user.count()}`)
  console.log(`  - Campaigns: ${await prisma.campaign.count()}`)
  console.log(`  - Campaign Players: ${await prisma.campaignPlayer.count()}`)
  console.log(`  - Campaign Unlocks: ${await prisma.campaignUnlock.count()}`)
  console.log(`  - Permanent Modifications: ${await prisma.permanentModification.count()}`)
  console.log(`  - Campaign Games: ${await prisma.campaignGame.count()}`)
  console.log('\n✨ Seed data ready for development and testing!\n')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

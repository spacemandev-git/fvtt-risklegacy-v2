/**
 * Database Integration Tests
 *
 * Tests Prisma Client, database schema, and all CRUD operations.
 * Module 1.3: Database Schema & Setup
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import bcrypt from 'bcrypt'
import {
  prisma,
  connectDatabase,
  disconnectDatabase,
  checkDatabaseHealth,
  cleanDatabase,
  withTransaction,
} from '../../src/server/db/client'

describe('Module 1.3: Database Schema & Setup', () => {
  beforeAll(async () => {
    console.log('\n=== Testing Module 1.3: Database Schema & Setup ===\n')
    await connectDatabase()
    await cleanDatabase()
  })

  afterAll(async () => {
    await cleanDatabase()
    await disconnectDatabase()
    console.log('\n=== Module 1.3 Tests Complete ===\n')
  })

  describe('Database Connection', () => {
    test('should connect to database successfully', async () => {
      console.log('📝 Test: Database connection')

      const isHealthy = await checkDatabaseHealth()

      console.log(`✅ Database health check: ${isHealthy ? 'PASSED' : 'FAILED'}\n`)
      expect(isHealthy).toBe(true)
    })

    test('should execute raw queries', async () => {
      console.log('📝 Test: Raw SQL query')

      const result = await prisma.$queryRaw<Array<{ result: number }>>`SELECT 1 as result`

      // Convert BigInt to number for SQLite compatibility
      const resultValue = typeof result[0].result === 'bigint'
        ? Number(result[0].result)
        : result[0].result

      console.log('Query result:', resultValue)
      console.log('✅ Raw query executed successfully\n')

      expect(result).toHaveLength(1)
      expect(resultValue).toBe(1)
    })
  })

  describe('User Model', () => {
    test('should create a user', async () => {
      console.log('📝 Test: Create user')

      const passwordHash = await bcrypt.hash('testpass123', 10)
      const user = await prisma.user.create({
        data: {
          username: 'testuser',
          passwordHash,
        },
      })

      console.log('Created user:', JSON.stringify({
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      }, null, 2))
      console.log('✅ User created successfully\n')

      expect(user.id).toBeDefined()
      expect(user.username).toBe('testuser')
      expect(user.passwordHash).toBeDefined()
      expect(user.createdAt).toBeInstanceOf(Date)
    })

    test('should find a user by username', async () => {
      console.log('📝 Test: Find user by username')

      const user = await prisma.user.findUnique({
        where: { username: 'testuser' },
      })

      console.log('Found user:', JSON.stringify({
        id: user?.id,
        username: user?.username,
      }, null, 2))
      console.log('✅ User found successfully\n')

      expect(user).toBeDefined()
      expect(user?.username).toBe('testuser')
    })

    test('should enforce unique username constraint', async () => {
      console.log('📝 Test: Unique username constraint')

      try {
        await prisma.user.create({
          data: {
            username: 'testuser', // Duplicate
            passwordHash: 'hash',
          },
        })
        expect(true).toBe(false) // Should not reach here
      } catch (error: any) {
        console.log('✅ Unique constraint enforced:', error.code)
        expect(error.code).toBe('P2002')
      }
      console.log()
    })

    test('should update a user', async () => {
      console.log('📝 Test: Update user')

      const user = await prisma.user.findUnique({
        where: { username: 'testuser' },
      })

      const newPasswordHash = await bcrypt.hash('newpassword', 10)
      const updated = await prisma.user.update({
        where: { id: user!.id },
        data: { passwordHash: newPasswordHash },
      })

      console.log('Updated user:', JSON.stringify({
        id: updated.id,
        username: updated.username,
        passwordChanged: updated.passwordHash !== user!.passwordHash,
      }, null, 2))
      console.log('✅ User updated successfully\n')

      expect(updated.passwordHash).not.toBe(user!.passwordHash)
    })

    test('should delete a user', async () => {
      console.log('📝 Test: Delete user')

      const user = await prisma.user.findUnique({
        where: { username: 'testuser' },
      })

      await prisma.user.delete({
        where: { id: user!.id },
      })

      const deleted = await prisma.user.findUnique({
        where: { username: 'testuser' },
      })

      console.log('User after deletion:', deleted === null ? 'NULL (deleted)' : 'Still exists')
      console.log('✅ User deleted successfully\n')

      expect(deleted).toBeNull()
    })
  })

  describe('Campaign Model', () => {
    let userId: string

    beforeAll(async () => {
      const user = await prisma.user.create({
        data: {
          username: 'campaignuser',
          passwordHash: await bcrypt.hash('pass', 10),
        },
      })
      userId = user.id
    })

    test('should create a campaign', async () => {
      console.log('📝 Test: Create campaign')

      const campaign = await prisma.campaign.create({
        data: {
          name: 'Test Campaign',
          creatorId: userId,
          state: JSON.stringify({ initialized: true }),
        },
      })

      console.log('Created campaign:', JSON.stringify({
        id: campaign.id,
        name: campaign.name,
        creatorId: campaign.creatorId,
        state: campaign.state,
      }, null, 2))
      console.log('✅ Campaign created successfully\n')

      expect(campaign.id).toBeDefined()
      expect(campaign.name).toBe('Test Campaign')
      expect(campaign.creatorId).toBe(userId)
    })

    test('should find campaign with creator relation', async () => {
      console.log('📝 Test: Find campaign with relations')

      const campaign = await prisma.campaign.findFirst({
        where: { name: 'Test Campaign' },
        include: { creator: true },
      })

      console.log('Campaign with creator:', JSON.stringify({
        id: campaign?.id,
        name: campaign?.name,
        creator: {
          id: campaign?.creator.id,
          username: campaign?.creator.username,
        },
      }, null, 2))
      console.log('✅ Campaign with relations loaded\n')

      expect(campaign).toBeDefined()
      expect(campaign?.creator.username).toBe('campaignuser')
    })

    test('should update campaign state', async () => {
      console.log('📝 Test: Update campaign state')

      const campaign = await prisma.campaign.findFirst({
        where: { name: 'Test Campaign' },
      })

      const newState = { initialized: true, gamesPlayed: 1 }
      const updated = await prisma.campaign.update({
        where: { id: campaign!.id },
        data: { state: JSON.stringify(newState) },
      })

      console.log('Updated campaign state:', JSON.stringify({
        id: updated.id,
        name: updated.name,
        state: JSON.parse(updated.state),
      }, null, 2))
      console.log('✅ Campaign state updated\n')

      expect(JSON.parse(updated.state).gamesPlayed).toBe(1)
    })
  })

  describe('Campaign Players & Relationships', () => {
    let campaignId: string
    let user1Id: string
    let user2Id: string

    beforeAll(async () => {
      const user1 = await prisma.user.create({
        data: {
          username: 'player1',
          passwordHash: await bcrypt.hash('pass', 10),
        },
      })

      const user2 = await prisma.user.create({
        data: {
          username: 'player2',
          passwordHash: await bcrypt.hash('pass', 10),
        },
      })

      const campaign = await prisma.campaign.create({
        data: {
          name: 'Multiplayer Campaign',
          creatorId: user1.id,
        },
      })

      user1Id = user1.id
      user2Id = user2.id
      campaignId = campaign.id
    })

    test('should add players to campaign', async () => {
      console.log('📝 Test: Add players to campaign')

      const player1 = await prisma.campaignPlayer.create({
        data: {
          campaignId,
          userId: user1Id,
          faction: 'enclave-of-the-bear',
          stars: 0,
        },
      })

      const player2 = await prisma.campaignPlayer.create({
        data: {
          campaignId,
          userId: user2Id,
          faction: 'imperial-balkania',
          stars: 2,
        },
      })

      console.log('Added players:', JSON.stringify([
        { userId: player1.userId, faction: player1.faction, stars: player1.stars },
        { userId: player2.userId, faction: player2.faction, stars: player2.stars },
      ], null, 2))
      console.log('✅ Players added to campaign\n')

      expect(player1.campaignId).toBe(campaignId)
      expect(player2.stars).toBe(2)
    })

    test('should enforce unique campaign-user constraint', async () => {
      console.log('📝 Test: Unique campaign-user constraint')

      try {
        await prisma.campaignPlayer.create({
          data: {
            campaignId,
            userId: user1Id, // Duplicate
            faction: 'khan-industries',
            stars: 0,
          },
        })
        expect(true).toBe(false)
      } catch (error: any) {
        console.log('✅ Unique constraint enforced:', error.code)
        expect(error.code).toBe('P2002')
      }
      console.log()
    })

    test('should load campaign with all players', async () => {
      console.log('📝 Test: Load campaign with players')

      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          players: {
            include: { user: true },
          },
        },
      })

      console.log('Campaign with players:', JSON.stringify({
        id: campaign?.id,
        name: campaign?.name,
        players: campaign?.players.map(p => ({
          username: p.user.username,
          faction: p.faction,
          stars: p.stars,
        })),
      }, null, 2))
      console.log('✅ Campaign loaded with all players\n')

      expect(campaign?.players).toHaveLength(2)
    })

    test('should update player stars', async () => {
      console.log('📝 Test: Update player stars')

      const player = await prisma.campaignPlayer.findUnique({
        where: {
          campaignId_userId: {
            campaignId,
            userId: user1Id,
          },
        },
      })

      const updated = await prisma.campaignPlayer.update({
        where: { id: player!.id },
        data: { stars: { increment: 1 } },
      })

      console.log('Updated player stars:', JSON.stringify({
        userId: updated.userId,
        faction: updated.faction,
        oldStars: 0,
        newStars: updated.stars,
      }, null, 2))
      console.log('✅ Player stars updated\n')

      expect(updated.stars).toBe(1)
    })
  })

  describe('Campaign Unlocks', () => {
    let campaignId: string
    let userId: string

    beforeAll(async () => {
      const user = await prisma.user.create({
        data: {
          username: 'unlockuser',
          passwordHash: await bcrypt.hash('pass', 10),
        },
      })

      const campaign = await prisma.campaign.create({
        data: {
          name: 'Unlock Campaign',
          creatorId: user.id,
        },
      })

      userId = user.id
      campaignId = campaign.id
    })

    test('should create campaign unlock', async () => {
      console.log('📝 Test: Create campaign unlock')

      const unlock = await prisma.campaignUnlock.create({
        data: {
          campaignId,
          packName: 'secondwin',
          unlockedBy: userId,
        },
      })

      console.log('Created unlock:', JSON.stringify({
        id: unlock.id,
        packName: unlock.packName,
        unlockedBy: unlock.unlockedBy,
        unlockedAt: unlock.unlockedAt,
      }, null, 2))
      console.log('✅ Campaign unlock created\n')

      expect(unlock.packName).toBe('secondwin')
    })

    test('should enforce unique campaign-pack constraint', async () => {
      console.log('📝 Test: Unique campaign-pack constraint')

      try {
        await prisma.campaignUnlock.create({
          data: {
            campaignId,
            packName: 'secondwin', // Duplicate
          },
        })
        expect(true).toBe(false)
      } catch (error: any) {
        console.log('✅ Unique constraint enforced:', error.code)
        expect(error.code).toBe('P2002')
      }
      console.log()
    })

    test('should load campaign with unlocks', async () => {
      console.log('📝 Test: Load campaign with unlocks')

      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: { unlocks: true },
      })

      console.log('Campaign unlocks:', JSON.stringify({
        campaignName: campaign?.name,
        unlocks: campaign?.unlocks.map(u => u.packName),
      }, null, 2))
      console.log('✅ Campaign unlocks loaded\n')

      expect(campaign?.unlocks).toHaveLength(1)
      expect(campaign?.unlocks[0].packName).toBe('secondwin')
    })
  })

  describe('Permanent Modifications', () => {
    let campaignId: string
    let userId: string

    beforeAll(async () => {
      const user = await prisma.user.create({
        data: {
          username: 'moduser',
          passwordHash: await bcrypt.hash('pass', 10),
        },
      })

      const campaign = await prisma.campaign.create({
        data: {
          name: 'Mod Campaign',
          creatorId: user.id,
        },
      })

      userId = user.id
      campaignId = campaign.id
    })

    test('should create permanent modification (city)', async () => {
      console.log('📝 Test: Create permanent modification (city)')

      const mod = await prisma.permanentModification.create({
        data: {
          campaignId,
          type: 'city',
          appliedBy: userId,
          gameNumber: 1,
          data: JSON.stringify({
            territoryId: 'north-america-eastern-united-states',
            cityName: 'New Test City',
            type: 'minor',
          }),
        },
      })

      console.log('Created modification:', JSON.stringify({
        id: mod.id,
        type: mod.type,
        gameNumber: mod.gameNumber,
        data: JSON.parse(mod.data),
      }, null, 2))
      console.log('✅ City modification created\n')

      expect(mod.type).toBe('city')
      expect(JSON.parse(mod.data).cityName).toBe('New Test City')
    })

    test('should create permanent modification (scar)', async () => {
      console.log('📝 Test: Create permanent modification (scar)')

      const mod = await prisma.permanentModification.create({
        data: {
          campaignId,
          type: 'scar',
          appliedBy: userId,
          gameNumber: 2,
          data: JSON.stringify({
            factionId: 'khan-industries',
            scarName: 'Bunker',
            effect: 'Start game with 1 less troop',
          }),
        },
      })

      console.log('Created scar:', JSON.stringify({
        id: mod.id,
        type: mod.type,
        gameNumber: mod.gameNumber,
        data: JSON.parse(mod.data),
      }, null, 2))
      console.log('✅ Scar modification created\n')

      expect(mod.type).toBe('scar')
    })

    test('should load campaign with all modifications', async () => {
      console.log('📝 Test: Load campaign with modifications')

      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          permanentModifications: {
            orderBy: { gameNumber: 'asc' },
          },
        },
      })

      console.log('Campaign modifications:', JSON.stringify({
        campaignName: campaign?.name,
        modifications: campaign?.permanentModifications.map(m => ({
          type: m.type,
          gameNumber: m.gameNumber,
          data: JSON.parse(m.data),
        })),
      }, null, 2))
      console.log('✅ All modifications loaded\n')

      expect(campaign?.permanentModifications).toHaveLength(2)
    })
  })

  describe('Campaign Games', () => {
    let campaignId: string
    let winnerId: string

    beforeAll(async () => {
      const user = await prisma.user.create({
        data: {
          username: 'gameuser',
          passwordHash: await bcrypt.hash('pass', 10),
        },
      })

      const campaign = await prisma.campaign.create({
        data: {
          name: 'Game Campaign',
          creatorId: user.id,
        },
      })

      winnerId = user.id
      campaignId = campaign.id
    })

    test('should create campaign game', async () => {
      console.log('📝 Test: Create campaign game')

      const game = await prisma.campaignGame.create({
        data: {
          campaignId,
          gameNumber: 1,
          winnerId,
          completedAt: new Date(),
          gameState: JSON.stringify({ finalTurnCount: 10 }),
        },
      })

      console.log('Created game:', JSON.stringify({
        id: game.id,
        gameNumber: game.gameNumber,
        winnerId: game.winnerId,
        completedAt: game.completedAt,
        state: JSON.parse(game.gameState),
      }, null, 2))
      console.log('✅ Campaign game created\n')

      expect(game.gameNumber).toBe(1)
      expect(game.winnerId).toBe(winnerId)
    })

    test('should enforce unique campaign-gameNumber constraint', async () => {
      console.log('📝 Test: Unique campaign-gameNumber constraint')

      try {
        await prisma.campaignGame.create({
          data: {
            campaignId,
            gameNumber: 1, // Duplicate
            winnerId,
          },
        })
        expect(true).toBe(false)
      } catch (error: any) {
        console.log('✅ Unique constraint enforced:', error.code)
        expect(error.code).toBe('P2002')
      }
      console.log()
    })

    test('should create multiple sequential games', async () => {
      console.log('📝 Test: Create multiple sequential games')

      const game2 = await prisma.campaignGame.create({
        data: {
          campaignId,
          gameNumber: 2,
          winnerId,
          completedAt: new Date(),
        },
      })

      const game3 = await prisma.campaignGame.create({
        data: {
          campaignId,
          gameNumber: 3,
          completedAt: null, // In progress
        },
      })

      console.log('Created games:', JSON.stringify([
        { gameNumber: game2.gameNumber, completed: !!game2.completedAt },
        { gameNumber: game3.gameNumber, completed: !!game3.completedAt },
      ], null, 2))
      console.log('✅ Multiple games created\n')

      expect(game2.gameNumber).toBe(2)
      expect(game3.completedAt).toBeNull()
    })

    test('should load campaign with game history', async () => {
      console.log('📝 Test: Load campaign with game history')

      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          games: {
            orderBy: { gameNumber: 'asc' },
          },
        },
      })

      console.log('Campaign game history:', JSON.stringify({
        campaignName: campaign?.name,
        games: campaign?.games.map(g => ({
          gameNumber: g.gameNumber,
          winnerId: g.winnerId,
          completed: !!g.completedAt,
        })),
      }, null, 2))
      console.log('✅ Game history loaded\n')

      expect(campaign?.games).toHaveLength(3)
    })
  })

  describe('Database Transactions', () => {
    test('should execute transaction successfully', async () => {
      console.log('📝 Test: Database transaction (success)')

      const result = await withTransaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            username: 'txuser',
            passwordHash: await bcrypt.hash('pass', 10),
          },
        })

        const campaign = await tx.campaign.create({
          data: {
            name: 'TX Campaign',
            creatorId: user.id,
          },
        })

        return { user, campaign }
      })

      console.log('Transaction result:', JSON.stringify({
        user: { id: result.user.id, username: result.user.username },
        campaign: { id: result.campaign.id, name: result.campaign.name },
      }, null, 2))
      console.log('✅ Transaction committed successfully\n')

      expect(result.user).toBeDefined()
      expect(result.campaign).toBeDefined()
    })

    test('should rollback transaction on error', async () => {
      console.log('📝 Test: Database transaction (rollback)')

      try {
        await withTransaction(async (tx) => {
          await tx.user.create({
            data: {
              username: 'rollbackuser',
              passwordHash: await bcrypt.hash('pass', 10),
            },
          })

          // Force error with duplicate username
          await tx.user.create({
            data: {
              username: 'rollbackuser', // Duplicate
              passwordHash: await bcrypt.hash('pass', 10),
            },
          })
        })
        expect(true).toBe(false)
      } catch (error: any) {
        console.log('✅ Transaction rolled back:', error.code)
      }

      // Verify user was not created
      const user = await prisma.user.findUnique({
        where: { username: 'rollbackuser' },
      })

      console.log('User after rollback:', user === null ? 'NULL (rolled back)' : 'EXISTS')
      console.log('✅ Rollback verified\n')

      expect(user).toBeNull()
    })
  })

  describe('Cascade Delete', () => {
    test('should cascade delete campaign and related data', async () => {
      console.log('📝 Test: Cascade delete')

      // Create campaign with related data
      const user = await prisma.user.create({
        data: {
          username: 'cascadeuser',
          passwordHash: await bcrypt.hash('pass', 10),
        },
      })

      const campaign = await prisma.campaign.create({
        data: {
          name: 'Cascade Campaign',
          creatorId: user.id,
        },
      })

      await prisma.campaignPlayer.create({
        data: {
          campaignId: campaign.id,
          userId: user.id,
          faction: 'enclave-of-the-bear',
        },
      })

      await prisma.campaignUnlock.create({
        data: {
          campaignId: campaign.id,
          packName: 'secondwin',
        },
      })

      await prisma.permanentModification.create({
        data: {
          campaignId: campaign.id,
          type: 'scar',
          data: JSON.stringify({ test: 'data' }),
        },
      })

      await prisma.campaignGame.create({
        data: {
          campaignId: campaign.id,
          gameNumber: 1,
          winnerId: user.id,
        },
      })

      console.log('Created campaign with related data')
      console.log('Deleting campaign...')

      // Delete campaign
      await prisma.campaign.delete({
        where: { id: campaign.id },
      })

      // Verify all related data was deleted
      const players = await prisma.campaignPlayer.findMany({
        where: { campaignId: campaign.id },
      })
      const unlocks = await prisma.campaignUnlock.findMany({
        where: { campaignId: campaign.id },
      })
      const mods = await prisma.permanentModification.findMany({
        where: { campaignId: campaign.id },
      })
      const games = await prisma.campaignGame.findMany({
        where: { campaignId: campaign.id },
      })

      console.log('After cascade delete:', JSON.stringify({
        campaignPlayers: players.length,
        campaignUnlocks: unlocks.length,
        permanentModifications: mods.length,
        campaignGames: games.length,
      }, null, 2))
      console.log('✅ Cascade delete successful\n')

      expect(players).toHaveLength(0)
      expect(unlocks).toHaveLength(0)
      expect(mods).toHaveLength(0)
      expect(games).toHaveLength(0)
    })
  })

  describe('Database Statistics', () => {
    test('should display database statistics', async () => {
      console.log('📝 Test: Database statistics')

      const stats = {
        users: await prisma.user.count(),
        campaigns: await prisma.campaign.count(),
        campaignPlayers: await prisma.campaignPlayer.count(),
        campaignUnlocks: await prisma.campaignUnlock.count(),
        permanentModifications: await prisma.permanentModification.count(),
        campaignGames: await prisma.campaignGame.count(),
      }

      console.log('\n📊 Database Statistics:')
      console.log(JSON.stringify(stats, null, 2))
      console.log('\n✅ Statistics retrieved successfully\n')

      expect(stats.users).toBeGreaterThan(0)
    })
  })
})

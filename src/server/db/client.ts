/**
 * Prisma Client Singleton
 *
 * This module provides a singleton instance of Prisma Client for use throughout the application.
 * It includes proper connection management and TypeScript types.
 */

import { PrismaClient } from '@prisma/client'
import { logger } from '../index.js'

/**
 * Extended Prisma Client with middleware and custom methods
 */
const prismaClientSingleton = () => {
  const client = new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
    ],
  })

  // Log queries in development
  if (process.env.NODE_ENV === 'development') {
    client.$on('query', (e: any) => {
      logger.debug('Prisma Query:', {
        query: e.query,
        params: e.params,
        duration: `${e.duration}ms`,
      })
    })
  }

  return client
}

// Global type declaration for TypeScript
declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

// Singleton pattern - reuse connection in development (hot reloading)
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma
}

/**
 * Connect to the database
 */
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect()
    logger.info('Database connected successfully')
  } catch (error) {
    logger.error('Failed to connect to database:', error)
    throw error
  }
}

/**
 * Disconnect from the database
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect()
    logger.info('Database disconnected successfully')
  } catch (error) {
    logger.error('Failed to disconnect from database:', error)
    throw error
  }
}

/**
 * Execute a transaction with automatic rollback on error
 */
export async function withTransaction<T>(
  fn: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    return fn(tx as PrismaClient)
  })
}

/**
 * Check database connection health
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    logger.error('Database health check failed:', error)
    return false
  }
}

/**
 * Clean database (for testing purposes only)
 */
export async function cleanDatabase(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot clean database in production')
  }

  // Delete in correct order to respect foreign key constraints
  await prisma.campaignGame.deleteMany()
  await prisma.permanentModification.deleteMany()
  await prisma.campaignUnlock.deleteMany()
  await prisma.campaignPlayer.deleteMany()
  await prisma.campaign.deleteMany()
  await prisma.user.deleteMany()

  logger.info('Database cleaned successfully')
}

export { prisma }
export default prisma

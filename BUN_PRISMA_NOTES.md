# Bun + Prisma Integration Notes

## Why Bun?

**Performance Benefits**:
- 3-4x faster than Node.js for most operations
- Native TypeScript support (no ts-node needed)
- Built-in test runner, bundler, and package manager
- Fast cold starts and hot reloading
- Native SQLite support (useful for development)

**Developer Experience**:
- Single runtime for everything (no separate build tools)
- Fast package installation
- Built-in .env support
- Compatible with most Node.js packages

## Why Prisma?

**Type Safety**:
- Fully typed database queries
- Auto-generated TypeScript types from schema
- Catch errors at compile time, not runtime

**Developer Experience**:
- Schema-first approach (easier to read and maintain)
- Automatic migrations
- Prisma Studio for database browsing
- Great IDE integration

**Features**:
- Relation handling
- Transactions
- Connection pooling
- Multiple database support (SQLite dev → PostgreSQL prod)

## Bun + Prisma Compatibility

### Current Status (2025)
Prisma works well with Bun but has some considerations:

1. **Prisma Client Generation**: Works perfectly
   ```bash
   bunx prisma generate
   ```

2. **Migrations**: Fully supported
   ```bash
   bunx prisma migrate dev
   bunx prisma migrate deploy
   ```

3. **Prisma Studio**: Works via bunx
   ```bash
   bunx prisma studio
   ```

### Known Issues & Workarounds

**Issue 1: Prisma CLI with Bun**
- Workaround: Use `bunx` instead of `bun` for Prisma commands
- Example: `bunx prisma migrate dev` (not `bun prisma migrate dev`)

**Issue 2: Native Binaries**
- Prisma uses native binaries for database access
- These work fine with Bun as Bun is Node-compatible
- No action needed

## Project Setup with Bun + Prisma

### Initial Setup
```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Initialize project (already done)
bun init

# Install Prisma
bun add -D prisma
bun add @prisma/client

# Initialize Prisma
bunx prisma init
```

### Database Configuration

**Development (SQLite)**:
```prisma
// prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

**Production (PostgreSQL)**:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Environment Variables**:
```bash
# .env
DATABASE_URL="postgresql://user:pass@localhost:5432/risklegacy"
```

### Workflow

**1. Create/Modify Schema**:
```prisma
model User {
  id           String   @id @default(cuid())
  username     String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  campaigns    CampaignPlayer[]
}
```

**2. Generate Migration**:
```bash
bunx prisma migrate dev --name add_user_model
```

**3. Prisma Client Auto-Regenerates**:
```typescript
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// Fully typed!
const user = await prisma.user.create({
  data: {
    username: 'alice',
    passwordHash: 'hashed...'
  }
})
```

**4. Use in Code**:
```typescript
// src/server/db/client.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

## Prisma Schema Design for Risk Legacy

### Key Models

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(cuid())
  username     String   @unique
  passwordHash String
  createdAt    DateTime @default(now())

  // Relations
  createdCampaigns Campaign[]       @relation("CampaignCreator")
  campaigns        CampaignPlayer[]
}

model Campaign {
  id        String   @id @default(cuid())
  name      String
  creatorId String
  state     Json     @default("{}")
  createdAt DateTime @default(now())

  // Relations
  creator       User                     @relation("CampaignCreator", fields: [creatorId], references: [id])
  players       CampaignPlayer[]
  unlocks       CampaignUnlock[]
  modifications PermanentModification[]
  games         CampaignGame[]
}

model CampaignPlayer {
  id         String  @id @default(cuid())
  campaignId String
  userId     String
  faction    String?
  totalStars Int     @default(0)

  // Relations
  campaign Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([campaignId, userId])
}

model CampaignUnlock {
  id         String   @id @default(cuid())
  campaignId String
  packName   String
  unlockedAt DateTime @default(now())

  // Relations
  campaign Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)

  @@unique([campaignId, packName])
}

model PermanentModification {
  id         String   @id @default(cuid())
  campaignId String
  type       String   // 'scar', 'sticker', 'city', 'value_increase'
  data       Json
  createdAt  DateTime @default(now())

  // Relations
  campaign Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)

  @@index([campaignId, type])
}

model CampaignGame {
  id          String    @id @default(cuid())
  campaignId  String
  gameNumber  Int
  winnerId    String?
  completedAt DateTime?

  // Relations
  campaign Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)

  @@unique([campaignId, gameNumber])
}
```

### Benefits of This Schema

1. **Type Safety**: All queries are fully typed
2. **Relations**: Easy to query related data
3. **Cascading Deletes**: Automatically clean up related records
4. **Unique Constraints**: Prevent duplicate data
5. **Indexes**: Fast queries on common patterns
6. **JSON Fields**: Flexible storage for complex game state

### Example Queries

```typescript
// Get campaign with all players
const campaign = await prisma.campaign.findUnique({
  where: { id: campaignId },
  include: {
    players: {
      include: {
        user: {
          select: { username: true }
        }
      }
    },
    unlocks: true,
    modifications: true
  }
})

// Get user's campaigns
const myCampaigns = await prisma.campaign.findMany({
  where: {
    players: {
      some: {
        userId: currentUserId
      }
    }
  },
  include: {
    creator: {
      select: { username: true }
    },
    players: {
      include: {
        user: {
          select: { username: true }
        }
      }
    }
  }
})

// Add unlock to campaign
await prisma.campaignUnlock.create({
  data: {
    campaignId,
    packName: 'secondwin'
  }
})

// Add permanent modification
await prisma.permanentModification.create({
  data: {
    campaignId,
    type: 'scar',
    data: {
      factionId: 'balkania',
      scarId: 'cautious',
      description: 'Lose 1 die on first attack'
    }
  }
})
```

## Performance Tips

### Connection Pooling
```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=10',
    },
  },
})
```

### Query Optimization
```typescript
// Use select to limit fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    username: true,
    // Don't include passwordHash when not needed
  }
})

// Use transactions for multiple operations
await prisma.$transaction([
  prisma.campaign.create({ data: campaignData }),
  prisma.campaignPlayer.create({ data: playerData }),
  prisma.campaignUnlock.create({ data: unlockData })
])
```

### Bun-Specific Optimizations
```typescript
// Use Bun's native file I/O when possible
import { file } from 'bun'

// Bun's native fetch is faster
const response = await fetch('...')

// Use Bun.serve() instead of Express for max performance (optional)
Bun.serve({
  port: 8000,
  fetch(req) {
    // Handle request
  }
})
```

## Testing with Bun + Prisma

```typescript
// test/db.test.ts
import { describe, expect, test, beforeAll, afterAll } from 'bun:test'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

beforeAll(async () => {
  // Reset database
  await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('User model', () => {
  test('creates user', async () => {
    const user = await prisma.user.create({
      data: {
        username: 'testuser',
        passwordHash: 'hash'
      }
    })
    expect(user.username).toBe('testuser')
  })
})
```

## Migration to Production

**Development to Production**:
1. Develop with SQLite: Fast, no setup
2. Test with PostgreSQL: Same as production
3. Deploy with PostgreSQL: Production database

**Environment-Based Database**:
```typescript
// src/server/db/client.ts
const databaseUrl = process.env.NODE_ENV === 'production'
  ? process.env.DATABASE_URL
  : 'file:./dev.db'

// Then use in Prisma schema
// datasource db {
//   provider = "postgresql"
//   url      = env("DATABASE_URL")
// }
```

## Useful Commands

```bash
# Development workflow
bun run db:migrate        # Create and apply migration
bun run db:generate       # Regenerate Prisma Client
bun run db:studio         # Open Prisma Studio

# Production deployment
bun run db:migrate:prod   # Apply migrations (no prompts)

# Reset database (dev only)
bun run db:reset          # Warning: Deletes all data!

# Seed database
bun run db:seed           # Add test data
```

## Resources

- [Bun Docs](https://bun.sh/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Bun + Prisma Guide](https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/bun)

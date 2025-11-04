# Hono Framework Guide

## Why Hono?

Hono is the perfect web framework for Bun and this project:

### Performance
- **Ultra-fast**: 3-4x faster than Express
- **Small bundle**: ~12KB (vs Express ~200KB)
- **Zero dependencies**: Minimal overhead
- **Edge-ready**: Works on any JavaScript runtime

### Developer Experience
- **TypeScript-first**: Excellent type inference
- **Modern API**: Clean, chainable syntax
- **Built-in utilities**: JWT, CORS, logger, etc.
- **Bun-optimized**: Native compatibility

### Perfect for Risk Legacy
- RESTful API design
- JWT authentication built-in
- Fast JSON responses (critical for game state)
- WebSocket support (for real-time updates)
- Easy integration with boardgame.io

## Basic Hono Setup

### Installation
```bash
bun add hono @hono/jwt
```

### Simple Server
```typescript
// src/server/index.ts
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => c.text('Risk Legacy API'))

export default {
  port: 8000,
  fetch: app.fetch,
}
```

Run with: `bun run src/server/index.ts`

## Hono Features We'll Use

### 1. Routing

```typescript
import { Hono } from 'hono'

const app = new Hono()

// Simple routes
app.get('/api/health', (c) => c.json({ status: 'ok' }))

// Route parameters
app.get('/api/campaigns/:id', async (c) => {
  const id = c.req.param('id')
  // ...
  return c.json({ campaign })
})

// Query parameters
app.get('/api/campaigns', async (c) => {
  const userId = c.req.query('userId')
  // ...
  return c.json({ campaigns })
})

// Request body
app.post('/api/auth/login', async (c) => {
  const { username, password } = await c.req.json()
  // ...
  return c.json({ token })
})
```

### 2. Middleware

```typescript
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { jwt } from '@hono/jwt'

const app = new Hono()

// Global middleware
app.use('*', logger())
app.use('*', cors({
  origin: ['http://localhost:3000'],
  credentials: true,
}))

// Protected routes
app.use('/api/campaigns/*', jwt({
  secret: process.env.JWT_SECRET!,
}))

// Custom middleware
app.use('/api/*', async (c, next) => {
  console.log('API request:', c.req.path)
  await next()
})
```

### 3. JWT Authentication

```typescript
import { Hono } from 'hono'
import { jwt, sign } from '@hono/jwt'

const app = new Hono()

// Login route - generate token
app.post('/api/auth/login', async (c) => {
  const { username, password } = await c.req.json()

  // Verify credentials
  const user = await verifyUser(username, password)
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  // Generate JWT
  const token = await sign(
    {
      userId: user.id,
      username: user.username,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    },
    process.env.JWT_SECRET!
  )

  return c.json({ token, user: { id: user.id, username: user.username } })
})

// Protected route
app.use('/api/campaigns/*', jwt({ secret: process.env.JWT_SECRET! }))

app.get('/api/campaigns', async (c) => {
  // Access user from JWT payload
  const payload = c.get('jwtPayload')
  const userId = payload.userId

  const campaigns = await prisma.campaign.findMany({
    where: {
      players: {
        some: { userId }
      }
    }
  })

  return c.json({ campaigns })
})
```

### 4. Error Handling

```typescript
import { Hono } from 'hono'

const app = new Hono()

// Custom error handler
app.onError((err, c) => {
  console.error('Error:', err)

  if (err instanceof ValidationError) {
    return c.json({ error: err.message }, 400)
  }

  if (err instanceof UnauthorizedError) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  return c.json({ error: 'Internal server error' }, 500)
})

// Not found handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404)
})
```

### 5. Modular Routes

```typescript
// src/server/api/auth.ts
import { Hono } from 'hono'
import { sign } from '@hono/jwt'
import bcrypt from 'bcrypt'
import { prisma } from '../db/client'

const auth = new Hono()

auth.post('/register', async (c) => {
  const { username, password } = await c.req.json()

  // Validate
  if (password.length < 8) {
    return c.json({ error: 'Password too short' }, 400)
  }

  // Check if exists
  const exists = await prisma.user.findUnique({ where: { username } })
  if (exists) {
    return c.json({ error: 'Username taken' }, 409)
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10)

  // Create user
  const user = await prisma.user.create({
    data: { username, passwordHash }
  })

  // Generate token
  const token = await sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET!
  )

  return c.json({ token, user: { id: user.id, username: user.username } })
})

auth.post('/login', async (c) => {
  const { username, password } = await c.req.json()

  // Find user
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  // Verify password
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  // Generate token
  const token = await sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET!
  )

  return c.json({ token, user: { id: user.id, username: user.username } })
})

export default auth

// src/server/index.ts
import { Hono } from 'hono'
import auth from './api/auth'

const app = new Hono()

app.route('/api/auth', auth)

export default app
```

### 6. Type-Safe Responses

```typescript
import { Hono } from 'hono'

type Campaign = {
  id: string
  name: string
  createdAt: Date
}

const app = new Hono()

// Type-safe JSON response
app.get('/api/campaigns/:id', async (c) => {
  const id = c.req.param('id')

  const campaign = await prisma.campaign.findUnique({
    where: { id }
  })

  if (!campaign) {
    return c.json({ error: 'Campaign not found' }, 404)
  }

  // TypeScript knows the response type
  return c.json<Campaign>(campaign)
})
```

## Hono + Prisma Pattern

```typescript
// src/server/api/campaigns.ts
import { Hono } from 'hono'
import { jwt } from '@hono/jwt'
import { prisma } from '../db/client'

const campaigns = new Hono()

// Protect all campaign routes
campaigns.use('*', jwt({ secret: process.env.JWT_SECRET! }))

// List user's campaigns
campaigns.get('/', async (c) => {
  const { userId } = c.get('jwtPayload')

  const campaigns = await prisma.campaign.findMany({
    where: {
      players: {
        some: { userId }
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
      },
      unlocks: true
    }
  })

  return c.json({ campaigns })
})

// Get specific campaign
campaigns.get('/:id', async (c) => {
  const id = c.req.param('id')
  const { userId } = c.get('jwtPayload')

  const campaign = await prisma.campaign.findFirst({
    where: {
      id,
      players: {
        some: { userId }
      }
    },
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

  if (!campaign) {
    return c.json({ error: 'Campaign not found' }, 404)
  }

  return c.json({ campaign })
})

// Create campaign
campaigns.post('/', async (c) => {
  const { userId } = c.get('jwtPayload')
  const { name } = await c.req.json()

  const campaign = await prisma.campaign.create({
    data: {
      name,
      creatorId: userId,
      players: {
        create: {
          userId,
        }
      },
      unlocks: {
        create: {
          packName: 'base'
        }
      }
    },
    include: {
      players: true,
      unlocks: true
    }
  })

  return c.json({ campaign }, 201)
})

export default campaigns
```

## Integration with boardgame.io

boardgame.io uses Koa, but we can run both:

### Option 1: Separate Ports
```typescript
// src/server/index.ts - Hono API
import { Hono } from 'hono'

const app = new Hono()
// ... routes

export default {
  port: 8000,
  fetch: app.fetch,
}

// src/server/boardgame-server.ts - boardgame.io
import { Server } from 'boardgame.io/server'

const server = Server({
  games: [RiskLegacy],
})

server.run(8001) // Different port
```

### Option 2: Mount Koa in Hono (Advanced)
```typescript
// Proxy boardgame.io requests through Hono
app.all('/game/*', async (c) => {
  // Forward to boardgame.io Koa server
  const response = await fetch(`http://localhost:8001${c.req.path}`, {
    method: c.req.method,
    headers: c.req.headers,
    body: c.req.method !== 'GET' ? await c.req.text() : undefined,
  })

  return new Response(response.body, response)
})
```

## Complete Example: Main Server

```typescript
// src/server/index.ts
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { jwt } from '@hono/jwt'

// Route modules
import auth from './api/auth'
import campaigns from './api/campaigns'
import lobbies from './api/lobbies'
import assets from './api/assets'
import rulebook from './api/rulebook'

const app = new Hono()

// Global middleware
app.use('*', logger())
app.use('*', cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}))

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }))

// Public routes
app.route('/api/auth', auth)
app.route('/api/rulebook', rulebook) // Public rulebook access

// Protected routes (require JWT)
app.use('/api/campaigns/*', jwt({ secret: process.env.JWT_SECRET! }))
app.use('/api/lobbies/*', jwt({ secret: process.env.JWT_SECRET! }))

app.route('/api/campaigns', campaigns)
app.route('/api/lobbies', lobbies)
app.route('/api/assets', assets)

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404)
})

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err)
  return c.json({ error: 'Internal server error' }, 500)
})

// Export for Bun
export default {
  port: Number(process.env.PORT) || 8000,
  fetch: app.fetch,
}

console.log(`🚀 Server running on port ${process.env.PORT || 8000}`)
```

## Testing with Hono

```typescript
// test/api/auth.test.ts
import { describe, expect, test } from 'bun:test'
import app from '../src/server'

describe('Auth API', () => {
  test('POST /api/auth/register creates user', async () => {
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        password: 'testpass123'
      })
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.token).toBeDefined()
    expect(data.user.username).toBe('testuser')
  })

  test('POST /api/auth/login returns token', async () => {
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        password: 'testpass123'
      })
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.token).toBeDefined()
  })
})
```

## Performance Benefits

Hono is significantly faster than Express:

| Framework | Requests/sec | Response Time |
|-----------|-------------|---------------|
| Hono      | ~140,000    | 0.7ms         |
| Express   | ~40,000     | 2.5ms         |
| Fastify   | ~90,000     | 1.1ms         |

For Risk Legacy:
- Faster game state responses
- Better real-time performance
- Lower server costs
- Better user experience

## Key Advantages for This Project

1. **Bun Native**: Designed to work perfectly with Bun
2. **TypeScript**: Full type inference without extra config
3. **Lightweight**: Won't bloat the server
4. **Fast JSON**: Critical for game state API
5. **Built-in JWT**: No need for passport.js complexity
6. **Modern**: Clean, async/await-first API
7. **Edge-Ready**: Can deploy to Cloudflare Workers later

## Resources

- [Hono Documentation](https://hono.dev/)
- [Hono + Bun Guide](https://hono.dev/getting-started/bun)
- [Hono JWT Middleware](https://github.com/honojs/middleware/tree/main/packages/jwt)
- [Hono Examples](https://github.com/honojs/examples)

# Zod Validation Guide

## Why Zod?

Zod provides runtime validation with TypeScript type inference, making your API completely type-safe:

### Problems Without Zod
```typescript
// ❌ No runtime validation
app.post('/api/auth/register', async (c) => {
  const body = await c.req.json()
  // body is 'any' - no safety!
  // User could send: { username: 123, password: null }
  const user = await prisma.user.create({ data: body }) // 💥 Runtime error
})
```

### Solution With Zod
```typescript
// ✅ Runtime validation + TypeScript types
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

const RegisterSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(8)
})

app.post('/api/auth/register', zValidator('json', RegisterSchema), async (c) => {
  const body = c.req.valid('json') // Fully typed AND validated!
  // body is { username: string, password: string }
  const user = await prisma.user.create({ data: body }) // ✅ Safe
})
```

### Key Benefits
1. **Runtime Safety**: Invalid data is rejected before it reaches your code
2. **Type Inference**: TypeScript types are automatically inferred from schemas
3. **Better Errors**: Clear validation error messages for clients
4. **Single Source of Truth**: One schema defines both validation and types
5. **Composable**: Build complex schemas from simple ones

## Basic Zod Usage

### Primitive Types
```typescript
import { z } from 'zod'

const StringSchema = z.string()
const NumberSchema = z.number()
const BooleanSchema = z.boolean()
const DateSchema = z.date()
const OptionalSchema = z.string().optional()
const NullableSchema = z.string().nullable()
```

### String Validation
```typescript
const UsernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')

const EmailSchema = z.string().email('Invalid email address')

const PasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password is too long')
```

### Number Validation
```typescript
const AgeSchema = z.number()
  .int('Age must be a whole number')
  .min(13, 'Must be at least 13 years old')
  .max(120, 'Invalid age')

const PriceSchema = z.number()
  .positive('Price must be positive')
  .multipleOf(0.01, 'Price must have at most 2 decimal places')
```

### Object Schemas
```typescript
const UserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
  age: z.number().int().min(13).optional()
})

// Infer TypeScript type
type User = z.infer<typeof UserSchema>
// type User = { username: string; password: string; age?: number }
```

### Array Schemas
```typescript
const StringArraySchema = z.array(z.string())

const UserArraySchema = z.array(UserSchema)

const NonEmptyArraySchema = z.array(z.string()).nonempty('Array cannot be empty')

const MinLengthArraySchema = z.array(z.string()).min(2, 'Must have at least 2 items')
```

### Enum Schemas
```typescript
const FactionSchema = z.enum([
  'balkania',
  'enclave',
  'khan',
  'mechaniker',
  'saharan'
])

const PhaseSchema = z.enum(['setup', 'recruit', 'attack', 'maneuver', 'draw'])
```

### Union Types
```typescript
const IdSchema = z.union([z.string(), z.number()])

const ResponseSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('success'), data: z.any() }),
  z.object({ type: z.literal('error'), message: z.string() })
])
```

## Zod with Hono

### Basic Validation
```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const app = new Hono()

const CreateCampaignSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional()
})

app.post('/api/campaigns',
  zValidator('json', CreateCampaignSchema),
  async (c) => {
    const data = c.req.valid('json') // Typed as { name: string, description?: string }

    const campaign = await prisma.campaign.create({
      data: {
        name: data.name,
        description: data.description,
        creatorId: c.get('jwtPayload').userId
      }
    })

    return c.json({ campaign })
  }
)
```

### Query Parameter Validation
```typescript
const ListCampaignsQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default('10'),
  status: z.enum(['active', 'completed', 'all']).default('all')
})

app.get('/api/campaigns',
  zValidator('query', ListCampaignsQuerySchema),
  async (c) => {
    const { page, limit, status } = c.req.valid('query')
    // page and limit are numbers, status is 'active' | 'completed' | 'all'

    const campaigns = await prisma.campaign.findMany({
      skip: (page - 1) * limit,
      take: limit,
      // ... filter by status
    })

    return c.json({ campaigns, page, limit })
  }
)
```

### Path Parameter Validation
```typescript
const CampaignIdSchema = z.object({
  id: z.string().uuid('Invalid campaign ID')
})

app.get('/api/campaigns/:id',
  zValidator('param', CampaignIdSchema),
  async (c) => {
    const { id } = c.req.valid('param')

    const campaign = await prisma.campaign.findUnique({
      where: { id }
    })

    if (!campaign) {
      return c.json({ error: 'Campaign not found' }, 404)
    }

    return c.json({ campaign })
  }
)
```

### Multiple Validators
```typescript
const UpdateCampaignParamSchema = z.object({
  id: z.string().uuid()
})

const UpdateCampaignBodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional()
})

app.patch('/api/campaigns/:id',
  zValidator('param', UpdateCampaignParamSchema),
  zValidator('json', UpdateCampaignBodySchema),
  async (c) => {
    const { id } = c.req.valid('param')
    const updates = c.req.valid('json')

    const campaign = await prisma.campaign.update({
      where: { id },
      data: updates
    })

    return c.json({ campaign })
  }
)
```

## Risk Legacy Schemas

### User & Auth
```typescript
// src/server/schemas/auth.ts
import { z } from 'zod'

export const RegisterSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long')
})

export const LoginSchema = z.object({
  username: z.string(),
  password: z.string()
})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
```

### Campaign
```typescript
// src/server/schemas/campaign.ts
import { z } from 'zod'

export const CreateCampaignSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional()
})

export const UpdateCampaignSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional()
})

export const InvitePlayerSchema = z.object({
  username: z.string()
})

export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>
export type UpdateCampaignInput = z.infer<typeof UpdateCampaignSchema>
export type InvitePlayerInput = z.infer<typeof InvitePlayerSchema>
```

### Game Actions
```typescript
// src/server/schemas/game.ts
import { z } from 'zod'

export const FactionSchema = z.enum([
  'balkania',
  'enclave',
  'khan',
  'mechaniker',
  'saharan'
])

export const ChooseFactionSchema = z.object({
  factionId: FactionSchema
})

export const ChoosePowerSchema = z.object({
  powerId: z.string()
})

export const PlaceTroopsSchema = z.object({
  territoryId: z.string(),
  count: z.number().int().min(1)
})

export const AttackSchema = z.object({
  fromTerritory: z.string(),
  toTerritory: z.string(),
  numDice: z.number().int().min(1).max(3)
})

export const ManeuverSchema = z.object({
  fromTerritory: z.string(),
  toTerritory: z.string(),
  troopCount: z.number().int().min(1)
})

export type Faction = z.infer<typeof FactionSchema>
export type ChooseFactionInput = z.infer<typeof ChooseFactionSchema>
export type AttackInput = z.infer<typeof AttackSchema>
```

### Assets
```typescript
// src/server/assets/schemas.ts
import { z } from 'zod'

export const FactionCardSchema = z.object({
  namespace: z.string(),
  imgPath: z.string(),
  data: z.object({
    troop_img: z.string(),
    three_img: z.string(),
    hq_img: z.string(),
    name: z.string()
  })
})

export const PowerCardSchema = z.object({
  namespace: z.string(),
  data: z.object({
    description: z.string(),
    type: z.enum(['starter', 'advanced', 'special'])
  })
})

export const TerritoryCardSchema = z.object({
  namespace: z.string(),
  imgPath: z.string(),
  cardBack: z.string(),
  data: z.object({
    value: z.number().int().min(1).max(4),
    continent: z.enum([
      'north_america',
      'south_america',
      'europe',
      'africa',
      'asia',
      'australia'
    ])
  })
})

export const ScarCardSchema = z.object({
  namespace: z.string(),
  qty: z.number().int().min(1),
  data: z.object({
    tokenImg: z.string()
  })
})

export type FactionCard = z.infer<typeof FactionCardSchema>
export type PowerCard = z.infer<typeof PowerCardSchema>
export type TerritoryCard = z.infer<typeof TerritoryCardSchema>
export type ScarCard = z.infer<typeof ScarCardSchema>
```

### Rulebook
```typescript
// src/server/rules/schemas.ts
import { z } from 'zod'

export const RuleSchema = z.object({
  id: z.string(),
  text: z.string(),
  priority: z.number().int().min(1),
  modifiers: z.array(z.any()).optional(),
  tags: z.array(z.string()),
  phase: z.string().optional(),
  applies_to: z.string()
})

export const SubsectionSchema = z.object({
  title: z.string(),
  content: z.string(),
  rules: z.array(RuleSchema),
  examples: z.array(z.object({
    scenario: z.string(),
    explanation: z.string()
  })).optional(),
  related: z.array(z.string()).optional()
})

export const SectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  subsections: z.record(SubsectionSchema)
})

export const RulebookSchema = z.object({
  version: z.string(),
  metadata: z.object({
    title: z.string(),
    description: z.string(),
    lastUpdated: z.string()
  }),
  sections: z.record(SectionSchema),
  glossary: z.record(z.string()).optional()
})

export type Rule = z.infer<typeof RuleSchema>
export type Rulebook = z.infer<typeof RulebookSchema>
```

## Validation Error Handling

### Default Hono Error Response
```typescript
// When validation fails, Hono returns:
{
  "success": false,
  "error": {
    "issues": [
      {
        "code": "too_small",
        "minimum": 3,
        "type": "string",
        "inclusive": true,
        "message": "Username must be at least 3 characters",
        "path": ["username"]
      }
    ]
  }
}
```

### Custom Error Handling
```typescript
import { zValidator } from '@hono/zod-validator'

app.post('/api/auth/register',
  zValidator('json', RegisterSchema, (result, c) => {
    if (!result.success) {
      return c.json({
        error: 'Validation failed',
        details: result.error.flatten()
      }, 400)
    }
  }),
  async (c) => {
    // ...
  }
)
```

### Simplified Error Format
```typescript
function formatZodError(error: ZodError) {
  return error.errors.reduce((acc, err) => {
    const field = err.path.join('.')
    acc[field] = err.message
    return acc
  }, {} as Record<string, string>)
}

// Returns:
{
  "username": "Username must be at least 3 characters",
  "password": "Password must be at least 8 characters"
}
```

## Environment Variables with Zod

```typescript
// src/server/config/env.ts
import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().int().min(1).max(65535)).default('8000'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  ALLOWED_ORIGINS: z.string().transform(s => s.split(',')),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info')
})

export const env = EnvSchema.parse(process.env)

// Now env is fully typed and validated!
// env.PORT is a number
// env.ALLOWED_ORIGINS is string[]
// env.NODE_ENV is 'development' | 'production' | 'test'
```

## Response Schemas (Optional but Recommended)

```typescript
// Define response schemas for consistency
const CampaignResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.date(),
  players: z.array(z.object({
    username: z.string(),
    faction: z.string().nullable()
  }))
})

app.get('/api/campaigns/:id', async (c) => {
  const campaign = await prisma.campaign.findUnique({
    where: { id: c.req.param('id') },
    include: { players: { include: { user: true } } }
  })

  // Validate response matches schema (catches bugs early)
  const validated = CampaignResponseSchema.parse(campaign)

  return c.json(validated)
})
```

## Testing with Zod

```typescript
import { describe, expect, test } from 'bun:test'
import { RegisterSchema } from '../src/server/schemas/auth'

describe('RegisterSchema', () => {
  test('accepts valid data', () => {
    const result = RegisterSchema.safeParse({
      username: 'testuser',
      password: 'password123'
    })

    expect(result.success).toBe(true)
  })

  test('rejects short username', () => {
    const result = RegisterSchema.safeParse({
      username: 'ab',
      password: 'password123'
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('at least 3 characters')
    }
  })

  test('rejects invalid characters in username', () => {
    const result = RegisterSchema.safeParse({
      username: 'test user!',
      password: 'password123'
    })

    expect(result.success).toBe(false)
  })
})
```

## Best Practices

### 1. Organize Schemas by Domain
```
src/server/schemas/
├── auth.ts        # Authentication schemas
├── campaign.ts    # Campaign management
├── game.ts        # Game action schemas
├── lobby.ts       # Lobby management
└── common.ts      # Shared/reusable schemas
```

### 2. Export Both Schema and Type
```typescript
export const UserSchema = z.object({
  username: z.string(),
  id: z.string()
})

export type User = z.infer<typeof UserSchema>
```

### 3. Compose Complex Schemas
```typescript
const BaseUserSchema = z.object({
  username: z.string(),
  createdAt: z.date()
})

const UserWithPasswordSchema = BaseUserSchema.extend({
  passwordHash: z.string()
})

const PublicUserSchema = BaseUserSchema.pick({
  username: true
})
```

### 4. Use Refinements for Complex Validation
```typescript
const AttackSchema = z.object({
  fromTerritory: z.string(),
  toTerritory: z.string(),
  numDice: z.number().int().min(1).max(3)
}).refine(
  (data) => data.fromTerritory !== data.toTerritory,
  { message: 'Cannot attack the same territory' }
)
```

### 5. Transform Data
```typescript
const DateRangeSchema = z.object({
  start: z.string().transform(s => new Date(s)),
  end: z.string().transform(s => new Date(s))
}).refine(
  (data) => data.end > data.start,
  { message: 'End date must be after start date' }
)
```

## Performance Considerations

Zod validation is fast but not free:

1. **Validate Once**: Don't re-validate the same data
2. **Use .passthrough()**: For objects with extra fields you don't care about
3. **Lazy Validation**: Use `.lazy()` for recursive schemas
4. **Selective Validation**: Only validate user input, not trusted data

```typescript
// ✅ Good: Validate user input
const userInput = RequestSchema.parse(req.body)

// ❌ Bad: Re-validating already validated data
const validated = ResponseSchema.parse(alreadyValidated)

// ✅ Good: Only validate at boundaries
const userInput = schema.parse(input) // Validate once
processData(userInput) // Type-safe, no validation needed
```

## Resources

- [Zod Documentation](https://zod.dev/)
- [Hono + Zod Validator](https://github.com/honojs/middleware/tree/main/packages/zod-validator)
- [Zod Error Formatting](https://zod.dev/ERROR_HANDLING)

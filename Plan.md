# Risk Legacy Digital Implementation Plan

## 🎯 Project Overview

**Goal**: Build a complete digital implementation of Risk Legacy (the legacy board game) as an API-first server using boardgame.io. The game should be fully playable via API without requiring a UI client.

**What is Risk Legacy**: A board game where 3-5 players compete for global domination across multiple games in a campaign. The game permanently evolves - players make permanent changes to the board, unlock new content (factions, powers, rules), and the world changes based on who wins. It's "Risk" meets "persistent RPG campaign".

**Key Features**:
- Campaign system (series of games with persistent state)
- 5 unique factions with different powers
- Legacy mechanics (stickers, scars, permanent board modifications)
- Unlock system (7 packs that open when conditions are met)
- Machine-readable rulebook (queryable via API)
- Full game state management via boardgame.io

---

## 📚 Reference Documents

**MUST READ THESE BEFORE STARTING ANY MODULE**:

1. **`Plan.md`** (this file) - Complete implementation plan with all modules
2. **`GAME_INDEX.md`** - Complete Risk Legacy rules, game mechanics, victory conditions
3. **`ASSETS_INDEX.md`** - Asset structure, YAML format, unlock packs catalog
4. **`BOARDGAMEIO_INDEX.md`** - boardgame.io architecture, state management, phases
5. **`RULEBOOK_SPEC.md`** - Machine-readable rulebook system specification
6. **`BUN_PRISMA_NOTES.md`** - Bun + Prisma integration guide and patterns
7. **`HONO_NOTES.md`** - Hono framework guide with complete examples
8. **`ZOD_NOTES.md`** - Zod validation patterns and all schemas

**Quick Reference**:
- Game assets: `/assets/` directory (YAML files + images)
- Rules PDF: `/assets/rules.pdf` (original game rules)
- Package config: `package.json` (all dependencies and scripts)
- Environment: `.env.example` (required environment variables)

---

## 🔄 How to Resume Work

### Starting Fresh (New Context)
1. **Read this Plan.md file completely**
2. **Check "Current Status Summary"** section (bottom of this file)
3. **Find the next pending module** in the appropriate phase
4. **Read the module's reference documents** (listed in Dependencies)
5. **Execute the module's tasks** (checkboxes)
6. **Update the module status** when complete
7. **Update "Current Status Summary"** section

### Example Resume Command
```
"I'm ready to continue the Risk Legacy project. I've read Plan.md.
I see Module X.Y is next. Please begin implementation."
```

### If Resuming Mid-Module
1. Check which tasks are marked `[x]` (completed)
2. Continue from first `[ ]` (pending) task
3. Reference the module's deliverables to know what files exist

---

## Architecture Decisions

### Technology Stack
- **Runtime**: Bun (replaces Node.js)
- **Package Manager**: Bun (replaces npm/yarn)
- **Web Framework**: Hono (lightweight, fast, Bun-optimized)
- **Validation**: Zod (runtime type validation with TypeScript inference)
- **Database**:
  - Development: FlatFile (JSON file storage) for boardgame.io state
  - Production: PostgreSQL for user/campaign data
  - ORM: Prisma
- **Authentication**: JWT tokens (stateless, API-first)
- **Real-time Updates**: WebSockets via boardgame.io's built-in support
- **Asset Management**: Convert YAML to JSON at build time

### MVP Scope
**Priority 1 (Must Have)**:
- Base game only (5 factions with starting powers)
- Core gameplay phases (setup, recruit, attack, maneuver, card draw)
- Victory conditions (4 stars to win)
- Campaign system (track games in a series)
- Strict server-side validation

**Priority 2 (Should Have - Post-MVP)**:
- Legacy features (stickers, scars, permanent modifications)
- Mission system (secret objectives)
- All 6 unlock packs with new content

**Priority 3 (Nice to Have - Future)**:
- AI players
- Game replays and history
- Spectator mode
- Advanced analytics

### Simplified Module Sequence for MVP

**Phase 1-2** remain the same (foundation + auth)

**Phase 3** (Core Game) - Simplified:
- ~~Module 3.7~~ (Mission System) → Post-MVP
- ~~Module 3.9~~ (Legacy Systems) → Post-MVP
- Module 3.6 simplified (basic win condition, no board signing)

**Phase 5** (Advanced Features) → Most moved to post-MVP

This allows us to deliver a working multiplayer Risk Legacy game faster, then iterate with legacy features that make it truly unique.

---

## Phase 1: Foundation & Infrastructure

### Module 1.1: Project Setup
**Status**: Partially Complete
**Dependencies**: None

Tasks:
- [x] Initialize TypeScript project
- [ ] Verify/install Bun runtime
- [ ] Update package.json for Bun compatibility
- [ ] Install boardgame.io dependencies via Bun
- [ ] Configure build system for Bun
- [ ] Setup src/server directory structure:
  ```
  src/server/
  ├── api/           # Hono API route handlers
  │   ├── auth.ts
  │   ├── campaigns.ts
  │   ├── lobbies.ts
  │   ├── assets.ts
  │   └── rulebook.ts
  ├── assets/        # Asset loader & compiled assets
  │   ├── loader.ts
  │   └── data/      # Compiled JSON assets
  ├── db/            # Prisma client & database utilities
  │   ├── client.ts
  │   └── seed.ts
  ├── game/          # boardgame.io game logic
  │   ├── state.ts
  │   ├── moves/
  │   ├── phases/
  │   └── index.ts
  ├── rules/         # Machine-readable rulebook
  │   ├── base-rules.json
  │   ├── modifiers/
  │   ├── rulebook-builder.ts
  │   └── rulebook-api.ts
  ├── middleware/    # Hono middleware (auth, etc.)
  │   └── auth.ts
  └── index.ts       # Main server entry point (Hono app)
  ```
- [ ] Configure environment variables (.env.example)
- [ ] Setup logging framework (pino or similar)
- [ ] Create bun scripts (dev, build, start)

**Deliverable**: Working Bun + TypeScript build with boardgame.io imports

---

### Module 1.2: Rules Parser & Machine-Readable Rulebook
**Status**: Not Started
**Dependencies**: 1.1
**Estimated Context**: Large
**Priority**: High - Required for lobby rulebook system

Tasks:
- [ ] Extract and structure rules from rules.pdf into modular sections:
  - Setup rules (faction selection, initial placement)
  - Turn structure (recruit, attack, maneuver, card draw)
  - Combat rules (dice rolling, fortification, special conditions)
  - Victory conditions (star acquisition, win conditions)
  - Card rules (territory cards, coin cards, turn-in sets)
  - Faction powers (base powers for each faction)
  - Territory information (adjacencies, continents)
  - Resource rules (troop recruitment calculation)
- [ ] Create Zod schema for rulebook structure:
  ```typescript
  import { z } from 'zod'

  const RuleSchema = z.object({
    id: z.string(),
    text: z.string(),
    priority: z.number(),
    tags: z.array(z.string()),
    phase: z.string().optional(),
    applies_to: z.string()
  })

  const RulebookSchema = z.object({
    version: z.string(),
    metadata: z.object({
      title: z.string(),
      description: z.string(),
      lastUpdated: z.string()
    }),
    sections: z.record(z.any()) // Define section schemas
  })
  ```
- [ ] Implement unlock-based rule modifications:
  - Each unlock pack can add/modify rules
  - Track which rules are active based on unlocked packs
  - Generate lobby-specific rulebook based on campaign state
- [ ] Create rulebook API endpoints:
  - GET /api/rulebook/base - Base game rules
  - GET /api/lobbies/:id/rulebook - Lobby-specific rules with unlocks
  - GET /api/rulebook/section/:name - Get specific rule section
- [ ] Create rule lookup/search functionality
- [ ] Validate extracted rules against game implementation

**Deliverable**: `src/server/rules/` with:
- `base-rules.json` - Complete base game rulebook
- `rule-modifiers.json` - Unlock pack rule modifications
- `rulebook-builder.ts` - Generates lobby-specific rulebooks
- `rulebook-api.ts` - API endpoints for rule access

**Notes**: This is critical infrastructure. Each lobby needs its own rulebook instance that clients can query. Rules should be granular enough that UI can display relevant sections during gameplay (e.g., "show combat rules" during attack phase).

---

### Module 1.3: Database Schema & Setup (Prisma)
**Status**: Not Started
**Dependencies**: 1.1
**Estimated Context**: Small-Medium

Tasks:
- [ ] Install Prisma via Bun: `bun add -D prisma && bun add @prisma/client`
- [ ] Initialize Prisma: `bunx prisma init`
- [ ] Design Prisma schema (`prisma/schema.prisma`):
  - User model (id, username, passwordHash, createdAt)
  - Campaign model (id, name, creatorId, createdAt, state)
  - CampaignPlayer model (campaignId, userId, faction, stars)
  - CampaignUnlock model (campaignId, packName, unlockedAt)
  - PermanentModification model (campaignId, type, data JSON)
  - CampaignGame model (campaignId, gameNumber, winnerId, completedAt)
- [ ] Configure database connections:
  - Development: SQLite or PostgreSQL local
  - Production: PostgreSQL
- [ ] Create initial migration: `bunx prisma migrate dev`
- [ ] Generate Prisma Client: `bunx prisma generate`
- [ ] Create database utility module:
  - Initialize Prisma Client
  - Connection helpers
  - Transaction utilities
- [ ] Create seed script for development data
- [ ] Add Prisma scripts to package.json

**Deliverable**:
- `prisma/schema.prisma` - Complete database schema
- `prisma/migrations/` - Migration files
- `src/server/db/client.ts` - Prisma client instance
- `src/server/db/seed.ts` - Seed script

---

### Module 1.4: Asset Loader & Build-Time Conversion
**Status**: Not Started
**Dependencies**: 1.1
**Estimated Context**: Medium

Tasks:
- [ ] Install dependencies: `bun add js-yaml zod && bun add -D @types/js-yaml`
- [ ] Create Zod schemas for all asset types:
  - Faction, Power, Territory, Scar, Sticker, Mission, Event
  - Validate YAML data during conversion
- [ ] Create build script to convert YAML → JSON:
  - Parse all YAML files in assets/unlocks/
  - **Ignore all .js files** (legacy FoundryVTT code)
  - Validate with Zod schemas
  - Output to `src/server/assets/data/` as JSON
  - Preserve directory structure and namespaces
- [ ] Create asset loader utility to:
  - Load pre-compiled JSON assets
  - Re-validate with Zod on load (optional, for safety)
  - Build card databases (factions, powers, territories, etc.)
  - Index cards by namespace
  - Track quantities for duplicates
- [ ] Implement pack-based filtering (base + unlocked only)
- [ ] Write unit tests for asset loading and validation

**Deliverable**:
- `src/server/assets/schemas.ts` - Zod schemas for all asset types
- `scripts/convert-assets.ts` - Build-time YAML→JSON converter with validation
- `src/server/assets/loader.ts` - Runtime asset loader
- `src/server/assets/data/*.json` - Compiled, validated asset files

---

## Phase 2: User & Campaign Management

### Module 2.1: User Authentication API
**Status**: Not Started
**Dependencies**: 1.3 (Database)
**Estimated Context**: Small

Tasks:
- [ ] Install auth dependencies via Bun:
  - `bun add hono @hono/jwt @hono/zod-validator`
  - `bun add bcrypt zod`
  - `bun add -D @types/bcrypt`
- [ ] Create Zod schemas for validation:
  ```typescript
  import { z } from 'zod'

  const RegisterSchema = z.object({
    username: z.string().min(3).max(20),
    password: z.string().min(8).max(100)
  })

  const LoginSchema = z.object({
    username: z.string(),
    password: z.string()
  })
  ```
- [ ] Create Hono routes with Zod validation:
  - POST /api/auth/register
  - POST /api/auth/login
  - GET /api/auth/me (with JWT middleware)
- [ ] Implement password hashing with bcrypt
- [ ] Use Hono's JWT middleware for token generation/verification
- [ ] Create authentication middleware for protected routes:
  ```typescript
  import { jwt } from '@hono/jwt'

  app.use('/api/*', jwt({ secret: JWT_SECRET }))
  ```
- [ ] Use Prisma Client for user queries with Zod validation
- [ ] Write integration tests

**Deliverable**: `src/server/api/auth.ts` with type-safe, validated authentication

---

### Module 2.2: Campaign Management API
**Status**: Not Started
**Dependencies**: 1.2 (Rules), 1.3 (Database), 1.4 (Assets), 2.1 (Auth)
**Estimated Context**: Medium

Tasks:
- [ ] Create Hono routes:
  - POST /api/campaigns (create new campaign)
  - GET /api/campaigns (list user's campaigns)
  - GET /api/campaigns/:id (get campaign details)
  - POST /api/campaigns/:id/invite (invite player)
  - GET /api/campaigns/:id/unlocks (get unlocked packs)
  - GET /api/campaigns/:id/rulebook (get campaign-specific rulebook)
- [ ] Implement campaign state management with Prisma:
  ```typescript
  // Create campaign
  await prisma.campaign.create({
    data: {
      name,
      creatorId: userId,
      state: {},
      players: {
        create: { userId, faction: null }
      }
    }
  })

  // Track unlocks
  await prisma.campaignUnlock.create({
    data: { campaignId, packName }
  })

  // Store permanent modifications
  await prisma.permanentModification.create({
    data: { campaignId, type: 'scar', data: { ... } }
  })
  ```
- [ ] Implement campaign initialization logic:
  - Initialize with base rulebook
  - Set up base pack assets
- [ ] Implement unlock condition checking
- [ ] Update rulebook when packs unlock
- [ ] Write integration tests

**Deliverable**: `src/server/api/campaigns.ts` with campaign CRUD operations

---

## Phase 3: Core Game Logic

### Module 3.1: Game State Definition
**Status**: Not Started
**Dependencies**: 1.3
**Estimated Context**: Medium

Tasks:
- [ ] Define TypeScript interfaces for:
  - Territory (owner, troops, hq, city, scars, etc.)
  - Player state (faction, power, stars, cards, etc.)
  - Combat state (attacker, defender, rolls, etc.)
  - Campaign state (unlocks, signatures, scars, etc.)
  - Deck state (territories, events, missions, etc.)
- [ ] Create board topology (territory adjacencies)
- [ ] Implement initial state setup function
- [ ] Create state helper utilities (getTerritory, addTroops, etc.)

**Deliverable**: `src/server/game/state.ts` with complete state types

---

### Module 3.2: Setup Phase
**Status**: Not Started
**Dependencies**: 3.1
**Estimated Context**: Medium

Tasks:
- [ ] Implement setup phase in boardgame.io:
  - Faction selection (turn order based on campaign stars)
  - Power selection (1 of 2 starting powers)
  - Initial troop placement
  - HQ placement
- [ ] Create moves:
  - chooseFaction(factionId)
  - choosePower(powerId)
  - placeInitialTroop(territoryId)
  - placeHQ(territoryId)
- [ ] Implement turn order logic (fewer stars go first)
- [ ] Add validation for setup moves
- [ ] Create stage transitions

**Deliverable**: `src/server/game/phases/setup.ts` with working setup phase

---

### Module 3.3: Recruit Phase
**Status**: Not Started
**Dependencies**: 3.1
**Estimated Context**: Small

Tasks:
- [ ] Implement recruit troop calculation:
  - Count territories + population
  - Divide by 3, round down (unless Balkania)
  - Minimum 3 troops
- [ ] Create move: recruitTroops(placements: Map<territoryId, count>)
- [ ] Implement card turn-in logic:
  - 3 same territory = 4 troops
  - 3 different continents = 8 troops
  - 3+ matching values = 4 × value troops
- [ ] Add validation for troop placement
- [ ] Handle faction-specific recruitment bonuses

**Deliverable**: `src/server/game/phases/recruit.ts`

---

### Module 3.4: Combat System
**Status**: Not Started
**Dependencies**: 3.1
**Estimated Context**: Large

Tasks:
- [ ] Implement dice rolling (using ctx.random.Die(6))
- [ ] Create combat resolution logic:
  - Compare highest dice (ties to defender)
  - Compare second dice if both have 2+
  - Apply fortification bonus
  - Apply faction power modifiers
- [ ] Create moves:
  - attack(fromTerritory, toTerritory)
  - rollAttack(numDice)
  - rollDefense(numDice)
  - resolveCombat()
  - conquorTerritory()
  - retreat()
- [ ] Implement missile usage
- [ ] Handle special combat conditions:
  - Natural 6s
  - Three-of-a-kind
  - Fortified territories
  - HQ conquest (award star)
- [ ] Track combat for unlock conditions (3 missiles, etc.)
- [ ] Add comprehensive validation

**Deliverable**: `src/server/game/combat.ts` with complete combat system

---

### Module 3.5: Maneuver & Card Draw
**Status**: Not Started
**Dependencies**: 3.1
**Estimated Context**: Small

Tasks:
- [ ] Implement maneuver move:
  - Move troops between connected territories
  - Saharan Republic special: move between any territories
  - Validate movement legality
- [ ] Implement card drawing:
  - Draw territory card if conquered 1+ territories
  - Draw coin card if conquered 4+ territories
  - Balkania special: can draw coin on 4+ expansion
- [ ] Create moves:
  - maneuver(from, to, count)
  - drawCard(type)
- [ ] Add turn-end validation

**Deliverable**: `src/server/game/phases/maneuver.ts`

---

### Module 3.6: Victory & End Game
**Status**: Not Started
**Dependencies**: 3.1
**Estimated Context**: Medium

Tasks:
- [ ] Implement star tracking:
  - HQ conquest = 1 star
  - Mission completion = 1 star
  - 10+ red stars controlled = 1 star
  - Winning game = 1-2 stars
- [ ] Create endIf condition (first to 4 stars)
- [ ] Implement end-game phase:
  - Winner signs board
  - Winner places victory sticker
  - Players add scars to factions
  - Check unlock conditions
  - Open new packs if triggered
- [ ] Create moves:
  - signBoard(location, text)
  - placeVictorySticker(territoryId, stickerId)
  - addScar(factionId, scarId)
- [ ] Update campaign state with permanent changes
- [ ] Trigger pack unlocks

**Deliverable**: `src/server/game/phases/endgame.ts`

---

### Module 3.7: Mission System
**Status**: Not Started
**Dependencies**: 3.1
**Estimated Context**: Medium

Tasks:
- [ ] Implement mission dealing (secret to each player)
- [ ] Create mission validation logic for each type:
  - Continent control
  - Player elimination
  - Territory control
  - Troop thresholds
  - Combat achievements
- [ ] Implement mission completion detection
- [ ] Create moves:
  - claimMission() - attempt to complete mission
  - discardMission() - once per game
- [ ] Award star on completion
- [ ] Handle private mission unlocks

**Deliverable**: `src/server/game/missions.ts`

---

### Module 3.8: Faction Powers
**Status**: Not Started
**Dependencies**: 3.1, 3.2, 3.3, 3.4, 3.5
**Estimated Context**: Large

Tasks:
- [ ] Implement all 10 starting faction powers:
  - Khan 1: Troop at HQ start of turn
  - Khan 2: Troop when drawing territory card
  - Mechaniker 1: Starting HQ always fortified
  - Mechaniker 2: Double 6s block territory
  - Enclave 1: -1 to defender first attack
  - Enclave 2: Three of a kind conquers
  - Balkania 1: Round up when recruiting
  - Balkania 2: Draw card on 4+ expansion without conquest
  - Saharan 1: Maneuver anytime
  - Saharan 2: Maneuver anywhere
- [ ] Create power effect system:
  - onTurnStart hooks
  - onAttack hooks
  - onDefend hooks
  - onRecruit hooks
  - onManeuver hooks
  - onDrawCard hooks
- [ ] Implement power selection during setup
- [ ] Add unlocked powers from campaign
- [ ] Test all power interactions

**Deliverable**: `src/server/game/powers.ts` with all faction powers

---

### Module 3.9: Legacy Systems (Stickers & Scars)
**Status**: Not Started
**Dependencies**: 3.1, 3.6
**Estimated Context**: Medium

Tasks:
- [ ] Implement sticker placement:
  - City founding (minor cities, world capital)
  - Resource value increases
  - Victory bonuses
  - Territory naming
  - Custom stickers from unlocks
- [ ] Implement scar system:
  - Track scars per faction
  - Apply negative effects during gameplay
  - Prevent duplicate scars
- [ ] Create persistent modification storage:
  - Store in campaign state
  - Apply to new games in campaign
  - Track sticker quantities
- [ ] Create moves:
  - foundCity(territoryId, cityName, type)
  - increaseValue(cardId)
  - placeSticker(stickerId, location)
- [ ] Validate sticker availability

**Deliverable**: `src/server/game/legacy.ts`

---

## Phase 4: Integration & Server

### Module 4.1: Complete Game Definition
**Status**: Not Started
**Dependencies**: 3.1-3.9
**Estimated Context**: Small

Tasks:
- [ ] Combine all phases into single game definition
- [ ] Configure turn structure and order
- [ ] Set up stage transitions
- [ ] Implement playerView for secret information
- [ ] Add AI configuration (optional)
- [ ] Create game factory that accepts campaign state
- [ ] Write integration tests for full game flow

**Deliverable**: `src/server/game/index.ts` exporting complete game

---

### Module 4.2: boardgame.io Server Setup
**Status**: Not Started
**Dependencies**: 1.3 (Database), 4.1 (Game Definition)
**Estimated Context**: Small

Tasks:
- [ ] Install boardgame.io server dependencies via Bun:
  - `bun add boardgame.io koa @koa/cors koa-body`
- [ ] Create boardgame.io server instance
- [ ] Configure database adapter:
  - Development: FlatFile
  - Production: Custom Prisma adapter or PostgreSQL adapter
- [ ] Set up lobby system (boardgame.io built-in)
- [ ] Implement custom authentication integration:
  - Validate JWT tokens from our auth system
  - Link boardgame.io credentials to user accounts
- [ ] Configure CORS and security
- [ ] Add logging middleware (compatible with Bun)
- [ ] Create health check endpoint
- [ ] Configure WebSocket support

**Deliverable**: `src/server/boardgame-server.ts`

**Note**: Ensure all middleware is compatible with Bun runtime

---

### Module 4.3: Lobby API Integration
**Status**: Not Started
**Dependencies**: 1.2 (Rules Parser), 2.2, 4.2
**Estimated Context**: Medium

Tasks:
- [ ] Create Hono routes to extend boardgame.io lobby with campaign context:
  - POST /api/lobbies (create lobby for campaign)
  - GET /api/lobbies (list user's active lobbies)
  - POST /api/lobbies/:id/join (join with campaign validation)
  - POST /api/lobbies/:id/start (start game in campaign)
  - GET /api/lobbies/:id/rulebook (get lobby-specific rulebook)
- [ ] Validate players belong to campaign
- [ ] Enforce faction uniqueness per campaign
- [ ] Initialize game with campaign state
- [ ] **Attach campaign-specific rulebook to lobby**:
  - Each lobby gets a compiled rulebook based on campaign unlocks
  - Clients can query rulebook during gameplay
  - Support rule lookups by section/keyword
- [ ] Update campaign after game completion
- [ ] Handle game save/load

**Deliverable**: `src/server/api/lobbies.ts`

---

### Module 4.4: Asset Serving API
**Status**: Not Started
**Dependencies**: 1.4 (Asset Loader)
**Estimated Context**: Small

Tasks:
- [ ] Create Hono routes:
  - GET /api/assets/packs (list available packs for campaign)
  - GET /api/assets/factions (get faction data)
  - GET /api/assets/powers (get power cards)
  - GET /api/assets/territories (get territory cards)
  - GET /api/assets/board (get board image URLs)
- [ ] Implement static file serving for images
- [ ] Add caching headers
- [ ] Filter assets by campaign unlocks

**Deliverable**: `src/server/api/assets.ts`

---

### Module 4.5: Main Server Application
**Status**: Not Started
**Dependencies**: 2.1, 2.2, 4.2, 4.3, 4.4
**Estimated Context**: Small

Tasks:
- [ ] Create Hono application
- [ ] Mount all API routes:
  ```typescript
  import { Hono } from 'hono'
  import { logger } from 'hono/logger'
  import { cors } from 'hono/cors'

  const app = new Hono()

  // Middleware
  app.use('*', logger())
  app.use('*', cors({ origin: allowedOrigins }))

  // Routes
  app.route('/api/auth', authRoutes)
  app.route('/api/campaigns', campaignRoutes)
  app.route('/api/lobbies', lobbyRoutes)
  app.route('/api/assets', assetRoutes)
  app.route('/api/rulebook', rulebookRoutes)
  ```
- [ ] Integrate boardgame.io server (Koa) with Hono:
  - Mount boardgame.io at /game
  - Or run on separate port
- [ ] Add error handling middleware
- [ ] Add request logging (Hono's built-in logger)
- [ ] Configure environment-based settings (.env)
- [ ] Create startup script using Bun.serve:
  ```typescript
  export default {
    port: process.env.PORT || 8000,
    fetch: app.fetch,
  }
  ```
- [ ] Add graceful shutdown handling
- [ ] Create development and production startup scripts

**Deliverable**: `src/server/index.ts` - main server entry point

**Note**: Hono works natively with Bun.serve() for optimal performance

---

## Phase 5: Advanced Features

### Module 5.1: Event System
**Status**: Not Started
**Dependencies**: 4.1
**Estimated Context**: Medium

Tasks:
- [ ] Implement event card drawing
- [ ] Create event effect system (similar to powers)
- [ ] Add unlocked events from campaign
- [ ] Implement event timing (start of turn, combat, etc.)
- [ ] Create event resolution moves
- [ ] Test event interactions with powers

**Deliverable**: `src/server/game/events.ts`

---

### Module 5.2: Advanced Unlock Packs
**Status**: Not Started
**Dependencies**: 1.3, 3.6, 5.1
**Estimated Context**: Large (one module per pack)

Tasks per pack:
- [ ] Parse pack-specific cards (missions, events, rules, powers)
- [ ] Implement new rules modifications
- [ ] Add new faction powers
- [ ] Integrate new missions
- [ ] Test unlock triggers
- [ ] Update campaign state on unlock

**Packs to implement** (in order):
1. secondwin - New missions, events, evolution rules
2. worldcapital - Private missions, lead faction, world capital
3. minorcities - Draft system, city mechanics
4. eliminated - Elimination rules and powers
5. thirtytroops - Faction variants, new scars
6. threemissiles - Mutant powers, enhanced missiles

**Deliverable**: `src/server/game/unlocks/` with pack-specific logic

---

### Module 5.3: Game Save/Load & Replay
**Status**: Not Started
**Dependencies**: 4.2
**Estimated Context**: Small

Tasks:
- [ ] Implement save game state to database
- [ ] Implement load game from database
- [ ] Add game pause/resume functionality
- [ ] Create game history/replay viewer (API only)
- [ ] Add turn-by-turn log export
- [ ] Test save/load integrity

**Deliverable**: Enhanced database module with save/load

---

### Module 5.4: Validation & Error Handling
**Status**: Not Started
**Dependencies**: 4.1
**Estimated Context**: Medium

Tasks:
- [ ] Add comprehensive move validation:
  - Territory ownership
  - Troop counts
  - Adjacency requirements
  - Phase/stage restrictions
- [ ] Implement INVALID_MOVE returns
- [ ] Create detailed error messages
- [ ] Add move legality checking API
- [ ] Write validation unit tests
- [ ] Test edge cases and exploits

**Deliverable**: `src/server/game/validation.ts`

---

## Phase 6: Testing & Documentation

### Module 6.1: Unit Tests
**Status**: Not Started
**Dependencies**: All game logic modules
**Estimated Context**: Large

Tasks:
- [ ] Test asset loading
- [ ] Test state initialization
- [ ] Test all moves in isolation
- [ ] Test combat system thoroughly
- [ ] Test all faction powers
- [ ] Test mission completion
- [ ] Test unlock conditions
- [ ] Test campaign state updates
- [ ] Achieve >80% code coverage

**Deliverable**: Comprehensive test suite in `src/server/__tests__/`

---

### Module 6.2: Integration Tests
**Status**: Not Started
**Dependencies**: 4.5
**Estimated Context**: Medium

Tasks:
- [ ] Test complete game flows (setup → win)
- [ ] Test API endpoints
- [ ] Test authentication flows
- [ ] Test campaign creation and management
- [ ] Test lobby system
- [ ] Test save/load cycles
- [ ] Test concurrent games
- [ ] Test error scenarios

**Deliverable**: Integration tests in `src/server/__integration__/`

---

### Module 6.3: API Documentation
**Status**: Not Started
**Dependencies**: 4.5
**Estimated Context**: Small

Tasks:
- [ ] Document all API endpoints (OpenAPI/Swagger)
- [ ] Create API usage examples
- [ ] Document authentication flow
- [ ] Document game flow via API
- [ ] Create Postman collection
- [ ] Write API quickstart guide

**Deliverable**: `API.md` and OpenAPI spec file

---

## Phase 7: Deployment & DevOps

### Module 7.1: Docker Configuration
**Status**: Not Started
**Dependencies**: 4.5
**Estimated Context**: Small

Tasks:
- [ ] Create Dockerfile for server
- [ ] Create docker-compose.yml (server + postgres)
- [ ] Configure environment variables
- [ ] Add health checks
- [ ] Optimize image size
- [ ] Test container deployment

**Deliverable**: Working Docker setup

---

### Module 7.2: Production Configuration
**Status**: Not Started
**Dependencies**: 7.1
**Estimated Context**: Small

Tasks:
- [ ] Set up production database
- [ ] Configure SSL/TLS
- [ ] Set up logging aggregation
- [ ] Configure monitoring
- [ ] Set up backup strategy
- [ ] Create deployment scripts
- [ ] Write deployment documentation

**Deliverable**: Production-ready deployment

---

## Current Status Summary

**Last Updated**: 2025-01-04

### ✅ Completed Modules
- **Planning Phase**: All planning documents created
  - Plan.md ✅
  - GAME_INDEX.md ✅
  - ASSETS_INDEX.md ✅
  - BOARDGAMEIO_INDEX.md ✅
  - RULEBOOK_SPEC.md ✅
  - BUN_PRISMA_NOTES.md ✅
  - HONO_NOTES.md ✅
  - ZOD_NOTES.md ✅
  - .env.example ✅
  - package.json (initial setup) ✅

### 🚧 In Progress
- None

### ⏭️ Next Module to Implement
**Module 1.1: Project Setup**
- Status: Partially Complete (package.json exists)
- File: See Phase 1, Module 1.1 below
- Next action: Install dependencies and create directory structure

### 📋 Upcoming Modules (In Order)
1. ✅ Module 1.1: Project Setup
2. Module 1.2: Rules Parser & Machine-Readable Rulebook ⚠️ HIGH PRIORITY
3. Module 1.3: Database Schema & Setup (Prisma)
4. Module 1.4: Asset Loader & Build-Time Conversion
5. Module 2.1: User Authentication API
6. Module 2.2: Campaign Management API
... (see full list in Phase sections below)

### 📊 Progress Tracking
- **Phase 1** (Foundation): 0/4 modules complete
- **Phase 2** (User & Campaign): 0/2 modules complete
- **Phase 3** (Core Game): 0/8 modules complete (2 deferred to post-MVP)
- **Phase 4** (Integration): 0/5 modules complete
- **Phase 5+** (Advanced): Deferred to post-MVP

**Total Progress**: 0/19 MVP modules complete

### 🎯 Current Sprint Goal
Complete Phase 1 (Foundation & Infrastructure) - 4 modules

---

## Deferred Decisions (Post-MVP)

### Infrastructure
1. **Caching**: Redis for session/game state caching?
2. **CDN**: Move image serving to external CDN for production?
3. **Scaling**: Load balancing for multiple server instances?

### Game Features
1. **Turn Timer**: Implement turn time limits?
2. **Spectators**: Allow non-players to watch games?
3. **Replays**: Full replay functionality or just logs?
4. **OAuth**: Add social login (Google, GitHub, etc.)?

### Optimizations
1. **State Size**: Optimize state structure for large campaign histories?
2. **Asset Loading**: Lazy load unlock packs vs load all and filter?
3. **Caching Strategy**: Cache compiled game definitions per campaign?

---

## Time Estimates

**Small modules**: 1-3 hours (context: ~10k-20k tokens)
**Medium modules**: 3-6 hours (context: ~20k-40k tokens)
**Large modules**: 6+ hours (context: ~40k+ tokens, may need splitting)

**Total estimated time**: 80-120 hours
**Phases can be parallelized** where dependencies allow

---

## Resumption Strategy

When resuming work:
1. Read this Plan.md to see overall progress
2. Check module status and dependencies
3. Review relevant index files (GAME_INDEX.md, etc.)
4. Start with the next pending module
5. Update status in this file when complete
6. Commit progress regularly

Each module is designed to be self-contained and produce a working deliverable that can be tested independently.

# Resume Guide - Risk Legacy Implementation

## Quick Start (New Claude Context)

### Step 1: Understand the Project
Read this section FIRST, then jump to Step 2.

**What we're building**:
A complete API server for Risk Legacy (board game) using boardgame.io. Players can create campaigns, play games via API calls, and the game state persists across multiple games with legacy mechanics (permanent changes, unlocks, etc.).

**Tech Stack**:
- **Bun** - JavaScript runtime (faster than Node.js)
- **Hono** - Web framework (faster than Express)
- **Zod** - Runtime validation + TypeScript types
- **Prisma** - Database ORM (PostgreSQL in prod, SQLite in dev)
- **boardgame.io** - Game state management framework
- **TypeScript** - Type safety

**Key Concept**: This is an API-first design. No UI needed - everything is accessible via REST API and WebSockets.

### Step 2: Check Current Status

**Command**:
```
"Read /Users/spacemandev/Projects/fvtt-risklegacy-v2/Plan.md and tell me:
1. What is the next module to implement?
2. What is its current status?
3. What are the prerequisites?"
```

Look at the "Current Status Summary" section in Plan.md (near the bottom).

### Step 3: Read Module Documentation

Before implementing ANY module, read these files:

**Always Read**:
1. `Plan.md` - Find your module, read its tasks
2. `GAME_INDEX.md` - Understand Risk Legacy rules
3. `ASSETS_INDEX.md` - Understand game assets structure

**Read Based on Module**:
- **Database modules** → Read `BUN_PRISMA_NOTES.md`
- **API modules** → Read `HONO_NOTES.md` + `ZOD_NOTES.md`
- **Rules modules** → Read `RULEBOOK_SPEC.md`
- **Game logic modules** → Read `BOARDGAMEIO_INDEX.md`
- **Asset modules** → Read `ASSETS_INDEX.md`

### Step 4: Execute Module Tasks

Each module in Plan.md has:
- **Status**: Not Started / In Progress / Complete
- **Dependencies**: What must be done first
- **Tasks**: Checkbox list of work items
- **Deliverable**: What files should exist when done

Work through tasks top to bottom, checking them off:
```markdown
- [x] Completed task
- [ ] Pending task
```

### Step 5: Update Progress

When module is complete:
1. Change module status to "Complete"
2. Update "Current Status Summary" section
3. Move to next module

---

## Module Dependencies Quick Reference

```
Phase 1 (Foundation):
├─ 1.1: Project Setup (no dependencies)
├─ 1.2: Rules Parser (depends on 1.1)
├─ 1.3: Database Setup (depends on 1.1)
└─ 1.4: Asset Loader (depends on 1.1)

Phase 2 (User & Campaign):
├─ 2.1: Auth API (depends on 1.3)
└─ 2.2: Campaign API (depends on 1.2, 1.3, 1.4, 2.1)

Phase 3 (Core Game):
├─ 3.1: Game State (depends on 1.4)
├─ 3.2: Setup Phase (depends on 3.1)
├─ 3.3: Recruit Phase (depends on 3.1)
├─ 3.4: Combat System (depends on 3.1)
├─ 3.5: Maneuver & Cards (depends on 3.1)
├─ 3.6: Victory & End Game (depends on 3.1)
└─ 3.8: Faction Powers (depends on 3.1-3.5)

Phase 4 (Integration):
├─ 4.1: Complete Game Definition (depends on all Phase 3)
├─ 4.2: boardgame.io Server (depends on 1.3, 4.1)
├─ 4.3: Lobby API (depends on 1.2, 2.2, 4.2)
├─ 4.4: Asset Serving API (depends on 1.4)
└─ 4.5: Main Server (depends on all Phase 2 & 4)
```

**Critical Path** (must do in order):
1.1 → 1.3 → 2.1 → 2.2 (can then parallelize game logic)

---

## Common Resume Scenarios

### Scenario 1: Brand New Start
**Situation**: No code written yet, starting from scratch

**Steps**:
1. Read Plan.md sections: Overview, Architecture Decisions, MVP Scope
2. Read Module 1.1 tasks
3. Say: "I'm ready to begin Module 1.1: Project Setup. Please install dependencies and create the directory structure per the plan."

**Expected First Actions**:
- Run `bun install` to install dependencies
- Create `src/server/` directory structure
- Create initial config files

---

### Scenario 2: Mid-Phase Resume
**Situation**: Some modules complete, resuming mid-phase

**Steps**:
1. Read "Current Status Summary" in Plan.md
2. Find first module with status "In Progress" or "Not Started"
3. Check if dependencies are met (all prerequisite modules marked complete)
4. Read that module's tasks
5. Say: "I'm resuming Module X.Y: [Name]. I see tasks 1-3 are complete. Please continue from task 4."

**Example**:
```
"I'm resuming Module 2.1: User Authentication API.
I see dependencies are installed and schemas are created.
Please implement the Hono routes starting from task 4."
```

---

### Scenario 3: Module Complete, Next Steps Unclear
**Situation**: Just finished a module, not sure what's next

**Steps**:
1. Update Plan.md: Mark completed module status as "Complete"
2. Update "Current Status Summary" section
3. Check module dependencies - find first module where all dependencies are now met
4. Say: "Module X.Y is complete. According to the dependency graph, I can now start Module A.B. Please begin."

---

### Scenario 4: Testing/Validation Needed
**Situation**: Code written but needs testing before moving on

**Steps**:
1. Check module's "Deliverable" section - lists expected files
2. Verify all deliverable files exist
3. Run relevant test commands from package.json
4. Say: "Module X.Y implementation is complete. Please verify deliverables and run tests before marking as complete."

**Test Commands**:
```bash
bun run type-check        # TypeScript validation
bun test                  # Run tests
bun run db:generate       # Verify Prisma schema
bun run convert-assets    # Verify asset conversion
```

---

## File Checklist by Phase

### Phase 1 Deliverables
After completing Phase 1, these files should exist:

```
✅ Plan.md
✅ GAME_INDEX.md
✅ ASSETS_INDEX.md
✅ BOARDGAMEIO_INDEX.md
✅ RULEBOOK_SPEC.md
✅ BUN_PRISMA_NOTES.md
✅ HONO_NOTES.md
✅ ZOD_NOTES.md
✅ .env.example
✅ package.json
□ src/server/index.ts
□ src/server/api/ (directory)
□ src/server/db/client.ts
□ src/server/rules/base-rules.json
□ src/server/assets/data/*.json
□ prisma/schema.prisma
□ scripts/convert-assets.ts
```

### Phase 2 Deliverables
```
□ src/server/api/auth.ts
□ src/server/api/campaigns.ts
□ src/server/schemas/auth.ts
□ src/server/schemas/campaign.ts
□ src/server/middleware/auth.ts
```

### Phase 3 Deliverables
```
□ src/server/game/state.ts
□ src/server/game/phases/setup.ts
□ src/server/game/phases/recruit.ts
□ src/server/game/combat.ts
□ src/server/game/phases/maneuver.ts
□ src/server/game/phases/endgame.ts
□ src/server/game/powers.ts
□ src/server/game/index.ts
```

### Phase 4 Deliverables
```
□ src/server/boardgame-server.ts
□ src/server/api/lobbies.ts
□ src/server/api/assets.ts
□ Server running on http://localhost:8000
```

---

## Essential Commands Reference

### Development
```bash
bun run dev              # Start dev server (auto-reload)
bun run build            # Build for production
bun run start            # Run production build
```

### Database (Prisma)
```bash
bun run db:generate      # Generate Prisma Client
bun run db:migrate       # Create & apply migration
bun run db:studio        # Open Prisma Studio (GUI)
bun run db:seed          # Seed database with test data
bun run db:reset         # Reset database (WARNING: deletes data)
```

### Assets
```bash
bun run convert-assets   # Convert YAML → JSON
```

### Testing
```bash
bun test                 # Run all tests
bun run type-check       # TypeScript type checking
```

---

## Quick Reference: Tech Stack APIs

### Hono (Web Framework)
```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { jwt } from '@hono/jwt'

const app = new Hono()

app.post('/api/endpoint',
  zValidator('json', MySchema),  // Validate input
  jwt({ secret: SECRET }),       // Protect route
  async (c) => {
    const data = c.req.valid('json')
    return c.json({ result: data })
  }
)
```

### Zod (Validation)
```typescript
import { z } from 'zod'

const Schema = z.object({
  name: z.string().min(3),
  age: z.number().int().min(0)
})

type Data = z.infer<typeof Schema>  // TypeScript type
```

### Prisma (Database)
```typescript
import { prisma } from './db/client'

const user = await prisma.user.create({
  data: { username: 'alice', passwordHash: 'hash' }
})

const campaigns = await prisma.campaign.findMany({
  where: { creatorId: userId },
  include: { players: true }
})
```

### boardgame.io (Game Engine)
```typescript
const RiskLegacy = {
  name: 'risk-legacy',
  setup: (ctx) => ({ /* initial state */ }),
  moves: {
    attack: (G, ctx, from, to) => { /* modify G */ }
  },
  phases: {
    setup: { /* ... */ },
    main: { /* ... */ }
  }
}
```

---

## Troubleshooting

### "Module dependencies not met"
**Problem**: Trying to implement module X but prerequisite modules aren't done

**Solution**: Check Plan.md dependency tree. Complete prerequisite modules first.

---

### "Files missing that should exist"
**Problem**: Documentation says file should exist but it doesn't

**Solution**: Check "Current Status Summary" - that module may not be complete yet. Go back and finish that module.

---

### "Environment variables missing"
**Problem**: Server won't start, complaining about missing env vars

**Solution**:
1. Copy `.env.example` to `.env`
2. Fill in required values
3. Run `bun run dev` again

---

### "Prisma Client not found"
**Problem**: Import error when trying to use Prisma

**Solution**: Run `bun run db:generate` to generate Prisma Client

---

### "TypeScript errors"
**Problem**: Type errors when implementing code

**Solution**:
1. Run `bun run type-check` to see all errors
2. Ensure Prisma Client is generated
3. Check Zod schemas are imported correctly

---

## Success Criteria

You'll know you're done with a module when:

1. ✅ All task checkboxes are marked `[x]`
2. ✅ All deliverable files exist
3. ✅ TypeScript compiles without errors (`bun run type-check`)
4. ✅ Tests pass (if module includes tests)
5. ✅ Module status updated to "Complete" in Plan.md
6. ✅ "Current Status Summary" section updated

---

## Getting Help

If stuck or unclear:

1. **Re-read the module's reference docs** (listed in Dependencies)
2. **Check similar modules** (how was auth implemented? copy pattern)
3. **Review tech stack guides** (HONO_NOTES.md, ZOD_NOTES.md, etc.)
4. **Ask specific questions**: "I'm implementing Module X.Y, task Z. How should I structure the Zod schema for this API endpoint?"

---

## Example: Perfect Resume

**User**:
```
I'm continuing the Risk Legacy project. I've read Plan.md.
The Current Status Summary shows Module 1.1 is next (Project Setup).
I see package.json exists but directory structure is not created yet.
Please complete Module 1.1 starting from task 5 (create directory structure).
```

**Claude**:
```
Perfect! I'll complete Module 1.1: Project Setup. I can see:

✅ package.json exists with all dependencies defined
✅ .env.example exists
⏭️ Next: Create src/server/ directory structure

Let me create the complete directory structure and install dependencies...
[proceeds with implementation]
```

---

## Remember

- **One module at a time** - Don't skip ahead
- **Check dependencies** - Make sure prerequisites are done
- **Update progress** - Keep Plan.md current
- **Test as you go** - Don't accumulate untested code
- **Read before coding** - 5 minutes reading docs saves 30 minutes debugging

---

**You're ready to resume! Start with Plan.md and find your next module.** 🚀

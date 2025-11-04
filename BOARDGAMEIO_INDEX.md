# boardgame.io Architecture Index

## Core Concepts

### Game Definition
A boardgame.io game is defined by a configuration object:

```typescript
{
  name: string,           // Game identifier
  setup: (ctx) => G,      // Initial state setup
  moves: {...},           // Player actions
  phases: {...},          // Game phases
  turn: {...},            // Turn structure
  endIf: (G, ctx) => {}, // Win condition
  ai: {...},             // AI configuration (optional)
}
```

### State Management

**G (Game State)**:
- Arbitrary object structure
- Managed by boardgame.io framework
- Automatically synchronized across clients
- Includes all game data (board, cards, scores, etc.)

**ctx (Context)**:
- Framework-provided metadata
- Contains: currentPlayer, numPlayers, phase, turn, etc.
- Read-only information about game state
- Accessed in moves, phases, and hooks

### Moves
Player actions that modify game state:

```typescript
moves: {
  moveName: (G, ctx, ...args) => {
    // Modify G directly or return new G
    // G mutations are tracked by framework
  }
}
```

Key points:
- Moves can only be called by eligible players
- Framework validates and logs all moves
- Can be restricted by phase/stage
- Support undo/redo automatically

### Phases
Top-level game flow control:

```typescript
phases: {
  phaseName: {
    start: true,              // Start phase
    next: 'nextPhase',        // Next phase
    onBegin: (G, ctx) => {},  // Phase start hook
    onEnd: (G, ctx) => {},    // Phase end hook
    endIf: (G, ctx) => {},    // Auto-advance condition
    moves: {...},             // Phase-specific moves
    turn: {...},              // Turn config for this phase
  }
}
```

Use cases:
- Setup phase
- Main gameplay phase
- Scoring phase
- Different game rounds

### Turns
Manages turn order and player actions:

```typescript
turn: {
  order: TurnOrder.DEFAULT, // or custom function
  onBegin: (G, ctx) => {},  // Turn start
  onEnd: (G, ctx) => {},    // Turn end
  endIf: (G, ctx) => {},    // Auto-end turn
  stages: {...},            // Substages within turn
}
```

Turn order strategies:
- `TurnOrder.DEFAULT` - Sequential
- `TurnOrder.RESET` - Restart from first player
- `TurnOrder.CONTINUE` - Continue from current
- Custom function for complex order

### Stages
Sub-states within a turn (optional):

```typescript
stages: {
  stageName: {
    moves: {...},           // Stage-specific moves
    next: 'nextStage',      // Stage progression
  }
}
```

Use for:
- Multi-step player actions
- Simultaneous play phases
- Responses/interruptions

## Server Architecture

### Server Setup

```typescript
import { Server } from 'boardgame.io/server';

const server = Server({
  games: [MyGame],        // Array of game definitions
  db: new FlatFile(),     // Database adapter
});

server.run(8000);
```

### Database Adapters
boardgame.io supports multiple storage backends:

1. **FlatFile** - JSON files (dev/testing)
2. **PostgreSQL** - Production database
3. **MongoDB** - NoSQL option
4. **Custom** - Implement interface

Database stores:
- Game state (G)
- Metadata (ctx)
- Move log
- Player credentials

### Lobby System

The framework provides built-in lobby functionality:

**Lobby API Endpoints**:
- `POST /games/{name}/create` - Create game
- `GET /games/{name}` - List games
- `GET /games/{name}/{id}` - Get game info
- `POST /games/{name}/{id}/join` - Join game
- `POST /games/{name}/{id}/leave` - Leave game
- `POST /games/{name}/{id}/playAgain` - Rematch
- `POST /games/{name}/{id}/rename` - Rename game

**Game Instance Data**:
```typescript
{
  gameID: string,
  players: {
    '0': { name?: string, credentials?: string },
    '1': { name?: string, credentials?: string },
  },
  setupData: any,
  unlisted: boolean,
}
```

### Authentication

Built-in authentication options:

1. **Lobby Credentials**:
   - Generated when joining game
   - Returned to client
   - Required for subsequent moves
   - Stored in database

2. **Custom Authentication**:
```typescript
const server = Server({
  games: [MyGame],
  authenticateCredentials: async (credentials, playerMetadata) => {
    // Custom auth logic
    return true/false;
  },
});
```

### API Endpoints

**Standard Game API** (auto-generated):
- `POST /games/{name}/{id}/move` - Execute move
- `POST /games/{name}/{id}/undo` - Undo move
- `POST /games/{name}/{id}/redo` - Redo move
- `GET /games/{name}/{id}` - Get state

Request format:
```typescript
{
  playerID: '0',
  credentials: 'token',
  move: 'moveName',
  args: [...],
}
```

## State Persistence

### Saving Games
boardgame.io automatically persists:
- Game state after every move
- Metadata updates
- Complete move history

### Loading Games
State restoration:
- Automatic on server restart
- Lazy loading from database
- Full replay from move log

### Custom Persistence
Override database methods:
```typescript
class CustomDB {
  async connect() {}
  async createMatch(id, opts) {}
  async fetch(id, opts) {}
  async listMatches(opts) {}
  async wipe(id) {}
  async setState(id, state) {}
}
```

## Advanced Features

### Logging
Built-in move logging:
- Tracks all state changes
- Time-travel debugging
- Replay capability
- Audit trail

### Plugins
Extend functionality:
```typescript
const myPlugin = {
  name: 'my-plugin',
  setup: (G) => G,
  api: {
    // Custom API methods
  },
}
```

### Events
Framework events:
- `ctx.events.endTurn()` - End current turn
- `ctx.events.endPhase()` - End current phase
- `ctx.events.setPhase('name')` - Jump to phase
- `ctx.events.endGame()` - End game
- `ctx.events.setActivePlayers({...})` - Set active players

### Random API
Deterministic randomness:
```typescript
// In game config
import { INVALID_MOVE } from 'boardgame.io/core';

moves: {
  rollDice: (G, ctx) => {
    const roll = ctx.random.Die(6);
    G.lastRoll = roll;
  },

  shuffle: (G, ctx) => {
    G.deck = ctx.random.Shuffle(G.deck);
  },
}
```

Uses seeded RNG for:
- Reproducible games
- Replay capability
- Fair randomness

### Secret State
Hide information from players:
```typescript
playerView: (G, ctx, playerID) => {
  // Return modified G with hidden info
  const visibleState = { ...G };
  delete visibleState.secretCards;
  return visibleState;
}
```

## Server Configuration

### Full Server Setup
```typescript
import { Server, FlatFile } from 'boardgame.io/server';
import { PostgresStore } from 'bgio-postgres';

const server = Server({
  games: [MyGame, AnotherGame],

  // Database
  db: new PostgresStore('postgresql://...'),

  // Authentication
  authenticateCredentials: customAuth,

  // Lobby configuration
  lobbyConfig: {
    apiPort: 8080,
    apiCallback: () => console.log('Lobby API running'),
  },

  // CORS
  origins: ['http://localhost:3000'],
});

server.run({
  port: 8000,
  callback: () => console.log('Server running'),
});
```

## Integration with Risk Legacy

### State Structure Recommendation
```typescript
interface RiskLegacyState {
  // Board
  territories: Territory[];
  adjacencies: Map<string, string[]>;

  // Players
  players: PlayerState[];

  // Campaign
  campaign: {
    unlockedPacks: string[];
    signatures: Signature[];
    permanentScars: Scar[];
    cityPlacements: City[];
  };

  // Current Game
  currentGame: {
    missions: Map<playerID, Mission>;
    resourceCards: Map<playerID, Card[]>;
    availableStickers: Sticker[];
  };

  // Decks
  decks: {
    territories: Card[];
    events: Card[];
    missions: Card[];
    scars: Card[];
  };
}
```

### Phase Structure
```typescript
phases: {
  setup: {
    // Faction selection, power choice, initial placement
  },
  main: {
    turn: {
      order: TurnOrder.DEFAULT,
      stages: {
        recruit: {},
        attack: {},
        maneuver: {},
        drawCard: {},
      }
    }
  },
  endGame: {
    // Winner signs board, players add scars, check unlocks
  },
  campaign: {
    // Between-game state, setup next game
  }
}
```

### Move Structure
```typescript
moves: {
  // Setup
  chooseFaction: (G, ctx, factionId) => {},
  choosePower: (G, ctx, powerId) => {},
  placeInitialTroop: (G, ctx, territoryId) => {},

  // Gameplay
  recruitTroops: (G, ctx, placements) => {},
  attack: (G, ctx, from, to) => {},
  resolveCombat: (G, ctx, attackRoll, defendRoll) => {},
  maneuver: (G, ctx, from, to, count) => {},
  drawCard: (G, ctx, type) => {},

  // Legacy
  signBoard: (G, ctx, location) => {},
  placeSticker: (G, ctx, sticker, location) => {},
  addScar: (G, ctx, factionId, scarId) => {},
  foundCity: (G, ctx, territoryId, cityName) => {},

  // Card management
  turnInCards: (G, ctx, cardIds) => {},
  useMissile: (G, ctx) => {},
  completeMission: (G, ctx) => {},
}
```

## API-First Design

For Risk Legacy, the server should expose:

1. **User Management**
   - POST /auth/register
   - POST /auth/login
   - GET /auth/me

2. **Campaign Management**
   - GET /campaigns - List user's campaigns
   - POST /campaigns - Create new campaign
   - GET /campaigns/:id - Get campaign state
   - GET /campaigns/:id/unlocks - Get unlocked content

3. **Lobby Management**
   - Use boardgame.io built-in lobby API
   - Extend with campaign context

4. **Game Management**
   - Use boardgame.io game API
   - Add campaign state updates

5. **Asset Management**
   - GET /assets/:pack/:category/:card - Get card data
   - GET /assets/board - Get board state
   - GET /assets/images/:path - Serve images

This allows full API-based play without requiring the UI client.

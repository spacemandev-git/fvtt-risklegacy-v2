# Machine-Readable Rulebook Specification

## Overview
The rulebook system provides a structured, queryable representation of Risk Legacy rules that can be modified by unlock packs and queried by clients during gameplay.

## Architecture

### Rulebook Lifecycle
```
rules.pdf
    ↓ (Manual extraction - Module 1.2)
base-rules.json
    ↓
Campaign Created → rulebook instance (base rules)
    ↓
Pack Unlocked → apply rule modifiers
    ↓
Lobby Created → attach campaign rulebook
    ↓
Client Queries → GET /api/lobbies/:id/rulebook
```

## JSON Schema

### Base Rulebook Structure
```json
{
  "version": "1.0.0",
  "metadata": {
    "title": "Risk Legacy Base Rules",
    "description": "Official rules for Risk Legacy",
    "lastUpdated": "2025-01-04"
  },
  "sections": {
    "overview": { ... },
    "setup": { ... },
    "turn_structure": { ... },
    "combat": { ... },
    "cards": { ... },
    "victory": { ... },
    "factions": { ... },
    "territories": { ... }
  },
  "glossary": { ... }
}
```

### Section Structure
Each section has a consistent structure:

```json
{
  "id": "combat",
  "title": "Combat Rules",
  "summary": "How to resolve attacks between territories",
  "subsections": {
    "attacking": {
      "title": "Attacking",
      "content": "To attack, you must have at least 2 troops...",
      "rules": [
        {
          "id": "combat.attacking.minimum_troops",
          "text": "You must have at least 2 troops in the attacking territory",
          "priority": 1
        },
        {
          "id": "combat.attacking.adjacency",
          "text": "You can only attack adjacent territories",
          "priority": 1
        }
      ],
      "examples": [
        {
          "scenario": "Attacking with 3 troops",
          "explanation": "You can roll up to 3 dice..."
        }
      ],
      "related": ["combat.defending", "territories.adjacency"]
    },
    "defending": { ... },
    "dice_rolling": { ... },
    "fortification": { ... },
    "conquest": { ... }
  }
}
```

### Rule Object
Individual rules that can be referenced, modified, or overridden:

```json
{
  "id": "combat.dice.attacker_rolls",
  "text": "Attacker rolls 1-3 dice based on attacking troops (max 3)",
  "priority": 1,
  "modifiers": [],
  "tags": ["combat", "dice", "attacker"],
  "phase": "attack",
  "applies_to": "all"
}
```

## Modular Sections

### 1. Overview
- Game objective
- Components list
- Player count
- Game duration

### 2. Setup
- Faction selection order
- Power card selection
- Initial troop placement
- HQ placement rules
- Territory card distribution

### 3. Turn Structure
- Turn order
- Turn phases (recruit → attack → maneuver → draw)
- Phase transitions
- Turn end conditions

### 4. Recruit Phase
- Troop calculation formula
- Minimum troops
- Bonus troops sources
- Card turn-in rules
- Coin card mechanics

### 5. Combat
- Attack requirements
- Dice rolling rules
- Comparison rules (ties to defender)
- Fortification bonus
- Special combat conditions
- HQ conquest
- Missile usage

### 6. Maneuver
- Movement rules
- Connected territory requirement
- Troop minimum requirements
- Timing (end of turn vs anytime)

### 7. Card System
- Territory cards
- Coin cards
- Draw conditions
- Turn-in sets and values
- Card management

### 8. Victory Conditions
- Star acquisition methods:
  - HQ conquest (1 star)
  - Mission completion (1 star)
  - Red star control (1 star)
  - Winning game (1-2 stars)
- Win condition (first to 4 stars)
- Immediate victory

### 9. Factions
Each faction gets an entry:
```json
{
  "id": "imperial_balkania",
  "name": "Imperial Balkania",
  "description": "Focus on recruitment and expansion",
  "starting_powers": [
    {
      "id": "balkania_1",
      "text": "Round up when dividing territories by 3",
      "trigger": "recruit_phase"
    },
    {
      "id": "balkania_2",
      "text": "Draw card on 4+ expansion without conquest",
      "trigger": "end_turn"
    }
  ],
  "strategy_notes": "Best for players who like building large armies"
}
```

### 10. Territories
- Territory list by continent
- Adjacency graph
- Starting values (all 1)
- Continent bonuses (none in base game)

### 11. Glossary
Key terms and definitions:
- HQ
- Fortified
- Conquest
- Resource card
- Star
- Missile
- etc.

## Rule Modifiers (Unlock Packs)

### Modifier Structure
```json
{
  "pack": "secondwin",
  "modifiers": [
    {
      "type": "add_section",
      "section": "missions.private_missions",
      "data": {
        "title": "Private Missions",
        "content": "Starting with this game, each player receives...",
        "rules": [...]
      }
    },
    {
      "type": "modify_rule",
      "rule_id": "victory.win_condition",
      "changes": {
        "text": "First to 4 stars OR complete world capital mission"
      }
    },
    {
      "type": "add_rule",
      "section": "turn_structure.recruit",
      "rule": {
        "id": "recruit.evolution_1",
        "text": "Cities now provide +1 population for recruitment",
        "priority": 2
      }
    }
  ]
}
```

### Modifier Types
1. **add_section** - Add entirely new rule sections
2. **modify_rule** - Change existing rule text
3. **add_rule** - Add new rule to existing section
4. **remove_rule** - Disable a rule (rare)
5. **replace_section** - Completely replace a section

### Priority System
Rules have priority levels to resolve conflicts:
- Priority 1: Base rules
- Priority 2: First unlock modifications
- Priority 3: Second unlock modifications
- etc.

Higher priority rules override lower priority when conflicting.

## Campaign-Specific Rulebook

Each campaign maintains its own rulebook instance:

```typescript
interface CampaignRulebook {
  campaignId: string;
  baseRules: Rulebook;
  unlockedPacks: string[];
  modifiers: RuleModifier[];
  compiledRulebook: Rulebook; // Base + applied modifiers
  version: string;
}
```

### Compilation Process
1. Start with base-rules.json
2. Load modifiers for each unlocked pack (in order)
3. Apply modifiers sequentially
4. Resolve priority conflicts
5. Generate final compiled rulebook
6. Cache compiled version

### Example Flow
```
Campaign starts → base rules only
├─ Game 1 finishes → no unlocks
│
├─ Game 2 finishes → "secondwin" unlocks
│  └─ Recompile rulebook with secondwin modifiers
│
└─ Game 5 → "minorcities" unlocks
   └─ Recompile with secondwin + minorcities modifiers
```

## API Endpoints

### GET /api/rulebook/base
Returns the base rulebook (no modifications).

**Response:**
```json
{
  "version": "1.0.0",
  "sections": { ... }
}
```

### GET /api/campaigns/:id/rulebook
Returns campaign-specific rulebook with all unlocks applied.

**Response:**
```json
{
  "campaignId": "abc123",
  "version": "1.2.0",
  "unlockedPacks": ["base", "secondwin"],
  "sections": { ... }
}
```

### GET /api/lobbies/:id/rulebook
Returns the rulebook for a specific lobby (uses campaign rulebook).

**Response:**
Same as campaign rulebook, plus lobby context.

### GET /api/rulebook/section/:sectionId
Returns a specific section from base rules.

**Query Params:**
- `campaignId` (optional) - Get section from campaign rulebook
- `detailed` (optional) - Include examples and related rules

**Response:**
```json
{
  "id": "combat",
  "title": "Combat Rules",
  "subsections": { ... }
}
```

### POST /api/rulebook/search
Search rules by keyword or tag.

**Request:**
```json
{
  "query": "fortified",
  "campaignId": "abc123",
  "sections": ["combat", "territories"]
}
```

**Response:**
```json
{
  "results": [
    {
      "section": "combat.defending",
      "rule": {
        "id": "combat.fortification_bonus",
        "text": "Fortified territories add +1 to highest defense die",
        "relevance": 0.95
      }
    }
  ]
}
```

## Client Usage Examples

### During Gameplay
```javascript
// Player wants to attack
const combatRules = await fetch(`/api/lobbies/${lobbyId}/rulebook?section=combat`);

// Show combat rules in UI
displayRules(combatRules.sections.combat);

// Player has a question about fortification
const searchResults = await fetch(`/api/rulebook/search`, {
  method: 'POST',
  body: JSON.stringify({
    query: 'fortified',
    campaignId: campaignId
  })
});
```

### Campaign Setup
```javascript
// Show what rules are active in this campaign
const campaignRules = await fetch(`/api/campaigns/${campaignId}/rulebook`);

// Display unlocked content
console.log('Active packs:', campaignRules.unlockedPacks);
console.log('New rules:', campaignRules.modifiers);
```

## Implementation Notes

### Manual Extraction (Module 1.2)
Since rules.pdf is a PDF document, extraction will be partially manual:

1. **Read PDF content** - Extract text and structure
2. **Structure rules** - Organize into sections
3. **Create JSON** - Format as base-rules.json
4. **Validate** - Ensure all rules are captured
5. **Cross-reference** - Link related rules
6. **Add examples** - Include gameplay examples

This is a one-time task for base rules. Unlock pack rules can be extracted from:
- Unlock pack rule card images (assets/unlocks/*/rules/)
- Cross-reference with base rules
- Document what changes

### Storage Strategy
- **Base rules**: Stored as JSON file (`src/server/rules/base-rules.json`)
- **Modifiers**: Stored as JSON files per pack (`src/server/rules/modifiers/*.json`)
- **Compiled rulebooks**: Cached in memory per campaign
- **Database**: Store campaign → unlocked packs mapping only

### Performance Considerations
- Rulebooks are relatively small (~100-500KB compiled)
- Cache compiled rulebooks in memory
- Regenerate only when pack unlocks
- Consider Redis caching for production

### Validation
Rulebooks should be validated against game implementation:
- All referenced rule IDs exist in code
- Faction powers match rulebook text
- Combat rules align with dice logic
- Victory conditions match star tracking

## Future Enhancements

### Interactive Rulebook
- Clickable cross-references
- Contextual rule suggestions
- "What can I do now?" queries
- Rules based on game state

### Rule Diffs
Show what changed when packs unlock:
```
+ New Rule: Private missions are dealt at game start
~ Modified: Victory condition now includes world capital
- Removed: N/A
```

### Versioning
Track rulebook versions:
- v1.0.0 - Base game
- v1.1.0 - + secondwin pack
- v1.2.0 - + worldcapital pack
- etc.

### Localization
Support multiple languages:
```json
{
  "id": "combat.attacking",
  "text": {
    "en": "You must have at least 2 troops...",
    "es": "Debes tener al menos 2 tropas...",
    "fr": "Vous devez avoir au moins 2 troupes..."
  }
}
```

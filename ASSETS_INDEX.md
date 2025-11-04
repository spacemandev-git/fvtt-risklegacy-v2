# Risk Legacy - Assets Index

## Directory Structure
```
assets/
├── board/          # Board images
├── icons/          # Game icons (missiles, stars)
├── rules.pdf       # Complete game rules
└── unlocks/        # Unlock pack content
```

## Unlock Packs

### Base Pack (base/)
**Trigger**: Open before first game

**Contents**:
- `factions/cards.yaml` - 5 faction definitions
  - Imperial Balkania
  - Enclave of the Bear
  - Khan Industries
  - Die Mechaniker
  - Saharan Republic

- `powers/cards.yaml` - 10 starting power cards (2 per faction)
  - Starter powers for each faction
  - Players choose 1 per game

- `territories/cards.yaml` - 42 territory cards
  - All base territories with continent affiliations
  - All start with value: 1

- `scars/cards.yaml` - Scar cards (quantity varies)
  - Permanent negative effects for factions

- `stickersheet/cards.yaml` - Base stickers
  - City stickers
  - Resource value increases
  - Victory bonuses

- `macros/` - ~~JavaScript utility functions~~ (IGNORE - legacy FoundryVTT code)
  - ~~All .js files are from previous implementation~~
  - ~~Not needed for boardgame.io version~~

- ~~`init.js`~~ - (IGNORE - legacy FoundryVTT initialization)

### Second Win Pack (secondwin/)
**Trigger**: Open when one person signs the board for a second time

**Contents**:
- `missions/cards.yaml` - New mission cards
  - Amphibious Onslaught
  - Unexpected Attack
  - Superior Infrastructure
  - Explore the World
  - World Capital
  - Reign of Terror
  - Imperial Might
  - Urban Assault

- `events/cards.yaml` - New event cards
  - Join the Cause

- `rules/cards.yaml` - New rule modifications
  - Evolution 1 rule card

- `stickersheet/cards.yaml` - Additional stickers
  - Scar Capital sticker

### World Capital Pack (worldcapital/)
**Trigger**: Open when World Capital mark is about to go on the board

**Contents**:
- `missions/cards.yaml` - New mission cards
  - Guerilla Warfare
  - Urban Troop Surge
  - Advanced Tactics
  - Advanced Training
  - Wide Border
  - Forced Occupation

- `powers/cards.yaml` - New power cards
  - Mission-related powers

- `rules/cards.yaml` - New rules
  - Private Mission Rules
  - Evolution 2
  - Evolution 1
  - Lead Faction Rules
  - World Capital Rules

### Minor Cities Pack (minorcities/)
**Trigger**: Open when all 9 minor cities have been founded

**Contents**:
- `events/cards.yaml` - New event cards
- `scars/cards.yaml` - Additional scar cards
- `rules/cards.yaml` - City-related rules
- `draft/cards.yaml` - Draft mechanism cards

- `macros/draftSetup.js` - Draft setup utility

### Eliminated Pack (eliminated/)
**Trigger**: Open when a faction is eliminated from the game

**Contents**:
- `powers/cards.yaml` - New faction powers
- `scars/cards.yaml` - Elimination-related scars
- `rules/cards.yaml` - Elimination rules

### Thirty Troops Pack (thirtytroops/)
**Trigger**: Open when someone places 30+ troops on board and has a missile

**Contents**:
- `events/cards.yaml` - New event cards
- `factions/cards.yaml` - New faction variants
- `powers/cards.yaml` - Power upgrades
- `scars/cards.yaml` - Additional scars
  - Primitive
  - Cautious
  - Unpopular
  - Purist
  - Short-sighted
- `rules/cards.yaml` - New rules
- `stickersheet/cards.yaml` - Additional stickers
- `territories/cards.yaml` - New territory cards

### Three Missiles Pack (threemissiles/)
**Trigger**: Open when 3 missiles are used on the same combat roll

**Contents**:
- `events/cards.yaml` - New event cards
- `factions/cards.yaml` - Faction modifications
- `powers/cards.yaml` - Enhanced powers
- `rules/cards.yaml` - Missile-related rules
- `secretmutantpowers/cards.yaml` - Special mutant abilities

## Asset File Format

### YAML Card Structure
```yaml
namespace: identifier.category.pack.game.author
imgPath: image_filename.jpg
data:
  # Card-specific data fields
  # Varies by card type
---
# Next card (YAML documents separated by ---)
```

### Common Data Fields

**Faction Cards**:
```yaml
data:
  troop_img: faction_1.png
  three_img: faction_3.png
  hq_img: faction_hq.png
  name: "Faction Name"
```

**Power Cards**:
```yaml
data:
  description: "Power description text"
  type: starter|advanced|special
```

**Territory Cards**:
```yaml
data:
  value: 1-4
  continent: continent_name
```

**Scar Cards**:
```yaml
qty: number_of_copies
data:
  tokenImg: scar_image.png
```

**Sticker Cards**:
```yaml
qty: number_available
data:
  folder: "Before First Game"|"Held On"|"Game Won"
```

## Board Assets

### Board Images
- `board/original.jpg` - Original board layout (15.9 MB)
- `board/advanced.jpg` - Advanced board variant (616 KB)
- `board/sideboard.jpg` - Side information board (990 KB)
- `board/board_sign.jpg` - Signature board (438 KB)

### Icons
- `icons/missile.png` - Missile token icon
- `icons/star.png` - Victory star icon

## Data Loading Strategy

### Pack Loading Order
1. Load base pack (always)
2. Check campaign state for unlocked packs
3. Load unlocked packs in order:
   - secondwin
   - worldcapital
   - minorcities
   - eliminated
   - thirtytroops
   - threemissiles

### Card Deck Management
Each category maintains separate decks:
- Factions (selection at game start)
- Powers (per faction, player choice)
- Territories (draw deck)
- Missions (secret objectives)
- Events (random events)
- Scars (end-game penalties)
- Stickers (permanent modifications)

### Init Scripts
**Note**: All `.js` files in the assets directory are legacy FoundryVTT code and should be **IGNORED**.

For boardgame.io implementation, we'll need to:
1. Parse YAML files at build time (convert to JSON)
2. Build card/asset databases
3. Track which packs are unlocked per campaign
4. Filter available content based on campaign state

## Asset Integration Notes

### Required Adaptations for boardgame.io
1. **YAML Parsing**: Convert YAML card definitions to JSON
2. **Image References**: Store relative paths, serve via static file server
3. **Namespace Management**: Use namespaces to track card origins
4. **Quantity Tracking**: Some cards have multiple copies (qty field)
5. **Deck Building**: Combine cards from base + unlocked packs
6. **State Persistence**: Track which stickers/scars are active
7. **Campaign Progression**: Store unlock triggers and opened packs

### Dynamic Content Loading
The game requires runtime content management:
- Cards added/removed based on unlocks
- Territory values modified by stickers
- Faction powers expanded through campaign
- Rules evolved as new packs open
- Board state permanently altered

This differs from typical boardgame.io games with static rule sets.

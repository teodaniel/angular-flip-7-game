# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a single-page Angular 21 application for a card game called **Flip 7**. It is a turn-based game played on a single device for at least 3 players. The first person to reach 200 points wins.

The application includes Server-Side Rendering (SSR) support. The project uses:
- Angular 21.0+ with standalone components (no NgModules)
- TypeScript 5.9 with strict mode enabled
- Vitest for unit testing
- Express for SSR server
- SCSS for styling
- Prettier for code formatting (printWidth: 100, singleQuote: true)

## Game Rules

### Player Setup

- **Player count**: 3-18 players
- **Winning condition**: First player to reach 200 points wins
- **Turn-based**: Players take turns drawing cards on a single shared device

### Turn Mechanics

**Drawing Cards:**

- On each turn, a player can flip cards from the draw deck as many times as they want
- **Maximum hand size**: 7 cards per turn
- After drawing, the player can either:
  - Draw another card (if under 7 cards and no bust)
  - End their turn to score their points

**Bust Rules:**

- If a player draws a **NUMBER card (0-12)** with the same number as one already drawn during their current turn, they **bust**
- When a player busts, they score **0 points** for that turn and their turn ends immediately
- **Only NUMBER cards cause busts** - Addition cards (+2, +4, +6, +8, +10) and special cards can be drawn multiple times without busting

### Scoring

**Basic Scoring:**

- **NUMBER cards**: Add the card's face value to the turn score (0-12 points each)
- **Addition cards** (+2, +4, +6, +8, +10): Add bonus points to the turn score
- **Multiplier (x2)**: Doubles the entire turn score
- **Seven-card bonus**: Successfully drawing 7 cards awards an additional **15 points**

**Cards that don't add points:**

- FREEZE, FLIP THREE, and SECOND CHANCE cards do not contribute to the score

**Turn score calculation:**

1. Sum all NUMBER cards (0-12)
2. Add all ADDITION cards (+2, +4, +6, +8, +10)
3. If x2 multiplier was drawn, double the total
4. If 7 cards were successfully drawn, add 15 bonus points

### Special Cards

**FREEZE** (3 cards in deck)

- Immediately ends the player's turn when drawn
- Player scores points for all cards drawn before FREEZE
- Counts toward the 7-card hand limit

**FLIP THREE** (3 cards in deck)

- Automatically draws 3 additional cards from the deck
- Normal bust rules apply during the auto-draw
- If a bust occurs during FLIP THREE, the player scores nothing
- Counts toward the 7-card hand limit

**SECOND CHANCE** (3 cards in deck)

- Prevents one bust during the current turn
- When a duplicate number is drawn, both the SECOND CHANCE card and the duplicate card are removed from the hand
- Player can continue drawing cards after using SECOND CHANCE
- Counts toward the 7-card hand limit
- Does not add points to the score

**Multiplier (x2)** (1 card in deck)

- Doubles the entire score for the current turn
- Applied after summing all NUMBER and ADDITION cards
- Applied before the 7-card bonus
- Counts toward the 7-card hand limit

**Addition Cards** (+2, +4, +6, +8, +10) (5 cards in deck)

- Add bonus points to the turn total
- Can be drawn multiple times without causing a bust
- Each counts toward the 7-card hand limit

### Deck Management

**Deck composition**: 94 cards total

- NUMBER cards: 78 cards (1×0, 1×1, 2×2, 3×3, 4×4, 5×5, 6×6, 7×7, 8×8, 9×9, 10×10, 11×11, 12×12)
- ADDITION cards: 5 cards (1×+2, 1×+4, 1×+6, 1×+8, 1×+10)
- MULTIPLIER: 1 card (1×x2)
- SPECIAL cards: 9 cards (3×FREEZE, 3×FLIP THREE, 3×SECOND CHANCE)

**Empty deck handling:**

- When the draw deck runs out, the discard pile is shuffled to create a new draw deck
- Discard pile contains all cards from successfully completed turns

## Development Commands

### Start Development Server
```bash
npm start
# or
ng serve
```
Runs on http://localhost:4200/ with auto-reload

### Build
```bash
npm run build
```
Outputs to `dist/` directory. Default configuration is production.

### Watch Mode (Development)
```bash
npm run watch
```
Builds with watch mode and development configuration

### Run Tests
```bash
npm test
# or
ng test
```
Uses Vitest as the test runner

### Run SSR Server
```bash
npm run serve:ssr:angular-flip-7-game
```
Runs the Express server with Angular SSR (requires build first). Server listens on PORT environment variable or defaults to port 4000.

### Generate Components
```bash
ng generate component component-name
```
Creates new components with SCSS styling (configured in angular.json)

## Architecture

### Game Architecture

The game is built as a single-component application with service-based business logic:

**Core Component:** [src/app/app.ts](src/app/app.ts)

- Manages all game state using Angular signals
- Orchestrates game flow (draw, bust detection, turn progression)
- Signal state includes: players, currentPlayerIndex, currentRoundScore, drawnCards, discardPile, deckCount, isTurnActive, hasBusted, isFlippingThree
- Key methods: `drawCard()`, `autoFlipThree()`, `endTurn()`
- Computed properties: `currentPlayer`, `sortedPlayers`, `canDrawCard`

**Data Models:** [src/app/models/card.model.ts](src/app/models/card.model.ts)

- `CardType` enum: NUMBER, ADDITION, MULTIPLIER, FREEZE, FLIP_THREE, SECOND_CHANCE
- `Card` interface with id, type, value, imageUrl, displayValue

**Services:**

1. [src/app/services/card-deck.service.ts](src/app/services/card-deck.service.ts) - Deck Management
   - Creates and manages the 94-card deck
   - Deck composition: 78 number cards (1×0, 1×1, 2×2, 3×3... 12×12), 5 addition cards (+2/4/6/8/10), 1 multiplier (x2), 9 special cards (3×FREEZE, 3×FLIP THREE, 3×SECOND CHANCE)
   - Fisher-Yates shuffle algorithm
   - Methods: `initializeDeck()`, `shuffle()`, `drawCard()`, `getRemainingCount()`, `reset()`

2. [src/app/services/game-logic.service.ts](src/app/services/game-logic.service.ts) - Game Rules (Stateless)
   - `checkBust()` - Detects duplicate number cards
   - `hasSecondChance()`, `removeSecondChanceAndBustCard()` - Second chance mechanic
   - `calculateRoundScore()` - Sums NUMBER and ADDITION cards, applies x2 MULTIPLIER, adds 15-point bonus at 7-card limit
   - `hasFreeze()`, `hasFlipThree()`, `getNumberCardValues()` - Helper methods

### SSR Configuration
- **Browser entry**: [src/main.ts](src/main.ts)
- **Server entry**: [src/main.server.ts](src/main.server.ts)
- **SSR server**: [src/server.ts](src/server.ts) - Express server with Angular Node App Engine
- **Build mode**: Server output mode with SSR entry point
- **Server routes**: [src/app/app.routes.server.ts](src/app/app.routes.server.ts) - Prerender mode for all routes (`**`)
- Client hydration is enabled with event replay for improved performance

### Application Structure
- **Root component**: [src/app/app.ts](src/app/app.ts) - Uses standalone component architecture with signals
- **Config**: [src/app/app.config.ts](src/app/app.config.ts) - Browser configuration with client hydration and global error listeners
- **Server config**: [src/app/app.config.server.ts](src/app/app.config.server.ts) - Server-specific configuration
- **Routing**: [src/app/app.routes.ts](src/app/app.routes.ts) - Currently empty (single-page app)
- **Template**: [src/app/app.html](src/app/app.html) - Game UI with header, player info, deck, and drawn cards sections
- **Styles**: [src/app/app.scss](src/app/app.scss) - Comprehensive SCSS with purple-violet gradient theme, responsive design (768px breakpoint)

### Key Patterns
- **Standalone components**: All components use `imports` array instead of NgModules
- **Signals**: The app uses Angular signals for reactive state (see state management in app.ts)
- **Service layer separation**: CardDeckService handles data, GameLogicService implements rules (pure functions), App component orchestrates
- **Component selector prefix**: `app-` (configured in angular.json)
- **File naming**: Components use separate files for TS, HTML, and SCSS (e.g., `app.ts`, `app.html`, `app.scss`)

### Testing
- Test files use `.spec.ts` extension
- Vitest is configured with globals enabled (no need to import `describe`, `it`, `expect`)
- Tests use Angular's TestBed for component testing
- Example test: [src/app/app.spec.ts](src/app/app.spec.ts)

### TypeScript Configuration
- **Strict mode enabled**: All strict type checking options are on
- **Target**: ES2022
- **Module**: preserve (for Angular's new module system)
- **Experimental decorators**: Enabled for Angular
- **Angular compiler**: strictTemplates, strictInjectionParameters, strictInputAccessModifiers all enabled

### Express Server Setup
The SSR server ([src/server.ts](src/server.ts)):
- Serves static files from `/browser` with 1-year max-age caching
- Uses `AngularNodeAppEngine` to handle Angular SSR requests
- Can be extended with REST API endpoints (see comments in server.ts)
- Supports PM2 for process management

### Assets

- **Card images**: 22 SVG files in `public/images/cards/`
  - Number cards: card-0.svg through card-12.svg
  - Addition: card-plus2/4/6/8/10.svg
  - Multiplier: card-x2.svg
  - Special: card-freeze.svg, card-flip-three.svg, card-second-chance.svg
- **Deck back**: public/images/card-back.svg
- All cards use 150×210px deck size, 80×112px hand size (configured in app.scss)

## Bundle Budgets
- Initial bundle: 500kB warning, 1MB error
- Component styles: 4kB warning, 8kB error

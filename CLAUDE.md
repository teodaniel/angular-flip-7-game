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

- When the draw deck runs out, a "DECK EMPTY" popup appears with "Reshuffling..." message
- The discard pile is automatically shuffled to create a new draw deck
- Visual feedback: deck shows empty-slot.svg placeholder when empty with reduced opacity
- Empty deck has disabled interaction (cursor: not-allowed)
- Discard pile contains all cards from successfully completed turns
- Reshuffle happens after 1.5 second delay with popup notification

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
- Signal state includes: players, currentPlayerIndex, currentRoundScore, drawnCards, discardPile, deckCount, isTurnActive, hasBusted, isFlippingThree, showStartModal, showEndModal, showDiscardOverlay, showBustPopup, showFreezePopup, showBonusPopup, showDeckEmptyPopup, showNextPlayerPopup, showSecondChancePopup, showFlipThreePopup, mousePosition
- Key methods: `drawCard()`, `autoFlipThree()`, `endTurn()`, `showNextPlayerAndEndTurn()`, `finalizeTurnEnd()`, `toggleDiscardOverlay()`, `getCardProximity()`, `showTurnEndNotification()`
- Computed properties: `currentPlayer`, `sortedPlayers`, `canDrawCard`, `canStartGame`
- Hand limit: 7-card limit applies to NUMBER cards only (special cards don't count toward limit)
- Mouse tracking: Proximity-based hover animation for fanned cards in discard overlay (listener added/removed dynamically)
- Turn-end notifications: Map-based system handles both BUST and FREEZE cards with sequential popup animations
- Turn ending flow: All scenarios (7 cards reached, bust, END TURN click) use common `showNextPlayerAndEndTurn()` method for consistent behavior
- autoFlipThree: For loop implementation with 500ms stagger between draws (500ms, 1000ms, 1500ms), supports nested FLIP THREE cards with proper delay chaining

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
   - `hasSecondChance()`, `removeSecondChanceAndBustCard()` - Second chance mechanic (removes only ONE SECOND CHANCE card, allowing multiple uses)
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
- **Template**: [src/app/app.html](src/app/app.html) - Game UI with header, player info, deck, drawn cards sections, and notification popups (BUST, FREEZE, BONUS, DECK EMPTY, NEXT PLAYER, SECOND CHANCE, FLIP THREE)
- **Styles**: [src/app/app.scss](src/app/app.scss) - Imports modular 7-1 pattern architecture from [src/styles/main.scss](src/styles/main.scss)

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

### UI Features

**Modals:**
- Start screen modal with player management (add/remove/rename players, 3-18 player validation)
- End game modal showing winner and final score
- Notification popups for turn-end events and player transitions (sequential animations with 2s timeouts)
  - BUST popup: Red gradient background, shown when duplicate number card is drawn
  - FREEZE popup: Blue gradient background, shown when FREEZE card is drawn
  - BONUS popup: Orange gradient background with 3D text effect (yellow text, red outline, dark blue drop shadow), shown when 7 number cards are reached
  - DECK EMPTY popup: Gray gradient background, shown when deck is empty during reshuffle (1.5s duration)
  - NEXT PLAYER popup: Hot pink/orange gradient background with yellow outlined text, announces next player after turn ends
  - SECOND CHANCE popup: Red/coral gradient (#f47576 → #f14947) with cream yellow text (#fff8d4) and dark blue border (#00098d), shown when SECOND CHANCE card prevents a bust (2s duration)
  - FLIP THREE popup: Yellow gradient (#f3f13a → #fbbf24) with orange text (#f68712) and dark blue accents (#00098d), shown when FLIP THREE card is activated (1.5s duration)
  - Automatic turn progression: First popup (BUST/FREEZE/BONUS) → NEXT PLAYER popup → Turn ends automatically with common `showNextPlayerAndEndTurn()` method

**Interactive Elements:**
- Discard pile overlay with fanned card display
  - Proximity-based hover animation using mouse position tracking
  - Multi-row layout when cards exceed viewport width
  - Dynamic row calculations: `getRowIndex()`, `getPositionInRow()`, `getCardsInRow()`, `getTotalRows()`
  - Cards lift and scale based on cursor distance (max 200px range)
  - CSS custom properties: `--proximity`, `--row-index`, `--position-in-row`, `--cards-in-row`, `--total-rows`
  - Mouse listeners added on overlay open, removed on close
  - Responsive breakpoints: 1400px (25 cards/row), 1200px (20), 992px (16), 768px (12), 480px (8), default (6)
- Deck interactions with hover effects (translateY(-10px) on hover, shadow filter transitions)
- END TURN button positioned at bottom-right of deck section with 40px margin from right edge
  - Absolute positioning on desktop, relative positioning on mobile
  - 120px height with retro gradient styling

**Styling & Color Palette:**

- Retro 80s/90s aesthetic inspired by game box design
- **SCSS Architecture**: Organized using **7-1 Pattern** with modular partials for maintainability and scalability
  - **Master file**: [src/app/app.scss](src/app/app.scss) imports [src/styles/main.scss](src/styles/main.scss)
  - **Abstracts** (`src/styles/abstracts/`):
    - `_variables.scss` - All design tokens: 25+ colors, spacing scale, borders, shadows (including `$shadow-hover-dark-blue` for consistent button/deck hover effects), card dimensions, transitions
    - `_mixins.scss` - Retro text mixin for bold outlined typography
    - `_index.scss` - Forwards all abstracts with preserved namespaces
  - **Base** (`src/styles/base/`):
    - `_reset.scss` - Global element styles (main container)
    - `_index.scss` - Forwards all base styles
  - **Components** (`src/styles/components/`):
    - `_buttons.scss` - End turn (absolute positioned, dark blue shadow), start, add, remove buttons
    - `_cards.scss` - Card styling, fanned cards with multi-row layout
    - `_modals.scss` - Start and end game modals
    - `_popups.scss` - Notification popups (bust, freeze, bonus, deck empty, next player, second chance, flip three) with fadeInOut keyframe animation
    - `_index.scss` - Forwards all components
  - **Layout** (`src/styles/layout/`):
    - `_header.scss` - Header with Flip 7 title
    - `_top-section.scss` - Player info, round score, leaderboard
    - `_deck-section.scss` - Main gameplay area
    - `_drawn-cards.scss` - Bottom drawn cards section
    - `_discard-overlay.scss` - Fullscreen discard pile overlay
    - `_index.scss` - Forwards all layout styles
  - **Themes** (`src/styles/themes/`):
    - `_index.scss` - Future-proof for theme variations (empty)
  - **Namespace strategy**: Explicit namespaces with `@use` (e.g., `@use 'abstracts' as abstracts;`)
  - **Variables access**: Use explicit namespace (e.g., `vars.$color-dark-blue`, `mixins.retro-text()`)
- **Design Tokens** (defined in `abstracts/_variables.scss`):
  - Color palette: 25+ semantic color variables (e.g., `$color-dark-blue`, `$color-hot-pink`, `$color-crimson`)
  - Spacing scale: `$spacing-xs` through `$spacing-2xl` (0.5rem to 6rem)
  - Border system: `$border-thin` through `$border-ultra-thick` (2px to 8px)
  - Border radius: `$border-radius-sm` through `$border-radius-2xl` (8px to 24px)
  - Shadow presets: Standard shadows plus themed glows (`$shadow-glow-dark-blue`, `$shadow-hover-dark-blue`)
  - Card dimensions: `$card-width-deck`, `$card-height-deck`, `$card-width-hand`, `$card-height-hand`
  - Transitions: `$transition-fast`, `$transition-medium`, `$transition-slow`
- **Background**: Radial gradient from outer cream to center pale white (defined in [src/styles.scss](src/styles.scss))
- **Primary colors**: Dark blue (#1e3a5f), yellow (#ffee00), dark red (#8b0000)
- **Header**: Pale white background with triple border system using box-shadow layering
- **"FLIP 7" text**: Yellow with multi-layer text-shadow effect simulating SVG tspan strokes (dark blue → dark red → dark blue)
- **Section borders**: Dark blue with white/translucent backgrounds
- **Round score**: Dark red gradient background with yellow outlined score text
- **Interactive hover effects**: Dark blue shadows with smooth 0.3s transitions, offset 4px right and 5px down
- **Retro text mixin**: `@mixin retro-text()` in `abstracts/_mixins.scss` for bold outlined typography using `-webkit-text-stroke` and `paint-order`

**Layout:**

- Responsive design with 768px breakpoint
- Mobile: Vertical stack layout (discard → deck → END TURN button)
- Desktop: Horizontal layout with 6rem gap between elements

**State Management:**
- Discard pile shows first card (oldest) in array, not last
- All cards move to discard pile after turn (including bust cards)

### Assets

- **Card images**: 22 SVG files in `public/images/cards/`
  - Number cards: card-0.svg through card-12.svg
  - Addition: card-plus2/4/6/8/10.svg
  - Multiplier: card-x2.svg
  - Special: card-freeze.svg, card-flip-three.svg, card-second-chance.svg
- **Deck back**: public/images/card-back.svg
- **Discard placeholder**: public/images/discard-placeholder.svg
- **Empty deck slot**: public/images/empty-slot.svg (shown when deck is empty)
- All cards use 150×210px deck size, 80×112px hand size (configured in app.scss)

## Bundle Budgets

- Initial bundle: 500kB warning, 1MB error
- Component styles: 4kB warning, 8kB error

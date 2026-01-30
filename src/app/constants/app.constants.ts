// ============================================
// APPLICATION CONSTANTS
// Centralized constants for maintainability and consistency
// ============================================

/**
 * Timing configuration for animations and delays
 */
export const TIMING_CONFIG = {
  /** Duration for most notification popups (BUST, FREEZE, BONUS, NEXT PLAYER, SECOND CHANCE) */
  POPUP_DISPLAY_DURATION_MS: 2000,

  /** Duration for deck reshuffle and FLIP THREE popups */
  POPUP_SHORT_DURATION_MS: 1500,

  /** Delay between each card draw in FLIP THREE auto-draw */
  AUTO_FLIP_STAGGER_DELAY_MS: 500,

  /** Delay before focusing on modal elements */
  FOCUS_DELAY_MS: 0,
} as const;

/**
 * Game configuration and rules
 */
export const GAME_CONFIG = {
  /** Minimum number of players required to start */
  MIN_PLAYERS: 3,

  /** Maximum number of players allowed */
  MAX_PLAYERS: 18,

  /** Maximum number of cards in a player's hand */
  MAX_HAND_SIZE: 7,

  /** Total number of cards in the deck */
  DECK_SIZE: 94,

  /** Points required to win the game */
  WINNING_SCORE: 200,

  /** Number of cards auto-drawn by FLIP THREE card */
  FLIP_THREE_CARD_COUNT: 3,

  /** Bonus points awarded for drawing 7 cards */
  SEVEN_CARD_BONUS: 15,
} as const;

/**
 * Default player name configuration
 */
export const PLAYER_CONFIG = {
  /** Prefix for default player names */
  DEFAULT_NAME_PREFIX: 'Player',

  /** Function to generate default player name */
  getDefaultName: (index: number): string => `Player ${index + 1}`,
} as const;

/**
 * Notification popup messages
 */
export const NOTIFICATION_MESSAGES = {
  BUST: {
    title: 'BUSTED!',
    message: 'You drew a duplicate card',
  },
  FREEZE: {
    title: 'FROZEN!',
    message: 'You got Frozen! Better luck next time.',
  },
  BONUS: {
    title: '15 POINT BONUS!',
  },
  DECK_EMPTY: {
    title: 'DECK EMPTY',
    message: 'Reshuffling...',
  },
  SECOND_CHANCE: {
    title: 'SECOND CHANCE!',
    message: 'Bust prevented.',
  },
  FLIP_THREE: {
    title: 'FLIP THREE ACTIVATED!',
    message: 'Auto-drawing cards...',
  },
} as const;

/**
 * UI text and labels
 */
export const UI_STRINGS = {
  APP_TITLE: 'FLIP 7',
  TAGLINE: 'First to 200 points wins!',
  CONGRATULATIONS: 'CONGRATULATIONS!',
  CLICK_TO_CONTINUE: 'click to continue',
  ROUND_SCORE: 'Round Score',
  LEADERBOARD: 'Leaderboard',
  YOUR_CARDS: 'Your Cards',
  NO_CARDS_DRAWN: 'No cards drawn yet',
  START_BUTTON: 'START',
  ADD_PLAYER: 'Add Player',
  END_TURN: 'END TURN',
  EMPTY_DECK: 'Empty',
  CLICK_TO_DRAW: 'Click to Draw',
  DISCARD_PILE_LABEL: 'DISCARD PILE',
} as const;

/**
 * Accessibility strings and ARIA labels
 */
export const ARIA_LABELS = {
  // Deck section
  DISCARD_PILE_EMPTY: 'Discard pile is empty',
  VIEW_DISCARD_PILE: (count: number): string =>
    `View discard pile, ${count} card${count === 1 ? '' : 's'}`,
  DECK_EMPTY: 'Deck is empty',
  DRAW_CARD: (count: number): string =>
    `Draw a card from the deck, ${count} card${count === 1 ? '' : 's'} remaining`,
  CANNOT_DRAW_CARD: 'Cannot draw card',
  END_TURN_DISABLED: 'End turn button disabled',
  END_TURN_ACTIVE: 'End turn and score your points',

  // Player management
  PLAYER_NAME: (index: number): string => `Player ${index + 1} name`,
  REMOVE_PLAYER: (index: number): string => `Remove player ${index + 1}`,
  NEW_PLAYER_NAME: 'New player name',
  NEW_PLAYER_PLACEHOLDER: 'Enter player name (optional)',

  // Modals
  START_MODAL_TITLE: 'start-modal-title',
  END_MODAL_TITLE: 'end-modal-title',
  DISCARD_OVERLAY_LABEL: 'Discard pile viewer',

  // Player info
  NEXT_PLAYER_ANNOUNCEMENT: (playerName: string): string => `${playerName} is now playing`,
  WINNER_ANNOUNCEMENT: (playerName: string, score: number): string =>
    `${playerName} wins with ${score} points!`,
} as const;

/**
 * Card display values and names
 */
export const CARD_DISPLAY_VALUES = {
  FREEZE: 'FREEZE',
  FLIP_THREE: 'FLIP THREE',
  SECOND_CHANCE: 'SECOND CHANCE',
  MULTIPLIER: 'x2',
  ADDITION: {
    PLUS_2: '+2',
    PLUS_4: '+4',
    PLUS_6: '+6',
    PLUS_8: '+8',
    PLUS_10: '+10',
  },
} as const;

/**
 * Image asset paths
 */
export const IMAGE_PATHS = {
  CARD_BACK: 'images/card-back.svg',
  EMPTY_SLOT: 'images/empty-slot.svg',
  DISCARD_PLACEHOLDER: 'images/discard-placeholder.svg',

  /** Generate card image path */
  getCardPath: (filename: string): string => `images/cards/${filename}`,
} as const;

/**
 * DOM selectors and CSS classes
 */
export const DOM_SELECTORS = {
  MODAL_DIALOG: '[role="dialog"]',
  INPUT_TAG: 'INPUT',
  TEXTAREA_TAG: 'TEXTAREA',
  DISCARD_OVERLAY_CLASS: 'discard-overlay',
  PLAYER_NAME_ID_PREFIX: 'player-name-',
  CARD_ID_PREFIX: 'card-',
} as const;

/**
 * Responsive breakpoints and card layout configuration
 */
export const RESPONSIVE_BREAKPOINTS = {
  /** Screen width >= 1400px */
  EXTRA_LARGE: { width: 1400, cardsPerRow: 25 },
  /** Screen width >= 1200px */
  LARGE: { width: 1200, cardsPerRow: 20 },
  /** Screen width >= 992px */
  MEDIUM: { width: 992, cardsPerRow: 16 },
  /** Screen width >= 768px */
  TABLET: { width: 768, cardsPerRow: 12 },
  /** Screen width >= 480px */
  MOBILE: { width: 480, cardsPerRow: 8 },
  /** Screen width < 480px */
  SMALL_MOBILE: { width: 0, cardsPerRow: 6 },
} as const;

/**
 * Discard overlay configuration
 */
export const DISCARD_OVERLAY_CONFIG = {
  /** Maximum distance for proximity effect (in pixels) */
  MAX_PROXIMITY_DISTANCE: 200,
} as const;

/**
 * Error messages (for future use)
 */
export const ERROR_MESSAGES = {
  MIN_PLAYERS_REQUIRED: (min: number): string => `Minimum ${min} players required`,
  MAX_PLAYERS_REACHED: (max: number): string => `Maximum ${max} players reached`,
  INVALID_PLAYER_NAME: 'Player name cannot be empty',
} as const;

/**
 * Keyboard shortcuts documentation
 */
export const KEYBOARD_SHORTCUTS = {
  DRAW_CARD: 'Space',
  END_TURN: 'Enter',
  CLOSE_MODAL: 'Escape',
  TAB_FORWARD: 'Tab',
  TAB_BACKWARD: 'Shift+Tab',
} as const;

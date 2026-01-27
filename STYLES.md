# Styles Configuration Guide

## Overview

The project uses a **7-1 SCSS Pattern** with global style imports configured via `angular.json`. This allows components to import shared styles using clean, absolute paths instead of relative paths.

## Configuration

### angular.json

The `stylePreprocessorOptions` in [angular.json](angular.json) enables clean imports:

```json
{
  "stylePreprocessorOptions": {
    "includePaths": [
      "src/styles"
    ]
  }
}
```

This allows importing from `src/styles/` using clean paths like:
```scss
@use 'components/modals';  // Instead of: @use '../../../styles/components/modals';
```

## Directory Structure

```
src/styles/
├── abstracts/          # Design tokens (variables, mixins)
│   ├── _variables.scss # Colors, spacing, borders, shadows, transitions
│   ├── _mixins.scss    # Reusable mixins (retro-text)
│   └── _index.scss     # Forwards all abstracts
├── base/               # Global element styles
│   ├── _reset.scss     # Base reset styles
│   └── _index.scss
├── components/         # Reusable UI components
│   ├── _buttons.scss   # Button styles (end turn, add, remove, start)
│   ├── _cards.scss     # Card styling
│   ├── _modals.scss    # Modal styles (start, end)
│   ├── _popups.scss    # Notification popups
│   └── _index.scss
├── layout/             # Major layout components
│   ├── _header.scss
│   ├── _top-section.scss
│   ├── _deck-section.scss
│   ├── _drawn-cards.scss
│   ├── _discard-overlay.scss
│   └── _index.scss
├── themes/             # Theme variations (future use)
│   └── _index.scss
└── main.scss           # Master file importing all partials
```

## Component Styles

Each component imports only the styles it needs:

### Start Modal ([start-modal.scss](src/app/components/start-modal/start-modal.scss))
```scss
@use 'components/modals';
@use 'components/buttons';  // For start, add, remove buttons
```

### End Modal ([end-modal.scss](src/app/components/end-modal/end-modal.scss))
```scss
@use 'components/modals';
```

### Notification Popups ([notification-popups.scss](src/app/components/notification-popups/notification-popups.scss))
```scss
@use 'components/popups';
```

### Header ([header.scss](src/app/components/header/header.scss))
```scss
@use 'layout/header';
```

### Top Section ([top-section.scss](src/app/components/top-section/top-section.scss))
```scss
@use 'layout/top-section';
```

### Deck Section ([deck-section.scss](src/app/components/deck-section/deck-section.scss))
```scss
@use 'layout/deck-section';
@use 'components/cards';     // For card-back, labels, discard pile
@use 'components/buttons';   // For end turn button
```

### Drawn Cards ([drawn-cards.scss](src/app/components/drawn-cards/drawn-cards.scss))
```scss
@use 'layout/drawn-cards';
@use 'components/cards';
```

### Discard Overlay ([discard-overlay.scss](src/app/components/discard-overlay/discard-overlay.scss))
```scss
@use 'layout/discard-overlay';
@use 'components/cards';
```

## Using Design Tokens in Components

If you need to create custom component-specific styles using design tokens:

### Import Abstracts

```scss
// Component-specific styles
@use 'abstracts/variables' as vars;
@use 'abstracts/mixins';

.custom-element {
  background: vars.$color-hot-pink;
  border: vars.$border-medium solid vars.$color-cyan;
  padding: vars.$spacing-md;
  border-radius: vars.$border-radius-lg;
  transition: vars.$transition-medium;

  &:hover {
    box-shadow: vars.$shadow-hover-dark-blue;
  }
}

.custom-text {
  @include mixins.retro-text(vars.$color-hot-pink, vars.$color-cyan, 5px);
}
```

## Available Design Tokens

### Colors (25+ semantic variables)
```scss
vars.$color-dark-blue      // Primary dark blue
vars.$color-hot-pink       // Accent hot pink
vars.$color-cyan           // Accent cyan
vars.$color-yellow         // Flip 7 yellow
vars.$color-crimson        // Dark red
// ... and more
```

### Spacing Scale
```scss
vars.$spacing-xs    // 0.5rem
vars.$spacing-sm    // 1rem
vars.$spacing-md    // 1.5rem
vars.$spacing-lg    // 2rem
vars.$spacing-xl    // 3rem
vars.$spacing-2xl   // 6rem
```

### Borders
```scss
vars.$border-thin          // 2px
vars.$border-medium        // 3px
vars.$border-thick         // 4px
vars.$border-very-thick    // 6px
vars.$border-ultra-thick   // 8px
```

### Border Radius
```scss
vars.$border-radius-sm     // 8px
vars.$border-radius-md     // 12px
vars.$border-radius-lg     // 16px
vars.$border-radius-xl     // 20px
vars.$border-radius-2xl    // 24px
```

### Shadows
```scss
vars.$shadow-hover-dark-blue
vars.$shadow-glow-dark-blue
// ... and more
```

### Transitions
```scss
vars.$transition-fast      // 0.15s ease
vars.$transition-medium    // 0.3s ease
vars.$transition-slow      // 0.5s ease
```

## Mixins

### Retro Text Mixin
```scss
@include mixins.retro-text($fill-color, $stroke-color, $stroke-width);

// Example:
.title {
  @include mixins.retro-text(#ff006e, #00d4ff, 5px);
}
```

## Benefits

✅ **Clean imports** - No relative path hell (`../../..`)
✅ **Better organization** - Clear separation of concerns
✅ **Easy maintenance** - Changes in one place affect all imports
✅ **Type safety** - SCSS validates imports at build time
✅ **Component encapsulation** - Each component imports only what it needs
✅ **Scalability** - Easy to add new shared styles or design tokens

## Creating New Components

When creating a new component, import the relevant styles:

```bash
ng generate component components/my-component
```

Then in `my-component.scss`:
```scss
// Import what you need
@use 'abstracts/variables' as vars;
@use 'layout/my-layout-partial';  // If you created a new layout partial
@use 'components/my-component-partial';  // If you created a new component partial

// Or write component-specific styles
.my-custom-element {
  color: vars.$color-hot-pink;
}
```

## Global vs Component Styles

- **Global styles** ([src/styles.scss](src/styles.scss)) - Imported once, applies to entire app
- **Component styles** - Scoped to component, only loaded when component is used
- **Shared partials** - Reusable across multiple components using `@use`

## Development Workflow

1. **Add new design token** → Update [abstracts/_variables.scss](src/styles/abstracts/_variables.scss)
2. **Add new mixin** → Update [abstracts/_mixins.scss](src/styles/abstracts/_mixins.scss)
3. **Add new component styles** → Create partial in `components/` or `layout/`
4. **Import in component** → Use clean path: `@use 'components/my-partial'`

No need to restart dev server - Angular will hot-reload on save!

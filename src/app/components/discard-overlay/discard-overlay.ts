import {
  Component,
  input,
  output,
  signal,
  effect,
  ElementRef,
  viewChild,
  ChangeDetectionStrategy,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from '../../models/card.model';
import {
  DOM_SELECTORS,
  RESPONSIVE_BREAKPOINTS,
  DISCARD_OVERLAY_CONFIG,
  TIMING_CONFIG,
} from '../../constants/app.constants';

@Component({
  selector: 'app-discard-overlay',
  imports: [CommonModule],
  templateUrl: './discard-overlay.html',
  styleUrl: './discard-overlay.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscardOverlay {
  // Inputs
  readonly show = input.required<boolean>();
  readonly cards = input.required<Card[]>();

  // Outputs
  readonly close = output<void>();

  // Internal state
  protected readonly mousePosition = signal({ x: 0, y: 0 });
  private mouseMoveListener: ((e: MouseEvent) => void) | null = null;
  private rafId: number | null = null;

  // View references for focus management
  private readonly overlayContainer = viewChild<ElementRef<HTMLDivElement>>('overlayContainer');

  constructor() {
    // Effect to manage mouse listener and focus when show changes
    effect(() => {
      if (this.show()) {
        // Set focus to overlay when it opens
        setTimeout(() => {
          const overlay = this.overlayContainer()?.nativeElement;
          if (overlay) {
            overlay.focus();
          }
        }, TIMING_CONFIG.FOCUS_DELAY_MS);

        // Start listening to mouse movement with RAF throttling
        this.mouseMoveListener = (e: MouseEvent) => {
          // Throttle to animation frame (~16ms instead of ~1ms)
          if (this.rafId === null) {
            this.rafId = requestAnimationFrame(() => {
              this.mousePosition.set({ x: e.clientX, y: e.clientY });
              this.rafId = null;
            });
          }
        };
        // Added passive: true for better scroll performance
        window.addEventListener('mousemove', this.mouseMoveListener, { passive: true });
      } else {
        // Cancel pending RAF on close
        if (this.rafId !== null) {
          cancelAnimationFrame(this.rafId);
          this.rafId = null;
        }
        // Stop listening to mouse movement
        if (this.mouseMoveListener) {
          window.removeEventListener('mousemove', this.mouseMoveListener);
          this.mouseMoveListener = null;
        }
      }
    });
  }

  // Handle Escape key to close overlay
  @HostListener('document:keydown.escape')
  protected handleEscape(): void {
    if (this.show()) {
      this.close.emit();
    }
  }

  protected handleClose(event: MouseEvent): void {
    // Close if clicking on the overlay background
    const target = event.target as HTMLElement;
    if (target.classList.contains(DOM_SELECTORS.DISCARD_OVERLAY_CLASS)) {
      this.close.emit();
    }
  }

  protected getCardProximity(cardElement: HTMLElement): number {
    const rect = cardElement.getBoundingClientRect();
    const cardCenterX = rect.left + rect.width / 2;
    const cardCenterY = rect.top + rect.height / 2;

    const mousePos = this.mousePosition();
    const distanceX = mousePos.x - cardCenterX;
    const distanceY = mousePos.y - cardCenterY;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    // Use configured max distance for effect
    const maxDistance = DISCARD_OVERLAY_CONFIG.MAX_PROXIMITY_DISTANCE;
    // Calculate proximity: 1 when mouse is on card, 0 when far away
    const proximity = Math.max(0, 1 - distance / maxDistance);

    return proximity;
  }

  // Calculate cards per row based on viewport width
  protected getCardsPerRow(): number {
    const width = window.innerWidth;
    if (width >= RESPONSIVE_BREAKPOINTS.EXTRA_LARGE.width)
      return RESPONSIVE_BREAKPOINTS.EXTRA_LARGE.cardsPerRow;
    if (width >= RESPONSIVE_BREAKPOINTS.LARGE.width) return RESPONSIVE_BREAKPOINTS.LARGE.cardsPerRow;
    if (width >= RESPONSIVE_BREAKPOINTS.MEDIUM.width)
      return RESPONSIVE_BREAKPOINTS.MEDIUM.cardsPerRow;
    if (width >= RESPONSIVE_BREAKPOINTS.TABLET.width)
      return RESPONSIVE_BREAKPOINTS.TABLET.cardsPerRow;
    if (width >= RESPONSIVE_BREAKPOINTS.MOBILE.width) return RESPONSIVE_BREAKPOINTS.MOBILE.cardsPerRow;
    return RESPONSIVE_BREAKPOINTS.SMALL_MOBILE.cardsPerRow;
  }

  // Calculate row index for a card
  protected getRowIndex(cardIndex: number): number {
    return Math.floor(cardIndex / this.getCardsPerRow());
  }

  // Calculate position within row for a card
  protected getPositionInRow(cardIndex: number): number {
    return cardIndex % this.getCardsPerRow();
  }

  // Calculate number of cards in a specific row
  protected getCardsInRow(rowIndex: number, totalCards: number): number {
    const cardsPerRow = this.getCardsPerRow();
    const startIndex = rowIndex * cardsPerRow;
    return Math.min(cardsPerRow, totalCards - startIndex);
  }

  // Get total number of rows
  protected getTotalRows(): number {
    return Math.ceil(this.cards().length / this.getCardsPerRow());
  }
}

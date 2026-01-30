import { Component, input, output, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from '../../models/card.model';
import { DOM_SELECTORS } from '../../constants/app.constants';

@Component({
  selector: 'app-deck-section',
  imports: [CommonModule],
  templateUrl: './deck-section.html',
  styleUrl: './deck-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckSection {
  // Inputs
  readonly discardPile = input.required<Card[]>();
  readonly deckCount = input.required<number>();
  readonly canDrawCard = input.required<boolean>();
  readonly isTurnActive = input.required<boolean>();
  readonly hasDrawnCards = input.required<boolean>();

  // Outputs
  readonly drawCard = output<void>();
  readonly endTurn = output<void>();
  readonly viewDiscardPile = output<void>();

  // Keyboard shortcut: Space to draw card
  @HostListener('document:keydown.space', ['$event'])
  protected handleSpaceKey(event: Event): void {
    const keyEvent = event as KeyboardEvent;

    // Don't trigger if user is typing in an input/textarea or if modal is open
    const target = keyEvent.target as HTMLElement;
    if (
      target.tagName === DOM_SELECTORS.INPUT_TAG ||
      target.tagName === DOM_SELECTORS.TEXTAREA_TAG ||
      document.querySelector(DOM_SELECTORS.MODAL_DIALOG)
    ) {
      return;
    }

    if (this.canDrawCard()) {
      keyEvent.preventDefault();
      this.handleDrawCard();
    }
  }

  // Keyboard shortcut: Enter to end turn
  @HostListener('document:keydown.enter', ['$event'])
  protected handleEnterKey(event: Event): void {
    const keyEvent = event as KeyboardEvent;

    // Don't trigger if user is typing in an input/textarea or if modal is open
    const target = keyEvent.target as HTMLElement;
    if (
      target.tagName === DOM_SELECTORS.INPUT_TAG ||
      target.tagName === DOM_SELECTORS.TEXTAREA_TAG ||
      document.querySelector(DOM_SELECTORS.MODAL_DIALOG)
    ) {
      return;
    }

    // Only end turn if it's active and cards have been drawn
    if (this.isTurnActive() && this.hasDrawnCards()) {
      keyEvent.preventDefault();
      this.handleEndTurn();
    }
  }

  protected handleDrawCard(): void {
    this.drawCard.emit();
  }

  protected handleEndTurn(): void {
    this.endTurn.emit();
  }

  protected handleViewDiscardPile(): void {
    this.viewDiscardPile.emit();
  }
}

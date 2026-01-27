import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from '../../models/card.model';

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

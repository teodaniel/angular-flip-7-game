import { Injectable, signal } from '@angular/core';
import { Card, CardType } from '../models/card.model';

@Injectable({
  providedIn: 'root',
})
export class CardDeckService {
  private deck = signal<Card[]>([]);
  private currentId = 1;

  constructor() {
    this.reset();
  }

  initializeDeck(): Card[] {
    const cards: Card[] = [];
    this.currentId = 1;

    // Number cards
    for (let value = 12; value >= 1; value--) {
      for (let count = 0; count < value; count++) {
        cards.push(this.createCard(CardType.NUMBER, value, `images/cards/card-${value}.svg`));
      }
    }

    // Add single 0 card
    cards.push(this.createCard(CardType.NUMBER, 0, 'images/cards/card-0.svg'));

    // Addition cards
    [2, 4, 6, 8, 10].forEach((value) => {
      cards.push(
        this.createCard(CardType.ADDITION, value, `images/cards/card-plus${value}.svg`, `+${value}`)
      );
    });

    // Multiplier card
    cards.push(this.createCard(CardType.MULTIPLIER, 2, 'images/cards/card-x2.svg', 'x2'));

    // Special action cards - FREEZE (3x)
    for (let i = 0; i < 3; i++) {
      cards.push(this.createCard(CardType.FREEZE, 0, 'images/cards/card-freeze.svg', 'FREEZE'));
    }

    // FLIP THREE (3x)
    for (let i = 0; i < 3; i++) {
      cards.push(
        this.createCard(CardType.FLIP_THREE, 0, 'images/cards/card-flip-three.svg', 'FLIP THREE')
      );
    }

    // SECOND CHANCE (3x)
    for (let i = 0; i < 3; i++) {
      cards.push(
        this.createCard(
          CardType.SECOND_CHANCE,
          0,
          'images/cards/card-second-chance.svg',
          'SECOND CHANCE'
        )
      );
    }

    return this.shuffle(cards);
  }

  private createCard(type: CardType, value: number, imageUrl: string, displayValue?: string): Card {
    return {
      id: this.currentId++,
      type,
      value,
      imageUrl,
      displayValue: displayValue || value.toString(),
    };
  }

  shuffle(cards: Card[]): Card[] {
    const shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  drawCard(): Card | null {
    const currentDeck = this.deck();
    if (currentDeck.length === 0) {
      return null;
    }

    const card = currentDeck[0];
    this.deck.set(currentDeck.slice(1));
    return card;
  }

  getRemainingCount(): number {
    return this.deck().length;
  }

  getDeck(): Card[] {
    return this.deck();
  }

  setDeck(cards: Card[]): void {
    this.deck.set(this.shuffle(cards));
  }

  reset(): void {
    this.deck.set(this.initializeDeck());
  }
}

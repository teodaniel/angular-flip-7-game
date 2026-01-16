import { Injectable } from '@angular/core';
import { Card, CardType } from '../models/card.model';

@Injectable({
  providedIn: 'root',
})
export class GameLogicService {
  checkBust(drawnCards: Card[], newCard: Card): boolean {
    // Only number cards can cause a bust
    if (newCard.type !== CardType.NUMBER) {
      return false;
    }

    // Check if this number was already drawn
    const numberCards = drawnCards.filter((card) => card.type === CardType.NUMBER);
    return numberCards.some((card) => card.value === newCard.value);
  }

  hasSecondChance(drawnCards: Card[]): boolean {
    return drawnCards.some((card) => card.type === CardType.SECOND_CHANCE);
  }

  removeSecondChanceAndBustCard(drawnCards: Card[], bustCardId: number): {
    remainingCards: Card[];
    removedCards: Card[];
  } {
    // Remove ONE SECOND CHANCE card and the bust-causing number card
    let secondChanceRemoved = false;
    const removedCards: Card[] = [];
    const remainingCards = drawnCards.filter((card) => {
      // Remove the bust card
      if (card.id === bustCardId) {
        removedCards.push(card);
        return false;
      }
      // Remove only the first SECOND CHANCE card encountered
      if (card.type === CardType.SECOND_CHANCE && !secondChanceRemoved) {
        secondChanceRemoved = true;
        removedCards.push(card);
        return false;
      }
      return true;
    });

    return { remainingCards, removedCards };
  }

  calculateRoundScore(drawnCards: Card[]): number {
    let score = 0;
    let hasMultiplier = false;

    for (const card of drawnCards) {
      if (card.type === CardType.NUMBER || card.type === CardType.ADDITION) {
        score += Number(card.value);
      } else if (card.type === CardType.MULTIPLIER) {
        hasMultiplier = true;
      }
      // FREEZE, FLIP_THREE, SECOND_CHANCE don't add to score
    }

    // Apply multiplier if present
    if (hasMultiplier) {
      score *= 2;
    }

    // Add bonus if player reached 7 cards
    if (drawnCards.length === 7) {
      score += 15;
    }

    return score;
  }

  hasFreeze(drawnCards: Card[]): boolean {
    return drawnCards.some((card) => card.type === CardType.FREEZE);
  }

  hasFlipThree(drawnCards: Card[]): boolean {
    return drawnCards.some((card) => card.type === CardType.FLIP_THREE);
  }

  getNumberCardValues(drawnCards: Card[]): number[] {
    return drawnCards
      .filter((card) => card.type === CardType.NUMBER)
      .map((card) => Number(card.value));
  }
}

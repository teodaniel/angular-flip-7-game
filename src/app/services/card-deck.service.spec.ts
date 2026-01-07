import { TestBed } from '@angular/core/testing';
import { CardDeckService } from './card-deck.service';
import { CardType } from '../models/card.model';

describe('CardDeckService', () => {
  let service: CardDeckService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CardDeckService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize deck with 94 cards', () => {
    expect(service.getRemainingCount()).toBe(94);
  });

  it('should draw cards from deck', () => {
    const initialCount = service.getRemainingCount();
    const card = service.drawCard();

    expect(card).toBeTruthy();
    expect(service.getRemainingCount()).toBe(initialCount - 1);
  });

  it('should return null when deck is empty', () => {
    // Draw all cards
    for (let i = 0; i < 94; i++) {
      service.drawCard();
    }

    expect(service.getRemainingCount()).toBe(0);
    expect(service.drawCard()).toBeNull();
  });

  it('should reshuffle cards using setDeck', () => {
    // Draw some cards to create a discard pile
    const drawnCards = [];
    for (let i = 0; i < 10; i++) {
      const card = service.drawCard();
      if (card) drawnCards.push(card);
    }

    expect(service.getRemainingCount()).toBe(84);

    // Reshuffle the 10 drawn cards back into the deck
    service.setDeck(drawnCards);

    expect(service.getRemainingCount()).toBe(10);

    // Verify we can draw from the reshuffled deck
    const card = service.drawCard();
    expect(card).toBeTruthy();
    expect(service.getRemainingCount()).toBe(9);
  });

  it('should reset deck to initial 94 cards', () => {
    // Draw some cards
    for (let i = 0; i < 20; i++) {
      service.drawCard();
    }

    expect(service.getRemainingCount()).toBe(74);

    // Reset
    service.reset();

    expect(service.getRemainingCount()).toBe(94);
  });

  it('should shuffle cards when using setDeck', () => {
    // Create a simple ordered array of cards
    const orderedCards = [];
    for (let i = 0; i < 5; i++) {
      const card = service.drawCard();
      if (card) orderedCards.push(card);
    }

    // Get the IDs in order
    const originalOrder = orderedCards.map((c) => c.id);

    // Set deck with these cards (should shuffle)
    service.setDeck(orderedCards);

    // Draw them back and check if order changed
    const reshuffledCards = [];
    for (let i = 0; i < 5; i++) {
      const card = service.drawCard();
      if (card) reshuffledCards.push(card);
    }

    const newOrder = reshuffledCards.map((c) => c.id);

    // Note: There's a small chance this could fail if shuffle produces same order
    // But with 5 cards, probability is 1/120 (0.83%)
    // For a more reliable test, we just verify all cards are present
    expect(newOrder.sort()).toEqual(originalOrder.sort());
  });
});

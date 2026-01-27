import { Component, signal, inject, computed } from '@angular/core';
import { Card, CardType } from './models/card.model';
import { CardDeckService } from './services/card-deck.service';
import { GameLogicService } from './services/game-logic.service';
import { StartModal } from './components/start-modal/start-modal';
import { EndModal } from './components/end-modal/end-modal';
import { NotificationPopups } from './components/notification-popups/notification-popups';
import { Header } from './components/header/header';
import { TopSection } from './components/top-section/top-section';
import { DeckSection } from './components/deck-section/deck-section';
import { DrawnCards } from './components/drawn-cards/drawn-cards';
import { DiscardOverlay } from './components/discard-overlay/discard-overlay';

export interface Player {
  name: string;
  totalScore: number;
}

@Component({
  selector: 'app-root',
  imports: [
    StartModal,
    EndModal,
    NotificationPopups,
    Header,
    TopSection,
    DeckSection,
    DrawnCards,
    DiscardOverlay,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly cardDeckService = inject(CardDeckService);
  private readonly gameLogic = inject(GameLogicService);

  protected readonly players = signal<Player[]>([
    { name: 'Player 1', totalScore: 0 },
    { name: 'Player 2', totalScore: 0 },
    { name: 'Player 3', totalScore: 0 },
  ]);

  protected readonly currentPlayerIndex = signal(0);
  protected readonly currentRoundScore = signal(0);
  protected readonly drawnCards = signal<Card[]>([]);
  protected readonly discardPile = signal<Card[]>([]);
  protected readonly deckCount = signal(94);
  protected readonly isTurnActive = signal(true);
  protected readonly hasBusted = signal(false);
  protected readonly maxHandSize = 7;
  protected readonly isFlippingThree = signal(false);
  protected readonly flipThreeCount = signal(0);

  // Modal states
  protected readonly showStartModal = signal(true);
  protected readonly showEndModal = signal(false);
  protected readonly winner = signal<Player | null>(null);
  protected readonly minPlayers = 3;
  protected readonly maxPlayers = 18;

  // Discard overlay state
  protected readonly showDiscardOverlay = signal(false);

  // Notification popup states
  protected readonly showBustPopup = signal(false);
  protected readonly showFreezePopup = signal(false);
  protected readonly showBonusPopup = signal(false);
  protected readonly showDeckEmptyPopup = signal(false);
  protected readonly showNextPlayerPopup = signal(false);
  protected readonly showSecondChancePopup = signal(false);
  protected readonly showFlipThreePopup = signal(false);

  // Computed signals - memoized, only recalculate when dependencies change
  protected readonly currentPlayer = computed(() =>
    this.players()[this.currentPlayerIndex()]
  );

  protected readonly sortedPlayers = computed(() =>
    [...this.players()].sort((a, b) => b.totalScore - a.totalScore)
  );

  protected readonly nextPlayerName = computed(() =>
    this.players()[(this.currentPlayerIndex() + 1) % this.players().length].name
  );

  protected readonly canDrawCard = computed(() => {
    const numberCardCount = this.drawnCards().filter((c) => c.type === CardType.NUMBER).length;
    return (
      this.isTurnActive() &&
      !this.hasBusted() &&
      numberCardCount < this.maxHandSize &&
      this.deckCount() > 0 &&
      !this.isFlippingThree()
    );
  });

  protected readonly canStartGame = computed(() =>
    this.players().length >= this.minPlayers && this.players().length <= this.maxPlayers
  );

  protected drawCard(): void {
    // If deck is empty (count is 0), prevent drawing
    if (this.deckCount() === 0) {
      return;
    }

    if (!this.canDrawCard()) {
      return;
    }

    let card = this.cardDeckService.drawCard();
    this.deckCount.set(this.cardDeckService.getRemainingCount());

    // If deck just became empty after drawing, trigger reshuffle
    if (this.deckCount() === 0 && this.discardPile().length > 0) {
      // Show the deck empty popup
      this.showDeckEmptyPopup.set(true);

      // Wait 1.5 seconds, then reshuffle
      setTimeout(() => {
        this.cardDeckService.setDeck(this.discardPile());
        this.discardPile.set([]);
        this.deckCount.set(this.cardDeckService.getRemainingCount());
        this.showDeckEmptyPopup.set(false);
      }, 1500);
    }

    if (!card) {
      return;
    }

    // Check for bust before adding card
    if (this.gameLogic.checkBust(this.drawnCards(), card)) {
      // Check if player has SECOND CHANCE
      if (this.gameLogic.hasSecondChance(this.drawnCards())) {
        // Use SECOND CHANCE - remove it and the bust card, add them to discard
        const { remainingCards, removedCards } = this.gameLogic.removeSecondChanceAndBustCard(
          this.drawnCards(),
          card.id
        );
        this.drawnCards.set(remainingCards);

        // Add removed cards to discard pile
        this.discardPile.set([...removedCards, ...this.discardPile()]);

        // Show second chance popup
        this.showSecondChancePopup.set(true);
        setTimeout(() => {
          this.showSecondChancePopup.set(false);
        }, 2000);

        return;
      } else {
        // Player busts - add the bust card to show it
        const newCards = [...this.drawnCards(), card];
        this.drawnCards.set(newCards);
        this.hasBusted.set(true);
        this.isTurnActive.set(false);
        this.currentRoundScore.set(0);

        // Show bust notification and next player popup
        this.showTurnEndNotification(CardType.NUMBER);
        return;
      }
    }

    // Add card to hand
    const newCards = [...this.drawnCards(), card];
    this.drawnCards.set(newCards);

    // Calculate and update round score
    const score = this.gameLogic.calculateRoundScore(newCards);
    this.currentRoundScore.set(score);

    // Handle special cards
    if (card.type === CardType.FREEZE) {
      this.isTurnActive.set(false);
      this.showTurnEndNotification(CardType.FREEZE);
      return;
    } else if (card.type === CardType.FLIP_THREE && !this.isFlippingThree()) {
      this.isFlippingThree.set(true);
      this.flipThreeCount.set(0);

      // Show flip three popup
      this.showFlipThreePopup.set(true);
      setTimeout(() => {
        this.showFlipThreePopup.set(false);
      }, 1500);

      this.autoFlipThree();
    }

    // Check if 7 number cards reached (hand limit is for number cards only)
    const numberCardCount = newCards.filter((c) => c.type === CardType.NUMBER).length;
    if (numberCardCount >= this.maxHandSize) {
      this.isTurnActive.set(false);
      this.showBonusPopup.set(true);

      // Hide bonus popup after 2 seconds, then show next player popup and end turn
      setTimeout(() => {
        this.showBonusPopup.set(false);
        this.showNextPlayerAndEndTurn();
      }, 2000);
    }
  }

  private autoFlipThree(cardsToFlip: number = 3, baseDelay: number = 0): void {
    // Auto-draw cards with 500ms delay between each (500ms, 1000ms, 1500ms, etc.)
    for (let i = 0; i < cardsToFlip; i++) {
      setTimeout(() => {
        const numberCardCount = this.drawnCards().filter((c) => c.type === CardType.NUMBER).length;

        // Check if we can still draw (excluding isFlippingThree check since we're already flipping)
        if (
          this.isTurnActive() &&
          !this.hasBusted() &&
          numberCardCount < this.maxHandSize &&
          this.deckCount() > 0
        ) {
          const card = this.cardDeckService.drawCard();
          this.deckCount.set(this.cardDeckService.getRemainingCount());

          // Handle deck reshuffle
          if (this.deckCount() === 0 && this.discardPile().length > 0) {
            this.showDeckEmptyPopup.set(true);
            setTimeout(() => {
              this.cardDeckService.setDeck(this.discardPile());
              this.discardPile.set([]);
              this.deckCount.set(this.cardDeckService.getRemainingCount());
              this.showDeckEmptyPopup.set(false);
            }, 1500);
          }

          if (!card) {
            this.isFlippingThree.set(false);
            this.flipThreeCount.set(0);
            return;
          }

          // Check for bust
          if (this.gameLogic.checkBust(this.drawnCards(), card)) {
            if (this.gameLogic.hasSecondChance(this.drawnCards())) {
              const { remainingCards, removedCards } = this.gameLogic.removeSecondChanceAndBustCard(
                this.drawnCards(),
                card.id
              );
              this.drawnCards.set(remainingCards);

              // Add removed cards to discard pile
              this.discardPile.set([...this.discardPile(), ...removedCards]);

              this.showSecondChancePopup.set(true);
              setTimeout(() => {
                this.showSecondChancePopup.set(false);
              }, 2000);
            } else {
              const newCards = [...this.drawnCards(), card];
              this.drawnCards.set(newCards);
              this.hasBusted.set(true);
              this.isTurnActive.set(false);
              this.currentRoundScore.set(0);
              this.isFlippingThree.set(false);
              this.flipThreeCount.set(0);
              this.showTurnEndNotification(CardType.NUMBER);
              return;
            }
          } else {
            // Add card to hand
            const newCards = [...this.drawnCards(), card];
            this.drawnCards.set(newCards);

            // Calculate score
            const score = this.gameLogic.calculateRoundScore(newCards);
            this.currentRoundScore.set(score);

            // Check if this card is also FLIP THREE - add 3 more iterations
            if (card.type === CardType.FLIP_THREE) {
              const currentIteration = i + 1;
              const nextDelay = baseDelay + (currentIteration + 1) * 500;

              // Show flip three popup for nested FLIP THREE
              this.showFlipThreePopup.set(true);
              setTimeout(() => {
                this.showFlipThreePopup.set(false);
              }, 1500);

              // Schedule 3 more cards after the current sequence
              this.autoFlipThree(3, nextDelay);
              return;
            }

            // Handle FREEZE card
            if (card.type === CardType.FREEZE) {
              this.isTurnActive.set(false);
              this.isFlippingThree.set(false);
              this.flipThreeCount.set(0);
              this.showTurnEndNotification(CardType.FREEZE);
              return;
            }

            // Check if 7 number cards reached
            const updatedNumberCardCount = newCards.filter(
              (c) => c.type === CardType.NUMBER
            ).length;
            if (updatedNumberCardCount >= this.maxHandSize) {
              this.isTurnActive.set(false);
              this.isFlippingThree.set(false);
              this.flipThreeCount.set(0);
              this.showBonusPopup.set(true);
              setTimeout(() => {
                this.showBonusPopup.set(false);
                this.showNextPlayerAndEndTurn();
              }, 2000);
              return;
            }
          }

          this.flipThreeCount.set(this.flipThreeCount() + 1);
        } else {
          // Stop flipping if conditions aren't met
          this.isFlippingThree.set(false);
          this.flipThreeCount.set(0);
        }

        // Reset flags after the last card attempt
        if (i === cardsToFlip - 1) {
          this.isFlippingThree.set(false);
          this.flipThreeCount.set(0);
        }
      }, baseDelay + (i + 1) * 500); // Stagger each draw by 500ms (500ms, 1000ms, 1500ms)
    }
  }

  protected endTurn(): void {
    this.isTurnActive.set(false);
    this.showNextPlayerAndEndTurn();
  }

  private showNextPlayerAndEndTurn(): void {
    // Show next player popup
    this.showNextPlayerPopup.set(true);

    // Hide next player popup after 2 seconds and finalize turn end
    setTimeout(() => {
      this.showNextPlayerPopup.set(false);
      this.finalizeTurnEnd();
    }, 2000);
  }

  private finalizeTurnEnd(): void {
    const finalScore = this.hasBusted() ? 0 : this.currentRoundScore();

    // Update player's total score
    const updatedPlayers = this.players().map((p, idx) =>
      idx === this.currentPlayerIndex() ? { ...p, totalScore: p.totalScore + finalScore } : p
    );
    this.players.set(updatedPlayers);

    // Move cards to discard pile (always move cards, even if busted)
    this.discardPile.set([...this.drawnCards(), ...this.discardPile()]);

    // Reset for next turn
    this.drawnCards.set([]);
    this.currentRoundScore.set(0);
    this.hasBusted.set(false);
    this.isTurnActive.set(true);
    this.isFlippingThree.set(false);
    this.flipThreeCount.set(0);

    // Move to next player
    const nextPlayerIndex = (this.currentPlayerIndex() + 1) % this.players().length;
    this.currentPlayerIndex.set(nextPlayerIndex);

    // Check for winner (200+ points)
    if (updatedPlayers.some((p) => p.totalScore >= 200)) {
      const winningPlayer = updatedPlayers.reduce((prev, current) =>
        prev.totalScore > current.totalScore ? prev : current
      );
      this.winner.set(winningPlayer);
      this.showEndModal.set(true);
      return;
    }
  }

  protected handleAddPlayer(playerName: string): void {
    const playerNumber = this.players().length + 1;
    const name = playerName.trim() || `Player ${playerNumber}`;
    this.players.set([...this.players(), { name, totalScore: 0 }]);
  }

  protected handleRemovePlayer(index: number): void {
    const updatedPlayers = this.players().filter((_, i) => i !== index);
    this.players.set(updatedPlayers);
  }

  protected handleUpdatePlayerName(event: { index: number; name: string }): void {
    const updatedPlayers = this.players().map((p, i) =>
      i === event.index ? { ...p, name: event.name.trim() || `Player ${event.index + 1}` } : p
    );
    this.players.set(updatedPlayers);
  }

  protected startGame(): void {
    if (!this.canStartGame()) return;

    this.showStartModal.set(false);
    this.resetGameState();
  }

  protected resetGameState(): void {
    // Reset all game state
    this.currentPlayerIndex.set(0);
    this.currentRoundScore.set(0);
    this.drawnCards.set([]);
    this.discardPile.set([]);
    this.isTurnActive.set(true);
    this.hasBusted.set(false);
    this.isFlippingThree.set(false);
    this.flipThreeCount.set(0);

    // Reset deck
    this.cardDeckService.reset();
    this.deckCount.set(this.cardDeckService.getRemainingCount());

    // Reset player scores
    const resetPlayers = this.players().map((p) => ({ ...p, totalScore: 0 }));
    this.players.set(resetPlayers);
  }

  protected returnToStart(): void {
    this.showEndModal.set(false);
    this.showStartModal.set(true);
    this.winner.set(null);
    this.resetGameState();
  }

  protected handleViewDiscardPile(): void {
    // Only show overlay if there are cards in the discard pile
    if (this.discardPile().length > 0) {
      this.showDiscardOverlay.set(true);
    }
  }

  protected handleCloseDiscardOverlay(): void {
    this.showDiscardOverlay.set(false);
  }

  private showTurnEndNotification(cardType: CardType): void {
    // Map card types to their corresponding popup signals
    const popupSignalMap = new Map([
      [CardType.NUMBER, this.showBustPopup],
      [CardType.FREEZE, this.showFreezePopup],
    ]);

    const popupSignal = popupSignalMap.get(cardType);
    if (!popupSignal) {
      console.warn(`Unexpected card type for turn end notification: ${cardType}`);
      return;
    }

    // Show the popup
    popupSignal.set(true);

    // Hide the popup after 2 seconds, then show next player popup and end turn
    setTimeout(() => {
      popupSignal.set(false);
      this.showNextPlayerAndEndTurn();
    }, 2000);
  }
}

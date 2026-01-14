import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Card, CardType } from './models/card.model';
import { CardDeckService } from './services/card-deck.service';
import { GameLogicService } from './services/game-logic.service';

interface Player {
  name: string;
  totalScore: number;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, FormsModule],
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
  protected readonly newPlayerName = signal('');
  protected readonly minPlayers = 3;
  protected readonly maxPlayers = 18;

  // Discard overlay state
  protected readonly showDiscardOverlay = signal(false);
  protected readonly mousePosition = signal({ x: 0, y: 0 });
  private mouseMoveListener: ((e: MouseEvent) => void) | null = null;

  // Notification popup states
  protected readonly showBustPopup = signal(false);
  protected readonly showFreezePopup = signal(false);
  protected readonly showBonusPopup = signal(false);
  protected readonly showDeckEmptyPopup = signal(false);
  protected readonly showNextPlayerPopup = signal(false);

  protected get currentPlayer(): Player {
    return this.players()[this.currentPlayerIndex()];
  }

  protected get sortedPlayers(): Player[] {
    return [...this.players()].sort((a, b) => b.totalScore - a.totalScore);
  }

  protected get canDrawCard(): boolean {
    const numberCardCount = this.drawnCards().filter((c) => c.type === CardType.NUMBER).length;
    return (
      this.isTurnActive() &&
      !this.hasBusted() &&
      numberCardCount < this.maxHandSize &&
      this.deckCount() > 0
    );
  }

  protected get canStartGame(): boolean {
    return this.players().length >= this.minPlayers && this.players().length <= this.maxPlayers;
  }

  protected get canAddPlayer(): boolean {
    return this.players().length < this.maxPlayers;
  }

  protected get canRemovePlayer(): boolean {
    return this.players().length > this.minPlayers;
  }

  protected drawCard(): void {
    // If deck is empty (count is 0), prevent drawing
    if (this.deckCount() === 0) {
      return;
    }

    if (!this.canDrawCard) {
      return;
    }

    let card = this.cardDeckService.drawCard();
    this.deckCount.set(this.cardDeckService.getRemainingCount());

    // If deck just became empty after drawing, trigger reshuffle
    if (this.deckCount() === 0 && this.discardPile().length > 0) {
      console.log('Deck empty! Reshuffling discard pile...');

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
      console.log('No more cards available');
      return;
    }

    // Check for bust before adding card
    if (this.gameLogic.checkBust(this.drawnCards(), card)) {
      // Check if player has SECOND CHANCE
      if (this.gameLogic.hasSecondChance(this.drawnCards())) {
        // Use SECOND CHANCE - remove it and the bust card
        const updatedCards = this.gameLogic.removeSecondChanceAndBustCard(
          this.drawnCards(),
          card.id
        );
        this.drawnCards.set(updatedCards);
        console.log('SECOND CHANCE used! Bust prevented.');
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
        console.log('BUST! You drew a duplicate number card.');
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
      console.log('FREEZE card drawn! Turn ends.');
      this.isTurnActive.set(false);
      this.showTurnEndNotification(CardType.FREEZE);
      return;
    } else if (card.type === CardType.FLIP_THREE && !this.isFlippingThree()) {
      console.log('FLIP THREE activated! Auto-drawing 3 cards...');
      this.isFlippingThree.set(true);
      this.flipThreeCount.set(0);
      this.autoFlipThree();
    }

    // Check if 7 number cards reached (hand limit is for number cards only)
    const numberCardCount = newCards.filter((c) => c.type === CardType.NUMBER).length;
    if (numberCardCount >= this.maxHandSize) {
      console.log('7 number cards reached! 15 point bonus awarded. Turn ends.');
      this.isTurnActive.set(false);
      this.showBonusPopup.set(true);

      // Hide bonus popup after 2 seconds, show next player popup, then end turn
      setTimeout(() => {
        this.showBonusPopup.set(false);

        // Show next player popup
        this.showNextPlayerPopup.set(true);

        // Hide next player popup after 2 seconds and end turn
        setTimeout(() => {
          this.showNextPlayerPopup.set(false);
          this.endTurn();
        }, 2000);
      }, 2000);
    }
  }

  private autoFlipThree(): void {
    const numberCardCount = this.drawnCards().filter((c) => c.type === CardType.NUMBER).length;
    if (
      this.flipThreeCount() < 3 &&
      this.canDrawCard &&
      !this.hasBusted() &&
      numberCardCount < this.maxHandSize
    ) {
      this.flipThreeCount.set(this.flipThreeCount() + 1);
      this.drawCard();

      // Continue flipping if conditions met
      const updatedNumberCardCount = this.drawnCards().filter((c) => c.type === CardType.NUMBER).length;
      if (
        this.flipThreeCount() < 3 &&
        this.canDrawCard &&
        !this.hasBusted() &&
        updatedNumberCardCount < this.maxHandSize
      ) {
        setTimeout(() => this.autoFlipThree(), 300);
      } else {
        this.isFlippingThree.set(false);
        this.flipThreeCount.set(0);
      }
    } else {
      this.isFlippingThree.set(false);
      this.flipThreeCount.set(0);
    }
  }

  protected endTurn(): void {
    const finalScore = this.hasBusted() ? 0 : this.currentRoundScore();

    // Update player's total score
    const updatedPlayers = this.players().map((p, idx) =>
      idx === this.currentPlayerIndex()
        ? { ...p, totalScore: p.totalScore + finalScore }
        : p
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
      console.log(`${winningPlayer.name} wins with ${winningPlayer.totalScore} points!`);
      return;
    }

    console.log(`Turn ended. Next player: ${this.currentPlayer.name}`);
  }

  protected addPlayer(): void {
    if (!this.canAddPlayer) return;

    const playerNumber = this.players().length + 1;
    const playerName = this.newPlayerName().trim() || `Player ${playerNumber}`;

    this.players.set([...this.players(), { name: playerName, totalScore: 0 }]);
    this.newPlayerName.set('');
  }

  protected removePlayer(index: number): void {
    if (!this.canRemovePlayer) return;

    const updatedPlayers = this.players().filter((_, i) => i !== index);
    this.players.set(updatedPlayers);
  }

  protected updatePlayerName(index: number, name: string): void {
    const updatedPlayers = this.players().map((p, i) =>
      i === index ? { ...p, name: name.trim() || `Player ${index + 1}` } : p
    );
    this.players.set(updatedPlayers);
  }

  protected startGame(): void {
    if (!this.canStartGame) return;

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

  protected toggleDiscardOverlay(): void {
    // Only show overlay if there are cards in the discard pile
    if (this.discardPile().length > 0) {
      const newState = !this.showDiscardOverlay();
      this.showDiscardOverlay.set(newState);

      if (newState) {
        // Start listening to mouse movement
        this.mouseMoveListener = (e: MouseEvent) => {
          this.mousePosition.set({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', this.mouseMoveListener);
      } else {
        // Stop listening to mouse movement
        if (this.mouseMoveListener) {
          window.removeEventListener('mousemove', this.mouseMoveListener);
          this.mouseMoveListener = null;
        }
      }
    }
  }

  protected closeDiscardOverlay(event: MouseEvent): void {
    // Close if clicking outside of cards (on the overlay background)
    const target = event.target as HTMLElement;
    if (target.classList.contains('discard-overlay')) {
      this.showDiscardOverlay.set(false);

      // Remove mouse listener
      if (this.mouseMoveListener) {
        window.removeEventListener('mousemove', this.mouseMoveListener);
        this.mouseMoveListener = null;
      }
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

    // Define max distance for effect (200px)
    const maxDistance = 200;
    // Calculate proximity: 1 when mouse is on card, 0 when far away
    const proximity = Math.max(0, 1 - distance / maxDistance);

    return proximity;
  }

  // Calculate cards per row based on viewport width
  protected getCardsPerRow(): number {
    const width = window.innerWidth;
    if (width >= 1400) return 25;
    if (width >= 1200) return 20;
    if (width >= 992) return 16;
    if (width >= 768) return 12;
    if (width >= 480) return 8;
    return 6;
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
    return Math.ceil(this.discardPile().length / this.getCardsPerRow());
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

    // Hide the popup after 2 seconds and show next player popup
    setTimeout(() => {
      popupSignal.set(false);

      // Show next player popup
      this.showNextPlayerPopup.set(true);

      // Hide next player popup after 2 seconds and end turn
      setTimeout(() => {
        this.showNextPlayerPopup.set(false);
        this.endTurn();
      }, 2000);
    }, 2000);
  }
}

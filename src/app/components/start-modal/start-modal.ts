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
import { FormsModule } from '@angular/forms';

interface Player {
  name: string;
  totalScore: number;
}

@Component({
  selector: 'app-start-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './start-modal.html',
  styleUrl: './start-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartModal {
  // Inputs
  readonly show = input.required<boolean>();
  readonly players = input.required<Player[]>();
  readonly minPlayers = input.required<number>();
  readonly maxPlayers = input.required<number>();
  readonly canStartGame = input.required<boolean>();

  // Outputs
  readonly addPlayer = output<string>();
  readonly removePlayer = output<number>();
  readonly updatePlayerName = output<{ index: number; name: string }>();
  readonly startGame = output<void>();

  // Internal state
  protected readonly newPlayerName = signal('');

  // View references for focus management
  private readonly modalContainer = viewChild<ElementRef<HTMLDivElement>>('modalContainer');

  constructor() {
    // Effect to manage focus when modal opens/closes
    effect(() => {
      if (this.show()) {
        // Set focus to first input when modal opens
        setTimeout(() => {
          const modal = this.modalContainer()?.nativeElement;
          if (modal) {
            const firstInput = modal.querySelector('input:not([disabled])') as HTMLInputElement;
            firstInput?.focus();
          }
        }, 0);
      }
    });
  }

  // Handle Escape key to close modal (by starting game if possible)
  @HostListener('document:keydown.escape')
  protected handleEscape(): void {
    if (this.show() && this.canStartGame()) {
      this.handleStartGame();
    }
  }

  // Trap focus within modal
  @HostListener('document:keydown.tab', ['$event'])
  protected handleTab(event: Event): void {
    if (!this.show()) return;

    const keyEvent = event as KeyboardEvent;
    const modal = this.modalContainer()?.nativeElement;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (keyEvent.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        keyEvent.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        keyEvent.preventDefault();
        firstElement?.focus();
      }
    }
  }

  protected get canAddPlayer(): boolean {
    return this.players().length < this.maxPlayers();
  }

  protected get canRemovePlayer(): boolean {
    return this.players().length > this.minPlayers();
  }

  protected handleAddPlayer(): void {
    const playerName = this.newPlayerName().trim();
    this.addPlayer.emit(playerName);
    this.newPlayerName.set('');
  }

  protected handleRemovePlayer(index: number): void {
    this.removePlayer.emit(index);
  }

  protected handleUpdatePlayerName(index: number, name: string): void {
    this.updatePlayerName.emit({ index, name });
  }

  protected handleStartGame(): void {
    this.startGame.emit();
  }
}

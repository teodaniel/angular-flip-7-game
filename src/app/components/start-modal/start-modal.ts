import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
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

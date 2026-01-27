import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Player {
  name: string;
  totalScore: number;
}

@Component({
  selector: 'app-top-section',
  imports: [CommonModule],
  templateUrl: './top-section.html',
  styleUrl: './top-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopSection {
  // Inputs
  readonly currentPlayer = input.required<Player>();
  readonly currentRoundScore = input.required<number>();
  readonly sortedPlayers = input.required<Player[]>();
}

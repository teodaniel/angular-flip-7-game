import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Player {
  name: string;
  totalScore: number;
}

@Component({
  selector: 'app-end-modal',
  imports: [CommonModule],
  templateUrl: './end-modal.html',
  styleUrl: './end-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EndModal {
  // Inputs
  readonly show = input.required<boolean>();
  readonly winner = input.required<Player | null>();

  // Outputs
  readonly returnToStart = output<void>();

  protected handleReturnToStart(): void {
    this.returnToStart.emit();
  }
}

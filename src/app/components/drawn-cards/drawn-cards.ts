import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from '../../models/card.model';

@Component({
  selector: 'app-drawn-cards',
  imports: [CommonModule],
  templateUrl: './drawn-cards.html',
  styleUrl: './drawn-cards.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawnCards {
  // Inputs
  readonly cards = input.required<Card[]>();
}

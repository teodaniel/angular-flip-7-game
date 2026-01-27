import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notification-popups',
  imports: [CommonModule],
  templateUrl: './notification-popups.html',
  styleUrl: './notification-popups.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationPopups {
  // Inputs
  readonly showBust = input.required<boolean>();
  readonly showFreeze = input.required<boolean>();
  readonly showBonus = input.required<boolean>();
  readonly showDeckEmpty = input.required<boolean>();
  readonly showNextPlayer = input.required<boolean>();
  readonly showSecondChance = input.required<boolean>();
  readonly showFlipThree = input.required<boolean>();
  readonly nextPlayerName = input.required<string>();
}

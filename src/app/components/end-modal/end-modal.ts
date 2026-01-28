import {
  Component,
  input,
  output,
  effect,
  ElementRef,
  viewChild,
  ChangeDetectionStrategy,
  HostListener,
} from '@angular/core';
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

  // View references for focus management
  private readonly modalContainer = viewChild<ElementRef<HTMLDivElement>>('modalContainer');

  constructor() {
    // Effect to manage focus when modal opens
    effect(() => {
      if (this.show()) {
        // Set focus to modal container when it opens
        setTimeout(() => {
          const modal = this.modalContainer()?.nativeElement;
          if (modal) {
            // Make container focusable and focus it
            modal.setAttribute('tabindex', '-1');
            modal.focus();
          }
        }, 0);
      }
    });
  }

  // Handle Escape key or Enter key to close modal
  @HostListener('document:keydown.escape')
  @HostListener('document:keydown.enter')
  protected handleKeyClose(): void {
    if (this.show()) {
      this.handleReturnToStart();
    }
  }

  protected handleReturnToStart(): void {
    this.returnToStart.emit();
  }
}

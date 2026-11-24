import { Component, computed, input, signal } from '@angular/core';

import { TRUNCATE_AT, truncate } from './truncate';

/**
 * Shows a text cut to TRUNCATE_AT characters with a "Show more" toggle (RF-05).
 * The text is interpolated with {{ }}, so Angular escapes it: HTML inside a span is shown
 * as plain characters, never run (RNF-08).
 */
@Component({
  selector: 'app-expandable-text',
  styles: `
    .text {
      white-space: pre-wrap;
      word-break: break-word;
    }
    button {
      background: none;
      border: none;
      padding: 0;
      margin-left: 4px;
      color: var(--ion-color-primary);
      font: inherit;
    }
  `,
  template: `
    <span class="text">{{ expanded() ? text() : shortText() }}</span>
    @if (isLong()) {
      <button type="button" (click)="expanded.set(!expanded())">{{ expanded() ? 'Show less' : 'Show more' }}</button>
    }
  `,
})
export class ExpandableTextComponent {
  readonly text = input.required<string>();

  protected readonly expanded = signal(false);
  protected readonly isLong = computed(() => this.text().length > TRUNCATE_AT);
  protected readonly shortText = computed(() => truncate(this.text()));
}

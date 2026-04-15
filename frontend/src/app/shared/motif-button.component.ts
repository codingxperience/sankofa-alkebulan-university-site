import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-motif-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="motif-button"
      [class]="variant"
      [disabled]="disabled"
      [attr.aria-label]="ariaLabel || label"
      (click)="handleClick($event)"
    >
      <span class="motif-button__label">{{ label }}</span>
      <svg class="motif-button__background" viewBox="0 0 400 100" preserveAspectRatio="none">
        <defs>
          <pattern id="african-motif" patternUnits="userSpaceOnUse" width="80" height="40">
            <rect width="80" height="40" fill="#FFFFFF" />
            <!-- Mask -->
            <ellipse cx="10" cy="20" rx="5" ry="8" fill="#000000" />
            <rect x="7" y="15" width="6" height="10" fill="#333333" />
            <circle cx="10" cy="18" r="1" fill="#FFFFFF" />
            <circle cx="10" cy="22" r="1" fill="#FFFFFF" />
            <!-- Drum -->
            <rect x="25" y="10" width="8" height="20" fill="#000000" />
            <circle cx="29" cy="10" r="4" fill="#333333" />
            <circle cx="29" cy="30" r="4" fill="#333333" />
            <line x1="25" y1="15" x2="33" y2="15" stroke="#000000" stroke-width="1" />
            <line x1="25" y1="20" x2="33" y2="20" stroke="#000000" stroke-width="1" />
            <line x1="25" y1="25" x2="33" y2="25" stroke="#000000" stroke-width="1" />
            <!-- Figure -->
            <circle cx="50" cy="15" r="3" fill="#000000" />
            <rect x="47" y="18" width="6" height="10" fill="#000000" />
            <line x1="47" y1="22" x2="45" y2="25" stroke="#000000" stroke-width="1" />
            <line x1="53" y1="22" x2="55" y2="25" stroke="#000000" stroke-width="1" />
            <line x1="47" y1="28" x2="45" y2="32" stroke="#000000" stroke-width="1" />
            <line x1="53" y1="28" x2="55" y2="32" stroke="#000000" stroke-width="1" />
            <!-- Triangles and zigzags -->
            <path d="M65 5 L70 15 L65 25 L60 15 Z" fill="#FFD700" />
            <path d="M70 5 L75 10 L70 15 L65 10 Z" fill="#FFA500" />
            <path d="M0 35 L5 30 L10 35 L15 30 L20 35" stroke="#006400" stroke-width="1" fill="none" />
            <!-- Dots and circles -->
            <circle cx="35" cy="35" r="2" fill="#000000" />
            <circle cx="40" cy="35" r="1" fill="#FFFFFF" />
            <circle cx="35" cy="35" r="3" stroke="#FFD700" stroke-width="1" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#african-motif)" />
      </svg>
    </button>
  `,
  styles: [`
    .motif-button {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-md) var(--spacing-xl);
      border: none;
      border-radius: 8px;
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-semibold);
      cursor: pointer;
      transition: transform 0.2s ease, opacity 0.2s ease;
      overflow: hidden;
      background: transparent;
      color: var(--primary-color);
      min-height: 48px;
      --motif-bg: rgba(255,255,255,0.9);
      --motif-accent: rgba(184, 148, 31, 0.6);
      --motif-primary: rgba(26, 26, 26, 0.4);
    }

    .motif-button:hover:not(:disabled),
    .motif-button:focus:not(:disabled) {
      /* No hover effects */
    }

    .motif-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .motif-button__background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
    }

    .motif-button__label {
      position: relative;
      z-index: 1;
      font-family: inherit;
    }

    @media (prefers-reduced-motion: reduce) {
      .motif-button {
        transition: none;
      }

      .motif-button:hover,
      .motif-button:focus {
        transform: none;
      }
    }

    @media (max-width: 768px) {
      .motif-button {
        padding: var(--spacing-sm) var(--spacing-md);
        font-size: var(--font-size-sm);
      }
    }
  `]
})
export class MotifButtonComponent {
  @Input() label: string = '';
  @Input() path: string = '';
  @Input() variant: string = '';
  @Input() disabled: boolean = false;
  @Input() ariaLabel: string = '';
  @Output() click = new EventEmitter<string>();

  handleClick(event: Event) {
    this.click.emit(this.path);
  }
}
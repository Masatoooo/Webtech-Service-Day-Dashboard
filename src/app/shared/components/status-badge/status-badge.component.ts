import { Component, Input } from '@angular/core';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'forest'
  | 'gold'
  | 'brass'
  | 'slate'
  | 'navy'
  | 'warm'
  | 'error'
  | 'success';

@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.css'],
  standalone: false
})
export class StatusBadgeComponent {
  @Input() variant: BadgeVariant = 'default';
  @Input() label: string = '';

  get badgeClass(): string {
    switch (this.variant) {
      case 'forest':
      case 'primary':
      case 'success':
        return 'badge badge-forest';
      case 'brass':
      case 'gold':
        return 'badge badge-brass';
      case 'slate':
      case 'navy':
        return 'badge badge-slate';
      case 'error':
        return 'badge badge-error';
      case 'warm':
      default:
        return 'badge badge-warm';
    }
  }
}

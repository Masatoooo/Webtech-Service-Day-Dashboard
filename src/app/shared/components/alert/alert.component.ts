import { Component, Input } from '@angular/core';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css'],
  standalone: false
})
export class AlertComponent {
  @Input() type: AlertType = 'info';
  @Input() message: string = '';
}

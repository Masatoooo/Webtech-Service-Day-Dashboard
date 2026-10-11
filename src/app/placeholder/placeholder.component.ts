import { Component } from '@angular/core';

@Component({
  selector: 'app-placeholder',
  templateUrl: './placeholder.component.html',
  styleUrl: './placeholder.component.css',
  standalone: false
})
export class PlaceholderComponent {
  readonly currentDate = new Date().toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

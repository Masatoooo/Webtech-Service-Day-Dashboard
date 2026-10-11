import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { StatusBadgeComponent } from './components/status-badge/status-badge.component';
import { AlertComponent } from './components/alert/alert.component';
import { NotFoundComponent } from './components/not-found/not-found.component';

@NgModule({
  declarations: [
    StatusBadgeComponent,
    AlertComponent,
    NotFoundComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    StatusBadgeComponent,
    AlertComponent,
    NotFoundComponent
  ]
})
export class SharedModule {}

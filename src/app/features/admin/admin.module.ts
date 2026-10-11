import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../../shared/shared.module';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { ActivityManagementComponent } from './pages/activity-management/activity-management.component';
import { AdminRemindersComponent } from './pages/admin-reminders/admin-reminders.component';

@NgModule({
  declarations: [
    AdminDashboardComponent,
    ActivityManagementComponent,
    AdminRemindersComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    SharedModule
  ]
})
export class AdminModule {}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../../shared/shared.module';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { ActivityManagementComponent } from './pages/activity-management/activity-management.component';
import { NgoPartnersComponent } from './pages/ngo-partners/ngo-partners.component';
import { ParticipantMonitoringComponent } from './pages/participant-monitoring/participant-monitoring.component';
import { AdminRemindersComponent } from './pages/admin-reminders/admin-reminders.component';
import { AdminQrComponent } from './pages/admin-qr/admin-qr.component';

@NgModule({
  declarations: [
    AdminDashboardComponent,
    ActivityManagementComponent,
    NgoPartnersComponent,
    ParticipantMonitoringComponent,
    AdminRemindersComponent,
    AdminQrComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    SharedModule
  ]
})
export class AdminModule {}

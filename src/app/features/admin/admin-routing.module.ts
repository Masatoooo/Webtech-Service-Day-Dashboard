import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { ActivityManagementComponent } from './pages/activity-management/activity-management.component';
import { NgoPartnersComponent } from './pages/ngo-partners/ngo-partners.component';
import { ParticipantMonitoringComponent } from './pages/participant-monitoring/participant-monitoring.component';
import { AdminRemindersComponent } from './pages/admin-reminders/admin-reminders.component';
import { AdminQrComponent } from './pages/admin-qr/admin-qr.component';

const routes: Routes = [
  {
    path: '',
    component: AdminDashboardComponent
  },
  {
    path: 'activities',
    component: ActivityManagementComponent
  },
  {
    path: 'ngos',
    component: NgoPartnersComponent
  },
  {
    path: 'participants',
    component: ParticipantMonitoringComponent
  },
  {
    path: 'attendance',
    redirectTo: 'participants',
    pathMatch: 'full'
  },
  {
    path: 'reminders',
    component: AdminRemindersComponent
  },
  {
    path: 'qr',
    component: AdminQrComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {}

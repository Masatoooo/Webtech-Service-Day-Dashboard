import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { ActivityManagementComponent } from './pages/activity-management/activity-management.component';
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

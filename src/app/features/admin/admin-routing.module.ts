import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { ActivityManagementComponent } from './pages/activity-management/activity-management.component';

const routes: Routes = [
  {
    path: '',
    component: AdminDashboardComponent
  },
  {
    path: 'activities',
    component: ActivityManagementComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {}

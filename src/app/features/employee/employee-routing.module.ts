import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EmployeeDashboardComponent } from './pages/employee-dashboard/employee-dashboard.component';
import { OpportunityListComponent } from './pages/opportunity-list/opportunity-list.component';
import { ActivityDetailComponent } from './pages/activity-detail/activity-detail.component';
import { MyRegistrationsComponent } from './pages/my-registrations/my-registrations.component';
import { EmployeeNotificationsComponent } from './pages/employee-notifications/employee-notifications.component';
import { EmployeeCheckinComponent } from './pages/employee-checkin/employee-checkin.component';

const routes: Routes = [
  {
    path: '',
    component: EmployeeDashboardComponent
  },
  {
    path: 'activities',
    component: OpportunityListComponent
  },
  {
    path: 'activities/:id',
    component: ActivityDetailComponent
  },
  {
    path: 'registrations',
    component: MyRegistrationsComponent
  },
  {
    path: 'notifications',
    component: EmployeeNotificationsComponent
  },
  {
    path: 'checkin',
    component: EmployeeCheckinComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EmployeeRoutingModule {}

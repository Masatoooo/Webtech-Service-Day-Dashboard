import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SharedModule } from '../../shared/shared.module';
import { EmployeeRoutingModule } from './employee-routing.module';
import { EmployeeDashboardComponent } from './pages/employee-dashboard/employee-dashboard.component';
import { OpportunityListComponent } from './pages/opportunity-list/opportunity-list.component';
import { ActivityDetailComponent } from './pages/activity-detail/activity-detail.component';
import { MyRegistrationsComponent } from './pages/my-registrations/my-registrations.component';
import { EmployeeNotificationsComponent } from './pages/employee-notifications/employee-notifications.component';

@NgModule({
  declarations: [
    EmployeeDashboardComponent,
    OpportunityListComponent,
    ActivityDetailComponent,
    MyRegistrationsComponent,
    EmployeeNotificationsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    EmployeeRoutingModule,
    SharedModule
  ]
})
export class EmployeeModule {}

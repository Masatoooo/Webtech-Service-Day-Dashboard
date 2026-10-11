import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../../shared/shared.module';
import { EmployeeRoutingModule } from './employee-routing.module';
import { EmployeeDashboardComponent } from './pages/employee-dashboard/employee-dashboard.component';

@NgModule({
  declarations: [
    EmployeeDashboardComponent
  ],
  imports: [
    CommonModule,
    EmployeeRoutingModule,
    SharedModule
  ]
})
export class EmployeeModule {}

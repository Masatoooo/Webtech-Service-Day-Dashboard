import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';
import { AuthGuard, RoleGuard, LoginGuard, RootRedirectGuard } from './core/guards';
import { PlaceholderComponent } from './placeholder/placeholder.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [RootRedirectGuard],
    component: PlaceholderComponent
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [LoginGuard]
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [LoginGuard]
  },
  {
    path: 'admin',
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRole: 'ADMIN' },
    loadChildren: () =>
      import('./features/admin/admin.module').then((m) => m.AdminModule)
  },
  {
    path: 'employee',
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRole: 'EMPLOYEE' },
    loadChildren: () =>
      import('./features/employee/employee.module').then((m) => m.EmployeeModule)
  },
  {
    path: '404',
    component: NotFoundComponent
  },
  {
    path: '**',
    redirectTo: '404'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LogbookComponent } from './pages/logbook/logbook.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { CallbackComponent } from './pages/auth/callback/callback.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { PilotGuard } from './guards/pilot.guard';
import { RegisterComponent } from './pages/auth/register/register.component';
import { MedicalsComponent } from './pages/medicals/medicals.component';
import { LicenseComponent } from './pages/license/license.component';
import { TokensComponent } from './pages/profile/tokens/tokens.component';
import { AdminComponent } from './pages/admin/admin.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'auth/callback', component: CallbackComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent, canActivate: [PilotGuard] },
      { path: 'profile', component: ProfileComponent },
      { path: 'tokens', component: TokensComponent },
      { path: 'admin', component: AdminComponent, canActivate: [AdminGuard] },

      {
        path: 'medicals/:classType', component: MedicalsComponent, canActivate: [PilotGuard]
      },

      { path: 'logbook', component: LogbookComponent, canActivate: [PilotGuard] },

      {
        path: 'license/:type', component: LicenseComponent, canActivate: [PilotGuard]
      }
    ]
  }
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { 

}

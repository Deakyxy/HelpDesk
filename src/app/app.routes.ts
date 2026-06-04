import { Routes } from '@angular/router';
import { HomeComponent } from './componentes/home/home';
import { DashboardTecnicoComponent } from './componentes/dashboard-tecnico/dashboard-tecnico';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'tecnico',
    component: DashboardTecnicoComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];

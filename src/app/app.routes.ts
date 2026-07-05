import { Routes } from '@angular/router';
import { HomeComponent } from './componentes/home/home';
import { DashboardTecnicoComponent } from './componentes/dashboard-tecnico/dashboard-tecnico';
import { DashboardUsuarioComponent } from './componentes/dashboard-usuario/dashboard-usuario'; 
import { Firestore, collection, getDocs, DocumentData, QueryDocumentSnapshot, Timestamp } from '@angular/fire/firestore';

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
    path: 'panel-usuario',
    component: DashboardUsuarioComponent
  }
];

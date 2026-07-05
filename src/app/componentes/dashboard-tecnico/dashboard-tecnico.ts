import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Firestore, collection, getDocs, DocumentData, QueryDocumentSnapshot, where ,query, collectionData } from '@angular/fire/firestore';
import {Usuario} from '../home/home';

@Component({
  selector: 'app-dashboard-tecnico',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-tecnico.html',
  styleUrls: ['./dashboard-tecnico.css']
})

export class DashboardTecnicoComponent implements OnInit {
  private session    = inject(SessionService);
  private equiposSvc = inject(EquiposService);
  private ticketsSvc = inject(TicketsService);
  private firestore  = inject(Firestore);
  private router     = inject(Router);

  usuario    = this.session.obtener() || { uid: 'tecnico-default', nombre: 'Técnico', correo: 'tecnico@test.com', rol: 'tecnico' as const };
  tabActual: TabTecnico = 'tickets';
  filtroTicket: FiltroTicket = 'TODOS';

  filtrosDisponibles = [
    { valor: 'TODOS',             etiqueta: 'Todos' },
    { valor: 'ABIERTO',           etiqueta: 'Abiertos' },
      this.usuario.nombres = datos[0].nombres; 
      this.usuario.apellidos = datos[0].apellidos;
    }
  ; 
  

cerrarSesion() {
    this.router.navigate(['/']);
  }
}


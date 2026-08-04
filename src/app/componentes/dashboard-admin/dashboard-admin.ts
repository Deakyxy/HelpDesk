import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, query, where, collectionData, doc, updateDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-admin.html',
  styleUrls: ['./dashboard-admin.css']
})
export class DashboardAdminComponent {
  private firestore = inject(Firestore);
  private router = inject(Router);

  vistaActual: 'usuarios' | 'staff' = 'usuarios';
  mostrarTickets: boolean = true;
  areaFiltro: string = 'Todas';

  tecnicos: any[] = [];
  usuarios: any[] = [];
  
  todosTicketsActivos: any[] = [];
  todosTicketsHistorial: any[] = [];
  
  ticketsActivos: any[] = [];
  ticketsHistorial: any[] = [];

  constructor() {
    let loginCollection = collection(this.firestore, "Login");
    
    let qTecnicos = query(loginCollection, where("rol", "==", "tecnico"));
    collectionData(qTecnicos, { idField: 'id' }).subscribe((datos: any[]) => {
      this.tecnicos = datos;
    });

    let qUsuarios = query(loginCollection, where("rol", "==", "usuario"));
    collectionData(qUsuarios, { idField: 'id' }).subscribe((datos: any[]) => {
      this.usuarios = datos;
    });
    
    let ticketsCollection = collection(this.firestore, "Tickets");
    collectionData(ticketsCollection, { idField: 'id' }).subscribe((datos: any[]) => {
      this.todosTicketsActivos = datos.filter(t => t.estado === 'pendiente' || t.estado === 'asignado' || t.estado === 'por_cerrar');
      this.todosTicketsHistorial = datos.filter(t => t.estado === 'resuelto');
      
      this.filtrarPorArea(); 
    });
  }

  cambiarVista(vista: 'usuarios' | 'staff') {
    this.vistaActual = vista;
    this.mostrarTickets = false; 
  }

  toggleTickets() {
    this.mostrarTickets = true;
  }

  filtrarPorArea() {
    if (this.areaFiltro === 'Todas') {
      this.ticketsActivos = [...this.todosTicketsActivos];
      this.ticketsHistorial = [...this.todosTicketsHistorial];
    } else {
      this.ticketsActivos = this.todosTicketsActivos.filter(t => t.area === this.areaFiltro);
      this.ticketsHistorial = this.todosTicketsHistorial.filter(t => t.area === this.areaFiltro);
    }
  }

  asignar(idTicket: string, idTecnico: string, prioridadActualizada: string) {
    if (!idTicket || !idTecnico) {
      Swal.fire({
        icon: 'warning',
        title: 'Falta seleccionar técnico',
        text: 'Por favor, selecciona un técnico de la lista antes de asignar.'
      });
      return;
    }

    const prioridadFinal = prioridadActualizada || 'Baja';
    const tecnicoSeleccionado = this.tecnicos.find(t => t.id === idTecnico);
    let nombreCompleto = 'Técnico Asignado';
    
    if (tecnicoSeleccionado) {
      const nombres = tecnicoSeleccionado.nombres || '';
      const apellidos = tecnicoSeleccionado.apellidos || '';
      nombreCompleto = `${nombres} ${apellidos}`.trim() || 'Técnico Asignado';
    }

    Swal.fire({
      title: 'Asignando ticket...',
      text: `Vinculando solicitud con ${nombreCompleto}.`,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const ticketRef = doc(this.firestore, "Tickets", idTicket);
    
    updateDoc(ticketRef, {
      id_tecnico: idTecnico,
      nombre_tecnico: nombreCompleto, 
      estado: "asignado",
      prioridad: prioridadFinal
    })
    .then(() => {
      Swal.fire({
        icon: 'success',
        title: '¡Asignación exitosa!',
        text: `Ticket asignado correctamente a ${nombreCompleto}.`,
        timer: 2000,
        showConfirmButton: false
      });
    })
    .catch((error) => {
      Swal.fire({
        icon: 'error',
        title: 'Error de base de datos',
        text: 'Ocurrió un error al intentar actualizar la asignación.'
      });
    });
  }

  cerrarSesion() {
    this.router.navigate(['/']);
  }
}
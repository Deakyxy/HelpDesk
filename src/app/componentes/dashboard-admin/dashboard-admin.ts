import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, query, where, collectionData, doc, updateDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';

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

  ticketsPendientes: any[] = [];
  tecnicos: any[] = [];

  constructor() {
    let loginCollection = collection(this.firestore, "Login");
    let qTecnicos = query(loginCollection, where("rol", "==", "tecnico"));
    
    collectionData(qTecnicos, { idField: 'id' }).subscribe((datos: any[]) => {
      this.tecnicos = datos;
    });
    
    let ticketsCollection = collection(this.firestore, "Tickets");
    let qTickets = query(ticketsCollection, where("estado", "==", "pendiente"));
    
    collectionData(qTickets, { idField: 'id' }).subscribe((datos: any[]) => {
      this.ticketsPendientes = datos;
    });
  }

  async asignar(idTicket: string, idTecnico: string) {
  // 1. Validar que tengamos ambos identificadores
  if (!idTicket) {
    console.error("El ID del ticket es indefinido o inválido.");
    alert("Error interno: No se pudo identificar el ticket.");
    return;
  }

  if (!idTecnico) {
    alert('Por favor, selecciona un técnico de la lista.');
    return;
  }

  const tecnicoSeleccionado = this.tecnicos.find(t => t.id === idTecnico);
  
  let nombreCompleto = 'Técnico Asignado';
  if (tecnicoSeleccionado) {
    const nombres = tecnicoSeleccionado.nombres || '';
    const apellidos = tecnicoSeleccionado.apellidos || '';
    nombreCompleto = `${nombres} ${apellidos}`.trim() || 'Técnico Asignado';
  }

  try {
    const ticketRef = doc(this.firestore, "Tickets", idTicket);
    
    await updateDoc(ticketRef, {
      id_tecnico: idTecnico,
      nombre_tecnico: nombreCompleto, 
      estado: "asignado"
    });
    
    alert(`¡Listo! Ticket asignado a ${nombreCompleto} exitosamente.`);
    
  } catch (error) {
    console.error("Hubo un error al asignar en Firestore:", error); 
    alert('Ocurrió un error al intentar actualizar la base de datos.');
  }
}

  cerrarSesion() {
    this.router.navigate(['/']);
  }
}
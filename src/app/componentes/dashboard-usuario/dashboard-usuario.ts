import { Component, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Usuario } from '../home/home';
import { Firestore, collection, where, query, collectionData, addDoc, doc, updateDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-usuario.html',
  styleUrls: ['./dashboard-usuario.css']
})
export class DashboardUsuarioComponent {
  private firestore = inject(Firestore);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  
  usuario = new Usuario();

  nuevoTicket = {
    titulo: '',
    area: '',
    comentario: ''
  };

  mostrarTabla: boolean = false;
  misTicketsActivos: any[] = [];
  misTicketsHistorial: any[] = [];
  
  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.usuario.idusuario = history.state.idusuario;
  
      let UsuarioCollection = collection(this.firestore, "Login"); 
      let q = query(UsuarioCollection, where("idUsuario", "==", this.usuario.idusuario));
      
      collectionData(q).subscribe((datos: any[]) => {
        if (datos && datos.length > 0) {
          this.usuario.nombres = datos[0].nombres; 
          this.usuario.apellidos = datos[0].apellidos;
        }
      }); 

      let ticketsRef = collection(this.firestore, "Tickets");
      let qMisTickets = query(ticketsRef, where("id_creador", "==", this.usuario.idusuario));
      
      collectionData(qMisTickets, { idField: 'id' }).subscribe((datos: any[]) => {
        this.misTicketsActivos = datos.filter(t => t.estado !== 'resuelto');
        this.misTicketsHistorial = datos.filter(t => t.estado === 'resuelto');
      });
    }
  }

  async crearTicket() {
    if (!this.nuevoTicket.titulo || !this.nuevoTicket.area || !this.nuevoTicket.comentario) {
      alert('Por favor, llena todos los campos del formulario.');
      return;
    }

    try {
      const ticketsCollection = collection(this.firestore, "Tickets");
      
      await addDoc(ticketsCollection, {
        titulo: this.nuevoTicket.titulo,
        area: this.nuevoTicket.area,
        comentario: this.nuevoTicket.comentario,
        estado: "pendiente",
        id_tecnico: "",
        id_creador: this.usuario.idusuario,
        nombre_creador: `${this.usuario.nombres} ${this.usuario.apellidos}`.trim()
      });

      alert('¡Tu solicitud ha sido enviada al administrador!');
      this.nuevoTicket = { titulo: '', area: '', comentario: '' }; 

    } catch (error) {
      alert("Hubo un error al crear el ticket.");
    }
  }

  async solicitarCierre(idTicket: string) {
    try {
      const ticketRef = doc(this.firestore, "Tickets", idTicket);
      await updateDoc(ticketRef, { estado: "por_cerrar" });
      alert("¡Gracias! Has confirmado la solución. El técnico cerrará el ticket en el sistema.");
    } catch (error) {
      alert("Hubo un error al actualizar el ticket.");
    }
  }

  cerrarSesion() {
    this.router.navigate(['/']);
  }
}
import { Component, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, where, query, collectionData, addDoc, doc, updateDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Usuario } from '../home/home';

@Component({
  selector: 'app-dashboard-tecnico',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-tecnico.html',
  styleUrls: ['./dashboard-tecnico.css']
})
export class DashboardTecnicoComponent {
  private firestore = inject(Firestore);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  
  usuario = new Usuario();
  mostrarTablas: boolean = false;

    nuevoTicket = {
    titulo: '',
    area: '',
    comentario: ''
  };
  
  tareasActivas: any[] = [];
  tareasHistorial: any[] = [];
  misSolicitudesActivas: any[] = [];
  misSolicitudesHistorial: any[] = [];

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.usuario.idusuario = history.state.idusuario;
      
      let loginCollection = collection(this.firestore, "Login"); 
      let qLogin = query(loginCollection, where("idUsuario", "==", this.usuario.idusuario));
      collectionData(qLogin).subscribe((datos: any[]) => {
        if (datos && datos.length > 0) {
          this.usuario.nombres = datos[0].nombres; 
          this.usuario.apellidos = datos[0].apellidos;
        }
      }); 

      let ticketsRef = collection(this.firestore, "Tickets");
      
      let qAsignados = query(ticketsRef, where("id_tecnico", "==", this.usuario.idusuario));
      collectionData(qAsignados, { idField: 'id' }).subscribe((datos: any[]) => {
        this.tareasActivas = datos.filter(t => t.estado === 'asignado' || t.estado === 'por_cerrar');
        this.tareasHistorial = datos.filter(t => t.estado === 'resuelto');
      });

      let qCreados = query(ticketsRef, where("id_creador", "==", this.usuario.idusuario));
      collectionData(qCreados, { idField: 'id' }).subscribe((datos: any[]) => {
        this.misSolicitudesActivas = datos.filter(t => t.estado !== 'resuelto');
        this.misSolicitudesHistorial = datos.filter(t => t.estado === 'resuelto');
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

  async resolverTicket(idTicket: string) {
    try {
      const ticketRef = doc(this.firestore, "Tickets", idTicket);
      await updateDoc(ticketRef, { estado: "resuelto" });
      alert("¡Excelente! Has cerrado este ticket definitivamente.");
    } catch (error) {
      alert("Ocurrió un error al intentar resolver el ticket.");
    }
  }

  cerrarSesion() {
    this.router.navigate(['/']);
  }
}
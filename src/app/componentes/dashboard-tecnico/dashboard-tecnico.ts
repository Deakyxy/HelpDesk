import { Component, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, query, where, collectionData, doc, updateDoc, addDoc, getDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Usuario } from '../home/home';
import Swal from 'sweetalert2';

declare var bootstrap: any; 

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
  
  tareasActivas: any[] = [];
  tareasHistorial: any[] = [];
  misSolicitudesActivas: any[] = [];
  misSolicitudesHistorial: any[] = [];

  nuevoTicket = {
    titulo: '',
    area: '',
    comentario: ''
  };

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
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor, llena todos los campos del formulario.'
      });
      return;
    }

    Swal.fire({
      title: 'Generando ticket...',
      text: 'Por favor, espera un momento mientras enviamos tu solicitud.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const contadorRef = doc(this.firestore, "Variables", "Globales");
      const contadorSnap = await getDoc(contadorRef);
      
      let nuevoNumero = 1;

      if (contadorSnap.exists()) {
        const data = contadorSnap.data();
        nuevoNumero = (data['idultimoticket'] || 0) + 1;
      }

      const ticketsCollection = collection(this.firestore, "Tickets");
      await addDoc(ticketsCollection, {
        correlativo: nuevoNumero,
        titulo: this.nuevoTicket.titulo,
        area: this.nuevoTicket.area,
        comentario: this.nuevoTicket.comentario,
        estado: "pendiente",
        id_tecnico: "",
        id_creador: this.usuario.idusuario,
        nombre_creador: `${this.usuario.nombres} ${this.usuario.apellidos}`.trim()
      });

      await updateDoc(contadorRef, {
        idultimoticket: nuevoNumero
      });

      const modalElement = document.getElementById('modalNuevoTicketTecnico');
      if (modalElement) {
        const modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modalInstance.hide();
      }

      Swal.fire({
        title: `¡Se envió correctamente! Ticket #${nuevoNumero}`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false
      });

      this.nuevoTicket = { titulo: '', area: '', comentario: '' }; 

    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al crear el ticket. Inténtalo de nuevo.'
      });
    }
  }

  async resolverTicket(idTicket: string) {
    Swal.fire({
      title: '¿Marcar como completado?',
      text: '¿Estás seguro de marcar este ticket como resuelto? Se enviará al usuario para su validación.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar a revisión',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        
        Swal.fire({
          title: 'Actualizando estado...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        try {
          const ticketRef = doc(this.firestore, "Tickets", idTicket);
          await updateDoc(ticketRef, { estado: "por_cerrar" });
          
          Swal.fire({
            icon: 'success',
            title: '¡Enviado!',
            text: 'Se ha notificado al usuario para que confirme el cierre.',
            timer: 2000,
            showConfirmButton: false
          });
        } catch (error) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Ocurrió un error al intentar actualizar el ticket.'
          });
        }
      }
    });
  }

  cerrarSesion() {
    this.router.navigate(['/']);
  }
}
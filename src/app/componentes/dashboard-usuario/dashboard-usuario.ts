import { Component, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Usuario } from '../home/home';
import { Firestore, collection, where, query, collectionData, addDoc, doc, updateDoc, getDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

declare var bootstrap: any;

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
  areaFiltro: string = 'Todas';

  todosMisTicketsActivos: any[] = [];
  todosMisTicketsHistorial: any[] = [];

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
        this.todosMisTicketsActivos = datos.filter(t => t.estado !== 'resuelto');
        this.todosMisTicketsHistorial = datos.filter(t => t.estado === 'resuelto');
        this.filtrarPorArea();
      });
    }
  }

  toggleTickets() {
    this.mostrarTabla = !this.mostrarTabla;
  }

  filtrarPorArea() {
    if (this.areaFiltro === 'Todas') {
      this.misTicketsActivos = [...this.todosMisTicketsActivos];
      this.misTicketsHistorial = [...this.todosMisTicketsHistorial];
    } else {
      this.misTicketsActivos = this.todosMisTicketsActivos.filter(t => t.area === this.areaFiltro);
      this.misTicketsHistorial = this.todosMisTicketsHistorial.filter(t => t.area === this.areaFiltro);
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

      const modalElement = document.getElementById('modalNuevoTicket');
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

  async solicitarCierre(idTicket: string) {
    Swal.fire({
      title: '¿Confirmar cierre de ticket?',
      text: '¿Estás de acuerdo con la solución brindada por el técnico para dar por cerrado este problema?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar definitivamente',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const ticketRef = doc(this.firestore, "Tickets", idTicket);
          await updateDoc(ticketRef, { estado: "resuelto" });
          
          Swal.fire({
            icon: 'success',
            title: '¡Ticket cerrado!',
            text: 'Has confirmado la solución de manera exitosa.',
            timer: 2500,
            showConfirmButton: false
          });
        } catch (error) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un error al actualizar el ticket.'
          });
        }
      }
    });
  }

  cerrarSesion() {
    this.router.navigate(['/']);
  }
}
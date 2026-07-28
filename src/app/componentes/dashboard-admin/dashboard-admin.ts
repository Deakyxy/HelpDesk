import { Component, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, query, where, collectionData, doc, updateDoc, addDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

declare var bootstrap: any;

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
  private platformId = inject(PLATFORM_ID);

  adminData = {
    idusuario: '',
    nombres: 'Administrador', 
    apellidos: ''
  };

  vistaActual: 'panel' | 'usuarios' | 'staff' = 'panel';
  mostrarTickets: boolean = false;
  areaFiltro: string = 'Todas';

  tecnicos: any[] = [];
  usuarios: any[] = [];
  
  todosTicketsActivos: any[] = [];
  todosTicketsHistorial: any[] = [];
  ticketsActivos: any[] = [];
  ticketsHistorial: any[] = [];

  nuevaCuenta = {
    nombres: '',
    apellidos: '',
    idUsuario: '',
    correo: '',
    contrasena: '',
    rol: 'usuario'
  };

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      if (history.state && history.state.idusuario) {
        sessionStorage.setItem('admin_id', history.state.idusuario);
        this.adminData.idusuario = history.state.idusuario;
      } else {
        this.adminData.idusuario = sessionStorage.getItem('admin_id') || '';
      }

      if (!this.adminData.idusuario) {
        this.router.navigate(['/']);
        return;
      }

      let loginCollection = collection(this.firestore, "Login");
      
      let qAdmin = query(loginCollection, where("idUsuario", "==", this.adminData.idusuario));
      collectionData(qAdmin).subscribe((datos: any[]) => {
        if (datos && datos.length > 0) {
          this.adminData.nombres = datos[0].nombres;
          this.adminData.apellidos = datos[0].apellidos;
        }
      });
      
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
        const datosOrdenados = datos.sort((a, b) => {
          const fechaA = a.fecha_creacion?.seconds || 0;
          const fechaB = b.fecha_creacion?.seconds || 0;
          return fechaB - fechaA;
        });

        this.todosTicketsActivos = datosOrdenados.filter(t => t.estado === 'pendiente' || t.estado === 'asignado' || t.estado === 'por_cerrar');
        this.todosTicketsHistorial = datosOrdenados.filter(t => t.estado === 'resuelto');
        
        this.filtrarPorArea(); 
      });
    }
  }

  generartxtaleatorio(numero: number): string {
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const largo = letras.length;
    for (let i = 0; i < numero; i++) {
      result += letras.charAt(Math.floor(Math.random() * largo));
    }
    return result;
  }

  
  prepararRol(rolSeleccionado: 'usuario' | 'tecnico') {
    this.nuevaCuenta = {
      nombres: '',
      apellidos: '',
      idUsuario: this.generartxtaleatorio(10),
      correo: '',
      contrasena: '',
      rol: rolSeleccionado
    };
  }

  cambiarVista(vista: 'panel' | 'usuarios' | 'staff') {
    this.vistaActual = vista;
    this.mostrarTickets = false; 
  }

  toggleTickets() {
    this.mostrarTickets = !this.mostrarTickets;
    if (this.mostrarTickets) {
      this.vistaActual = 'panel'; 
    }
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

  async registrarCuenta() {
    if (!this.nuevaCuenta.nombres || !this.nuevaCuenta.apellidos || !this.nuevaCuenta.idUsuario || !this.nuevaCuenta.correo || !this.nuevaCuenta.contrasena) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor, llena toda la información de la nueva cuenta.'
      });
      return;
    }

    Swal.fire({
      title: 'Creando cuenta...',
      text: 'Registrando credenciales en la base de datos.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const loginCollection = collection(this.firestore, "Login");
      await addDoc(loginCollection, {
        nombres: this.nuevaCuenta.nombres,
        apellidos: this.nuevaCuenta.apellidos,
        idUsuario: this.nuevaCuenta.idUsuario,
        correo: this.nuevaCuenta.correo,
        contrasena: this.nuevaCuenta.contrasena,
        rol: this.nuevaCuenta.rol
      });

      const modalElement = document.getElementById('modalNuevoUsuario');
      if (modalElement) {
        const modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modalInstance.hide();
      }

      Swal.fire({
        icon: 'success',
        title: '¡Registro exitoso!',
        text: `La cuenta de tipo ${this.nuevaCuenta.rol.toUpperCase()} fue creada correctamente.`,
        timer: 2000,
        showConfirmButton: false
      });

      this.nuevaCuenta = { nombres: '', apellidos: '', idUsuario: '', correo: '', contrasena: '', rol: 'usuario' };
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error de registro',
        text: 'Ocurrió un error al intentar crear la cuenta en la base de datos.'
      });
    }
  }

  async asignar(idTicket: string, idTecnico: string) {
    if (!idTicket || !idTecnico) {
      Swal.fire({
        icon: 'warning',
        title: 'Falta seleccionar técnico',
        text: 'Por favor, selecciona un técnico de la lista antes de asignar.'
      });
      return;
    }

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

    try {
      const ticketRef = doc(this.firestore, "Tickets", idTicket);
      await updateDoc(ticketRef, {
        id_tecnico: idTecnico,
        nombre_tecnico: nombreCompleto, 
        estado: "asignado"
      });
      
      Swal.fire({
        icon: 'success',
        title: '¡Asignación exitosa!',
        text: `Ticket asignado correctamente a ${nombreCompleto}.`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error de base de datos',
        text: 'Ocurrió un error al intentar actualizar la asignación.'
      });
    }
  }

  cerrarSesion() {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('admin_id');
    }
    this.router.navigate(['/']);
  }
}
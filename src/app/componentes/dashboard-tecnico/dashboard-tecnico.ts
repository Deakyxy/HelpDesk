import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService } from '../../core/services/session.service';
import { EquiposService, Equipo } from '../../core/services/equipos.service';
import { TicketsService, Ticket, EstadoTicket } from '../../core/services/tickets.service';
import { Firestore, collection, getDocs, DocumentData, QueryDocumentSnapshot } from '@angular/fire/firestore';
import { Timestamp } from 'firebase/firestore';

type TabTecnico = 'tickets' | 'equipos';
type FiltroTicket = 'TODOS' | EstadoTicket;

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
    { valor: 'EN_PROGRESO',       etiqueta: 'En Progreso' },
    { valor: 'PENDIENTE_CLIENTE', etiqueta: 'Pend. Cliente' },
    { valor: 'CERRADO',           etiqueta: 'Cerrados' },
    { valor: 'RECHAZADO',         etiqueta: 'Rechazados' },
  ];

  tickets: Ticket[]  = [];
  equipos: Equipo[]  = [];
  clientes: { uid: string; nombre: string; correo: string }[] = [];

  // Ticket seleccionado para ver detalle
  ticketDetalle: Ticket | null = null;
  comentarioTexto = '';
  guardandoEstado = false;

  // Formulario equipo
  mostrarFormEquipo = false;
  modoEdicion = false;
  equipoEditandoId: string | null = null;
  formEquipo: Omit<Equipo, 'id'> = this.equipoVacio();

  ngOnInit() {
    this.ticketsSvc.obtenerTodos().subscribe(t => this.tickets = t);
    this.equiposSvc.obtenerTodos().subscribe(e => this.equipos = e);
    this.cargarClientes();
  }

  async cargarClientes() {
    const snap = await getDocs(collection(this.firestore, 'Login'));
    this.clientes = snap.docs
      .filter((d: QueryDocumentSnapshot<DocumentData>) => d.data()['rol'] === 'cliente' || !d.data()['rol'])
      .map((d: QueryDocumentSnapshot<DocumentData>) => ({
        uid:    d.id,
        nombre: d.data()['nombre'] ?? d.data()['correo'],
        correo: d.data()['correo']
      }));
  }

  get ticketsFiltrados(): Ticket[] {
    if (this.filtroTicket === 'TODOS') return this.tickets;
    return this.tickets.filter(t => t.estado === this.filtroTicket);
  }

  contarEstado(estado: EstadoTicket): number {
    return this.tickets.filter(t => t.estado === estado).length;
  }

  // ===== Acciones de Tickets =====

  verDetalle(t: Ticket) {
    this.ticketDetalle = t;
    this.comentarioTexto = t.comentarioTecnico ?? '';
  }

  async atenderTicket(t: Ticket) {
    const ahora = Timestamp.now();
    const historial = [...t.historial, {
      estado: 'EN_PROGRESO' as EstadoTicket,
      fecha:  ahora,
      nota:   `Ticket tomado por ${this.usuario.nombre}.`,
      autor:  this.usuario.nombre
    }];
    await this.ticketsSvc.actualizarEstado(t.id!, 'EN_PROGRESO', {
      asignadoA:     this.usuario.uid,
      asignadoNombre: this.usuario.nombre,
      historial
    });
  }

  async marcarTerminado() {
    if (!this.ticketDetalle) return;
    this.guardandoEstado = true;
    const ahora = Timestamp.now();
    const historial = [...this.ticketDetalle.historial, {
      estado: 'PENDIENTE_CLIENTE' as EstadoTicket,
      fecha:  ahora,
      nota:   this.comentarioTexto || 'Reparación completada.',
      autor:  this.usuario.nombre
    }];
    await this.ticketsSvc.actualizarEstado(this.ticketDetalle.id!, 'PENDIENTE_CLIENTE', {
      comentarioTecnico: this.comentarioTexto,
      historial
    });
    this.ticketDetalle = null;
    this.guardandoEstado = false;
  }

  // ===== CRUD Equipos =====

  abrirNuevoEquipo() {
    this.formEquipo     = this.equipoVacio();
    this.modoEdicion    = false;
    this.equipoEditandoId = null;
    this.mostrarFormEquipo = true;
  }

  abrirEditarEquipo(eq: Equipo) {
    this.formEquipo = { ...eq };
    this.modoEdicion = true;
    this.equipoEditandoId = eq.id!;
    this.mostrarFormEquipo = true;
  }

  async guardarEquipo() {
    // Sincronizar nombre del cliente asignado
    const cliente = this.clientes.find(c => c.uid === this.formEquipo.asignadoA);
    this.formEquipo.asignadoNombre = cliente?.nombre ?? '';

    if (this.modoEdicion && this.equipoEditandoId) {
      await this.equiposSvc.actualizar(this.equipoEditandoId, this.formEquipo);
    } else {
      await this.equiposSvc.crear(this.formEquipo);
    }
    this.mostrarFormEquipo = false;
  }

  async eliminarEquipo(id: string) {
    if (confirm('¿Eliminar este equipo? Esta acción no se puede deshacer.')) {
      await this.equiposSvc.eliminar(id);
    }
  }

  cerrarSesion() {
    this.session.cerrar();
    this.router.navigate(['/']);
  }

  equipoVacio(): Omit<Equipo, 'id'> {
    return {
      nombre: '', tipo: '', marca: '', modelo: '',
      numeroSerie: '', ubicacion: '', asignadoA: '', asignadoNombre: ''
    };
  }

  etiquetaEstado(estado: EstadoTicket): string {
    const map: Record<EstadoTicket, string> = {
      ABIERTO:            'Abierto',
      EN_PROGRESO:        'En Progreso',
      PENDIENTE_CLIENTE:  'Pendiente Cliente',
      CERRADO:            'Cerrado',
      RECHAZADO:          'Rechazado'
    };
    return map[estado];
  }

  formatearFecha(ts: Timestamp): string {
    return ts?.toDate().toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }) ?? '—';
  }
}

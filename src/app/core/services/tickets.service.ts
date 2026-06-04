import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, collectionData,
  doc, addDoc, updateDoc, query, where, orderBy
} from '@angular/fire/firestore';
import { Timestamp } from 'firebase/firestore';
import { Observable } from 'rxjs';

export type EstadoTicket =
  'ABIERTO' | 'EN_PROGRESO' | 'PENDIENTE_CLIENTE' | 'CERRADO' | 'RECHAZADO';

export interface HistorialEntry {
  estado: EstadoTicket;
  fecha: Timestamp;
  nota: string;
  autor: string;
}

export interface Ticket {
  id?: string;
  equipoId: string;
  equipoNombre: string;
  creadoPor: string;
  creadoPorNombre: string;
  asignadoA: string | null;
  asignadoNombre: string | null;
  titulo: string;
  descripcion: string;
  estado: EstadoTicket;
  comentarioTecnico: string | null;
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
  historial: HistorialEntry[];
}

@Injectable({ providedIn: 'root' })
export class TicketsService {
  private firestore = inject(Firestore);
  private col = collection(this.firestore, 'tickets');

  obtenerTodos(): Observable<Ticket[]> {
    const q = query(this.col, orderBy('creadoEn', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Ticket[]>;
  }

  obtenerPorCliente(uid: string): Observable<Ticket[]> {
    const q = query(this.col,
      where('creadoPor', '==', uid),
      orderBy('creadoEn', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Ticket[]>;
  }

  crear(ticket: Omit<Ticket, 'id'>): Promise<void> {
    return addDoc(this.col, ticket).then(() => {});
  }

  actualizarEstado(
    id: string,
    estado: EstadoTicket,
    extras: Partial<Ticket> = {}
  ): Promise<void> {
    const now = Timestamp.now();
    return updateDoc(doc(this.firestore, 'tickets', id), {
      estado,
      actualizadoEn: now,
      ...extras
    });
  }
}

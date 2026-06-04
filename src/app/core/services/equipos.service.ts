import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, collectionData,
  doc, addDoc, updateDoc, deleteDoc, query, where
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Equipo {
  id?: string;
  nombre: string;
  tipo: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  ubicacion: string;
  asignadoA: string;   // uid del cliente
  asignadoNombre: string;
}

@Injectable({ providedIn: 'root' })
export class EquiposService {
  private firestore = inject(Firestore);
  private col = collection(this.firestore, 'equipos');

  obtenerTodos(): Observable<Equipo[]> {
    return collectionData(this.col, { idField: 'id' }) as Observable<Equipo[]>;
  }

  obtenerPorCliente(uid: string): Observable<Equipo[]> {
    const q = query(this.col, where('asignadoA', '==', uid));
    return collectionData(q, { idField: 'id' }) as Observable<Equipo[]>;
  }

  crear(equipo: Omit<Equipo, 'id'>): Promise<void> {
    return addDoc(this.col, equipo).then(() => {});
  }

  actualizar(id: string, datos: Partial<Equipo>): Promise<void> {
    return updateDoc(doc(this.firestore, 'equipos', id), datos);
  }

  eliminar(id: string): Promise<void> {
    return deleteDoc(doc(this.firestore, 'equipos', id));
  }
}

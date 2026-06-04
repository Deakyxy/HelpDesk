import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface SesionUsuario {
  uid: string;
  nombre: string;
  correo: string;
  rol: 'cliente' | 'tecnico';
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly KEY = 'helpdesk_session';
  private platformId = inject(PLATFORM_ID);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  guardar(sesion: SesionUsuario): void {
    if (this.isBrowser) {
      localStorage.setItem(this.KEY, JSON.stringify(sesion));
    }
  }

  obtener(): SesionUsuario | null {
    if (!this.isBrowser) return null;
    const raw = localStorage.getItem(this.KEY);
    return raw ? JSON.parse(raw) : null;
  }

  estaLogueado(): boolean {
    return this.obtener() !== null;
  }

  obtenerRol(): 'cliente' | 'tecnico' | null {
    return this.obtener()?.rol ?? null;
  }

  cerrar(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.KEY);
    }
  }
}

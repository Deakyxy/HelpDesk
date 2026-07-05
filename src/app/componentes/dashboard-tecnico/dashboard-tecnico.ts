import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Firestore, collection, getDocs, DocumentData, QueryDocumentSnapshot, where ,query, collectionData } from '@angular/fire/firestore';
import {Usuario} from '../home/home';

@Component({
  selector: 'app-dashboard-tecnico',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-tecnico.html',
  styleUrls: ['./dashboard-tecnico.css']
})
export class DashboardTecnicoComponent {
  private firestore = inject(Firestore);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  usuario = new Usuario();

  constructor(){
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
}  
}
cerrarSesion() {
    this.router.navigate(['/']);
  }
}
import { Component, inject, PLATFORM_ID  } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Usuario } from '../home/home';
import { Firestore, collection, where ,query, collectionData, addDoc } from '@angular/fire/firestore';
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
    }
  }

async crearTicket() {
    const ticketsCollection = collection(this.firestore, "Tickets");
    

    await addDoc(ticketsCollection, {
      titulo: this.nuevoTicket.titulo,
      area: this.nuevoTicket.area,
      comentario: this.nuevoTicket.comentario,
      estado: "pendiente",
      id_tecnico: ""
    });


    alert('¡Tu solicitud ha sido enviada al administrador!');
    
    this.nuevoTicket = { 
      titulo: '', 
      area: '', 
      comentario: '' 
    }; 
  }
  cerrarSesion() {
    this.router.navigate(['/']);
  }
}
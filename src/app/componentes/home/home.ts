import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Firestore, collection, query, where, collectionData } from '@angular/fire/firestore';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent {
  bordeArcoirisActivo: boolean = true; 
  cargando: boolean = false; 
  private firestore = inject(Firestore);
  usuario = new Usuario();

  constructor(public router: Router) {}

 login() {
    this.cargando = true; 
    
    let UsuarioCollection = collection(this.firestore, "Login");
    let q = query(
      UsuarioCollection, 
      where("correo", "==", this.usuario.usuario), 
      where("contrasena", "==", this.usuario.contrasena)
    );
    
    collectionData(q).subscribe((datos: any) => {
  if (datos.length > 0) {
    this.usuario.idusuario = datos[0].idUsuario;
    this.usuario.nombres = datos[0].nombres;
    this.usuario.apellidos = datos[0].apellidos;
    this.usuario.rol = datos[0].rol;

    setTimeout(() => {
      switch (this.usuario.rol) {
        case 'admin': this.router.navigate(['/admin'], { state: this.usuario }); break;
        case 'tecnico': this.router.navigate(['/tecnico'], { state: this.usuario }); break;
        case 'usuario': this.router.navigate(['/panel-usuario'], { state: this.usuario }); break;
        default:
          this.cargando = false;
          alert("Rol no reconocido.");
          break;
      }
    },1000);

  } else {
    
    this.cargando = false; 
    alert("Usuario o contraseña incorrectos");
  }
});
  }
}


export class Usuario {
  idusuario: string = "";
  usuario: string = ""; 
  contrasena: string = "";
  nombres: string = "";
  apellidos: string = "";
  rol: string = "";
  
  constructor() { }
}
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
import { Router } from '@angular/router'; 

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent {
  private firestore = inject(Firestore);
  private router = inject(Router); 

  estaLogueado: boolean = false;
  mensajeError: string = ""; // 1. DECLARAMOS LA VARIABLE PARA EL CONTENIDO DEL ERROR

  loginData = {
    correo: "",
    contrasena: ""
  };

  async onSubmit() {
    try {
      this.mensajeError = ""; // Limpiamos cualquier error previo al dar clic

      const loginCollection = collection(this.firestore, 'Login');
      const q = query(loginCollection, where('correo', '==', this.loginData.correo));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();

       if (userData['contrasena'] === this.loginData.contrasena) {
  console.log("Acceso concedido");
  this.estaLogueado = true; // Con esto basta para que el HTML cambie de vista
  // Borramos la línea del router.navigate
    }
else {
          // 2. ASIGNAMOS EL TEXTO SI LA CONTRASEÑA ESTÁ MAL
          this.mensajeError = "La contraseña que ingresaste es incorrecta.";
          console.log("Contraseña incorrecta");
        }
      } else {
        // 3. ASIGNAMOS EL TEXTO SI EL CORREO NO EXISTE
        this.mensajeError = "El correo electrónico no está registrado en el sistema.";
        console.log("Usuario no encontrado");
      }
    } catch (error) {
      this.mensajeError = "Ocurrió un error inesperado al conectar con el servidor.";
      console.error("Error en el login:", error);
    }
  }

  cerrarSesion() {
    this.estaLogueado = false;
    this.loginData.correo = "";
    this.loginData.contrasena = "";
    this.mensajeError = "";
    console.log("Sesión cerrada");
  }

  // 4. FUNCIÓN PARA QUE LA "X" DE LA ALERTA BONITA BORRE EL CUADRO ROJO
  limpiarError() {
    this.mensajeError = "";
  }
}
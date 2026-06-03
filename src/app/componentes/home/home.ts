import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent {
  private firestore = inject(Firestore);

  // Estado de la sesión
  estaLogueado: boolean = false;
  
  // Objeto para los datos del formulario
  loginData = {
    correo: "",
    contrasena: ""
  };

  async onSubmit() {
    try {
      // 1. Referencia a la colección 'Login'
      const loginCollection = collection(this.firestore, 'Login');
      
      // 2. Crear consulta para buscar el usuario por su correo
      const q = query(loginCollection, where('correo', '==', this.loginData.correo));
      
      // 3. Ejecutar la búsqueda
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Tomamos el primer documento que coincida
        const userData = querySnapshot.docs[0].data();

        // 4. Validar si la contraseña coincide con la de la BD
        if (userData['contrasena'] === this.loginData.contrasena) {
          console.log("Acceso concedido");
          this.estaLogueado = true;
        } else {
          alert("Contraseña incorrecta");
        }
      } else {
        alert("Usuario no encontrado");
      }
    } catch (error) {
      console.error("Error al validar:", error);
      alert("Hubo un problema al conectar con la base de datos");
    }
  }

  cerrarSesion() {
    this.estaLogueado = false;
    this.loginData = { correo: "", contrasena: "" };
  }
}
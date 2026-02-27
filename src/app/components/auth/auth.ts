import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth',
  imports: [],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
})
export class Auth {
  titulo = ""
  Autenticando = false
  MensajeError = ""

  //Inyeccion de dependencias

  private authservice = inject(AuthService)
  private router = inject(Router)

  //Funcion que revisa la autenticacion / asincrona
  async iniciarSesionConGoogle(): Promise<void> {
    this.Autenticando = true
    this.MensajeError = ""

    try {
      //Falta implementar el sevicio
      //const usuario = await this.authservice.iniciarSesionConGoogle()
      console.log('LLamo a la funcion')
      const usuario = await this.authservice.iniciarSesion()

     /* //Vamos a simular un usuario ya creado

      let usuario = null
      usuario = await new Promise((resolve) => {
        setTimeout(() => resolve({ nombre: 'Usuario de prueba' }), 1000)
      })*/
      if (usuario) {
        await this.router.navigate(['/chat'])
      } else {
        this.MensajeError = "Error al autenticar"
        console.error("Error al autentificar en try")
      }

    } catch (error: any) {
      if (error.code === "auth/popup-closed-by-user") {
        console.error('Error: Cerraste la ventana emergente')
      } else if (error.code === "auth/popup-blocked") {
        console.error('El navegador bloqueo la ventana emergente')
      }
      else if (error.code == 'auth/network-request-failed') {
        console.error('Problemas con la conexion a internet')
      }
    }finally{
      this.Autenticando = false
    }
  }
  //Verificar que si el usuario ya esta autenticado se redireccione al chat de una vez
  ngOninit(): void{
    this.authservice.estaAutenticado$.subscribe(autenticado =>{
      if (autenticado){
        this.router.navigate(['/chat'])
      }
    })
  }
}
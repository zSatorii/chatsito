import { Injectable, inject } from '@angular/core';
import { Auth, user, User} from '@angular/fire/auth';
import { Usuario } from '../../models/usuario';
import { map } from 'rxjs';
import { GoogleAuthProvider } from 'firebase/auth';
import { signInWithPopup, signOut } from 'firebase/auth';


@Injectable({
  providedIn: "root"
})
export class AuthService {

  private auth = inject(Auth)

  //variable de tipo observable
  usuario$ = user(this.auth)

  //variable observable que devuelva true or  si el usuario esta autenticado
  estaAutenticado$ = this.usuario$.pipe(
    map(usuario => !!usuario)
  )

  //funcion asincrona que permite el inicio de sesion
  async iniciarSesion(): Promise< Usuario | null >{
    try{
      console.log('Inicio del servicio de funcion')
      const proveedor = new GoogleAuthProvider;

      //controladores
      proveedor.addScope('email')
      proveedor.addScope('profile')
      console.log('antes')
      const resultado = await signInWithPopup(this.auth, proveedor);
      console.log('despues')
      const usuarioFirebase = resultado.user;

      if(usuarioFirebase){
        const usuario : Usuario ={
          uid: usuarioFirebase.uid,
          nombre: usuarioFirebase.displayName || 'Usuario sin nombre',
          email: usuarioFirebase.email || '',
          fotoUrl: usuarioFirebase.photoURL || undefined,
          fechaCreacion: new Date,
          ultimaConexion: new Date
        }
        return usuario;
      }
      return null;
    }catch(error){
      console.error(' Error en la autenticacion')
      throw error
    }
  }

  obtenerUsuario(): User | null{
    return this.auth.currentUser
  }

  // Cerrar sesion

  async cerrarSesion(): Promise<void>{
    try{
      await signOut(this.auth)
    }catch(error){
      console.error('Error al cerrar sesion', error)
      throw error;
    }
  }
}
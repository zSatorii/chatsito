import { Injectable, inject } from '@angular/core';
import { MensajeChat } from '../../models/chat';
import { AuthService } from './auth';
import { FirebaseService } from './firebase';
import { BehaviorSubject } from 'rxjs';

// vamos a generar un mock del servicio de gemini
const geminiServiceMock = {
  convertirHistorialGemini: (historial: MensajeChat[])=> historial,
  enviarMensaje : async(contenido: string, historial: any)=> 'Respuesta desde el servicio de gemini de tipo Mock, esta respuesta siempre va a ser igual'
}

@Injectable({
  providedIn: 'root',
})

export class ChatService {
  private authService = inject(AuthService)
  private firebaseService =  inject(FirebaseService)

  private mensajeSubject = new BehaviorSubject<MensajeChat[]>([]);
  public mensajes$ = this.mensajeSubject.asObservable();

  private cargandoHistorial = false;

  private asistenteRespondiendo =  new BehaviorSubject<boolean>(false);
  private asistenteRespondiendo$ = this.asistenteRespondiendo.asObservable();

  async inicializarChat(usuarioId: string):Promise<void>{
    if(!this.cargandoHistorial){
      return;
    }
    this.cargandoHistorial = true;
    try{
      this.firebaseService.obtenerMensajesusuario(usuarioId).subscribe({
        next : (mensajes)=>{
          // actualizando el behaviorsubject
          this.mensajeSubject.next(mensajes)
          this.cargandoHistorial = false;
        },
        error : (error)=>{
          console.log("Error al cargar el historial", error)
          this.cargandoHistorial = false;
          // cargar con una lista vacia el behavior subject
          this.mensajeSubject.next([]);
        }
      })
    }catch(error){
      console.error('Error al cargar el historial', error)
      throw error;
      this.cargandoHistorial = false;
      this.mensajeSubject.next([]);
    }
  }
  async enviarMensaje(contenidoMensaje: string): Promise<void>{
    const usuarioActual = this.authService.obtenerUsuario()

    if(!usuarioActual){
      console.error('No hay un usuario autenticado');
      throw Error;
    }
    if(!contenidoMensaje.trim()){
      return ;
    }
    const mensajeUsuario: MensajeChat= {
      usuarioId: usuarioActual.uid,
      contenido: contenidoMensaje.trim(),
      fechaEnvio: new Date(),
      estado: 'Enviado',
      tipo: 'Usuario',
    }
    try {
      const mensajeDelUsuario = this.mensajeSubject.value;

      const nuevoMensajeEncontrado = [...mensajeDelUsuario, mensajeUsuario]
      this.mensajeSubject.next(nuevoMensajeEncontrado)
      try {
        await this.firebaseService.guardarMensaje(mensajeUsuario);
      } catch (firestoreError) {
        console.error('No se pudo guardar el mensaje del usuario', firestoreError)
      }

      this.asistenteRespondiendo.next(true)

      const mensajesActuales = this.mensajeSubject.value;

      
      const historialParaGemini = geminiServiceMock.convertirHistorialGemini(
        mensajesActuales.slice(-6)
      );
      const respuestaDelAsistente = await geminiServiceMock.enviarMensaje(
        contenidoMensaje,
        historialParaGemini
      )

      // Configurar mensajes del asistente

      const mensajeAsistente: MensajeChat = {
        usuarioId: usuarioActual.uid,
        contenido: respuestaDelAsistente,
        fechaEnvio: new Date(),
        estado: 'Enviado',
        tipo: 'Asistente',
      };
      const mensajeActualizados = this.mensajeSubject.value

      const nuevoMensajeEncontradoAsis= [...mensajeActualizados, mensajeAsistente]
      this.mensajeSubject.next(nuevoMensajeEncontradoAsis);

      try {
        await this.firebaseService.guardarMensaje(mensajeAsistente)
      } catch (firestoreError) {
        console.error('No se pudo guardar el mensaje del asistente', firestoreError)
      }

    } catch (error) {
      console.error('Error al procesar el mensaje', error)
          //generar un instancia del objeto en caso de que haya un error.
     const mensajeError: MensajeChat = {
        usuarioId: usuarioActual.uid,
        contenido: 'Lo sentimos no se pudo procesar el mensaje',
        fechaEnvio: new Date(),
        estado: 'Error',
        tipo: 'Asistente',
      };
      try {
        await this.firebaseService.guardarMensaje(mensajeError);
      } catch (saveError) {
        console.error('No se pudo guardar el mensaje de error', saveError);
        const mensajeActual = this.mensajeSubject.value;
        this.mensajeSubject.next([...mensajeActual, mensajeError]);
      }
      throw error;
    }finally{
      this.asistenteRespondiendo.next(false)
    }
  }
  limpiarChat(): void{
    this.mensajeSubject.next([]);
  }

  obtenerMensajes(): MensajeChat[]{
    return this.mensajeSubject.value
  }
}

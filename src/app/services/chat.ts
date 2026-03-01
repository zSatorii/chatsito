import { Injectable, inject } from '@angular/core';
import { MensajeChat } from '../../models/chat';
import { AuthService } from './auth';
import { FirebaseService } from './firebase';
import { BehaviorSubject } from 'rxjs';
import { beforeAuthStateChanged } from 'firebase/auth';
import { VoidExpr } from '@angular/compiler';

@Injectable({
  providedIn: "root"
})

// vamos a generar un mock del servicio de gemini
const geminiServiceMock = {
  convertirHistorialGemini: (historial: MensajeChat[])=> historial,
  enviarMensaje : async(contenido: string, historial: any)=> 'Respuesta desde el servicio de gemini de tipo Mock, esta respuesta siempre va a ser igual'
}
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

    }
  }
}
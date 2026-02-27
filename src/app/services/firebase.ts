import { Injectable, inject } from '@angular/core';
import { Firestore, Timestamp, collection } from '@angular/fire/firestore'
import { MensajeChat } from '../../models/chat'
import { addDoc } from 'firebase/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: "root"
})
export class FirebaseService {
 private firestore = inject(Firestore)
 
 //funcion para guardar mensaje.
 async guardarMensaje(mensaje:MensajeChat): Promise<void>{
  try{
    //revisar si viene sin mensaje
    if(!mensaje.usuarioId){
      //devuelvo que el mensaje debe tener un usuario Id
      throw new Error('Usuario Id es requerido');
    }else if(!mensaje.contenido){
      throw new Error('El contenido es requerido');
    }else if(!mensaje.tipo){
      throw new Error('El tipo es requerido');
    }

    const coleccionMensajes = collection(this.firestore, 'Mensajes')
    // prepara el mensaje 
    const mensajeGuardar={
      usuarioId : mensaje.usuarioId,
      contenido : mensaje.contenido,
      tipo : mensaje.tipo,
      estado : mensaje.estado,
      //fecha es de tipo timestamp y necesito pasarla a date
      fechaEnvio: Timestamp.fromDate(mensaje.fechaEnvio)
    };
    //añadir el mensaje a la collection, generar un documento en la colletion
    const docRef = await addDoc(coleccionMensajes, mensajeGuardar)
  }catch(error: any){
    console.error('❌ Error al guardar el mensaje en firestore')
    console.error('Error details', {
      mensaje: error.messaje,
      code: error.code,
      stack: error.stack
    })
  }
 }

 obtenerMensajesUsuario(){
  
 }

}


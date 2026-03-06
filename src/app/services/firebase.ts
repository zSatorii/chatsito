import { Injectable, Query, inject } from '@angular/core';
import { Firestore, QuerySnapshot, collection, onSnapshot, query, where } from '@angular/fire/firestore';
import { ConversacionChat, MensajeChat } from '../../models/chat';
import { addDoc, Timestamp } from 'firebase/firestore';
import { __awaiter } from 'tslib';
import { Observable } from 'rxjs';
import { DocumentData } from '@angular/fire/compat/firestore';


@Injectable({
  providedIn: "root"
})
export class FirebaseService {
  private firestore = inject(Firestore)


  // Funcion para guardar el mensaje
  async guardarMensaje(mensaje: MensajeChat): Promise<void>{
    try{
      console.log('ingreso guardar mensaje')
      // Revisar si viene sin usuarioID
      if(!mensaje.usuarioId){
        // devuelvo que el mensaje debe tener un usuarioId
        throw new Error('Usuario Id es requerido');
      } else if(!mensaje.contenido){
        throw new Error('El contenido es requerido');
      } else if(!mensaje.tipo){
        throw new Error('El tipo es requerido');
      }


      const coleccionMensajes = collection(this.firestore, 'mensajes')

      //Preparar el mensaje respecto a las fechas
      const mensajeGuardar={
        usuarioId : mensaje.usuarioId,
        contenido : mensaje.contenido,
        tipo: mensaje.tipo,
        estado: mensaje.estado,
        //fecha es de tipo TIMESTAMP y necesito pasarla a date
        fechaEnvio: Timestamp.fromDate(mensaje.fechaEnvio)
      };

    const docRef = await addDoc(coleccionMensajes, mensajeGuardar)
    }catch(error: any){
      console.error(' Error al guardar el mensaje en firestore')
      console.error('Error details', {
        mensaje: error.message,
        code : error.code,
        stack: error.stack
      })
    }
  }
  // filtrar mensajes por usuario
  obtenerMensajesusuario(usuarioId: String): Observable<MensajeChat[]>{
    return new Observable (observer =>{
      const consulta = query(
        collection(this.firestore, "mensajes"),
        where('usuarioId', "==" , usuarioId)
      )
      // configurar el listener para que funcione en tiempo real snapshot
      const unsubscribe = onSnapshot(
        consulta,
        (snapshot: QuerySnapshot<DocumentData>)=>{
          const mensajes : MensajeChat[] = snapshot.docs.map( doc => {
            const data = doc.data();
            return {
              id: doc.id,
              usuarioId: data['usuarioId'],
              contenido: data['contenido'],
              tipo: data['tipo'],
              estado: data['estado'],
              // recordamos que firebase guarda timestamp y angular guarda date
              fechaEnvio: data['fechaEnvio'].toDate()
            } as MensajeChat;
          });
          //ordenar los mensajes del mas reciente al mas antiguo
          mensajes.sort((a, b) => a.fechaEnvio.getTime() - b.fechaEnvio.getTime())

          observer.next(mensajes);
        },
        error => {
          console.error("Error al escuchar los mensajes");
          observer.error(error);
        }
      );
      // se retorna una dessuscripcion
      return ()=>{
        unsubscribe;
      }
    });
  }
  async guardarConversacion(conversacion: ConversacionChat):Promise<void>{
    try{
      const coleccionconversaciones = collection(this.firestore, 'conversaciones')
      // preparar las conversaciones para enviarlas a firestore
      const conversacionGuardar = {
        ...conversacion,
        fechaCreacion: Timestamp.fromDate(conversacion.fechaCreacion),
        ultimaActividad: Timestamp.fromDate(conversacion.ultimaActividad),
        // conversion de la fechaEnvio del mensajeChat
        mensajes: conversacion.mensajes.map(mensaje =>({
          ...mensaje,
          fechaEnvio: Timestamp.fromDate(mensaje.fechaEnvio)
        }))
      };
      await addDoc(coleccionconversaciones, conversacionGuardar)
    }catch(error){
      console.error('Error al guardar la conversacion', error)
      throw error;
    }
  }

   
}


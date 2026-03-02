import { Component, ViewChild, ElementRef, contentChild, inject } from '@angular/core';
import { MensajeChat } from '../../../models/chat';
import { CommonModule } from '@angular/common';
import {FormsModule} from '@angular/forms';
import { AuthService } from '../../services/auth';
import { ChatService } from '../../services/chat';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { User } from 'firebase/auth';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat {

  private authService = inject(AuthService)
  private chatService = inject(ChatService)
  private router = inject(Router)

  usuario : User | null = null
  mensajes: MensajeChat[] = []
  cargandoHistorial = false
  asistenteEscribiendo = false
  asistenteEnviando = false
  mensajeTexto=""
  mensajeError = ""

  private suscripciones : Subscription[] = []

  private async verificarAutenticacion(): Promise<void>{
    // a la variable usuario le voy a asignar el servicio de auth y la funcion de obtener usuario
    this.usuario = this.authService.obtenerUsuario()
    if (!this.usuario){
      await this.router.navigate(['/auth'])
      throw new Error('Usuario no autenticado')
    } 
  }

  private async inicializarChat(): Promise<void> {
    if(!this.usuario){
      return;
    }
    this.cargandoHistorial = true;
    try {
      await this.chatService.inicializarChat(this.usuario.uid)
    } catch (error) {
      console.error
    }
  }

  private debeHacerScroll = true;

  @ViewChild('messagesContainer') messagesContainer! : ElementRef

  private scrollhaciaabajo():void{
    try{
      const container = this.messagesContainer?.nativeElement
      if(container){
        container.scrollTop = container.scrollHeight
      }
    } catch(error){
      console.error('❌ Error al hacer scroll')
    }
  }


  ngAfterViewChecked():void{
    if(this.debeHacerScroll){
      this.scrollhaciaabajo();
      this.debeHacerScroll = false
    }
  }
  trackByMensaje(index: number, mensaje: MensajeChat){}

  formatearMensajeAsistente(contenido:string){
    return contenido
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
  }

  formatearhora(fecha: Date): string{
    return fecha.toLocaleDateString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  enviarMensaje(){}
  ngOnInit(){}
}
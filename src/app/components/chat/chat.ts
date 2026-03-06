import { Component, ViewChild, ElementRef, contentChild, inject, OnInit, OnDestroy, AfterViewChecked } from '@angular/core';
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
export class Chat implements OnInit, OnDestroy, AfterViewChecked {

  private authService = inject(AuthService)
  private chatService = inject(ChatService)
  private router = inject(Router)

  @ViewChild('messagesContainer') messagesContainer! : ElementRef
  @ViewChild('mensajeInput') mensajeInput! : ElementRef

  usuario : User | null = null
  mensajes: MensajeChat[] = []
  cargandoHistorial = false
  asistenteEscribiendo = false
  asistenteEnviando = false
  mensajeTexto=""
  enviandoMensaje = false
  mensajeError = "";

  private suscripciones : Subscription[] = []

  private async verificarAutenticacion(): Promise<void>{
    console.log('Ingreso a verificar autenticacion')
    // a la variable usuario le voy a asignar el servicio de auth y la funcion de obtener usuario
    this.usuario = this.authService.obtenerUsuario()
    if (!this.usuario){
      await this.router.navigate(['/auth'])
      throw new Error('Usuario no autenticado')
    } 
  }

  private async inicializarChat(): Promise<void> {
    console.log('ingreso a inicializar chat')
    if(!this.usuario){
      return;
    }
    this.cargandoHistorial = true;
    try {
      await this.chatService.inicializarChat(this.usuario.uid)
    } catch (error) {
      console.error('Error al inicializar el chat')
      throw error;
    }finally{
      this.cargandoHistorial = false;
    }
  }


  private configurarSuscripciones(): void{
    const subMensajes = this.chatService.mensajes$.subscribe( mensajes =>{
      this.mensajes = mensajes,
      this.debeHacerScroll = true;
    });

    const subMensajesAsis = this.chatService.asistenteRespondiendo$.subscribe( respondiendo =>{
      this.asistenteEscribiendo = respondiendo;
      if(respondiendo){
        this.debeHacerScroll = true
      }
    });

    this.suscripciones.push(subMensajes, subMensajesAsis)
  }
  async enviarMensaje(): Promise<void>{
    if(!this.mensajeTexto.trim()){
      return;
    }
    this.mensajeError = ""
    this.enviandoMensaje= true;

    const texto = this.mensajeTexto.trim();

    this.mensajeTexto = "";

    try {
      await this.chatService.enviarMensaje(texto)
      this.enfocarInput();
    } catch (error: any) {
      console.error('Error al enviar el mensaje')

      this.mensajeError = error.message || 'Error al enviar el mensaje'
      this.mensajeTexto = texto;
    }finally{
      this.enviandoMensaje = false;
    }
  }

  manejarTeclaPresionada(evento: KeyboardEvent){
    if(evento.key === "Enter" && !evento.shiftKey){
      evento.preventDefault();
      this.enviarMensaje();
    }
  }
  
  async cerrarSesion(): Promise<void>{
    try {
      this.chatService.limpiarChat();

      await this.authService.cerrarSesion();
      await this.router.navigate(['/auth'])
    } catch (error) {
      console.error('Error al cerrar sesion', error)
      this.mensajeError = "Error al cerrar la sesion"
      throw error;
    }

  }
  
  private debeHacerScroll : boolean = false;




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

  manejoErrorImagen(evento: any): void{
    evento.target.src = ''
  }

  trackByMensaje(index: number, mensaje: MensajeChat){
    return mensaje.id || `${mensaje.tipo} - ${mensaje.fechaEnvio.getTime()}`
  }

  async ngOnInit(): Promise<void>{
    try {
      await this.verificarAutenticacion();
      await this.inicializarChat();
      this.configurarSuscripciones();
    } catch (error) {
      console.error('Error al iniciar el chat OnInit')
      this.mensajeError = 'Error al cargar el chat intenta recargar la pagina'
      throw error;
    }
  }

  ngOnDestroy(): void {
    this.suscripciones.forEach(sub => sub.unsubscribe())
  }

  private enfocarInput():void{
    setTimeout(()=>{
      this.mensajeInput.nativeElement.focus();
    }, 100);
  }
}

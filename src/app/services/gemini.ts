import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment'  ;


interface PeticionGemini {
  contents: ContentGemini[];
  generationConfig?:{
    maxOutputTokens?: number;
    temperature?: number;
  }
  safetyConfig?: SafetySettings[];
}

interface ContentGemini{
  role: 'user' | 'model';
  parts: PartGemini[]; 
}

interface PartGemini{
  text: string;
}

interface SafetySettings{
  category: string;
  threshold: string;
}

interface RespuestaGemini{
  candidate:{
    content:{
      parts: {
        text: string;
      }[];
    };
    finishReason: string;
  }[];
  usageMetaData?:{
    promptTokenCount: number;
    candidateTokenCount: number;
    totalTokenCount: number;
  };
}



@Injectable({
  providedIn: "root"
})


export class GeminiService {
  //inyecciones de dependencias
  private http = inject(HttpClient)

  //variables que llevan la url
  private apiUrl = environment.gemini.apiUrl
  private apiKey = environment.gemini.apiKey

  enviarMensaje(mensaje: string, historialPrevio: ContentGemini[]= []): Observable<string>{
  //verificar si la url esta bien configurada
  if(!this.apiKey || this.apiKey ==='Tu_api_key_de_gemini'){
    console.error('Error la api key no esta configurada correctamente')
    return throwError(()=> new Error('La api key de Gemini no esta configurada correctamente'))
   }
   const header = new HttpHeaders({
    'Content-Type': 'application/json',
   })


   //vamos a enviar un mensaje al contenido del sistema
   const mensajeSistema: ContentGemini = {
    role: 'user',
    parts: [{
      text: "Eres un asistente virtual util y amigable., responde siempre en español de manera concisa. Eres especialista en preguntas generales y sobretodo en programacion de software. Manten un tono profesional pero cercano"
    }]
   }
   const respuestaSistema: ContentGemini={
    role: 'model',
    parts: [{
      text: 'Entendido, soy tu asistente virtual especializada en programacion de software, te contestare en español ¿En que te puedo ayudar?'
    }]
   }
  }
}

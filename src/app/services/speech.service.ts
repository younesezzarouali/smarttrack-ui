import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SpeechService {
  private recognition: any;
  isListening = signal<boolean>(false);

  constructor() {
    const { webkitSpeechRecognition }: any = window as any;
    if (webkitSpeechRecognition) {
      this.recognition = new webkitSpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'fr-FR'; // Default to French
    }
  }

  startListening(onResult: (text: string) => void, onEnd: () => void) {
    if (!this.recognition) {
      alert("Votre navigateur ne supporte pas la reconnaissance vocale.");
      return;
    }

    this.isListening.set(true);
    this.recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');
      onResult(transcript);
    };

    this.recognition.onend = () => {
      this.isListening.set(false);
      onEnd();
    };

    this.recognition.start();
  }

  stopListening() {
    if (this.recognition) {
      this.recognition.stop();
      this.isListening.set(false);
    }
  }
}

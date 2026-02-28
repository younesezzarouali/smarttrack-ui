import { Injectable, signal, NgZone } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SpeechService {
  private recognition: any;
  isListening = signal<boolean>(false);

  constructor(private zone: NgZone) {
    const { webkitSpeechRecognition }: any = window as any;
    if (webkitSpeechRecognition) {
      this.recognition = new webkitSpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false; // Set to false for more stable final results
      this.recognition.lang = 'fr-FR';
    }
  }

  startListening(onResult: (text: string) => void, onEnd: () => void) {
    if (!this.recognition) {
      alert("Votre navigateur ne supporte pas la reconnaissance vocale.");
      return;
    }

    this.zone.run(() => this.isListening.set(true));

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.zone.run(() => onResult(transcript));
    };

    this.recognition.onend = () => {
      this.zone.run(() => {
        this.isListening.set(false);
        onEnd();
      });
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      this.zone.run(() => {
        this.isListening.set(false);
        onEnd();
      });
    };

    this.recognition.start();
  }

  stopListening() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}

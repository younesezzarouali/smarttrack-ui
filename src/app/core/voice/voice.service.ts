import { Injectable, NgZone, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VoiceService {
  private isNative = Capacitor.isNativePlatform();
  private recognition: any;
  
  public isListening = signal<boolean>(false);
  
  private partialResultSubject = new Subject<string>();
  private finalResultSubject = new Subject<string>();
  private errorSubject = new Subject<string>();

  onPartialResult$: Observable<string> = this.partialResultSubject.asObservable();
  onFinalResult$: Observable<string> = this.finalResultSubject.asObservable();
  onError$: Observable<string> = this.errorSubject.asObservable();

  constructor(private zone: NgZone) {
    if (!this.isNative) {
      this.initWebSpeech();
    } else {
      this.setupNativeListeners();
    }
  }

  private async triggerHaptic() {
    if (this.isNative) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (e) {}
    }
  }

  private initWebSpeech() {
    const { webkitSpeechRecognition }: any = window as any;
    if (webkitSpeechRecognition) {
      this.recognition = new webkitSpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'fr-FR';

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        this.zone.run(() => {
          if (finalTranscript) {
            this.finalResultSubject.next(finalTranscript);
          } else if (interimTranscript) {
            this.partialResultSubject.next(interimTranscript);
          }
        });
      };

      this.recognition.onerror = (event: any) => {
        this.zone.run(() => {
          this.isListening.set(false);
          this.errorSubject.next(event.error);
        });
      };

      this.recognition.onend = () => {
        this.zone.run(() => {
          this.isListening.set(false);
        });
      };
    }
  }

  private async setupNativeListeners() {
    SpeechRecognition.addListener('partialResults', (data: any) => {
      this.zone.run(() => {
        if (data.matches && data.matches.length > 0) {
          this.partialResultSubject.next(data.matches[0]);
        }
      });
    });

    SpeechRecognition.addListener('listeningState', (data: any) => {
      this.zone.run(() => {
        this.isListening.set(data.status === 'started');
      });
    });
  }

  async startListening(): Promise<void> {
    await this.triggerHaptic();
    
    if (this.isNative) {
      try {
        // Simple direct request
        const perms = await SpeechRecognition.requestPermissions();
        if (perms.speechRecognition !== 'granted') {
          this.errorSubject.next('PERMISSION_DENIED');
          return;
        }

        await SpeechRecognition.start({
          language: 'fr-FR',
          maxResults: 1,
          prompt: 'Dites quelque chose...',
          partialResults: true,
          popup: false
        });
        
        // Safety: the listener should handle it, but we set it just in case
        this.isListening.set(true);
      } catch (e: any) {
        console.error('SpeechRecognition error:', e);
        // Alert to see error on phone
        // alert('Debug Voice Error: ' + JSON.stringify(e));
        this.errorSubject.next('NOT_AVAILABLE');
        this.isListening.set(false);
      }
    } else if (this.recognition) {
      try {
        this.recognition.start();
        this.isListening.set(true);
      } catch (e) {
        this.isListening.set(false);
      }
    }
  }

  async stopListening(): Promise<void> {
    await this.triggerHaptic();
    if (this.isNative) {
      try {
        await SpeechRecognition.stop();
      } catch (e) {}
      this.isListening.set(false);
    } else if (this.recognition) {
      this.recognition.stop();
      this.isListening.set(false);
    }
  }
}

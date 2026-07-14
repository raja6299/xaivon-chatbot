import { VoiceProvider, VoiceSettings } from '../types';

export class WebSpeechProvider implements VoiceProvider {
  name = 'WebSpeechAPI';
  
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionConstructor = (window as unknown as { SpeechRecognition?: { new(): SpeechRecognition }, webkitSpeechRecognition?: { new(): SpeechRecognition } }).SpeechRecognition || 
                                           (window as unknown as { webkitSpeechRecognition?: { new(): SpeechRecognition } }).webkitSpeechRecognition;
      if (SpeechRecognitionConstructor) {
        this.recognition = new SpeechRecognitionConstructor();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
      }
      this.synthesis = window.speechSynthesis;
    }
  }

  get isSupported(): boolean {
    return this.recognition !== null && this.synthesis !== null;
  }

  // --- Input (STT) ---
  
  async startListening(
    onResult: (text: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ): Promise<void> {
    if (!this.recognition) {
      onError('Speech recognition not supported in this browser.');
      return;
    }

    try {
      // Request microphone permissions explicitly to handle errors gracefully
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // We immediately stop the manual stream track because we just wanted the permission.
      // SpeechRecognition will manage its own stream.
      stream.getTracks().forEach(track => track.stop());
    } catch (err: unknown) {
      if (err instanceof Error) {
        onError(err.name === 'NotAllowedError' ? 'Microphone permission denied.' : 'Failed to access microphone.');
      } else {
        onError('Failed to access microphone.');
      }
      return;
    }

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        onResult(finalTranscript, true);
      } else if (interimTranscript) {
        onResult(interimTranscript, false);
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'no-speech') {
        onError(event.error);
      }
    };

    this.recognition.onend = () => {
      onEnd();
    };

    try {
      this.recognition.start();
    } catch (_e) {
      // Ignore if already started
    }
  }

  stopListening(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  abortListening(): void {
    if (this.recognition) {
      this.recognition.abort();
    }
  }

  // --- Output (TTS) ---

  speak(
    text: string, 
    settings: VoiceSettings,
    onStart: () => void,
    onEnd: () => void,
    onError: (err: string) => void
  ): void {
    if (!this.synthesis || settings.isMuted) {
      onEnd();
      return;
    }

    // Cancel any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.playbackSpeed;
    utterance.lang = settings.language;

    if (settings.preferredVoiceURI) {
      const voices = this.synthesis.getVoices();
      const voice = voices.find(v => v.voiceURI === settings.preferredVoiceURI);
      if (voice) {
        utterance.voice = voice;
      }
    }

    utterance.onstart = onStart;
    utterance.onend = onEnd;
    utterance.onerror = (e) => {
      // "interrupted" or "canceled" are normal if we stopped it manually.
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        onError(e.error);
      } else {
        onEnd();
      }
    };

    this.synthesis.speak(utterance);
  }

  pauseSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.pause();
    }
  }

  resumeSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.resume();
    }
  }

  stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  async getAvailableVoices(): Promise<{ uri: string, name: string, lang: string }[]> {
    if (!this.synthesis) return [];
    
    let voices = this.synthesis.getVoices();
    if (voices.length === 0) {
      // In some browsers (Chrome), voices are loaded asynchronously
      voices = await new Promise<SpeechSynthesisVoice[]>((resolve) => {
        const id = setInterval(() => {
          if (this.synthesis?.getVoices().length) {
            clearInterval(id);
            resolve(this.synthesis.getVoices());
          }
        }, 10);
        // Timeout after 1 second
        setTimeout(() => {
          clearInterval(id);
          resolve(this.synthesis?.getVoices() || []);
        }, 1000);
      });
    }

    return voices.map(v => ({
      uri: v.voiceURI,
      name: v.name,
      lang: v.lang
    }));
  }
}

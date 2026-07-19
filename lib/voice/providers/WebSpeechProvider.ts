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
      if (this.synthesis) {
        // Pre-warm voices
        this.synthesis.getVoices();
        if (this.synthesis.onvoiceschanged !== undefined) {
          this.synthesis.onvoiceschanged = () => {
            this.synthesis?.getVoices();
          };
        }
      }
    }
  }

  get isSupported(): boolean {
    return this.recognition !== null && this.synthesis !== null;
  }

  // --- Input (STT) ---
  
  async startListening(
    settings: VoiceSettings,
    onResult: (text: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ): Promise<void> {
    if (!this.recognition) {
      onError('Speech recognition not supported in this browser.');
      return;
    }
    
    // Dynamically set language from settings (or fallback to en-IN for Hinglish support)
    this.recognition.lang = settings.language || 'en-IN';

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

    let finalTranscript = ''; // Persisted across onresult events for this session

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';

      // Process only new results starting from event.resultIndex
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          // OVERWRITE interim transcript instead of appending.
          // This fixes a major Android Chrome bug where multiple interim results 
          // are pushed to the array, causing severe text duplication.
          interimTranscript = event.results[i][0].transcript;
        }
      }

      const fullText = (finalTranscript + interimTranscript).trim();
      if (fullText) {
        // We pass false for isFinal because in continuous mode, we don't want to 
        // prematurely trigger submission on every sentence boundary.
        onResult(fullText, false);
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
    } catch {
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

    let selectedVoice = null;
    let voices = this.synthesis.getVoices();

    if (voices.length === 0) {
      voices = this.synthesis.getVoices(); // Second attempt for some browsers
    }

    if (settings.preferredVoiceURI) {
      selectedVoice = voices.find(v => v.voiceURI === settings.preferredVoiceURI);
    }
    
    if (!selectedVoice && voices.length > 0) {
      const getScore = (v: SpeechSynthesisVoice) => {
        let score = 0;
        const lang = v.lang.toLowerCase();
        const name = v.name.toLowerCase();
        
        if (lang.startsWith('en')) {
          score += 20; // Strongly prefer English
          if (lang === 'en-us') score += 5;
          if (lang === 'en-gb') score += 4;
          
          // Premium voices
          if (name.includes('natural') || name.includes('premium') || name.includes('online')) score += 15;
          if (name.includes('google')) score += 8;
          if (name.includes('microsoft')) score += 6;
          if (name.includes('siri')) score += 6;
          
          if (v.default) score += 2;
        } else if (lang.startsWith('hi')) {
          score += 5;
        }
        return score;
      };

      const sortedVoices = [...voices].sort((a, b) => getScore(b) - getScore(a));
      selectedVoice = sortedVoices[0];
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Professional AI Consultant voice tuning
    utterance.rate = settings.playbackSpeed === 1.0 ? 0.95 : settings.playbackSpeed; // Slightly calm pace by default
    utterance.pitch = 0.98; // Slightly deeper, more authoritative tone
    utterance.volume = 1.0;

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

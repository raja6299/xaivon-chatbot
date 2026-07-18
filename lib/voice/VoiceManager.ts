import { VoiceProvider, VoiceSettings, DEFAULT_VOICE_SETTINGS, VoiceState } from './types';
import { WebSpeechProvider } from './providers/WebSpeechProvider';

export class VoiceManager {
  private provider: VoiceProvider;
  private settings: VoiceSettings;
  private state: VoiceState = 'idle';
  private speechQueue: string[] = [];
  
  private silenceTimer: NodeJS.Timeout | null = null;
  private currentText: string = '';
  
  // Listeners
  private stateListeners: Set<(state: VoiceState) => void> = new Set();
  private settingsListeners: Set<(settings: VoiceSettings) => void> = new Set();
  private textListeners: Set<(text: string, isFinal: boolean) => void> = new Set();
  private errorListeners: Set<(err: string) => void> = new Set();

  constructor() {
    // Default to WebSpeech, can be dependency-injected later
    this.provider = new WebSpeechProvider();
    this.settings = { ...DEFAULT_VOICE_SETTINGS };
    
    // Load persisted settings
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('xaivon_voice_settings');
        if (saved) {
          this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
      } catch {
        // ignore
      }
    }
  }

  get isSupported(): boolean {
    return this.provider.isSupported;
  }

  getSettings(): VoiceSettings {
    return { ...this.settings };
  }

  getState(): VoiceState {
    return this.state;
  }

  updateSettings(newSettings: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    if (typeof window !== 'undefined') {
      localStorage.setItem('xaivon_voice_settings', JSON.stringify(this.settings));
    }
    this.settingsListeners.forEach(l => l(this.settings));
  }

  private setState(newState: VoiceState) {
    if (this.state === newState) return;
    this.state = newState;
    this.stateListeners.forEach(l => l(this.state));
  }

  // --- STT (Input) ---

  async startListening(prefixText: string = '') {
    if (!this.provider.isSupported) {
      this.errorListeners.forEach(l => l('Voice not supported on this browser.'));
      return;
    }

    // Full Duplex Requirement: Stop TTS immediately if we start listening
    this.interruptOutput();

    this.setState('permission_request');
    
    // Make sure prefix text ends with a space if it's not empty
    const prefix = prefixText.trim() ? prefixText.trim() + ' ' : '';
    
    await this.provider.startListening(
      this.settings,
      (text: string) => {
        this.setState('recognizing');
        this.currentText = prefix + text;
        this.textListeners.forEach(l => l(this.currentText, false)); // Emit as interim

        // Reset silence timeout on every new text
        if (this.silenceTimer) clearTimeout(this.silenceTimer);
        this.silenceTimer = setTimeout(() => {
          // Silence detected: auto-submit
          this.stopListening();
        }, 2500); // 2.5 seconds of silence triggers submission
      },
      (err) => {
        this.setState('error');
        this.errorListeners.forEach(l => l(err));
        if (this.silenceTimer) clearTimeout(this.silenceTimer);
      },
      () => {
        if (this.state === 'recognizing' || this.state === 'listening') {
          this.setState('idle');
          if (this.silenceTimer) clearTimeout(this.silenceTimer);
          if (this.currentText) {
            this.textListeners.forEach(l => l(this.currentText, true));
            this.currentText = '';
          }
        }
      }
    );

    if (this.state === 'permission_request') {
      this.setState('listening');
    }
  }

  stopListening() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    this.provider.stopListening();
    this.setState('idle');
    
    // Emit the final accumulated text to trigger submission
    if (this.currentText) {
      this.textListeners.forEach(l => l(this.currentText, true));
      this.currentText = '';
    }
  }

  abortListening() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    this.currentText = '';
    this.provider.abortListening();
    this.setState('idle');
  }

  // --- TTS (Output) ---

  private cleanSpeechText(rawText: string): string {
    let text = rawText;
    
    // Replace code blocks and JSON
    if (text.includes('```')) {
       text = text.replace(/```[\s\S]*?```/g, ' I have shared the details in the chat. ');
    }
    
    // Replace URLs
    text = text.replace(/https?:\/\/[^\s]+/g, 'this link');

    // Strip HTML tags
    text = text.replace(/<[^>]*>?/gm, '');

    // Strip Markdown tables (very basic: lines with multiple |)
    text = text.replace(/\|.*\|/g, '');

    // Strip Brackets, Parentheses (but careful not to remove standard punctuation)
    // Actually, user said: Never read: Markdown, #, *, **, _, [], (), URLs, JSON, Code blocks, HTML, Tables, Emojis, Backticks
    text = text.replace(/[\[\]\(\)#*_`]/g, '');

    // Remove Emojis (matching emoji ranges)
    text = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}]/gu, '');

    // Improve natural pauses for TTS
    text = text.replace(/;/g, ',');
    text = text.replace(/ - /g, ', ');
    text = text.replace(/--/g, ', ');

    // Remove extra whitespace
    return text.replace(/\s{2,}/g, ' ').trim();
  }

  speakResponse(rawText: string) {
    if (!this.settings.autoSpeak || this.settings.isMuted) return;

    const cleanText = this.cleanSpeechText(rawText);
    if (!cleanText) return;

    this.speechQueue.push(cleanText);
    this.processQueue();
  }

  private processQueue() {
    if (this.state === 'speaking' || this.speechQueue.length === 0) return;

    const text = this.speechQueue.shift();
    if (!text) return;

    this.setState('speaking');
    this.provider.speak(
      text,
      this.settings,
      () => {
        // onStart
      },
      () => {
        // onEnd
        this.setState('idle');
        this.processQueue();
      },
      (err) => {
        // onError
        this.setState('error');
        this.errorListeners.forEach(l => l(err));
        this.processQueue();
      }
    );
  }

  interruptOutput() {
    this.speechQueue = [];
    this.provider.stopSpeaking();
    if (this.state === 'speaking' || this.state === 'paused') {
      this.setState('idle');
    }
  }

  pauseOutput() {
    this.provider.pauseSpeaking();
    this.setState('paused');
  }

  resumeOutput() {
    this.provider.resumeSpeaking();
    this.setState('speaking');
  }

  async getAvailableVoices() {
    return this.provider.getAvailableVoices();
  }

  // --- Subscriptions ---

  subscribeToState(listener: (state: VoiceState) => void) {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  subscribeToSettings(listener: (settings: VoiceSettings) => void) {
    this.settingsListeners.add(listener);
    return () => this.settingsListeners.delete(listener);
  }

  subscribeToText(listener: (text: string, isFinal: boolean) => void) {
    this.textListeners.add(listener);
    return () => this.textListeners.delete(listener);
  }

  subscribeToError(listener: (err: string) => void) {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  destroy() {
    this.interruptOutput();
    this.abortListening();
    this.stateListeners.clear();
    this.settingsListeners.clear();
    this.textListeners.clear();
    this.errorListeners.clear();
  }
}

// Singleton instance
let managerInstance: VoiceManager | null = null;
export function getVoiceManager(): VoiceManager {
  if (!managerInstance) {
    managerInstance = new VoiceManager();
  }
  return managerInstance;
}

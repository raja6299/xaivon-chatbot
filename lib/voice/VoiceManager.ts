import { VoiceProvider, VoiceSettings, DEFAULT_VOICE_SETTINGS, VoiceState } from './types';
import { WebSpeechProvider } from './providers/WebSpeechProvider';

export class VoiceManager {
  private provider: VoiceProvider;
  private settings: VoiceSettings;
  private state: VoiceState = 'idle';
  private speechQueue: string[] = [];
  
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
      } catch (_e) {
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

  async startListening() {
    if (!this.provider.isSupported) {
      this.errorListeners.forEach(l => l('Voice not supported on this browser.'));
      return;
    }

    // Full Duplex Requirement: Stop TTS immediately if we start listening
    this.interruptOutput();

    this.setState('permission_request');
    
    await this.provider.startListening(
      (text, isFinal) => {
        this.setState('recognizing');
        this.textListeners.forEach(l => l(text, isFinal));
      },
      (err) => {
        this.setState('error');
        this.errorListeners.forEach(l => l(err));
      },
      () => {
        if (this.state === 'recognizing' || this.state === 'listening') {
          this.setState('idle');
        }
      }
    );

    if (this.state === 'permission_request') {
      this.setState('listening');
    }
  }

  stopListening() {
    this.provider.stopListening();
    this.setState('idle');
  }

  abortListening() {
    this.provider.abortListening();
    this.setState('idle');
  }

  // --- TTS (Output) ---

  private cleanSpeechText(rawText: string): string {
    // Smart Speech: Remove code blocks, markdown tables, JSON, URLs
    let text = rawText;
    
    // Replace code blocks with placeholder
    if (text.includes('```')) {
       text = text.replace(/```[\s\S]*?```/g, ' I have shared the detailed technical information in the chat. ');
    }
    
    // Replace URLs
    text = text.replace(/https?:\/\/[^\s]+/g, ' this link ');

    // Strip markdown bold/italics
    text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
    text = text.replace(/(\*|_)(.*?)\1/g, '$2');

    return text.trim();
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

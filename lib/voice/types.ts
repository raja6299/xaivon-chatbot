export type VoiceState = 
  | 'idle' 
  | 'permission_request' 
  | 'listening' 
  | 'recognizing' 
  | 'processing' 
  | 'speaking' 
  | 'paused' 
  | 'completed' 
  | 'cancelled' 
  | 'error';

export interface VoiceSettings {
  autoSpeak: boolean;
  preferredVoiceURI: string | null;
  playbackSpeed: number;
  language: string;
  isMuted: boolean;
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  autoSpeak: true,
  preferredVoiceURI: null,
  playbackSpeed: 1.0,
  language: 'en-US',
  isMuted: false,
};

export interface VoiceProvider {
  name: string;
  isSupported: boolean;
  
  // Input
  startListening(
    settings: VoiceSettings,
    onResult: (text: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ): Promise<void>;
  stopListening(): void;
  abortListening(): void;

  // Output
  speak(
    text: string, 
    settings: VoiceSettings,
    onStart: () => void,
    onEnd: () => void,
    onError: (err: string) => void
  ): void;
  pauseSpeaking(): void;
  resumeSpeaking(): void;
  stopSpeaking(): void;
  
  // Voices
  getAvailableVoices(): Promise<{ uri: string, name: string, lang: string }[]>;
}
